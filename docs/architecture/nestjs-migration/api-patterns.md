---
title: NestJS API Patterns and Decorators
sidebar_label: API Patterns
---

# NestJS API Patterns and Decorators

Comprehensive guide to the API patterns, decorators, and conventions used in the NestJS migration.

## Controller Patterns

### 1. Standard Controller Structure

Every controller follows this consistent pattern:

```typescript
@Controller('api/v1/{tier}')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
@ApiTags('{tier}.{resource}')
export class {Resource}Controller {
  constructor(
    private readonly {resource}Service: {Resource}Service,
    private readonly logger: LoggerService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List {resources}' })
  @RequirePermissions('{tier}.{resource}.read')
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDto
  ): Promise<ApiResponse<{Resource}[]>> {
    const items = await this.{resource}Service.list(user, query);
    return { success: true, data: items };
  }
}
```

### 2. Tier-Specific Controllers

#### Public Tier (No Authentication)

```typescript
@Controller('api/v1/public')
@ApiTags('public')
export class PublicController {
  // No guards required
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health(): Promise<ApiResponse<HealthStatus>> {
    return { 
      success: true, 
      data: { status: 'healthy', timestamp: new Date() } 
    };
  }
}
```

#### User Tier (Individual Operations)

```typescript
@Controller('api/v1/user')
@UseGuards(JwtAuthGuard)
@ApiTags('user')
export class UserController {
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    // User can only access their own profile
    return this.userService.getProfile(user.id);
  }
}
```

#### Account Tier (Team Management)

```typescript
@Controller('api/v1/account')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('account')
export class AccountController {
  @Post('users')
  @RequirePermissions('account.users.create')
  @ApiOperation({ summary: 'Create account user' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // User can create users in their account
    return this.accountService.createUser(createUserDto, user.accountId);
  }
}
```

#### Tenant Tier (Tenant Administration)

```typescript
@Controller('api/v1/tenant')
@UseGuards(JwtAuthGuard, PermissionGuard, TenantContextGuard)
@ApiTags('tenant')
export class TenantController {
  @Put('configuration')
  @RequirePermissions('tenant.configuration.manage')
  @ApiOperation({ summary: 'Update tenant configuration' })
  async updateConfiguration(
    @Body() configDto: TenantConfigDto,
    @CurrentTenant() tenantId: string
  ) {
    return this.tenantService.updateConfiguration(tenantId, configDto);
  }
}
```

#### Platform Tier (System Administration)

```typescript
@Controller('api/v1/platform')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('platform')
export class PlatformController {
  @Post('tenants')
  @RequirePermissions('platform.tenants.create')
  @ApiOperation({ summary: 'Create new tenant' })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.platformService.createTenant(createTenantDto, user);
  }
}
```

## Custom Decorators

### 1. User Context Decorators

#### @CurrentUser()

Extracts the authenticated user from the request:

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Usage
@Get('profile')
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  return this.userService.getProfile(user.id);
}
```

#### @CurrentTenant()

Extracts the tenant ID from the authenticated user:

```typescript
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.tenantId;
  },
);

// Usage
@Get('configuration')
async getConfiguration(@CurrentTenant() tenantId: string) {
  return this.tenantService.getConfiguration(tenantId);
}
```

#### @CurrentAccount()

Extracts the account ID from the authenticated user:

```typescript
export const CurrentAccount = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.accountId;
  },
);

// Usage
@Get('users')
async getAccountUsers(@CurrentAccount() accountId: string) {
  return this.accountService.getUsers(accountId);
}
```

### 2. Permission Decorators

#### @RequirePermissions()

Declares the permissions required for an endpoint:

```typescript
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Usage - Single permission
@Get('users')
@RequirePermissions('account.users.read')
async getUsers() { }

// Usage - Multiple permissions (ANY)
@Post('users')
@RequirePermissions('account.users.create', 'account.admin')
async createUser() { }

// Usage - Multiple permissions (ALL)
@Delete('users/:id')
@RequirePermissions('account.users.delete')
@RequirePermissions('account.users.manage') // Both required
async deleteUser() { }
```

#### @Public()

Marks an endpoint as public (skips authentication):

```typescript
export const Public = () => SetMetadata('isPublic', true);

