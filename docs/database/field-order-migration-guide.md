# Field Order Migration Guide

## Overview

This guide documents the process of restructuring database tables to follow the standardized field ordering convention. Proper field ordering improves:

- Code readability and maintainability
- Database query performance
- API response consistency
- Developer experience

## Field Order Standard

### Required Order (Top to Bottom)

1. **Identifiers**
   - `uuid` - Always first (primary key)
   - `id` - Always second (unique auto-increment)

2. **Foreign Keys** (hierarchical order)
   - `tenantId` - Highest level scope
   - `accountId` - Account level scope
   - `userId` - User level scope
   - `parentId` - Self-referential
   - Other foreign keys (alphabetical)

3. **Core Fields**
   - `name`, `code`, `slug` - Primary identifiers
   - `title`, `displayName` - Display values
   - `description` - Descriptions
   - Other business fields (alphabetical)

4. **Status/Type Fields**
   - `status`, `state` - Current state
   - `type`, `kind` - Classification
   - `tier`, `level` - Hierarchy
   - `priority`, `order` - Ordering

5. **Configuration**
   - `settings` - Structured config
   - `metadata` - Unstructured data
   - `config`, `options` - Other config

6. **Boolean Flags** (is* pattern)
   - `isActive` - Always first flag
   - `isSystem`, `isDefault` - System flags
   - Other flags (alphabetical)

7. **Audit Fields** (*By pattern)
   - `createdBy`, `updatedBy`, `deletedBy`
   - `approvedBy`, `publishedBy`
   - Other audit fields

8. **Timestamps** (*At pattern)
   - `createdAt` - Always first
   - `updatedAt` - Always second
   - `deletedAt` - Soft delete
   - Other timestamps (alphabetical)

9. **Relations** (Prisma only)
   - Parent relations first
   - Child relations
   - Many-to-many relations

10. **Directives** (Prisma only)
    - `@@index`, `@@unique`
    - `@@map` - Always last

## Migration Approaches

### Approach 1: Prisma Schema Fix (Recommended)

Fix field order in Prisma schema without changing database:

```bash
# Run the schema fix script
pnpm tsx scripts/migrations/02-fix-field-order-prisma.ts

# Validate the schema
pnpm prisma validate

# Format the schema
pnpm prisma format
```

**Pros:**
- No database changes needed
- No downtime required
- New tables follow correct order
- Safe and reversible

**Cons:**
- Existing tables keep old order
- Inconsistency between schema and DB

### Approach 2: Database Restructure (Major Migration)

Recreate tables with correct field order:

```bash
# Generate migration SQL (doesn't execute)
pnpm tsx scripts/migrations/02-restructure-field-order.ts

# Review generated SQL files
cat migration_*.sql
cat rollback_*.sql

# Execute during maintenance window
psql $DATABASE_URL < migration_*.sql
```

**Pros:**
- Complete consistency
- Optimal storage layout
- Clean database structure

**Cons:**
- Requires downtime
- Complex migration
- Risk of data loss

## Implementation Strategy

### Phase 1: Schema Updates (No Downtime)
1. Fix Prisma schema field order
2. Update all models to follow standard
3. Generate new Prisma client
4. Deploy without database changes

### Phase 2: New Tables (Ongoing)
- All new tables created with correct order
- Existing tables remain unchanged
- No impact on running system

### Phase 3: Gradual Migration (Optional)
- Migrate tables during regular maintenance
- Start with less critical tables
- Use blue-green deployment

### Phase 4: Full Migration (Major Release)
- Schedule maintenance window
- Full backup required
- Execute complete restructure
- Verify all data integrity

## Verification Scripts

### Check Current Field Order
```sql
SELECT 
  table_name,
  ordinal_position,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;
```

### Find Tables Needing Reorder
```sql
WITH first_columns AS (
  SELECT 
    table_name,
    column_name,
    ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND ordinal_position <= 2
)
SELECT 
  table_name,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as first_two_columns
FROM first_columns
GROUP BY table_name
HAVING STRING_AGG(column_name, ', ' ORDER BY ordinal_position) != 'uuid, id'
ORDER BY table_name;
```

## Example: Before and After

### Before (Wrong Order)
```prisma
model User {
  id            Int      @id @default(autoincrement())
  createdAt     DateTime @default(now())
  email         String   @unique
  uuid          String
  accountId     Int
  isActive      Boolean  @default(true)
  firstName     String
  updatedAt     DateTime @updatedAt
  account       Account  @relation(fields: [accountId], references: [id])
  lastName      String
}
```

### After (Correct Order)
```prisma
model User {
  // Identifiers
  uuid          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id            Int      @unique @default(autoincrement())
  
  // Foreign Keys
  accountId     Int
  
  // Core Fields
  email         String   @unique
  firstName     String
  lastName      String
  
  // Flags
  isActive      Boolean  @default(true)
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  account       Account  @relation(fields: [accountId], references: [id])
  
  // Directives
  @@map("users")
}
```

## Common Issues and Solutions

### Issue: Column Order in Existing Tables
**Problem:** PostgreSQL doesn't support reordering columns without recreating the table.

**Solution:** 
- Use View layer to present correct order
- Fix in Prisma schema for consistency
- Plan table recreation during major upgrade

### Issue: Foreign Key Dependencies
**Problem:** Can't drop tables with foreign key references.

**Solution:**
```sql
-- Temporarily disable foreign key checks
SET session_replication_role = 'replica';

-- Perform migration

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
```

### Issue: Large Table Migration
**Problem:** Tables with millions of rows take too long to recreate.

**Solution:**
- Use partitioning strategy
- Migrate in batches
- Consider logical replication

## Best Practices

1. **Always Backup First**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Test in Development**
   - Run full migration in dev
   - Verify all features work
   - Check performance impact

3. **Monitor During Migration**
   - Watch for locks
   - Monitor disk space
   - Check replication lag

4. **Validate After Migration**
   ```bash
   pnpm tsx scripts/migrations/verify-field-order.ts
   ```

## Rollback Procedure

If issues occur during migration:

1. **Stop Application**
   ```bash
   kubectl scale deployment api --replicas=0
   ```

2. **Execute Rollback**
   ```bash
   psql $DATABASE_URL < rollback_*.sql
   ```

3. **Restore Application**
   ```bash
   kubectl scale deployment api --replicas=3
   ```

4. **Verify System Health**
   - Check logs
   - Test critical paths
   - Monitor metrics

## Next Steps

1. Review and fix Prisma schema
2. Plan migration timeline
3. Prepare rollback procedures
4. Schedule maintenance window
5. Execute migration
6. Update documentation