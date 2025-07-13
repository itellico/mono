# Audit Trail Implementation Guide for NestJS

## Overview

This guide provides step-by-step instructions for implementing the comprehensive audit trail system in the itellico NestJS application.

## Implementation Steps

### 1. Install Dependencies

```bash
pnpm add @nestjs/bull bull
pnpm add -D @types/bull
```

### 2. Create Audit Module Structure

```
apps/api/src/modules/audit/
├── audit.module.ts
├── audit.service.ts
├── audit.controller.ts
├── decorators/
│   ├── audit.decorator.ts
│   └── no-audit.decorator.ts
├── interceptors/
│   ├── audit.interceptor.ts
│   └── data-access.interceptor.ts
├── guards/
│   └── audit-permission.guard.ts
├── processors/
│   └── audit.processor.ts
├── dto/
│   ├── audit-event.dto.ts
│   ├── audit-query.dto.ts
│   └── audit-metrics.dto.ts
├── enums/
│   └── audit.enums.ts
└── interfaces/
    └── audit.interfaces.ts
```

### 3. Create Audit Module

```typescript
// audit.module.ts
import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditProcessor } from './processors/audit.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  providers: [
    AuditService,
    AuditInterceptor,
    AuditProcessor,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: AuditInterceptor,
    },
  ],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
```

### 4. Implement Audit Service

```typescript
// audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { AuditEventDto } from './dto/audit-event.dto';
import { AuditCategory, AuditSeverity } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(
    @InjectQueue('audit') private auditQueue: Queue,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async logEvent(event: AuditEventDto): Promise<void> {
    // Critical events are logged synchronously
    if (event.severity === AuditSeverity.CRITICAL) {
      await this.logCriticalEvent(event);
      return;
    }

    // Other events go to queue
    await this.auditQueue.add('audit-event', event);
  }

  private async logCriticalEvent(event: AuditEventDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          ...event,
          changes: event.changes || undefined,
          metadata: event.metadata || undefined,
        },
      });

      // Trigger immediate alerts for critical events
      if (event.category === AuditCategory.SECURITY) {
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      console.error('Failed to log critical audit event:', error);
      // Log to fallback system (file, external service, etc.)
      await this.logToFallback(event, error);
    }
  }

  async logDataAccess(params: {
    userId: number;
    tenantId: number;
    resourceType: string;
    resourceId?: string;
    accessType: string;
    recordCount?: number;
    fields?: string[];
  }): Promise<void> {
    await this.prisma.dataAccessLog.create({
      data: params,
    });
  }

  async logSecurityEvent(params: {
    eventType: string;
    severity: string;
    userId?: number;
    email?: string;
    ipAddress: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    await this.prisma.securityAuditLog.create({
      data: params,
    });

    // Check for suspicious patterns
    await this.checkSuspiciousActivity(params);
  }

  private async checkSuspiciousActivity(event: any): Promise<void> {
    const recentFailures = await this.prisma.securityAuditLog.count({
      where: {
        ipAddress: event.ipAddress,
        eventType: 'FAILED_LOGIN',
        occurredAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
    });

    if (recentFailures > 5) {
      await this.triggerSecurityAlert({
        type: 'BRUTE_FORCE_ATTEMPT',
        ipAddress: event.ipAddress,
        attempts: recentFailures,
      });
    }
  }

  async queryAuditLogs(filters: any): Promise<any[]> {
    const cacheKey = `audit:query:${JSON.stringify(filters)}`;
    
    return this.cache.remember(cacheKey, 300, async () => {
      return this.prisma.auditLog.findMany({
        where: this.buildWhereClause(filters),
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });
  }

  private buildWhereClause(filters: any): any {
    const where: any = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.category) where.category = filters.category;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return where;
  }

  private async triggerSecurityAlert(alert: any): Promise<void> {
    // Implement your alerting logic here
    // Could be email, Slack, PagerDuty, etc.
    console.error('SECURITY ALERT:', alert);
  }

  private async logToFallback(event: any, error: any): Promise<void> {
    // Implement fallback logging (file system, external service)
    console.error('Audit fallback:', { event, error });
  }
}
```

### 5. Create Audit Interceptor