// Usage
@Get('health')
@Public()
async health() {
  return { status: 'healthy' };
}
```

### 3. Validation Decorators

#### @ValidateQuery()

Custom query validation with transform:

```typescript
export const ValidateQuery = (dto: any) => 
  Query(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    forbidNonWhitelisted: true 
  }));

// Usage
@Get()
async list(@ValidateQuery(ListUsersDto) query: ListUsersDto) {
  return this.userService.list(query);
}
```

#### @ValidateBody()

Body validation with sanitization:

```typescript
export const ValidateBody = (dto: any) => 
  Body(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    forbidNonWhitelisted: true,
    validateCustomDecorators: true 
  }));

// Usage
@Post()
async create(@ValidateBody(CreateUserDto) data: CreateUserDto) {
  return this.userService.create(data);
}
```

### 4. Caching Decorators

#### @CacheResponse()

Enables response caching for GET endpoints:

```typescript
export const CacheResponse = (ttl: number = 300) => 
  SetMetadata('cache', { ttl });

// Usage
@Get('configuration')
@CacheResponse(3600) // Cache for 1 hour
async getConfiguration() {
  return this.configService.get();
}
```

#### @CacheInvalidate()

Invalidates cache patterns on mutations:

```typescript
export const CacheInvalidate = (...patterns: string[]) => 
  SetMetadata('invalidate', patterns);

// Usage
@Put('configuration')
@CacheInvalidate('tenant:*:configuration', 'user:*:settings')
async updateConfiguration() {
  // Cache patterns will be invalidated after successful update
}
```

## Guards

### 1. JWT Authentication Guard

Validates JWT tokens and populates user context:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}
```

### 2. Permission Guard

