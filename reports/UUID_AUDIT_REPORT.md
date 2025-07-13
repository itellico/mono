# UUID Audit Report for Multi-Tenant Database

## Executive Summary
This report audits all tables in the itellico Mono database to ensure proper UUID implementation for security and multi-tenant best practices.

## UUID Requirements for Multi-Tenant Systems

### Why UUIDs are Critical:
1. **Security**: Sequential IDs allow enumeration attacks
2. **Multi-tenancy**: Prevent cross-tenant data guessing
3. **Distributed Systems**: UUIDs work across multiple databases
4. **API Safety**: Safe to expose in URLs without revealing business metrics

### Best Practices:
1. **Position**: UUID should be the second column (after id)
2. **Uniqueness**: UUID must have a unique constraint
3. **Format**: Use UUID v4 for randomness
4. **Indexing**: UUID columns should be indexed for performance

## Table Audit Results

### Tables WITH UUID (✅ Compliant)
1. **Tenant** - ✅ Has UUID, unique constraint, position 2
2. **Role** - ✅ Has UUID, unique constraint, position 2  
3. **Permission** - ✅ Has UUID, unique constraint, position 2
4. **PermissionAudit** - ✅ Has UUID, unique constraint, position 2
5. **SubscriptionPlan** - ✅ Has UUID, unique constraint, position 2
6. **Feature** - ✅ Has UUID, unique constraint, position 2
7. **SiteSettings** - ✅ Has UUID, unique constraint, position 2

### Tables WITH UUID but Missing Unique Constraint (⚠️ Need Fix)
1. **Account** - Has UUID in position 2, needs unique constraint
2. **User** - Has UUID in position 2, needs unique constraint  
3. **Category** - Has UUID in position 2, needs unique constraint
4. **Tag** - Has UUID in position 2, needs unique constraint
5. **SavedSearch** - Has UUID in position 2, needs unique constraint
6. **OptionSet** - Has UUID in position 2, needs unique constraint
7. **OptionValue** - Has UUID in position 2, needs unique constraint

### Tables WITHOUT UUID that NEED it (❌ Critical - Public Facing)
1. **AuditLog** - May be exposed in compliance/security endpoints
2. **Media/Files** - If you have file upload (prevents direct file enumeration)

### Tables WITHOUT UUID (✅ OK - Internal Use Only)
1. **UserActivityLog** - Internal analytics, not exposed
2. **RecordLock** - Internal concurrency control
3. **ChangeSet** - Internal change tracking
4. **ChangeConflict** - Internal conflict resolution
5. **VersionHistory** - Internal versioning
6. **Currency** - Static reference data, OK to enumerate
7. **Country** - Static reference data, OK to enumerate
8. **Language** - Static reference data, OK to enumerate

### Relationship Tables (✅ UUID Not Required)
1. **RolePermission** - Junction table, internal only
2. **UserRole** - Junction table, internal only
3. **UserPermissionCache** - Cache table, internal only
4. **CategoryTag** - Junction table, internal only
5. **PlanFeatureLimit** - Junction table, internal only
6. **TenantSubscription** - One-to-one relationship, internal only

## Recommendations

### Immediate Actions Required
1. **Add unique constraints** to public-facing tables: Account, User, Category, Tag, SavedSearch
2. **Consider UUID for**: Media/File uploads if implemented

### Tables by API Exposure

#### Public API Endpoints (MUST have UUID)
- **User** - `/api/users/:uuid` 
- **Account** - Authentication and profile endpoints
- **Category** - `/api/categories/:uuid`
- **Tag** - `/api/tags/:uuid`
- **SavedSearch** - `/api/saved-searches/:uuid`
- **Tenant** - Multi-tenant isolation
- **SubscriptionPlan** - `/api/plans/:uuid`

#### Admin-Only Endpoints (UUID recommended but not critical)
- **Role** - Admin panel only
- **Permission** - Admin panel only
- **OptionSet/OptionValue** - Configuration management

#### Internal Only (UUID not needed)
- Junction tables (UserRole, RolePermission, etc.)
- Cache tables (UserPermissionCache)
- Internal tracking (RecordLock, ChangeSet, VersionHistory)
- Reference data (Currency, Country, Language)

## Current Status Summary
- ✅ **Fully Compliant** (UUID + unique): 7 tables
- ⚠️ **Need Unique Constraint**: 5 critical public-facing tables
- ✅ **Correctly Internal** (no UUID needed): 15+ tables

## Next Steps
1. Add unique constraints to User, Account, Category, Tag, SavedSearch
2. Update all public API endpoints to use UUID instead of ID
3. Keep internal endpoints using ID for performance
4. Document which endpoints are public vs internal
5. Add API tests to ensure no ID leakage in public endpoints