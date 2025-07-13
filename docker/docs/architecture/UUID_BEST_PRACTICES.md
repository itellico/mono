# UUID Best Practices for Multi-Tenant SaaS Applications

## Overview
This document outlines the UUID implementation standards and best practices for the itellico Mono, ensuring security, scalability, and proper multi-tenant isolation.

## Why UUIDs are Critical

### 1. Security
- **Prevent Enumeration Attacks**: Sequential IDs (1, 2, 3...) allow attackers to guess valid IDs
- **Data Privacy**: UUIDs prevent competitors from inferring business metrics (e.g., number of users, orders)
- **Cross-Tenant Protection**: Random UUIDs make it impossible to accidentally access another tenant's data

### 2. Scalability
- **Distributed Systems**: UUIDs can be generated independently without coordination
- **Database Sharding**: UUIDs work seamlessly across multiple database instances

## 🏗️ **Current Implementation**

### **Hybrid ID Architecture**
The itellico Mono uses a **dual-ID system** for optimal performance and security:

```prisma
model User {
  id       Int    @id @default(autoincrement()) // Internal FK relations
  uuid     String @unique @default(uuid()) @db.Uuid // PostgreSQL UUID type - External API exposure
  tenantId Int                                      // Internal FK
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

#### **Benefits of Hybrid Approach**
- **🔒 Security**: All public APIs use UUIDs exclusively
- **⚡ Performance**: Internal foreign keys use fast integer IDs
- **🔍 Debugging**: Integer IDs simplify database queries during development
- **📊 Analytics**: Internal metrics can use sequential IDs safely

### **Implementation Standards**

#### **✅ API Responses - UUID Only**
```typescript
// ✅ CORRECT: Public API Response
{
  "user": {
    "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "user@example.com"
    // NEVER expose: id, tenantId, or other integer IDs
  }
}
```

#### **✅ URL Parameters - UUID Only**
```typescript
// ✅ CORRECT: API Endpoints
GET /api/v1/users/f47ac10b-58cc-4372-a567-0e02b2c3d479
PUT /api/v1/posts/a1b2c3d4-e5f6-7890-abcd-ef1234567890

// ❌ NEVER: Integer IDs in URLs
// GET /api/v1/users/123
```

#### **✅ Database Queries - Tenant Scoped**
```typescript
// ✅ CORRECT: Always include tenant filtering
const user = await prisma.user.findFirst({
  where: {
    uuid: userUuid,
    tenantId: currentTenant.id  // Critical: tenant isolation
  }
});
```
- **Microservices**: Each service can generate its own UUIDs without conflicts

### 3. API Design
- **URL Safety**: UUIDs are safe to expose in URLs and API responses
- **Stateless Operations**: No need to track "next ID" sequences
- **Import/Export**: UUIDs remain unique across different environments

## Implementation Standards

### 1. Column Positioning
```sql
-- CORRECT: UUID as second column after ID
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  -- other columns...
);

-- WRONG: UUID at the end
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  -- other columns...
  uuid UUID DEFAULT gen_random_uuid()
);
```

### 2. Prisma Schema Standards
```prisma
model User {
  id   Int    @id @default(autoincrement())
  uuid String @unique @default(uuid()) @db.Uuid  // PostgreSQL UUID type - Always second column
  // ... other fields
}
```

### 3. Required Constraints
- **UNIQUE**: Every UUID column must have a unique constraint
- **NOT NULL**: UUIDs should never be nullable
- **DEFAULT**: Use database-level UUID generation
- **INDEX**: Add index for performance on UUID lookups

### 4. ⚠️ **CRITICAL: PostgreSQL UUID Type Required**

**UUIDs must use PostgreSQL's native UUID type, NOT string:**

```prisma
// ✅ CORRECT: PostgreSQL UUID type
model User {
  id   Int    @id @default(autoincrement())
  uuid String @unique @default(uuid()) @db.Uuid  // PostgreSQL UUID type
}

// ❌ WRONG: Generic string type
model User {
  id   Int    @id @default(autoincrement())
  uuid String @unique @default(uuid())  // This is a STRING, not a UUID!
}
```

**Why PostgreSQL UUID Type is Required:**
- **Storage Efficiency**: PostgreSQL UUID uses 16 bytes vs up to 36 bytes for string representation
- **Performance**: Native UUID operations are faster than string comparisons
- **Validation**: PostgreSQL validates UUID format at the database level
- **Indexing**: UUID indexes are more efficient than string indexes for UUID values
- **Type Safety**: Prevents invalid UUID strings from being stored

**Database Schema Verification:**
```sql
-- Check your UUID columns are properly typed
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'uuid';