Checks user permissions against required permissions:

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    return requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    );
  }
}
```

### 3. Tenant Context Guard

Ensures tenant isolation for multi-tenant operations:

```typescript
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Add tenant context to request
    request.tenant = {
      id: user.tenantId,
      // Additional tenant context
    };
    
    return true;
  }
}
```

## Interceptors

### 1. Response Transform Interceptor

Standardizes all API responses:

```typescript
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // Already formatted responses
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        // Pagination responses
        if (data && typeof data === 'object' && 'items' in data && 'pagination' in data) {
          return {
            success: true,
            data: data.items,
            pagination: data.pagination,
          };
        }
        
        // Standard responses
        return {
          success: true,
          data,
        };
      })
    );
  }
}
```

### 2. Logging Interceptor

Logs requests and responses with performance tracking:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userId = request.user?.id || 'anonymous';
    
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logPerformance(`${method} ${url}`, duration, { userId });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} failed`, error, { userId, duration });
        },
      })
    );
  }
}
```

## DTOs and Validation

### 1. Base DTO Classes

#### ListDto

Standard pagination and filtering:

```typescript
export class ListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ default: 20, minimum: 1, maximum: 100 })
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ default: 1, minimum: 1 })
  page?: number = 1;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false })
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ required: false })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @ApiProperty({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

#### CreateDto

Base creation DTO:

```typescript
export abstract class CreateDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  abstract name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

#### UpdateDto

Base update DTO with partial validation:

```typescript
export abstract class UpdateDto extends PartialType(CreateDto) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  isActive?: boolean;
}
```

### 2. Validation Rules

#### Custom Validators

```typescript
// Email domain validation
@ValidatorConstraint({ name: 'isAllowedDomain', async: false })
export class IsAllowedDomainConstraint implements ValidatorConstraintInterface {
  validate(email: string) {
    const allowedDomains = ['company.com', 'contractor.com'];
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }

  defaultMessage() {
    return 'Email domain is not allowed';
  }
}

export const IsAllowedDomain = () =>
  registerDecorator({
    target: object => object.constructor,
    propertyName: 'email',
    constraints: [],
    validator: IsAllowedDomainConstraint,
  });

// Usage
@IsEmail()
@IsAllowedDomain()
email: string;
```

#### Conditional Validation

```typescript
export class CreateUserDto {
  @IsString()
  userType: 'individual' | 'business';

  @ValidateIf(o => o.userType === 'business')
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ValidateIf(o => o.userType === 'business')
  @IsString()
  @IsNotEmpty()
  taxId?: string;
}
```

## Error Handling Patterns

### 1. Custom Exceptions

```typescript
export class TenantNotFoundException extends NotFoundException {
  constructor(tenantId: string) {
    super({
      success: false,
      error: 'TENANT_NOT_FOUND',
      message: `Tenant with ID ${tenantId} not found`,
      details: { tenantId },
    });
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(required: string[], actual: string[]) {
    super({
      success: false,
      error: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have the required permissions',
      details: { required, actual },
    });
  }
}
```

### 2. Exception Filters

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      success: false,
      error: this.getErrorCode(exception),
      message: this.getErrorMessage(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error('Exception occurred', exception, {
      url: request.url,
      method: request.method,
      statusCode: status,
    });

    response.status(status).json(errorResponse);
  }
}
```

## Testing Patterns

### 1. Controller Testing

```typescript
describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: { logPerformance: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should get user profile', async () => {
    const mockUser = { id: '1', name: 'John' };
    const mockProfile = { id: '1', name: 'John', email: 'john@example.com' };
    
    jest.spyOn(service, 'getProfile').mockResolvedValue(mockProfile);

    const result = await controller.getProfile(mockUser as any);

    expect(result).toEqual({ success: true, data: mockProfile });
    expect(service.getProfile).toHaveBeenCalledWith('1');
  });
});
```

### 2. E2E Testing with Authentication

```typescript
describe('UserController (e2e)', () => {
  let app: NestFastifyApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    await app.init();
    authService = app.get<AuthService>(AuthService);
  });

  it('should get user profile with valid token', async () => {
    // Create test user and token
    const testUser = TestHelpers.createTestUser();
    const token = TestHelpers.generateTestToken(app.get(JwtService), testUser);

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
});
```

## Performance Patterns

### 1. Caching Strategies

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    // L1 Cache: Redis
    const cacheKey = `user:profile:${userId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // L2 Cache: Database with includes
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        account: true,
        userRoles: { include: { role: true } },
      },
    });

    const profile = this.mapToProfile(user);
    
    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(profile), 3600);
    
    return profile;
  }
}
```

### 2. Batch Operations

```typescript
@Injectable()
export class UserService {
  async updateMultiple(updates: UpdateUserDto[]): Promise<User[]> {
    // Use transaction for batch updates
    return this.prisma.$transaction(
      updates.map(update => 
        this.prisma.user.update({
          where: { id: update.id },
          data: update,
        })
      )
    );
  }

  async getMultiple(userIds: string[]): Promise<User[]> {
    // Batch cache lookup
    const cacheKeys = userIds.map(id => `user:${id}`);
    const cached = await this.redis.mget(cacheKeys);
    
    const foundUsers = new Map();
    const missingIds = [];
    
    cached.forEach((item, index) => {
      if (item) {
        foundUsers.set(userIds[index], JSON.parse(item));
      } else {
        missingIds.push(userIds[index]);
      }
    });
    
    // Fetch missing users
    if (missingIds.length > 0) {
      const dbUsers = await this.prisma.user.findMany({
        where: { id: { in: missingIds.map(id => parseInt(id)) } },
      });
      
      // Cache the missing users
      const cacheItems = dbUsers.map(user => ({
        key: `user:${user.id}`,
        value: JSON.stringify(user),
        ttl: 3600,
      }));
      
      await this.redis.mset(cacheItems);
      
      dbUsers.forEach(user => foundUsers.set(user.id.toString(), user));
    }
    
    return userIds.map(id => foundUsers.get(id)).filter(Boolean);
  }
}
```

## Best Practices Summary

### 1. Controller Guidelines
- ✅ Use consistent decorator order
- ✅ Always validate input with DTOs
- ✅ Use custom decorators for common patterns
- ✅ Keep controllers thin - delegate to services
- ✅ Use proper HTTP status codes

### 2. Service Guidelines
- ✅ Implement proper error handling
- ✅ Use transactions for multi-step operations
- ✅ Cache frequently accessed data
- ✅ Log performance metrics
- ✅ Use dependency injection properly

### 3. Testing Guidelines
- ✅ Test controllers and services separately
- ✅ Use mocks for external dependencies
- ✅ Write comprehensive E2E tests
- ✅ Test error scenarios
- ✅ Maintain >70% code coverage

### 4. Performance Guidelines
- ✅ Use appropriate caching strategies
- ✅ Implement batch operations where possible
- ✅ Monitor slow queries and endpoints
- ✅ Use database indexes effectively
- ✅ Implement proper pagination

This comprehensive guide ensures consistent, maintainable, and performant API development across the entire NestJS application.