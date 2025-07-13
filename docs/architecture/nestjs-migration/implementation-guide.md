---
title: NestJS Implementation Guide
sidebar_label: Implementation Guide
---

# NestJS Implementation Guide

This guide provides detailed implementation patterns and code examples for the NestJS migration.

## Module Implementation Patterns

### Basic Module Structure

Every module follows this pattern:

```typescript
// example.module.ts
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
  imports: [],         // Other modules this module depends on
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService], // Export if other modules need this service
})
export class ExampleModule {}
```

### Controller Pattern

Controllers handle HTTP requests and delegate to services:

```typescript
// example.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExampleService } from './example.service';

@Controller('v1/example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.exampleService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.exampleService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: any) {
    return this.exampleService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.exampleService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.exampleService.remove(id);
  }
}
```

### Service Pattern

Services contain business logic and interact with databases:

```typescript
// example.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class ExampleService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: any) {
    const cacheKey = `examples:list:${JSON.stringify(query)}`;
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    // Query database
    const [items, total] = await Promise.all([
      this.prisma.example.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.example.count(),
    ]);

    const result = {
      success: true,
      data: {
        items,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total,
          totalPages: Math.ceil(total / (query.limit || 20)),
        },
      },
    };

    // Cache result
    await this.redis.set(cacheKey, result, 300); // 5 minutes
    
    return result;
  }
}
```

## Authentication Implementation

### JWT Strategy

```typescript
// auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          return request?.cookies?.['auth-token'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('app.jwtSecret'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      tier: payload.tier,
      tenantId: payload.tenantId,
      accountId: payload.accountId,
    };
  }
}
```

### Auth Guard

```typescript
// common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

## Permission Guards

### Tier-Based Guard

```typescript
// common/guards/tier.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TierGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.get<string>('tier', context.getHandler());
    if (!requiredTier) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const tierHierarchy = ['public', 'user', 'account', 'tenant', 'platform'];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  }
}
```

### Permission-Based Guard

```typescript
// common/guards/permission.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check user permissions
    const userPermissions = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    const hasPermission = userPermissions.some(ur =>
      ur.role.permissions.some(p => p.name === requiredPermission)
    );

    return hasPermission;
  }
}
```

## Custom Decorators

### User Decorator

```typescript
// common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Tier Decorator

```typescript
// common/decorators/tier.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequireTier = (tier: string) => SetMetadata('tier', tier);
```

### Permission Decorator

```typescript
// common/decorators/permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (permission: string) => SetMetadata('permission', permission);
```

## Validation Pipes

### Global Validation

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

### DTO Validation

```typescript
// dto/create-example.dto.ts
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
```

## Error Handling

### Global Exception Filter

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    response.status(status).send({
      success: false,
      error: this.getErrorCode(status),
      message: typeof message === 'string' ? message : message['message'],
      timestamp: new Date().toISOString(),
    });
  }

  private getErrorCode(status: number): string {
    const errorCodes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      500: 'INTERNAL_ERROR',
    };
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }
}
```

## Interceptors

### Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - now;
        console.log(`${method} ${url} ${response.statusCode} - ${duration}ms`);
      }),
    );
  }
}
```

### Transform Interceptor

```typescript
// common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Ensure consistent response format
        if (data && typeof data === 'object' && !data.success) {
          return { success: true, data };
        }
        return data;
      }),
    );
  }
}
```

## Testing Patterns

### Unit Test Example

```typescript
// example.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

describe('ExampleService', () => {
  let service: ExampleService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        {
          provide: PrismaService,
          useValue: {
            example: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should return cached data if available', async () => {
    const cachedData = { success: true, data: { items: [] } };
    jest.spyOn(redis, 'get').mockResolvedValue(cachedData);

    const result = await service.findAll({});
    
    expect(result).toEqual(cachedData);
    expect(prisma.example.findMany).not.toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
// example.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('ExampleController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/example (GET)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/example',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
  });
});
```

## Performance Optimization

### Query Optimization

```typescript
// Use select to limit fields
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// Use include wisely
const tenantsWithCounts = await this.prisma.tenant.findMany({
  include: {
    _count: {
      select: {
        accounts: true,
        users: true,
      },
    },
  },
});
```

### Batch Operations

```typescript
// Batch create
await this.prisma.user.createMany({
  data: users,
  skipDuplicates: true,
});

// Batch update
await this.prisma.$transaction(
  users.map(user =>
    this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    })
  )
);
```

## Deployment Considerations

### Environment Variables

```typescript
// Validate all required env vars on startup
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_HOST',
  'JWT_SECRET',
  'COOKIE_SECRET',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Health Checks

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
```

This implementation guide provides the foundation for building robust, scalable features in the NestJS architecture.