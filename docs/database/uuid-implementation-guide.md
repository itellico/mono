# UUID Implementation Guide

## Overview

This guide documents the process of implementing PostgreSQL UUID fields across all models in the itellico mono project. UUIDs serve as the primary public-facing identifiers while internal integer IDs are used for relations.

## Implementation Strategy

### Phase 1: Non-Breaking Changes (Current)
1. Add UUID fields to models missing them
2. Convert String UUID fields to PostgreSQL UUID type
3. Add indexes on UUID fields
4. Generate UUIDs for existing records

### Phase 2: Schema Updates
1. Update Prisma schema to reflect UUID changes
2. Make UUID the @id (primary key)
3. Change id to @unique
4. Regenerate Prisma client

### Phase 3: Application Updates
1. Update API responses to use UUID
2. Update frontend to handle UUIDs
3. Maintain backward compatibility

## UUID Standards

### Field Definition
```prisma
// Correct UUID implementation
uuid  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

// Incorrect implementations
uuid  String   // Missing @db.Uuid
id    String   // Using 'id' for UUID
uuid  String?  // UUID should never be nullable
```

### Database Type
- **Always use**: PostgreSQL native UUID type
- **Never use**: VARCHAR, TEXT, or plain String
- **Benefits**: 
  - 16 bytes storage (vs 36 for string)
  - Native indexing optimization
  - Built-in generation functions

## Migration Scripts

### 1. Add UUID Fields
```bash
# Run the migration script
pnpm tsx scripts/migrations/01-add-uuid-fields.ts
```

This script:
- Adds UUID columns to tables missing them
- Generates UUIDs for existing records
- Converts String UUID fields to proper type
- Creates necessary indexes

### 2. Verify Implementation
```bash
# Run the verification script
pnpm tsx scripts/migrations/verify-uuid-implementation.ts
```

This script checks:
- UUID field exists in all tables
- UUID is PostgreSQL UUID type
- UUID has unique constraint
- UUID is indexed
- UUID is the first column (best practice)

## Models Requiring Updates

### Missing UUID Entirely (9 models)
- Role
- Permission
- RolePermission
- UserRole
- PlanFeatureLimit
- CategoryTag
- Currency
- Country
- Language

### String UUID to Fix (3 models)
- User (uuid field is String)
- Tag (uuid field is String)  
- SubscriptionPlan (uuid field is String)

### Correct Implementation (Examples)
- Tenant ✅
- Account ✅
- Category ✅
- OptionSet ✅

## SQL Commands

### Add UUID to Existing Table
```sql
-- Step 1: Add column
ALTER TABLE "Role" ADD COLUMN "uuid" UUID;

-- Step 2: Generate UUIDs for existing records
UPDATE "Role" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE "Role" ALTER COLUMN "uuid" SET NOT NULL;

-- Step 4: Add unique constraint
ALTER TABLE "Role" ADD CONSTRAINT "Role_uuid_key" UNIQUE ("uuid");

-- Step 5: Create index
CREATE INDEX "Role_uuid_idx" ON "Role" ("uuid");
```

### Convert String to UUID Type
```sql
-- Step 1: Add temporary column
ALTER TABLE "User" ADD COLUMN "uuid_temp" UUID;

-- Step 2: Copy and convert data
UPDATE "User" SET "uuid_temp" = "uuid"::UUID WHERE "uuid" IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE "User" DROP COLUMN "uuid";

-- Step 4: Rename new column
ALTER TABLE "User" RENAME COLUMN "uuid_temp" TO "uuid";
```

## Prisma Schema Updates

### Before
```prisma
model User {
  id   Int    @id @default(autoincrement())
  uuid String  // Wrong type and order
  // ... other fields
}
```

### After
```prisma
model User {
  uuid String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id   Int    @unique @default(autoincrement())
  // ... other fields
}
```

## API Response Updates

### Before
```json
{
  "id": 123,
  "name": "John Doe"
}
```

### After
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "id": 123,  // Keep for backward compatibility
  "name": "John Doe"
}
```

### Transition Strategy
1. Add UUID to all responses
2. Keep numeric ID for compatibility
3. Deprecate numeric ID in API v2
4. Remove numeric ID in API v3

## Frontend Updates

### URL Structure
```typescript
// Before
/users/123
/accounts/456

// After
/users/550e8400-e29b-41d4-a716-446655440000
/accounts/6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

### TypeScript Types
```typescript
// Before
interface User {
  id: number;
  name: string;
}

// After
interface User {
  uuid: string;
  id: number; // Deprecated
  name: string;
}
```

## Performance Considerations

### Index Strategy
```sql
-- Primary lookup index
CREATE UNIQUE INDEX "users_uuid_idx" ON "users" ("uuid");

-- Composite indexes for common queries
CREATE INDEX "users_tenant_uuid_idx" ON "users" ("tenantId", "uuid");
CREATE INDEX "users_active_uuid_idx" ON "users" ("isActive", "uuid");
```

### Query Optimization
```typescript
// Use UUID for single record lookup
const user = await prisma.user.findUnique({
  where: { uuid: userUuid }
});

// Use ID for joins (better performance)
const account = await prisma.account.findUnique({
  where: { id: accountId },
  include: { users: true }
});
```

## Security Benefits

1. **Non-Sequential**: UUIDs don't reveal record count or order
2. **Unguessable**: 128-bit randomness prevents enumeration
3. **Global Uniqueness**: No collisions across systems
4. **Rate Limiting**: Harder to scrape or attack

## Common Issues and Solutions

### Issue: UUID Generation in Tests
```typescript
// Solution: Use crypto.randomUUID()
const testUser = {
  uuid: crypto.randomUUID(),
  name: 'Test User'
};
```

### Issue: UUID Validation
```typescript
// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_PATTERN.test(uuid);
}
```

### Issue: Prisma Type Mismatch
```bash
# After schema changes, regenerate client
pnpm prisma generate
```

## Monitoring

### Check UUID Usage
```sql
-- Tables without UUID
SELECT table_name 
FROM information_schema.tables t
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_name = t.table_name
  AND c.column_name = 'uuid'
)
AND table_schema = 'public'
AND table_type = 'BASE TABLE';

-- UUID columns that aren't proper type
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'uuid'
AND data_type != 'uuid';
```

## Next Steps

1. Run migration scripts in development
2. Verify all UUIDs are properly implemented
3. Update Prisma schema files
4. Regenerate Prisma client
5. Update API endpoints
6. Test thoroughly
7. Plan production deployment