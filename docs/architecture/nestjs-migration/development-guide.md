---
title: NestJS Development Guide
sidebar_label: Development Guide
---

# NestJS Development Guide

Complete guide for developing with the itellico NestJS architecture, including setup, workflows, and best practices.

## Quick Start

### Prerequisites

- Node.js 18+ (recommend using nvm)
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.9+
- pnpm package manager

### Initial Setup

```bash
# Clone and setup
git clone <repository>
cd mono/apps/api-nest

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database URLs and secrets

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed development data
pnpm run seed

# Start development server
pnpm start:dev
```

### Verify Setup

```bash
# Health check
curl http://localhost:3001/api/v1/public/health

# API documentation
open http://localhost:3001/docs

# Check logs for any errors
pnpm logs
```

## Development Workflow

### 1. Feature Development Process

#### Step 1: Plan Your Feature

```bash
# 1. Check existing endpoints
open http://localhost:3001/docs

# 2. Review related code
find src/modules -name "*user*" -type f

# 3. Check tests for patterns
find test -name "*user*" -type f
```

#### Step 2: Create Your Module Structure

```bash
# For a new resource (e.g., "projects")
mkdir -p src/modules/account/controllers
mkdir -p src/modules/account/services  
mkdir -p src/modules/account/dto

# Create files
touch src/modules/account/controllers/projects.controller.ts
touch src/modules/account/services/projects.service.ts
touch src/modules/account/dto/create-project.dto.ts
touch src/modules/account/dto/update-project.dto.ts
touch src/modules/account/dto/list-projects.dto.ts
```

#### Step 3: Implement Following Patterns

**1. DTO First (Define Your Data Structures):**

```typescript
// src/modules/account/dto/create-project.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'Project Alpha' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ example: 'Project description', required: false })
  description?: string;
}
```

**2. Service Implementation:**

```typescript
// src/modules/account/services/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { CreateProjectDto } from '../dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(accountId: string, createDto: CreateProjectDto) {
    this.logger.logBusiness('Creating project', { accountId, name: createDto.name });
    
    const project = await this.prisma.project.create({
      data: {
        ...createDto,
        accountId: parseInt(accountId),
      },
    });

    return project;
  }

  async findByAccount(accountId: string) {
    return this.prisma.project.findMany({
      where: { accountId: parseInt(accountId) },
    });
  }
}
```

**3. Controller Implementation:**

```typescript
// src/modules/account/controllers/projects.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CurrentAccount } from '@common/decorators/current-account.decorator';
import { RequirePermissions } from '@common/decorators/require-permissions.decorator';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { AuthenticatedUser } from '@common/types/auth.types';

@Controller('api/v1/account/projects')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('account.projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('account.projects.read')
  @ApiOperation({ summary: 'List account projects' })
  async list(@CurrentAccount() accountId: string) {
    const projects = await this.projectsService.findByAccount(accountId);
    return { success: true, data: projects };
  }

  @Post()
  @RequirePermissions('account.projects.create')
  @ApiOperation({ summary: 'Create new project' })
  async create(
    @Body() createDto: CreateProjectDto,
    @CurrentAccount() accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectsService.create(accountId, createDto);
    return { success: true, data: project };
  }
}
```

**4. Add to Module:**

```typescript
// src/modules/account/account.module.ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
// ... other imports

@Module({
  imports: [/* existing imports */],
  controllers: [
    // ... existing controllers
    ProjectsController,
  ],
  providers: [
    // ... existing services
    ProjectsService,
  ],
})
export class AccountModule {}
```

#### Step 4: Write Tests

**Unit Tests:**

```typescript
// src/modules/account/services/projects.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            logBusiness: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a project', async () => {
    const createDto = { name: 'Test Project', description: 'Test' };
    const mockProject = { id: 1, ...createDto, accountId: 1 };
    
    jest.spyOn(prisma.project, 'create').mockResolvedValue(mockProject as any);

    const result = await service.create('1', createDto);

    expect(result).toEqual(mockProject);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: { ...createDto, accountId: 1 },
    });
  });
});
```

**E2E Tests:**

```typescript
// test/account/projects.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../utils/test-helpers';

describe('ProjectsController (e2e)', () => {
  let app: NestFastifyApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Get auth token for account admin
    const accountAdmin = TestHelpers.createAccountAdminUser();
    authToken = TestHelpers.generateTestToken(app.get(JwtService), accountAdmin);
  });

  it('/api/v1/account/projects (GET)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/account/projects',
      cookies: { 'auth-token': authToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: expect.any(Array),
    });
  });
});
```