```typescript
// interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit.service';
import { AuditCategory, AuditSeverity, AuditStatus } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if audit is disabled
    const noAudit = this.reflector.getAllAndOverride<boolean>('noAudit', [
      handler,
      controller,
    ]);

    if (noAudit) {
      return next.handle();
    }

    // Get audit configuration
    const auditConfig = this.reflector.getAllAndOverride<any>('audit', [
      handler,
      controller,
    ]) || {};

    const startTime = Date.now();
    const auditContext = this.buildAuditContext(request, auditConfig);

    return next.handle().pipe(
      tap(async (response) => {
        // Log successful operation
        await this.auditService.logEvent({
          ...auditContext,
          status: AuditStatus.COMPLETED,
          duration: Date.now() - startTime,
          changes: this.extractChanges(request, response),
          metadata: {
            responseStatus: 200,
            responseSize: JSON.stringify(response || {}).length,
          },
        });
      }),
      catchError(async (error) => {
        // Log failed operation
        await this.auditService.logEvent({
          ...auditContext,
          status: AuditStatus.FAILED,
          severity: AuditSeverity.ERROR,
          duration: Date.now() - startTime,
          errorCode: error.code || error.name,
          errorMessage: error.message,
          metadata: {
            stack: error.stack,
          },
        });
        throw error;
      }),
    );
  }

  private buildAuditContext(request: any, config: any): any {
    const user = request.user;
    const method = request.method;
    const url = request.url;

    // Infer event type from HTTP method
    let eventType = config.eventType;
    if (!eventType) {
      switch (method) {
        case 'POST':
          eventType = 'create';
          break;
        case 'PUT':
        case 'PATCH':
          eventType = 'update';
          break;
        case 'DELETE':
          eventType = 'delete';
          break;
        default:
          eventType = 'read';
      }
    }

    // Extract entity info from URL
    const entityMatch = url.match(/\/api\/v1\/(\w+)\/(\w+)/);
    const entityType = config.entityType || entityMatch?.[1] || 'unknown';
    const entityId = request.params.id || request.params.uuid;

    return {
      category: config.category || AuditCategory.DATA_CHANGE,
      eventType,
      severity: config.severity || AuditSeverity.INFO,
      entityType,
      entityId,
      entityName: config.entityName,
      actorType: 'USER',
      userId: user?.id,
      tenantId: user?.tenantId || request.tenantId,
      accountId: user?.accountId,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      sessionId: request.session?.id,
      requestId: request.id,
      endpoint: url,
      httpMethod: method,
      operation: `${method} ${url}`,
      permissionUsed: config.permission,
      mfaVerified: user?.mfaVerified || false,
    };
  }

  private extractChanges(request: any, response: any): any {
    const method = request.method;
    
    if (method === 'POST') {
      return {
        created: request.body,
      };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      return {
        updates: request.body,
        // Would need to fetch original to show full diff
      };
    }
    
    if (method === 'DELETE') {
      return {
        deleted: { id: request.params.id },
      };
    }
    
    return null;
  }
}
```

### 6. Create Audit Decorators

```typescript
// decorators/audit.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { AuditCategory, AuditSeverity } from '@prisma/client';

export interface AuditConfig {
  category?: AuditCategory;
  eventType?: string;
  entityType?: string;
  severity?: AuditSeverity;
  permission?: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export const Audit = (config: AuditConfig) => SetMetadata('audit', config);

export const NoAudit = () => SetMetadata('noAudit', true);

// Convenience decorators
export const AuditCreate = (entityType: string) =>
  Audit({
    category: AuditCategory.DATA_CHANGE,
    eventType: 'create',
    entityType,
    severity: AuditSeverity.INFO,
  });

export const AuditUpdate = (entityType: string) =>
  Audit({
    category: AuditCategory.DATA_CHANGE,
    eventType: 'update',
    entityType,
    severity: AuditSeverity.INFO,
  });

export const AuditDelete = (entityType: string) =>
  Audit({
    category: AuditCategory.DATA_CHANGE,
    eventType: 'delete',
    entityType,
    severity: AuditSeverity.WARN,
  });

export const AuditAccess = (resourceType: string) =>
  Audit({
    category: AuditCategory.ACCESS,
    eventType: 'access',
    entityType: resourceType,
    severity: AuditSeverity.INFO,
  });

export const AuditSecurity = (eventType: string) =>
  Audit({
    category: AuditCategory.SECURITY,
    eventType,
    severity: AuditSeverity.WARN,
  });
```

### 7. Usage in Controllers

