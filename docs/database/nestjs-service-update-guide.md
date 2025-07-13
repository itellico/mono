# NestJS Service Update Guide for New Schema

## Overview

This guide documents the updates required for NestJS services to support the new database schema with UUID primary keys, comprehensive audit trails, and Redis caching.

## Key Changes

### 1. UUID as Primary Identifier
- All entities now use PostgreSQL UUID as primary key
- Services support both UUID and numeric ID during migration
- API endpoints use UUID in URLs

### 2. Soft Deletes
- All delete operations are soft deletes by default
- `deletedAt` timestamp tracks deletion
- Hard deletes require explicit permission

### 3. Audit Trail
- All data changes are logged
- Permission checks are audited
- Data access is tracked for compliance

### 4. Redis Caching
- Multi-level caching for permissions
- Automatic cache invalidation
- Performance monitoring

## Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Controllers                          │
│  - UUID validation                                       │
│  - Audit decorators                                      │
│  - Permission guards                                     │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                      Services                            │
│  - BaseCrudService (common operations)                   │
│  - Domain-specific services                              │
│  - Cache integration                                     │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                   Infrastructure                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Prisma    │  │    Redis    │  │    Audit    │    │
│  │    (DB)     │  │   (Cache)   │  │   (Logs)    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Implementation Examples

### 1. Base CRUD Service

All services should extend `BaseCrudService` for consistent behavior:

```typescript
@Injectable()
export class ProductsService extends BaseCrudService<
  Product,
  Prisma.ProductCreateInput,
  Prisma.ProductUpdateInput
> {
  protected readonly modelName = 'product';

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly auditService: AuditService,
    protected readonly cacheInvalidator: CacheInvalidatorService,
  ) {
    super(prisma, auditService, cacheInvalidator);
  }

  // Add domain-specific methods here
}
```

### 2. Controller with UUID Support

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductsController {
  @Get(':uuid')
  @RequirePermission('tenant.products.read')
  async findOne(@UUID() uuid: string) {
    return this.productsService.findOne(uuid);
  }

  @Post()
  @RequirePermission('tenant.products.create')
  @Audit({
    category: AuditCategory.DATA_CHANGE,
    eventType: 'create',
    entityType: 'product',
  })
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(
      dto,
      req.user.id,
      req.user.tenantId,
    );
  }
}
```

### 3. Service with Caching

```typescript
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MultiLevelCacheService,
  ) {}

  async getSettings(tenantId: number): Promise<Settings> {
    const cacheKey = `settings:tenant:${tenantId}`;
    
    return this.cache.get(
      cacheKey,
      async () => {
        // Load from database
        return this.prisma.settings.findMany({
          where: { tenantId },
        });
      },
      {
        l1TTL: 60,     // 1 minute in memory
        l2TTL: 3600,   // 1 hour in Redis
        l3TTL: 86400,  // 24 hours in PostgreSQL
      },
    );
  }

  async updateSettings(
    tenantId: number,
    settings: UpdateSettingsDto,
  ): Promise<void> {
    // Update database
    await this.prisma.settings.update({
      where: { tenantId },
      data: settings,
    });

    // Invalidate cache
    await this.cache.invalidate(`settings:tenant:${tenantId}`);
  }
}
```

## Migration Checklist

### For Each Service:

- [ ] Extend `BaseCrudService` for CRUD operations
- [ ] Update method signatures to accept UUID strings
- [ ] Add audit logging to all data modifications
- [ ] Implement cache invalidation for updates
- [ ] Add soft delete support
- [ ] Update queries to filter `deletedAt IS NULL`
- [ ] Add permission checks to all methods
- [ ] Update DTOs to include UUID fields
- [ ] Add transaction support for complex operations

### For Each Controller:

- [ ] Use `@UUID()` decorator for path parameters
- [ ] Add `@Audit()` decorators to modification endpoints
- [ ] Add `@RequirePermission()` to all endpoints
- [ ] Update Swagger documentation
- [ ] Add data export audit logging
- [ ] Implement bulk operations with transactions
- [ ] Add activity tracking endpoints

## Common Patterns

### 1. UUID or ID Support (Migration Period)

```typescript
async findByIdentifier(identifier: string): Promise<Entity> {
  const isUuid = validate(identifier);
  
  if (isUuid) {
    return this.findOne({ uuid: identifier });
  } else {
    const id = parseInt(identifier, 10);
    if (!isNaN(id)) {
      return this.findOne({ id });
    }
  }
  
  throw new BadRequestException('Invalid identifier');
}
```

### 2. Soft Delete Pattern

```typescript
async delete(uuid: string, userId: number): Promise<void> {
  await this.update(uuid, {
    deletedAt: new Date(),
    deletedBy: userId,
  });
}