#### Step 5: Test Your Implementation

```bash
# Run unit tests
pnpm test projects.service.spec.ts

# Run E2E tests  
pnpm test:e2e projects.e2e-spec.ts

# Test manually
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/v1/account/projects

# Check API docs
open http://localhost:3001/docs#/account.projects
```

### 2. Database Changes

#### Adding New Tables

```bash
# 1. Modify Prisma schema
vim prisma/schema.prisma

# Add your new model
model Project {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(100)
  description String?  @db.VarChar(500)
  accountId   Int
  account     Account  @relation(fields: [accountId], references: [id])
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

# 2. Create migration
pnpm prisma migrate dev --name add-projects

# 3. Generate client
pnpm prisma generate
```

#### Updating Existing Tables

```bash
# 1. Modify schema
# 2. Create migration with descriptive name
pnpm prisma migrate dev --name add-project-status-field

# 3. Check migration file and edit if needed
vim prisma/migrations/*/migration.sql

# 4. Apply and generate
pnpm prisma generate
```

### 3. Adding Background Jobs

```typescript
// 1. Define job type in rabbitmq/types/queue-jobs.types.ts
export interface ProjectNotificationJob extends BaseJob {
  type: 'project.notification';
  data: {
    projectId: string;
    accountId: string;
    event: 'created' | 'updated' | 'deleted';
    metadata?: Record<string, any>;
  };
}

// 2. Add to union type
export type QueueJob = 
  | EmailJob 
  | NotificationJob 
  | ProjectNotificationJob // Add here
  | /* other jobs */;

// 3. Queue the job in your service
async create(accountId: string, createDto: CreateProjectDto) {
  const project = await this.prisma.project.create(/* ... */);
  
  // Queue notification
  await this.rabbitMQ.sendMessage('project.notification', {
    projectId: project.id.toString(),
    accountId,
    event: 'created',
    metadata: { projectName: project.name },
  });
  
  return project;
}

// 4. Handle the job in background-jobs.service.ts
@MessagePattern('project.notification')
async handleProjectNotification(@Payload() job: ProjectNotificationJob): Promise<JobResult> {
  return this.handleJob(job);
}

private async processProjectNotificationJob(job: ProjectNotificationJob): Promise<JobResult> {
  const { data } = job;
  
  // Send notifications to team members
  await this.sendProjectNotifications(data);
  
  return { success: true, executionTime: 0 };
}
```

### 4. Adding Scheduled Tasks

```typescript
// In your service or create a new service
@Injectable()
export class ProjectSchedulerService {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Cron('0 9 * * 1', { name: 'weekly-project-reports' })
  async generateWeeklyReports() {
    // Generate weekly project reports
    const accounts = await this.getActiveAccounts();
    
    for (const account of accounts) {
      await this.schedulerService.queueReportJob({
        type: 'project_weekly_summary',
        format: 'pdf',
        filters: { accountId: account.id, period: 'week' },
        userId: 'system',
        email: account.adminEmail,
      });
    }
  }
}
```

## Common Tasks

### Adding New Permissions

```typescript
// 1. Add to permission constants
export const PERMISSIONS = {
  // Existing permissions...
  PROJECTS: {
    READ: 'account.projects.read',
    CREATE: 'account.projects.create',
    UPDATE: 'account.projects.update',
    DELETE: 'account.projects.delete',
    MANAGE: 'account.projects.manage',
  },
} as const;

// 2. Add to database seed
// prisma/seed.ts
const projectPermissions = [
  { name: 'account.projects.read', description: 'View account projects' },
  { name: 'account.projects.create', description: 'Create account projects' },
  { name: 'account.projects.update', description: 'Update account projects' },
  { name: 'account.projects.delete', description: 'Delete account projects' },
  { name: 'account.projects.manage', description: 'Manage all account projects' },
];

// 3. Assign to roles
const accountAdminRole = await prisma.role.findFirst({ 
  where: { name: 'Account Admin' } 
});

await prisma.rolePermission.createMany({
  data: projectPermissions.map(perm => ({
    roleId: accountAdminRole.id,
    permissionId: perm.id,
  })),
});
```

### Adding Caching

