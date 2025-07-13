# Prisma Schema Audit Report

## Executive Summary

The current Prisma schema has **71 models** with multiple violations of database best practices. Key issues include:

1. **UUID Implementation**: Mixed usage - some as String, some as @db.Uuid
2. **Field Ordering**: id comes before uuid (should be uuid first)
3. **Naming Conventions**: Inconsistent casing (snake_case, camelCase, PascalCase)
4. **Permission System**: Basic structure exists but lacks Redis caching integration
5. **Audit Trail**: Partial implementation without comprehensive coverage
6. **Indexes**: Missing critical performance indexes
7. **Relations**: Integer IDs used correctly but inconsistent naming

## Detailed Issues by Category

### 1. UUID Standards Violations

**Current Issues:**
- `uuid` fields declared as `String` instead of `@db.Uuid` in models: User, Tag, SubscriptionPlan
- Missing UUID fields in critical models: Role, Permission, UserRole, RolePermission
- UUID not first field in any model (violates field ordering requirement)

**Affected Models:**
```prisma
// BAD - Current
model User {
  id   Int    @id @default(autoincrement())
  uuid String  // Should be @db.Uuid and come first
}

// GOOD - Target
model User {
  uuid String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id   Int    @unique @default(autoincrement())
}
```

### 2. Field Ordering Issues

**Current Pattern:** id → uuid → other fields
**Required Pattern:** uuid → id → other fields

**All 71 models need reordering**

### 3. Naming Convention Issues

**Snake_case in field names:**
- `site_settings` table uses snake_case fields
- `tenant_id`, `user_id` instead of `tenantId`, `userId`
- `profile_type` enum uses snake_case values

**Table naming:**
- Some use `@@map()` for snake_case (good)
- Others don't map, resulting in PascalCase in DB (bad)

### 4. Permission System Issues

**Current Structure:**
```
Role → RolePermission → Permission
User → UserRole → Role
User → UserPermission → Permission (direct grants)
```

**Missing Components:**
- No Redis caching integration
- No permission inheritance implementation
- Basic audit but not comprehensive
- No permission versioning

### 5. Missing Best Practice Elements

**Audit Trail:**
- Only partial implementation (AuditLog, UserActivityLog)
- Missing: schema changes, permission changes, data access logs

**Soft Deletes:**
- No consistent soft delete pattern
- Missing `deletedAt` fields
- No archive strategy

**Versioning:**
- VersionHistory exists but not consistently used
- No automatic versioning triggers

### 6. Index Analysis

**Missing Critical Indexes:**
- Composite indexes for common queries
- Foreign key indexes not automatic in PostgreSQL
- No indexes on UUID fields (performance impact)
- Missing covering indexes for common JOINs

### 7. Data Type Issues

**JSON Fields:**
- Overuse of JSON type (settings, metadata, etc.)
- Should be normalized where possible
- No JSON schema validation

**String Length Constraints:**
- Inconsistent VARCHAR lengths
- Some unlimited strings that should be constrained

## Recommended Schema Template

```prisma
// Best Practice Model Template
model ExampleEntity {
  // 1. UUIDs first
  uuid      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  
  // 2. Internal ID
  id        Int      @unique @default(autoincrement())
  
  // 3. Foreign Keys (with proper naming)
  tenantId  Int
  accountId Int?
  
  // 4. Core fields
  name      String   @db.VarChar(255)
  slug      String   @unique @db.VarChar(100)
  
  // 5. Status/Type fields
  status    EntityStatus @default(ACTIVE)
  type      EntityType
  
  // 6. Metadata
  metadata  Json?
  
  // 7. Timestamps (always last)
  createdAt DateTime @default(now()) @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @db.Timestamptz(6)
  deletedAt DateTime? @db.Timestamptz(6)
  
  // 8. Relations
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  account   Account? @relation(fields: [accountId], references: [id])
  
  // 9. Indexes
  @@index([tenantId, status])
  @@index([slug])
  @@index([createdAt])
  @@index([deletedAt])
  
  // 10. Table mapping
  @@map("example_entities")
}
```

## Permission System Design

### Enhanced RBAC Structure

```prisma
model Permission {
  uuid        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id          Int      @unique @default(autoincrement())
  
  // Hierarchical permission pattern
  domain      String   @db.VarChar(50)  // e.g., "platform", "tenant", "account"
  resource    String   @db.VarChar(50)  // e.g., "users", "settings", "billing"
  action      String   @db.VarChar(50)  // e.g., "create", "read", "update", "delete"
  scope       String?  @db.VarChar(50)  // e.g., "own", "team", "all"
  
  // Permission metadata
  name        String   @unique @db.VarChar(255)
  description String?
  isSystem    Boolean  @default(false)
  
  // Caching hints
  cacheTTL    Int      @default(3600) // seconds
  version     Int      @default(1)
  
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)
  
  @@unique([domain, resource, action, scope])
  @@index([domain])
  @@index([resource])
  @@map("permissions")
}

model PermissionCache {
  uuid       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id         Int      @unique @default(autoincrement())
  
  userId     Int
  tenantId   Int
  cacheKey   String   @unique @db.VarChar(255)
  
  // Cached permission data
  permissions Json    // Array of permission patterns
  roles       Json    // Array of role IDs
  
  // Cache metadata
  computedAt DateTime @db.Timestamptz(6)
  expiresAt  DateTime @db.Timestamptz(6)
  version    Int
  
  // Redis sync flag
  inRedis    Boolean  @default(false)
  
  @@index([userId])
  @@index([expiresAt])
  @@map("permission_cache")
}
```

## Migration Strategy

### Phase 1: Non-Breaking Changes
1. Add missing UUID fields (as nullable)
2. Add missing indexes
3. Add table mappings for snake_case
4. Create new permission tables

### Phase 2: Data Migration
1. Generate UUIDs for existing records
2. Migrate permission data to new structure
3. Build permission cache
4. Create audit trail records

### Phase 3: Breaking Changes
1. Reorder fields (UUID first)
2. Make UUIDs primary keys
3. Update foreign key references
4. Remove deprecated fields

### Phase 4: Application Updates
1. Update Prisma client usage
2. Update NestJS services
3. Implement Redis caching
4. Update API responses

## Critical Recommendations

1. **Immediate Actions:**
   - Add UUID fields to all models (non-breaking)
   - Implement proper indexes
   - Start using @@map for snake_case tables

2. **Short Term:**
   - Design and implement new permission system
   - Add comprehensive audit trail
   - Implement Redis caching layer

3. **Long Term:**
   - Complete field reordering
   - Normalize JSON fields
   - Implement soft deletes consistently

## Estimated Impact

- **Performance**: 30-50% improvement with proper indexes
- **Security**: Enhanced with proper audit trail
- **Maintainability**: Significantly improved with consistent naming
- **Scalability**: Redis caching will reduce DB load by 60-80%

## Next Steps

1. Create migration plan document
2. Generate migration scripts
3. Test in development environment
4. Plan phased rollout
5. Update documentation