# Prisma Schema Violations - Detailed Analysis

## Table of Contents
1. [UUID Violations](#uuid-violations)
2. [Field Ordering Violations](#field-ordering-violations)
3. [Naming Convention Violations](#naming-convention-violations)
4. [Permission System Gaps](#permission-system-gaps)
5. [Missing Indexes](#missing-indexes)
6. [Data Type Issues](#data-type-issues)
7. [Audit Trail Gaps](#audit-trail-gaps)

## UUID Violations

### Models with String UUID (Should be @db.Uuid)
```prisma
// ❌ VIOLATION: User model
model User {
  uuid String  // Should be: String @db.Uuid
}

// ❌ VIOLATION: Tag model
model Tag {
  uuid String  // Should be: String @db.Uuid
}

// ❌ VIOLATION: SubscriptionPlan model
model SubscriptionPlan {
  uuid String @unique  // Should be: String @unique @db.Uuid
}
```

### Models Missing UUID Entirely
- Role
- Permission
- RolePermission
- UserRole
- PlanFeatureLimit
- CategoryTag
- Currency
- Country
- Language

### Models with Correct UUID Implementation
✅ Good examples to follow:
- Tenant
- Account
- Category
- OptionSet
- EntityTag
- UserCollection

## Field Ordering Violations

### All 71 Models Have Wrong Order
**Current Pattern**: `id` → `uuid` → other fields
**Required Pattern**: `uuid` → `id` → other fields

### Impact by Tier
| Tier | Models | Status |
|------|---------|---------|
| Platform | 15 models | ❌ All need reordering |
| Tenant | 18 models | ❌ All need reordering |
| Account | 12 models | ❌ All need reordering |
| User | 20 models | ❌ All need reordering |
| System | 6 models | ❌ All need reordering |

## Naming Convention Violations

### Snake_case in Field Names
```prisma
// ❌ VIOLATIONS in SiteSettings
model SiteSettings {
  tenant_id          Int?    // Should be: tenantId
  user_id            BigInt? // Should be: userId
  default_value      Json?   // Should be: defaultValue
  max_value          Json?   // Should be: maxValue
  min_value          Json?   // Should be: minValue
  allowed_values     Json?   // Should be: allowedValues
  allowed_formats    Json?   // Should be: allowedFormats
  validation_schema  Json?   // Should be: validationSchema
  parent_setting_id  Int?    // Should be: parentSettingId
  overrides_global   Boolean? // Should be: overridesGlobal
  display_name       String?  // Should be: displayName
  help_text          String?  // Should be: helpText
  is_required        Boolean? // Should be: isRequired
  is_secret          Boolean? // Should be: isSecret
  requires_restart   Boolean? // Should be: requiresRestart
  is_readonly        Boolean? // Should be: isReadonly
  is_active          Boolean? // Should be: isActive
  requires_approval  Boolean? // Should be: requiresApproval
  last_modified_by   BigInt?  // Should be: lastModifiedBy
  approved_by        BigInt?  // Should be: approvedBy
  approved_at        DateTime? // Should be: approvedAt
  created_at         DateTime? // Should be: createdAt
  updated_at         DateTime? // Should be: updatedAt
}
```

### Tables Without @@map
These tables will have PascalCase names in PostgreSQL:
- Tenant
- Account
- User
- Role
- Permission
- Tag
- Category
- Currency
- Country
- Language
- Feature

### Inconsistent Enum Naming
```prisma
// Mixed conventions in enums
enum ProfileType {
  MODEL        @map("model")      // snake_case mapping
  PHOTOGRAPHER @map("photographer")
  AGENCY       @map("agency")
  CLIENT       @map("client")
}

enum ChangeLevel {
  OPTIMISTIC  // No mapping, will be UPPERCASE in DB
  PROCESSING
  COMMITTED
}
```

## Permission System Gaps

### Current Issues
1. **No Caching Layer**
   - UserPermissionCache exists but not integrated
   - No Redis connection defined
   - No cache invalidation strategy

2. **Missing Permission Hierarchy**
   - No parent-child relationships
   - No permission inheritance
   - No wildcard expansion

3. **Incomplete Audit**
   - PermissionAudit only logs checks
   - No audit for permission grants/revokes
   - No audit for role changes

### Required Components
```prisma
// ❌ MISSING: Permission hierarchy
model PermissionHierarchy {
  uuid     String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  parentId Int
  childId  Int
  depth    Int
  // ... indexes
}

// ❌ MISSING: Redis cache config
model CacheConfig {
  uuid        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  entity      String @unique
  ttlSeconds  Int
  strategy    String
  // ... other fields
}
```

## Missing Indexes

### Critical Performance Indexes
```prisma
// ❌ User model missing indexes
model User {
  // Missing:
  @@index([uuid])  // UUID lookups
  @@index([accountId, isActive])  // Common filter
  @@index([username, isActive])  // Login queries
}

// ❌ Account model missing indexes
model Account {
  // Missing:
  @@index([uuid])  // UUID lookups
  @@index([tenantId, isActive])  // Tenant queries
  @@index([email, isActive])  // Already has unique on email
}

// ❌ Permission queries need covering indexes
model UserRole {
  // Missing:
  @@index([userId, roleId, validUntil])  // Permission checks
}
```

### Foreign Key Indexes
PostgreSQL doesn't auto-create indexes on foreign keys:
- All `tenantId` fields need indexes
- All `userId` fields need indexes
- All `accountId` fields need indexes

## Data Type Issues

### Overuse of JSON
```prisma
// ❌ Should be normalized
model Tenant {
  description      Json?  // Could be TEXT
  features         Json?  // Should be relation to Features
  settings         Json?  // Should use SiteSettings
  categories       Json?  // Should be relation to Categories
  allowedCountries Json?  // Should be relation to Countries
}

// ❌ Unvalidated JSON
model Account {
  accountCapabilities Json?  // No schema validation
}
```

### String Length Issues
```prisma
// ❌ Unlimited strings
model User {
  bio     String?  // Should have @db.VarChar(1000)
  website String?  // Should have @db.VarChar(255)
}

// ❌ Inconsistent lengths
model Account {
  phone   String? @db.VarChar(30)  // Why 30?
  city    String? @db.VarChar(100) // Why 100?
}
```

## Audit Trail Gaps

### Missing Audit for:
1. **Schema Changes**
   - No tracking of model modifications
   - No migration audit trail

2. **Permission Changes**
   - Role assignments not audited
   - Permission grants not audited
   - No "who changed what when"

3. **Data Access**
   - No read audit for sensitive data
   - No export/download tracking
   - No bulk operation logging

4. **System Changes**
   - Configuration changes not tracked
   - Feature flag changes not logged
   - Integration changes not audited

### Required Audit Tables
```prisma
// ❌ MISSING: Comprehensive audit
model DataAccessLog {
  uuid      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    Int
  resource  String
  operation String
  recordIds String[]
  // ... other fields
}

// ❌ MISSING: Change tracking
model SchemaChangeLog {
  uuid        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  version     String
  migration   String
  appliedAt   DateTime
  appliedBy   String
  // ... other fields
}
```

## Summary Statistics

| Violation Type | Count | Severity |
|----------------|-------|----------|
| UUID as String | 3 | High |
| Missing UUID | 9 | High |
| Wrong field order | 71 | Medium |
| Snake_case fields | 23 | Low |
| Missing @@map | 11 | Low |
| Missing indexes | 150+ | High |
| JSON overuse | 15 | Medium |
| No string limits | 8 | Low |
| Audit gaps | 10 | High |

## Priority Matrix

### P0 - Critical (Security/Performance)
1. Add missing indexes (performance)
2. Implement permission caching (performance)
3. Add comprehensive audit (security)

### P1 - High (Functionality)
1. Fix UUID types (data integrity)
2. Add missing UUIDs (consistency)
3. Implement permission hierarchy (functionality)

### P2 - Medium (Maintainability)
1. Fix field ordering (consistency)
2. Normalize JSON fields (maintainability)
3. Add string constraints (data quality)

### P3 - Low (Cosmetic)
1. Fix naming conventions (consistency)
2. Add table mappings (aesthetics)
3. Standardize enum naming (consistency)