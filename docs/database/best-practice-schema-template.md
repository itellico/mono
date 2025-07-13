# Best Practice Prisma Schema Template

## Overview

This document provides the standardized schema templates that all models in the itellico mono project must follow. These templates enforce:

1. UUID as primary key (PostgreSQL UUID type)
2. Proper field ordering (uuid → id → foreign keys → fields → timestamps → relations → indexes)
3. Consistent naming conventions (camelCase in Prisma, snake_case in PostgreSQL)
4. Comprehensive indexing strategy
5. Audit trail integration
6. Soft delete support

## Core Model Template

```prisma
// Best Practice Model Template - Use this for all new models
model EntityName {
  // ========== 1. IDENTIFIERS (Always first) ==========
  uuid      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id        Int      @unique @default(autoincrement())
  
  // ========== 2. FOREIGN KEYS (Hierarchical order) ==========
  tenantId  Int      // Required for tenant-scoped entities
  accountId Int?     // Optional for account-scoped entities
  userId    Int?     // Optional for user-scoped entities
  
  // ========== 3. CORE FIELDS ==========
  // Business identifiers
  name      String   @db.VarChar(255)
  code      String   @unique @db.VarChar(50)
  slug      String   @unique @db.VarChar(100)
  
  // Descriptive fields
  displayName String  @db.VarChar(255)
  description String? @db.Text
  
  // ========== 4. STATUS/TYPE FIELDS ==========
  status    EntityStatus @default(ACTIVE)
  type      EntityType   @default(STANDARD)
  tier      String       @db.VarChar(20) // platform|tenant|account|user|public
  
  // ========== 5. CONFIGURATION ==========
  settings  Json?      // Structured configuration
  metadata  Json?      // Unstructured metadata
  tags      String[]   // Array fields
  
  // ========== 6. FLAGS ==========
  isActive  Boolean   @default(true)
  isSystem  Boolean   @default(false)  // Cannot be modified by users
  isDefault Boolean   @default(false)  // Auto-assigned
  isLocked  Boolean   @default(false)  // Temporarily locked
  
  // ========== 7. AUDIT FIELDS ==========
  createdBy Int?
  updatedBy Int?
  deletedBy Int?
  
  // ========== 8. TIMESTAMPS (Always last) ==========
  createdAt DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @db.Timestamptz(6)
  deletedAt DateTime? @db.Timestamptz(6)  // Soft delete
  
  // ========== 9. RELATIONS ==========
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  account   Account?  @relation(fields: [accountId], references: [id])
  user      User?     @relation(fields: [userId], references: [id])
  creator   User?     @relation("EntityCreator", fields: [createdBy], references: [id])
  updater   User?     @relation("EntityUpdater", fields: [updatedBy], references: [id])
  deleter   User?     @relation("EntityDeleter", fields: [deletedBy], references: [id])
  
  // Child relations
  children  ChildEntity[]
  
  // ========== 10. INDEXES ==========
  @@unique([tenantId, code])           // Tenant-scoped uniqueness
  @@index([uuid])                      // UUID lookups
  @@index([tenantId, status])          // Common filter
  @@index([tenantId, isActive])        // Active records
  @@index([createdAt])                 // Time-based queries
  @@index([deletedAt])                 // Soft delete queries
  @@index([type, status])              // Type filtering
  
  // ========== 11. TABLE MAPPING ==========
  @@map("entity_names")               // Always use snake_case
}
```

## Enum Template

```prisma
// Best Practice Enum Template
enum EntityStatus {
  DRAFT       @map("draft")
  PENDING     @map("pending")
  ACTIVE      @map("active")
  SUSPENDED   @map("suspended")
  ARCHIVED    @map("archived")
  DELETED     @map("deleted")
  
  @@map("entity_status")
}

enum EntityType {
  STANDARD    @map("standard")
  PREMIUM     @map("premium")
  ENTERPRISE  @map("enterprise")
  CUSTOM      @map("custom")
  
  @@map("entity_type")
}
```