```typescript
// Example: user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { 
  Audit, 
  AuditCreate, 
  AuditUpdate, 
  AuditDelete, 
  AuditAccess,
  NoAudit 
} from '@/audit/decorators/audit.decorator';
import { AuditCategory, AuditSeverity } from '@prisma/client';

@Controller('users')
export class UserController {
  @Post()
  @AuditCreate('user')
  async createUser(@Body() dto: CreateUserDto) {
    // Implementation
  }

  @Get()
  @AuditAccess('user')
  async getUsers() {
    // Implementation
  }

  @Get(':id')
  @NoAudit() // Don't audit individual user reads
  async getUser(@Param('id') id: string) {
    // Implementation
  }

  @Put(':id')
  @AuditUpdate('user')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    // Implementation
  }

  @Delete(':id')
  @Audit({
    category: AuditCategory.DATA_CHANGE,
    eventType: 'delete',
    entityType: 'user',
    severity: AuditSeverity.CRITICAL, // Deleting users is critical
    permission: 'platform.users.delete',
  })
  async deleteUser(@Param('id') id: string) {
    // Implementation
  }

  @Post(':id/export')
  @Audit({
    category: AuditCategory.ACCESS,
    eventType: 'export',
    entityType: 'user',
    severity: AuditSeverity.WARN,
  })
  async exportUserData(@Param('id') id: string) {
    // Log data access for compliance
    await this.auditService.logDataAccess({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      resourceType: 'user_export',
      resourceId: id,
      accessType: 'export',
      recordCount: 1,
      fields: ['*'], // All fields
    });
    
    // Implementation
  }
}
```

### 8. Create Audit Processor

```typescript
// processors/audit.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';

@Processor('audit')
export class AuditProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('audit-event')
  async handleAuditEvent(job: Job) {
    const event = job.data;
    
    try {
      await this.prisma.auditLog.create({
        data: {
          ...event,
          changes: event.changes || undefined,
          metadata: event.metadata || undefined,
        },
      });
      
      // Update metrics asynchronously
      await this.updateMetrics(event);
    } catch (error) {
      console.error('Failed to process audit event:', error);
      throw error; // Will retry based on queue config
    }
  }

  private async updateMetrics(event: any): Promise<void> {
    // Update real-time metrics
    const metricKey = `audit:metrics:${event.tenantId}:${event.category}`;
    // Implementation depends on your metrics system
  }
}
```

### 9. Create Audit Controller

```typescript
// audit.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/auth/guards/permission.guard';
import { RequirePermission } from '@/auth/decorators/permission.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @RequirePermission('platform.audit.read')
  async getAuditLogs(@Query() query: any) {
    return this.auditService.queryAuditLogs(query);
  }

  @Get('metrics')
  @RequirePermission('platform.audit.read')
  async getAuditMetrics(@Query() query: any) {
    return this.auditService.getAuditMetrics(query);
  }

  @Get('export')
  @RequirePermission('platform.audit.export')
  async exportAuditLogs(@Query() query: any) {
    // Log the export action itself
    await this.auditService.logDataAccess({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      resourceType: 'audit_logs',
      accessType: 'export',
      filters: query,
    });
    
    return this.auditService.exportAuditLogs(query);
  }
}
```

### 10. Security Event Logging

```typescript
// In auth service
async login(email: string, password: string, ipAddress: string) {
  try {
    const user = await this.validateUser(email, password);
    
    // Log successful login
    await this.auditService.logSecurityEvent({
      eventType: 'LOGIN',
      severity: 'LOW',
      userId: user.id,
      email,
      ipAddress,
      success: true,
    });
    
    return this.generateTokens(user);
  } catch (error) {
    // Log failed login
    await this.auditService.logSecurityEvent({
      eventType: 'FAILED_LOGIN',
      severity: 'MEDIUM',
      email,
      ipAddress,
      success: false,
      failureReason: error.message,
    });
    
    throw error;
  }
}
```

## Testing

### Unit Tests

```typescript
describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;
  let queue: Queue;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('audit'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should log critical events synchronously', async () => {
    const event = {
      category: AuditCategory.SECURITY,
      severity: AuditSeverity.CRITICAL,
      // ... other fields
    };

    await service.logEvent(event);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining(event),
    });
    expect(queue.add).not.toHaveBeenCalled();
  });
});
```

## Monitoring

### Grafana Dashboard Queries

```sql
-- Audit events per hour
SELECT 
  date_trunc('hour', created_at) as time,
  category,
  COUNT(*) as events
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1;

-- Failed operations
SELECT 
  entity_type,
  operation,
  COUNT(*) as failures,
  AVG(duration) as avg_duration
FROM audit_logs
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY 1, 2
ORDER BY 3 DESC;

-- Security threats
SELECT 
  ip_address,
  event_type,
  COUNT(*) as attempts,
  MAX(occurred_at) as last_attempt
FROM security_audit_logs
WHERE severity IN ('HIGH', 'CRITICAL')
AND occurred_at > NOW() - INTERVAL '1 hour'
GROUP BY 1, 2
HAVING COUNT(*) > 5;
```

## Next Steps

1. Implement audit module in NestJS
2. Add audit decorators to all controllers
3. Configure queue processing
4. Set up monitoring dashboards
5. Create compliance reports
6. Test audit trail completeness
7. Document audit events