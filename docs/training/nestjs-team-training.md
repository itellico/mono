# NestJS Team Training Guide

Comprehensive training materials for the development team on NestJS patterns, best practices, and the itellico architecture.

## Training Overview

### Objectives
By the end of this training, team members will:
- ✅ Understand NestJS core concepts and decorators
- ✅ Master the 5-tier architecture pattern
- ✅ Know how to implement new features following established patterns
- ✅ Understand testing strategies and best practices
- ✅ Be proficient with debugging and troubleshooting

### Target Audience
- Full-stack developers
- Backend developers
- DevOps engineers (deployment sections)
- Technical leads

### Duration
- **Full Training**: 4-6 hours (can be split across multiple sessions)
- **Quick Onboarding**: 2 hours (for experienced NestJS developers)

## Module 1: NestJS Fundamentals (45 minutes)

### 1.1 What is NestJS? (10 minutes)

**Key Concepts:**
- Progressive Node.js framework for building scalable server-side applications
- Built with TypeScript
- Heavily inspired by Angular
- Uses decorators extensively
- Dependency Injection (DI) container

**Why NestJS for itellico?**
- **Performance**: Fastify adapter maintains >40K req/sec
- **Developer Experience**: Decorators and clear patterns work perfectly with Claude Code
- **Enterprise Ready**: Built-in testing, validation, guards, interceptors
- **Scalability**: Microservices ready with RabbitMQ integration

### 1.2 Core Decorators (15 minutes)

#### Controllers
```typescript
@Controller('api/v1/user')
export class UserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: user };
  }

  @Post('update')
  @RequirePermissions('user.profile.edit')
  async updateProfile(
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // Implementation
  }
}
```

#### Services & Dependency Injection
```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}

  async findById(id: string): Promise<User> {
    // Check cache first
    const cached = await this.redis.get(`user:${id}`);
    if (cached) return JSON.parse(cached);

    // Query database
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    // Cache result
    await this.redis.set(`user:${id}`, JSON.stringify(user), 3600);
    
    return user;
  }
}
```

#### Modules
```typescript
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    LoggingModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

### 1.3 Request Lifecycle (10 minutes)

**Order of Execution:**
1. **Guards** - Authentication, permissions
2. **Interceptors (Before)** - Logging, transform request
3. **Pipes** - Validation, transformation
4. **Controller Method** - Business logic
5. **Interceptors (After)** - Transform response, metrics
6. **Exception Filters** - Error handling

### 1.4 Hands-on Exercise (10 minutes)

**Task**: Create a simple `HealthController`
```typescript
@Controller('api/v1/health')
export class HealthController {
  @Get()
  health() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
        version: process.env.npm_package_version,
      },
    };
  }
}
```

## Module 2: itellico 5-Tier Architecture (60 minutes)

### 2.1 Architecture Overview (15 minutes)

**Tier Hierarchy:**
```
Platform (System Admin)
   ↓
Tenant (Tenant Admin)
   ↓
Account (Account Admin)
   ↓
User (Individual User)
   ↓