```typescript
// Service with caching
@Injectable()
export class ProjectsService {
  async findByAccount(accountId: string): Promise<Project[]> {
    const cacheKey = this.redis.getTenantKey(accountId, 'projects');
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const projects = await this.prisma.project.findMany({
      where: { accountId: parseInt(accountId) },
    });
    
    // Cache for 30 minutes
    await this.redis.set(cacheKey, JSON.stringify(projects), 1800);
    
    return projects;
  }

  async update(id: string, updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.prisma.project.update({
      where: { id: parseInt(id) },
      data: updateDto,
    });
    
    // Invalidate cache
    const cacheKey = this.redis.getTenantKey(project.accountId.toString(), 'projects');
    await this.redis.del(cacheKey);
    
    return project;
  }
}
```

### Adding Validation Rules

```typescript
// Custom validators
import { ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueProjectName', async: true })
export class IsUniqueProjectNameConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(name: string, args: any) {
    const accountId = args.object.accountId;
    const existing = await this.prisma.project.findFirst({
      where: { name, accountId },
    });
    return !existing;
  }

  defaultMessage() {
    return 'Project name must be unique within the account';
  }
}

export const IsUniqueProjectName = () =>
  registerDecorator({
    target: object => object.constructor,
    propertyName: 'name',
    constraints: [],
    validator: IsUniqueProjectNameConstraint,
  });

// Usage in DTO
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsUniqueProjectName()
  name: string;
}
```

## Debugging & Troubleshooting

### Debugging Requests

```typescript
// Add debug logging to any service
this.logger.debug('Processing request', {
  userId: user.id,
  accountId: user.accountId,
  params: { projectId },
  body: updateDto,
});
```

### Database Query Debugging

```typescript
// Enable Prisma query logging in development
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}

// Or programmatically
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Testing with Different User Roles

```typescript
// Create different test users
const regularUser = TestHelpers.createTestUser({
  permissions: ['user.profile.read', 'user.profile.edit'],
});

const accountAdmin = TestHelpers.createTestUser({
  tier: 'account',
  permissions: ['account.*'],
});

const platformAdmin = TestHelpers.createTestUser({
  tier: 'platform', 
  permissions: ['platform.*'],
});

// Test with different permissions
it('should allow account admin to create projects', async () => {
  const token = TestHelpers.generateTestToken(jwtService, accountAdmin);
  // ... test logic
});

it('should deny regular user creating projects', async () => {
  const token = TestHelpers.generateTestToken(jwtService, regularUser);
  // ... expect 403 Forbidden
});
```

### Performance Monitoring

```typescript
// Add performance monitoring to services
@Injectable()
export class ProjectsService {
  async findByAccount(accountId: string): Promise<Project[]> {
    const startTime = Date.now();
    
    try {
      const projects = await this.prisma.project.findMany({
        where: { accountId: parseInt(accountId) },
      });
      
      const duration = Date.now() - startTime;
      this.logger.logPerformance('projects.findByAccount', duration, {
        accountId,
        resultCount: projects.length,
      });
      
      return projects;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('projects.findByAccount failed', error, {
        accountId,
        duration,
      });
      throw error;
    }
  }
}
```

## Code Quality

### Linting and Formatting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint:fix

# Format with Prettier
pnpm format

# Check TypeScript
pnpm type-check
```

### Testing Standards

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e

# Run specific test file
pnpm test projects.service.spec.ts

# Run tests in watch mode
pnpm test:watch
```

### Code Review Checklist

- [ ] **DTOs**: Proper validation decorators
- [ ] **Services**: Error handling and logging
- [ ] **Controllers**: Proper guards and permissions
- [ ] **Tests**: Unit and E2E tests written
- [ ] **Documentation**: API docs updated
- [ ] **Performance**: Caching where appropriate
- [ ] **Security**: No sensitive data in logs
- [ ] **Types**: Proper TypeScript types
- [ ] **Migrations**: Database changes documented

## Deployment

### Pre-deployment Checklist

```bash
# 1. Run full test suite
pnpm test
pnpm test:e2e

# 2. Check build
pnpm build

# 3. Run linter
pnpm lint

# 4. Check for security issues
pnpm audit

# 5. Update documentation
# Update API docs if needed

# 6. Database migrations
pnpm prisma migrate deploy
```

### Environment Variables

```bash
# Required environment variables
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret

# Optional
LOG_LEVEL=info
NODE_ENV=production
PORT=3001
```

This guide provides a complete workflow for developing features in the NestJS architecture, ensuring consistency and quality across the codebase.