---
title: NestJS Quick Reference
sidebar_label: Quick Reference
---

# NestJS Quick Reference

Quick reference for common NestJS patterns and commands in the itellico mono project.

## Project Structure

```
apps/api-nest/
├── src/
│   ├── modules/           # Feature modules (5-tier)
│   ├── common/           # Shared code
│   ├── config/           # Configuration
│   └── main.ts          # Entry point
├── test/                # E2E tests
├── prisma/              # Database schema (symlink)
└── package.json         # Dependencies
```

## Common Commands

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm start:debug        # Start with debugger

# Building
pnpm build             # Build for production
pnpm start:prod        # Run production build

# Testing
pnpm test              # Run unit tests
pnpm test:watch        # Run tests in watch mode
pnpm test:cov          # Run tests with coverage
pnpm test:e2e          # Run end-to-end tests

# Code Quality
pnpm lint              # Run ESLint
pnpm format            # Format with Prettier

# Database
pnpm prisma generate   # Generate Prisma client
pnpm prisma migrate dev # Run migrations
pnpm prisma studio     # Open Prisma Studio
```

## Module Creation

```bash
# Generate a new module
nest g module modules/example

# Generate a complete CRUD module
nest g resource modules/example

# Individual components
nest g controller modules/example
nest g service modules/example
```

## Common Decorators

### Controller Decorators

```typescript
@Controller('v1/example')           // Define route prefix
@Get()                             // GET endpoint
@Post()                            // POST endpoint
@Put(':id')                        // PUT endpoint with param
@Delete(':id')                     // DELETE endpoint
@Patch(':id')                      // PATCH endpoint

@UseGuards(JwtAuthGuard)           // Apply auth guard
@UseInterceptors(CacheInterceptor) // Apply interceptor
@UsePipes(ValidationPipe)          // Apply validation
```

### Parameter Decorators

```typescript
@Body() body: CreateDto            // Request body
@Param('id') id: string           // Route parameter
@Query() query: QueryDto          // Query parameters
@Headers() headers: any           // Request headers
@Req() request: FastifyRequest    // Full request object
@Res() response: FastifyReply     // Full response object
@CurrentUser() user: User         // Custom user decorator
```

### Validation Decorators

```typescript
@IsString()                       // String validation
@IsNumber()                       // Number validation
@IsEmail()                        // Email validation
@IsEnum(Status)                   // Enum validation
@IsOptional()                     // Optional field
@IsNotEmpty()                     // Required field
@MinLength(5)                     // Min string length
@MaxLength(100)                   // Max string length
@IsUUID()                        // UUID validation
@IsDate()                        // Date validation
@Transform(({ value }) => ...)   // Transform value
```

## Service Patterns

### Basic Service

```typescript
@Injectable()
export class ExampleService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.example.findMany();
  }
}
```

### With Caching

```typescript
async findOne(id: string) {
  const cacheKey = `example:${id}`;
  
  // Check cache
  const cached = await this.redis.get(cacheKey);
  if (cached) return cached;
  
  // Get from DB
  const result = await this.prisma.example.findUnique({
    where: { id }
  });
  
  // Cache result
  if (result) {
    await this.redis.set(cacheKey, result, 300);
  }
  
  return result;
}
```

## Response Formats

### Success Response

```typescript
{
  success: true,
  data: {
    // Response data
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: "ERROR_CODE",
  message: "Human readable message"
}
```

### Paginated Response

```typescript
{
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5
    }
  }
}
```

## Guard Examples

### JWT Auth Guard

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async getProtected() {
  // Only authenticated users
}
```

### Tier Guard

```typescript
@UseGuards(JwtAuthGuard, TierGuard)
@RequireTier('tenant')
@Get('tenant-only')
async getTenantData() {
  // Only tenant tier and above
}
```

### Permission Guard

```typescript
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('platform.tenants.manage')
@Post('tenants')
async createTenant() {
  // Only users with permission
}
```

## Cache Keys

### Key Patterns

```typescript
// Tenant-scoped
`tenant:${tenantId}:${resource}`

// Account-scoped
`account:${accountId}:${resource}`

// User-scoped
`user:${userId}:${resource}`

// General cache
`cache:${resource}:${identifier}`
```

### Cache Operations

```typescript
// Set with TTL (seconds)
await redis.set('key', value, 300);

// Get
const value = await redis.get('key');

// Delete
await redis.del('key');

// Delete by pattern
await redis.delPattern('tenant:123:*');
```

## Environment Variables

### Required

```env
NODE_ENV=development|production|test
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
COOKIE_SECRET=secret
JWT_SECRET=secret
```

### Optional

```env
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://192.168.178.94:3000
REDIS_PASSWORD=password
```

## Testing

### Unit Test

```typescript
describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExampleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ExampleService);
  });

  it('should return examples', async () => {
    const result = await service.findAll();
    expect(result).toBeDefined();
  });
});
```

### E2E Test

```typescript
describe('Example (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();
  });

  it('/example (GET)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/example',
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## Common Issues

### Issue: Circular Dependency

```typescript
// Solution: Use forwardRef
@Module({
  imports: [forwardRef(() => OtherModule)],
})
```

### Issue: Cannot resolve dependencies

```typescript
// Solution: Ensure providers are exported
@Module({
  providers: [ExampleService],
  exports: [ExampleService], // Don't forget to export!
})
```

### Issue: Prisma types not found

```bash
# Solution: Generate Prisma client
pnpm prisma generate
```

## Performance Tips

1. **Use select** to limit database fields
2. **Cache frequently accessed data** with Redis
3. **Use pagination** for large datasets
4. **Enable compression** in Fastify
5. **Use indexes** in database schema
6. **Batch operations** when possible
7. **Avoid N+1 queries** with proper includes

## Security Best Practices

1. **Always validate input** with DTOs
2. **Use guards** for authentication/authorization
3. **Store secrets** in environment variables
4. **Use HTTP-only cookies** for auth tokens
5. **Enable CORS** with specific origins
6. **Sanitize user input** to prevent XSS
7. **Use parameterized queries** (Prisma does this)
8. **Rate limit** API endpoints
9. **Log security events** for auditing
10. **Keep dependencies updated**

## Useful Links

- [NestJS Documentation](https://docs.nestjs.com)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/documentation)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)