## Permission Model Templates

### Permission Model
```prisma
model Permission {
  // Identifiers
  uuid        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id          Int      @unique @default(autoincrement())
  
  // Permission pattern: domain.resource.action.scope
  domain      String   @db.VarChar(50)  // platform|tenant|account|user|public
  resource    String   @db.VarChar(50)  // users|settings|billing|reports
  action      String   @db.VarChar(50)  // create|read|update|delete|execute
  scope       String?  @db.VarChar(50)  // own|team|tenant|all
  
  // Metadata
  name        String   @unique @db.VarChar(255) // "platform.tenants.create"
  displayName String   @db.VarChar(255)         // "Create Tenants"
  description String?  @db.Text
  category    String   @db.VarChar(50)          // admin|management|operations
  
  // Configuration
  requiresMfa Boolean  @default(false)
  isDangerous Boolean  @default(false)  // Requires extra confirmation
  cacheTTL    Int      @default(3600)   // Cache duration in seconds
  
  // System flags
  isSystem    Boolean  @default(false)  // Cannot be modified
  isActive    Boolean  @default(true)
  
  // Audit
  createdBy   Int?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)
  
  // Relations
  roles       RolePermission[]
  users       UserPermission[]
  conditions  PermissionCondition[]
  creator     User?    @relation("PermissionCreator", fields: [createdBy], references: [id])
  
  // Indexes
  @@unique([domain, resource, action, scope])
  @@index([domain])
  @@index([resource])
  @@index([isActive])
  @@index([category])
  
  @@map("permissions")
}
```

### Role Model
```prisma
model Role {
  // Identifiers
  uuid        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id          Int      @unique @default(autoincrement())
  
  // Role information
  name        String   @db.VarChar(100)         // "Platform Administrator"
  code        String   @unique @db.VarChar(50)  // "PLATFORM_ADMIN"
  displayName String   @db.VarChar(255)
  description String?  @db.Text
  
  // Hierarchy
  tier        String   @db.VarChar(20)  // platform|tenant|account|user
  level       Int      @default(0)       // 100=platform, 80=tenant, 60=account, 40=user
  parentId    Int?
  
  // Scoping
  tenantId    Int?     // Null for platform roles
  
  // Configuration
  maxUsers    Int?     // Maximum users who can have this role
  priority    Int      @default(0)  // Higher priority overrides lower
  
  // System flags
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)  // Auto-assigned to new users
  
  // Audit
  createdBy   Int?
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)
  
  // Relations
  parent      Role?     @relation("RoleHierarchy", fields: [parentId], references: [id])
  children    Role[]    @relation("RoleHierarchy")
  permissions RolePermission[]
  users       UserRole[]
  tenant      Tenant?   @relation(fields: [tenantId], references: [id])
  creator     User?     @relation("RoleCreator", fields: [createdBy], references: [id])
  
  // Indexes
  @@unique([tenantId, code])
  @@index([tier])
  @@index([level])
  @@index([tenantId, isActive])
  @@index([parentId])
  
  @@map("roles")
}
```

## Audit Model Template

```prisma
model AuditLog {
  // Identifiers
  uuid        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id          BigInt   @unique @default(autoincrement())
  
  // Event information
  eventType   String   @db.VarChar(50)   // create|update|delete|access|permission
  entityType  String   @db.VarChar(50)   // user|account|tenant|permission
  entityId    String   @db.Uuid
  entityName  String?  @db.VarChar(255)
  
  // Actor information
  userId      Int
  tenantId    Int
  ipAddress   String?  @db.VarChar(45)   // Supports IPv6
  userAgent   String?  @db.Text
  sessionId   String?  @db.Uuid
  
  // Change details
  action      String   @db.VarChar(100)  // specific action taken
  changes     Json?    // {"field": {"old": "value1", "new": "value2"}}
  metadata    Json?    // Additional context
  
  // Request tracking
  requestId   String?  @db.Uuid
  apiVersion  String?  @db.VarChar(20)
  endpoint    String?  @db.VarChar(255)
  
  // Performance
  duration    Int?     // Operation duration in milliseconds
  
  // Timestamp
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  
  // Relations
  user        User     @relation(fields: [userId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  // Indexes
  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@index([eventType])
  @@index([createdAt])
  @@index([tenantId, createdAt])
  
  @@map("audit_logs")
}
```