-- Should return: data_type = 'uuid', NOT 'character varying'
```

## Tables Requiring UUIDs

### Public-Facing Tables (MUST have UUID)
These tables are exposed via public API endpoints and must use UUIDs to prevent enumeration:

1. **User**: `/api/users/:uuid` - Prevent user enumeration
2. **Account**: Authentication endpoints - Protect account information
3. **Category**: `/api/categories/:uuid` - Public content organization
4. **Tag**: `/api/tags/:uuid` - Public content tagging
5. **SavedSearch**: `/api/saved-searches/:uuid` - User-specific data
6. **Tenant**: Multi-tenant isolation (critical for security)
7. **SubscriptionPlan**: `/api/plans/:uuid` - Public pricing pages
8. **Media/Files**: If implemented - Prevent direct file enumeration

### Admin-Only Tables (UUID Recommended)
These are only accessible to admins, UUID is good practice but not critical:

1. **Role**: Admin panel management
2. **Permission**: Admin panel management
3. **OptionSet/OptionValue**: Configuration management

### Internal Tables (UUID NOT Required)
These tables are never exposed to public APIs and don't need UUIDs:

1. **Junction Tables**: UserRole, RolePermission, CategoryTag
2. **Cache Tables**: UserPermissionCache
3. **Internal Tracking**: RecordLock, ChangeSet, VersionHistory
4. **Reference Data**: Currency, Country, Language
5. **Audit Tables**: UserActivityLog (internal analytics)

### Decision Criteria
Ask these questions to determine if a table needs UUID:

1. **Is it exposed in public API endpoints?** → YES: Need UUID
2. **Can regular users query/access it?** → YES: Need UUID
3. **Is it only used for internal relationships?** → NO: Don't need UUID
4. **Is it static reference data?** → NO: Don't need UUID
5. **Is it only accessible by admins?** → MAYBE: Nice to have UUID

## Code Implementation

### 1. API Endpoints
```typescript
// CORRECT: Use UUID in endpoints
GET /api/v1/users/:uuid
GET /api/v1/users/00000000-0000-0000-0000-000000000001

// WRONG: Never expose internal IDs
GET /api/v1/users/:id
GET /api/v1/users/123
```

### 2. Database Queries
```typescript
// CORRECT: Find by UUID
const user = await prisma.user.findFirst({
  where: { uuid: userUuid }
});

// WRONG: Don't expose findUnique with ID
const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

### 3. Authentication Tokens
```typescript
// JWT payload should use UUID
const payload = {
  sub: user.uuid,  // NOT user.id
  sessionId: session.uuid,
  type: 'access'
};
```

## Migration Strategy

### For Existing Tables Without UUID
1. Add UUID column with default
2. Backfill existing records
3. Add unique constraint
4. Update all code references
5. Never remove ID column (keep for relationships)

### Migration Template
```sql
-- Step 1: Add column
ALTER TABLE table_name ADD COLUMN uuid UUID DEFAULT gen_random_uuid();

-- Step 2: Backfill existing records
UPDATE table_name SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Step 3: Add constraints
ALTER TABLE table_name ALTER COLUMN uuid SET NOT NULL;
ALTER TABLE table_name ADD CONSTRAINT table_name_uuid_key UNIQUE (uuid);
CREATE INDEX table_name_uuid_idx ON table_name(uuid);
```

## Performance Considerations

### 1. Indexing
- Always index UUID columns used in WHERE clauses
- Consider composite indexes for common query patterns

### 2. Storage
- UUIDs use 16 bytes vs 4 bytes for integers
- Worth the tradeoff for security and scalability

### 3. Query Optimization
```typescript
// Use findFirst instead of findUnique for UUID queries
// Prisma's findUnique requires the field to be marked as @unique in schema
const user = await prisma.user.findFirst({
  where: { uuid: userUuid }
});
```

## Security Checklist

- [ ] All user-facing tables have UUID columns
- [ ] UUIDs are in position 2 (after ID)
- [ ] All UUID columns have unique constraints
- [ ] **All UUID columns use PostgreSQL UUID type (`@db.Uuid`), not String**
- [ ] API endpoints use UUIDs, not IDs
- [ ] JWT tokens contain UUIDs
- [ ] No sequential IDs in API responses
- [ ] UUID generation uses cryptographically secure methods

## Common Mistakes to Avoid

1. **Don't use UUIDs as primary keys** - Keep integer IDs for relationships
2. **Don't generate UUIDs in application code** - Use database defaults
3. **Don't expose both ID and UUID** - Only expose UUID in APIs
4. **Don't forget indexes** - UUID lookups need proper indexing
5. **Don't use UUID v1 or v3** - Use v4 for randomness
6. **⚠️ Don't use String type for UUIDs** - Must use `@db.Uuid` for PostgreSQL UUID type

## Monitoring and Compliance

### Regular Audits
Run the UUID audit script quarterly:
```bash
npx tsx audit-uuid.ts
```

### Compliance Requirements
- GDPR: UUIDs help with data minimization
- SOC2: Prevents unauthorized data access
- HIPAA: Reduces PHI exposure risk

## Conclusion
Proper UUID implementation is not optional for multi-tenant SaaS applications. It's a fundamental security requirement that protects user data, prevents enumeration attacks, and enables proper tenant isolation.