async restore(uuid: string): Promise<void> {
  await this.update(uuid, {
    deletedAt: null,
    deletedBy: null,
  });
}
```

### 3. Bulk Operations

```typescript
async bulkUpdate(
  uuids: string[],
  data: UpdateDto,
  userId: number,
): Promise<number> {
  return this.prisma.$transaction(async (tx) => {
    let updated = 0;
    
    for (const uuid of uuids) {
      await tx.entity.update({
        where: { uuid },
        data: {
          ...data,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });
      
      // Audit each update
      await this.auditService.logEvent({
        category: 'DATA_CHANGE',
        eventType: 'bulk_update',
        entityType: 'entity',
        entityId: uuid,
        userId,
      });
      
      updated++;
    }
    
    return updated;
  });
}
```

### 4. Complex Queries with Caching

```typescript
async getAnalytics(
  tenantId: number,
  filters: AnalyticsFilters,
): Promise<Analytics> {
  const cacheKey = `analytics:${tenantId}:${JSON.stringify(filters)}`;
  
  return this.cache.get(
    cacheKey,
    async () => {
      const [revenue, users, orders] = await Promise.all([
        this.calculateRevenue(tenantId, filters),
        this.countActiveUsers(tenantId, filters),
        this.countOrders(tenantId, filters),
      ]);
      
      return { revenue, users, orders };
    },
    { l1TTL: 300, l2TTL: 3600 }, // 5 min memory, 1hr Redis
  );
}
```

## Testing Updates

### 1. Service Tests

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  describe('findOne', () => {
    it('should find by UUID', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const user = { uuid, id: 1, firstName: 'John' };
      
      prisma.user.findFirst.mockResolvedValue(user);
      
      const result = await service.findOne(uuid);
      
      expect(result).toEqual(user);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { uuid, deletedAt: null },
      });
    });
  });
});
```

### 2. Controller Tests

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: createMock<UsersService>(),
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  describe('findOne', () => {
    it('should validate UUID format', async () => {
      const invalidUuid = 'not-a-uuid';
      
      await expect(
        controller.findOne(invalidUuid),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

## Performance Considerations

### 1. Query Optimization

```typescript
// Bad: N+1 queries
const users = await this.prisma.user.findMany();
for (const user of users) {
  const roles = await this.prisma.userRole.findMany({
    where: { userId: user.id },
  });
}

// Good: Single query with includes
const users = await this.prisma.user.findMany({
  include: {
    roles: {
      include: {
        role: true,
      },
    },
  },
});
```

### 2. Batch Loading

```typescript
async loadUserPermissions(userIds: number[]): Promise<Map<number, string[]>> {
  // Use DataLoader pattern or batch query
  const permissions = await this.prisma.userPermission.findMany({
    where: {
      userId: { in: userIds },
    },
    include: {
      permission: true,
    },
  });

  // Group by user
  const permissionMap = new Map<number, string[]>();
  for (const up of permissions) {
    if (!permissionMap.has(up.userId)) {
      permissionMap.set(up.userId, []);
    }
    permissionMap.get(up.userId)!.push(up.permission.name);
  }

  return permissionMap;
}
```

### 3. Pagination

```typescript
async findPaginated(
  page: number,
  limit: number,
  filters?: FilterDto,
): Promise<PaginatedResult<Entity>> {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    this.prisma.entity.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.entity.count({ where: filters }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

## Security Best Practices

1. **Always validate UUIDs** before database queries
2. **Check permissions** at the service level
3. **Audit sensitive operations** (exports, bulk updates)
4. **Use transactions** for data consistency
5. **Sanitize user input** in queries
6. **Implement rate limiting** for expensive operations
7. **Log security events** (failed permissions, suspicious activity)

## Monitoring

### Key Metrics to Track:

1. **Cache hit rates** - Should be >90% for permissions
2. **Query performance** - P95 latency &lt;100ms
3. **Audit log volume** - Monitor for anomalies
4. **Error rates** - Track by operation type
5. **Permission check frequency** - Identify hot paths

### Example Monitoring Integration:

```typescript
@Injectable()
export class MetricsService {
  private readonly cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_level', 'entity_type'],
  });

  recordCacheHit(level: string, entityType: string) {
    this.cacheHits.inc({ cache_level: level, entity_type: entityType });
  }
}
```

## Next Steps

1. Update all existing services to extend `BaseCrudService`
2. Add UUID validation to all controllers
3. Implement audit logging for all data changes
4. Add cache invalidation to update operations
5. Update tests for new patterns
6. Add monitoring and alerting
7. Document API changes