## Cache Model Template

```prisma
model CacheEntry {
  // Identifiers
  uuid        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  
  // Cache key
  cacheKey    String   @unique @db.VarChar(255)
  namespace   String   @db.VarChar(50)   // permissions|roles|settings
  
  // Scope
  tenantId    Int?
  userId      Int?
  context     String   @db.VarChar(50)   // platform|tenant|account|user
  
  // Cache data
  data        Json     // Cached value
  dataType    String   @db.VarChar(50)   // array|object|string|number
  
  // Metadata
  tags        String[] // For bulk invalidation
  version     Int      @default(1)
  hash        String   @db.VarChar(64)   // SHA256 of data
  
  // Cache control
  ttlSeconds  Int      @default(3600)
  maxAge      Int      @default(3600)
  
  // Timestamps
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  expiresAt   DateTime @db.Timestamptz(6)
  accessedAt  DateTime @default(now()) @db.Timestamptz(6)
  
  // Statistics
  hitCount    Int      @default(0)
  missCount   Int      @default(0)
  
  // Redis sync
  inRedis     Boolean  @default(false)
  redisKey    String?  @db.VarChar(255)
  
  // Relations
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
  
  // Indexes
  @@index([namespace, context])
  @@index([tenantId, namespace])
  @@index([userId])
  @@index([expiresAt])
  @@index([tags])
  
  @@map("cache_entries")
}
```

## Migration Helper Comments

When migrating existing models, add these comments to track progress:

```prisma
model ExistingModel {
  // TODO: MIGRATION - Add UUID field
  // TODO: MIGRATION - Reorder fields (UUID first)
  // TODO: MIGRATION - Add missing indexes
  // TODO: MIGRATION - Add audit fields
  // TODO: MIGRATION - Add soft delete support
  // TODO: MIGRATION - Fix naming conventions
  // TODO: MIGRATION - Add table mapping
  
  id        Int      @id @default(autoincrement())
  // ... existing fields
}
```

## Validation Rules

1. **UUID**: Always use `@db.Uuid` type, never plain `String`
2. **Field Order**: Must follow the template order exactly
3. **Naming**: 
   - Prisma fields: camelCase
   - PostgreSQL tables: snake_case via `@@map`
   - Enums: CONSTANT_CASE with snake_case mapping
4. **Indexes**: Include all specified indexes
5. **Relations**: Use descriptive relation names
6. **Timestamps**: Always use `@db.Timestamptz(6)` for timezone support

## Common Patterns

### Hierarchical Data
```prisma
parentId    Int?
depth       Int      @default(0)
path        String   @db.VarChar(500)  // "1.2.3" for hierarchy
orderIndex  Int      @default(0)

parent      ModelName? @relation("ModelHierarchy", fields: [parentId], references: [id])
children    ModelName[] @relation("ModelHierarchy")

@@index([parentId, orderIndex])
@@index([path])
```

### Versioning
```prisma
version     Int      @default(1)
versionedAt DateTime @default(now()) @db.Timestamptz(6)
versionedBy Int?

versioner   User?    @relation("ModelVersioner", fields: [versionedBy], references: [id])
```

### Localization
```prisma
locale      String   @db.VarChar(10)  // en-US, de-DE
isDefault   Boolean  @default(false)

@@unique([parentId, locale])
@@index([locale])
```

## Next Steps

1. Create migration scripts based on these templates
2. Update all 71 models to follow this structure
3. Generate and run database migrations
4. Update application code to handle new structure
5. Implement caching layer
6. Add comprehensive audit logging