Public (No Authentication)
```

**Tier Characteristics:**
- **Public**: `/api/v1/public/*` - No authentication required
- **User**: `/api/v1/user/*` - Individual user operations
- **Account**: `/api/v1/account/*` - Account-level management
- **Tenant**: `/api/v1/tenant/*` - Tenant administration
- **Platform**: `/api/v1/platform/*` - System administration

### 2.2 Permission System (15 minutes)

**Permission Format:**
```
{tier}.{resource}.{action}

Examples:
- user.profile.read
- account.users.create
- tenant.configuration.manage
- platform.tenants.create
```

**Using Permissions:**
```typescript
@Controller('api/v1/account/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AccountUsersController {
  @Get()
  @RequirePermissions('account.users.read')
  async getUsers(@CurrentAccount() accountId: string) {
    // Implementation
  }

  @Post()
  @RequirePermissions('account.users.create')
  async createUser(
    @Body() createDto: CreateUserDto,
    @CurrentAccount() accountId: string
  ) {
    // Implementation
  }
}
```

### 2.3 Custom Decorators (15 minutes)

**User Context Decorators:**
```typescript
// Get current user
@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  // user.id, user.email, user.permissions available
}

// Get current account ID
@Get('settings')
async getSettings(@CurrentAccount() accountId: string) {
  // accountId available as string
}

// Get current tenant ID (if applicable)
@Get('config')
async getConfig(@CurrentTenant() tenantId: string) {
  // tenantId available as string
}
```

**Permission Decorators:**
```typescript
// Single permission
@RequirePermissions('account.users.read')

// Multiple permissions (ANY)
@RequirePermissions('account.admin', 'platform.support')

// Public endpoint (skip authentication)
@Public()
```

### 2.4 Response Format Standards (15 minutes)

**Standard Success Response:**
```typescript
// Simple success
return {
  success: true,
  data: result
};

// Paginated response
return {
  success: true,
  data: {
    items: users,
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8
    }
  }
};
```

**Error Responses (handled by interceptor):**
```typescript
// Automatic error format
{
  success: false,
  error: 'ERROR_CODE',
  message: 'Human readable message',
  details?: { additional: 'context' }
}
```

## Module 3: Development Patterns (60 minutes)

### 3.1 Creating New Features (20 minutes)

**Step-by-Step Process:**

1. **Create DTOs**
```typescript
// src/modules/account/dto/create-project.dto.ts
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'Project Alpha' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
```

2. **Implement Service**
```typescript
// src/modules/account/services/projects.service.ts
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  async create(accountId: string, createDto: CreateProjectDto) {
    this.logger.logBusiness('Creating project', { accountId, name: createDto.name });
    
    return this.prisma.project.create({
      data: {
        ...createDto,
        accountId: parseInt(accountId),
      },
    });
  }
}
```

3. **Create Controller**
```typescript
// src/modules/account/controllers/projects.controller.ts
@Controller('api/v1/account/projects')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('account.projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @RequirePermissions('account.projects.create')
  @ApiOperation({ summary: 'Create new project' })
  async create(
    @Body() createDto: CreateProjectDto,
    @CurrentAccount() accountId: string
  ) {
    const project = await this.projectsService.create(accountId, createDto);
    return { success: true, data: project };
  }
}
```

4. **Add to Module**
```typescript
// src/modules/account/account.module.ts
@Module({
  controllers: [
    // ... existing
    ProjectsController,
  ],
  providers: [
    // ... existing
    ProjectsService,
  ],
})
export class AccountModule {}
```

### 3.2 Database Patterns (20 minutes)

**Working with Prisma:**
```typescript
// Basic CRUD operations
@Injectable()
export class ProjectsService {
  // Create
  async create(data: CreateProjectDto) {
    return this.prisma.project.create({ data });
  }

  // Read with relations
  async findByAccount(accountId: string) {
    return this.prisma.project.findMany({
      where: { accountId: parseInt(accountId) },
      include: {
        account: true,
        users: { where: { isActive: true } },
      },
    });
  }

  // Update
  async update(id: string, data: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  // Delete (soft delete recommended)
  async delete(id: string) {
    return this.prisma.project.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
  }
}
```

**Transaction Patterns:**
```typescript
async createProjectWithTeam(projectData: CreateProjectDto, teamData: CreateTeamDto) {
  return this.prisma.$transaction(async (tx) => {
    const project = await tx.project.create({ data: projectData });
    
    const team = await tx.team.create({
      data: {
        ...teamData,
        projectId: project.id,
      },
    });

    return { project, team };
  });
}
```

### 3.3 Caching Patterns (20 minutes)

**Service-Level Caching:**
```typescript
@Injectable()
export class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    // L1 Cache: Redis
    const cacheKey = `user:profile:${userId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      this.logger.logPerformance('cache-hit', 0, { key: cacheKey });
      return JSON.parse(cached);
    }

    // L2 Cache: Database
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { account: true, userRoles: { include: { role: true } } },
    });

    const profile = this.mapToProfile(user);
    
    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(profile), 3600);
    
    return profile;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateDto,
    });

    // Invalidate cache
    await this.redis.del(`user:profile:${userId}`);
    
    return user;
  }
}
```

**Controller-Level Caching:**
```typescript
@Controller('api/v1/user')
export class UserController {
  @Get('configuration')
  @CacheResponse(3600) // Cache for 1 hour
  async getConfiguration() {
    return this.configService.getUserConfig();
  }

  @Put('configuration')
  @CacheInvalidate('user:*:configuration') // Clear user config caches
  async updateConfiguration(@Body() configDto: ConfigDto) {
    return this.configService.updateUserConfig(configDto);
  }
}
```

## Module 4: Testing Strategies (45 minutes)

### 4.1 Unit Testing (20 minutes)

**Service Testing Pattern:**
```typescript
// src/modules/user/services/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            logPerformance: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should get user profile from cache', async () => {
    const mockProfile = { id: '1', name: 'John Doe' };
    jest.spyOn(redis, 'get').mockResolvedValue(JSON.stringify(mockProfile));

    const result = await service.getProfile('1');

    expect(result).toEqual(mockProfile);
    expect(redis.get).toHaveBeenCalledWith('user:profile:1');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should fetch from database when cache miss', async () => {
    const mockUser = { 
      id: 1, 
      name: 'John Doe', 
      account: { email: 'john@example.com' },
      userRoles: []
    };
    
    jest.spyOn(redis, 'get').mockResolvedValue(null);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(redis, 'set').mockResolvedValue(undefined);

    const result = await service.getProfile('1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: expect.any(Object),
    });
    expect(redis.set).toHaveBeenCalled();
  });
});
```

### 4.2 E2E Testing (25 minutes)

**Controller E2E Testing:**
```typescript
// test/user/user.e2e-spec.ts
describe('UserController (e2e)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    jwtService = app.get<JwtService>(JwtService);
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.deleteMany();
    await app.close();
  });

  it('/api/v1/user/profile (GET)', async () => {
    // Setup test data
    const testUser = await TestHelpers.createTestUser(prisma);
    const token = TestHelpers.generateTestToken(jwtService, testUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/user/profile',
      cookies: { 'auth-token': token },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: testUser.id,
        email: testUser.email,
      }),
    });
  });

  it('/api/v1/user/profile (PUT)', async () => {
    const testUser = await TestHelpers.createTestUser(prisma);
    const token = TestHelpers.generateTestToken(jwtService, testUser);

    const updateData = { name: 'Updated Name', bio: 'New bio' };

    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/user/profile',
      cookies: { 'auth-token': token },
      payload: updateData,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      success: true,
      data: expect.objectContaining(updateData),
    });

    // Verify database update
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(updatedUser.name).toBe(updateData.name);
  });
});
```

**Test Helpers:**
```typescript
// test/utils/test-helpers.ts
export class TestHelpers {
  static createTestUser(prisma: PrismaService, overrides = {}) {
    return prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        ...overrides,
      },
    });
  }

  static generateTestToken(jwtService: JwtService, user: any) {
    return jwtService.sign({
      sub: user.id.toString(),
      email: user.email,
      permissions: ['user.profile.read', 'user.profile.edit'],
    });
  }

  static createAccountAdminUser(prisma: PrismaService) {
    return this.createTestUser(prisma, {
      permissions: [
        'account.users.read',
        'account.users.create',
        'account.users.update',
        'account.admin',
      ],
    });
  }
}
```

## Module 5: Advanced Features (45 minutes)

### 5.1 Background Jobs & Queues (20 minutes)

**Queueing Jobs:**
```typescript
@Injectable()
export class UserService {
  constructor(private readonly rabbitmq: RabbitMQService) {}

  async createUser(createDto: CreateUserDto) {
    const user = await this.prisma.user.create({ data: createDto });

    // Queue welcome email
    await this.rabbitmq.queueEmailJob({
      type: 'user.welcome',
      to: user.email,
      data: { userName: user.name },
      priority: 5,
    });

    // Queue notification to account admins
    await this.rabbitmq.queueNotificationJob({
      type: 'user.created',
      recipients: await this.getAccountAdmins(user.accountId),
      data: { userId: user.id, userName: user.name },
    });

    return user;
  }
}
```

**Processing Jobs:**
```typescript
@Injectable()
export class BackgroundJobsService extends BaseQueueProcessor {
  @MessagePattern('email.user.welcome')
  async handleWelcomeEmail(@Payload() job: EmailJob): Promise<JobResult> {
    try {
      await this.emailService.sendWelcomeEmail(job.to, job.data);
      
      return {
        success: true,
        executionTime: Date.now() - job.createdAt,
        result: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error('Welcome email failed', error, { jobId: job.id });
      throw error; // Will trigger retry logic
    }
  }

  @MessagePattern('notification.user.created')
  async handleUserCreatedNotification(@Payload() job: NotificationJob): Promise<JobResult> {
    // Send in-app notifications to account admins
    await Promise.all(
      job.recipients.map(recipient =>
        this.notificationService.create({
          userId: recipient.id,
          type: 'user_created',
          message: `New user ${job.data.userName} joined the account`,
          data: job.data,
        })
      )
    );

    return { success: true };
  }
}
```

### 5.2 Scheduled Tasks (15 minutes)

**Cron Jobs:**
```typescript
@Injectable()
export class ScheduledTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  @Cron('0 2 * * *', { name: 'daily-cleanup', timeZone: 'UTC' })
  async handleDailyCleanup() {
    this.logger.logSystem('Starting daily cleanup');

    // Clean expired sessions
    await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Clean old audit logs (keep 90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    // Queue backup job
    await this.rabbitmq.queueBackupJob({
      type: 'database.backup',
      schedule: 'daily',
      retentionDays: 30,
    });

    this.logger.logSystem('Daily cleanup completed');
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'health-check' })
  async handleHealthCheck() {
    // Check critical services
    const services = ['database', 'redis', 'rabbitmq'];
    const healthStatus = {};

    for (const service of services) {
      try {
        await this.checkService(service);
        healthStatus[service] = 'healthy';
      } catch (error) {
        healthStatus[service] = 'unhealthy';
        this.logger.logSecurity(`Service ${service} unhealthy`, 'high');
      }
    }

    // Alert if any service is down
    const unhealthyServices = Object.entries(healthStatus)
      .filter(([_, status]) => status === 'unhealthy')
      .map(([service]) => service);

    if (unhealthyServices.length > 0) {
      await this.rabbitmq.queueNotificationJob({
        type: 'system.alert',
        recipients: await this.getSystemAdmins(),
        data: { unhealthyServices },
        priority: 10, // High priority
      });
    }
  }
}
```

### 5.3 Monitoring & Logging (10 minutes)

**Structured Logging:**
```typescript
@Injectable()
export class OrderService {
  constructor(private readonly logger: LoggerService) {}

  async createOrder(userId: string, orderData: CreateOrderDto) {
    this.logger.logBusiness('Order creation started', {
      userId,
      itemCount: orderData.items.length,
      totalAmount: orderData.total,
    });

    try {
      const order = await this.processOrder(orderData);
      
      this.logger.logBusiness('Order created successfully', {
        userId,
        orderId: order.id,
        amount: order.total,
        processingTime: Date.now() - startTime,
      });

      return order;
    } catch (error) {
      this.logger.logBusiness('Order creation failed', {
        userId,
        error: error.message,
        orderData: JSON.stringify(orderData),
      });
      throw error;
    }
  }
}
```

**Performance Monitoring:**
```typescript
@Injectable()
export class UserService {
  async getComplexUserData(userId: string) {
    const startTime = Date.now();
    
    try {
      const result = await this.performComplexQuery(userId);
      
      const duration = Date.now() - startTime;
      this.logger.logPerformance('complex-user-query', duration, {
        userId,
        resultSize: JSON.stringify(result).length,
      });

      // Alert if query is slow
      if (duration > 1000) {
        this.logger.logSecurity('Slow query detected', 'medium', {
          query: 'complex-user-query',
          duration,
          userId,
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Complex query failed', error, { userId });
      throw error;
    }
  }
}
```

## Module 6: Debugging & Troubleshooting (30 minutes)

### 6.1 Common Issues & Solutions (20 minutes)

**Issue 1: Dependency Injection Errors**
```
Error: Nest can't resolve dependencies of the UserService (?, PrismaService)
```

**Solution:**
```typescript
// Wrong - Missing provider
@Module({
  providers: [UserService], // LoggerService not provided
})

// Correct - All dependencies provided
@Module({
  imports: [LoggingModule], // LoggerService exported from LoggingModule
  providers: [UserService],
})
```

**Issue 2: Circular Dependencies**
```
Error: Nest cannot create the UserService instance. The module has a circular dependency.
```

**Solution:**
```typescript
// Use forwardRef
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
  ) {}
}
```

**Issue 3: Schema Type Mismatches**
```
Error: Type 'string' is not assignable to type 'number'
```

**Solution:**
```typescript
// Always convert IDs for Prisma
async findUser(id: string) {
  return this.prisma.user.findUnique({
    where: { id: parseInt(id) }, // Convert string to number
  });
}

// Convert back for API responses
return {
  success: true,
  data: {
    ...user,
    id: user.id.toString(), // Convert number to string
  },
};
```

### 6.2 Debugging Tools (10 minutes)

**Debug Configuration:**
```typescript
// src/main.ts - Development
if (process.env.NODE_ENV === 'development') {
  // Enable detailed logging
  app.useLogger(new Logger());
  
  // Enable query logging
  const logger = new Logger('SQL');
  prisma.$on('query', (e) => {
    logger.log(`Query: ${e.query}`);
    logger.log(`Duration: ${e.duration}ms`);
  });
}
```

**Debugging Requests:**
```typescript
// Add debug logging to any service
@Injectable()
export class ProjectService {
  async createProject(data: CreateProjectDto) {
    this.logger.debug('Creating project with data', {
      projectName: data.name,
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
    });

    const result = await this.prisma.project.create({ data });
    
    this.logger.debug('Project created', {
      projectId: result.id,
      executionTime: '...',
    });

    return result;
  }
}
```

## Module 7: Best Practices & Code Review (30 minutes)

### 7.1 Code Quality Checklist (15 minutes)

**Controller Checklist:**
- ✅ Uses proper HTTP methods (GET, POST, PUT, DELETE)
- ✅ Has appropriate guards (@UseGuards)
- ✅ Uses permission decorators (@RequirePermissions)
- ✅ Validates input with DTOs
- ✅ Returns standardized responses
- ✅ Has proper API documentation (@ApiOperation)

**Service Checklist:**
- ✅ Uses dependency injection properly
- ✅ Has proper error handling
- ✅ Logs important operations
- ✅ Uses transactions for multi-step operations
- ✅ Implements caching where appropriate
- ✅ Has unit tests

**DTO Checklist:**
- ✅ Has proper validation decorators
- ✅ Has API documentation (@ApiProperty)
- ✅ Uses TypeScript types correctly
- ✅ Follows naming conventions

### 7.2 Performance Best Practices (15 minutes)

**Database Optimization:**
```typescript
// ❌ Bad - N+1 queries
async getProjectsWithUsers() {
  const projects = await this.prisma.project.findMany();
  
  for (const project of projects) {
    project.users = await this.prisma.user.findMany({
      where: { projectId: project.id },
    });
  }
  
  return projects;
}

// ✅ Good - Single query with includes
async getProjectsWithUsers() {
  return this.prisma.project.findMany({
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, name: true, email: true },
      },
    },
  });
}
```

**Caching Strategy:**
```typescript
// ✅ Good - Multi-layer caching
async getExpensiveData(id: string) {
  // L1: Memory cache (fastest)
  if (this.memoryCache.has(id)) {
    return this.memoryCache.get(id);
  }

  // L2: Redis cache
  const cached = await this.redis.get(`expensive:${id}`);
  if (cached) {
    const data = JSON.parse(cached);
    this.memoryCache.set(id, data, 300); // 5 minutes
    return data;
  }

  // L3: Database (slowest)
  const data = await this.computeExpensiveData(id);
  
  // Cache at all levels
  await this.redis.set(`expensive:${id}`, JSON.stringify(data), 3600);
  this.memoryCache.set(id, data, 300);
  
  return data;
}
```

## Training Assessment

### Practical Exercise (30 minutes)

**Task**: Implement a complete feature for "Project Comments"

**Requirements:**
1. Create DTOs for creating and updating comments
2. Implement CommentService with CRUD operations
3. Create CommentController with proper guards and permissions
4. Add caching for frequently accessed comments
5. Write unit tests for the service
6. Write E2E tests for the controller

**Expected Files:**
- `src/modules/account/dto/create-comment.dto.ts`
- `src/modules/account/dto/update-comment.dto.ts`
- `src/modules/account/services/comments.service.ts`
- `src/modules/account/controllers/comments.controller.ts`
- `src/modules/account/services/comments.service.spec.ts`
- `test/account/comments.e2e-spec.ts`

### Knowledge Check Questions

1. What is the order of execution in the NestJS request lifecycle?
2. How do you implement caching in a service method?
3. What's the difference between `@CurrentUser()` and `@CurrentAccount()` decorators?
4. How do you queue a background job for sending an email?
5. What's the proper way to handle database transactions?
6. How do you implement proper error handling in a service?
7. What are the 5 tiers in our architecture and their purposes?

## Training Resources

### Documentation Links
- [NestJS Official Documentation](https://docs.nestjs.com/)
- [API Patterns Guide](../architecture/nestjs-migration/api-patterns.md)
- [Development Guide](../architecture/nestjs-migration/development-guide.md)
- [Migration Status](../architecture/nestjs-migration/migration-status.md)

### Code Examples
- Live examples in `apps/api-nest/src/modules/`
- Test examples in `apps/api-nest/test/`
- Performance benchmarks in `apps/api-nest/src/benchmark/`

### Support Channels
- **Slack**: #nestjs-migration
- **Documentation**: http://localhost:3005
- **API Docs**: http://localhost:3001/docs
- **Live Environment**: Use `./start-nestjs-dev.sh`

## Post-Training Action Items

### For Developers
1. ✅ Complete the practical exercise
2. ✅ Set up local development environment
3. ✅ Review existing codebase patterns
4. ✅ Implement first feature using new patterns
5. ✅ Participate in code reviews

### For Team Leads
1. ✅ Schedule follow-up sessions for specific topics
2. ✅ Set up code review guidelines for NestJS
3. ✅ Update development workflows
4. ✅ Monitor team progress and provide support

### For DevOps
1. ✅ Understand Docker configuration
2. ✅ Review CI/CD pipeline changes
3. ✅ Set up monitoring and alerting
4. ✅ Plan production deployment strategy

---

**Training Success Metrics:**
- Team can implement new features using NestJS patterns
- Code reviews pass quality standards
- Performance benchmarks are met
- No major bugs in production after migration

**Continuous Learning:**
- Monthly NestJS pattern reviews
- Share knowledge through team presentations
- Stay updated with NestJS releases and best practices