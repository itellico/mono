# Security Audit: UUID Implementation in Role-Permission System

## Executive Summary

**⚠️ CRITICAL SECURITY ISSUES IDENTIFIED**

The itellico Mono's role-permission system has significant security vulnerabilities due to missing UUIDs in core RBAC models and inconsistent identifier usage across APIs. **Immediate action required** before production deployment.

## Current State Analysis

### ✅ Models WITH UUIDs (Good)
- **User, Account, Tenant**: Primary entities properly secured
- **SubscriptionPlan, Feature**: Business entities secured
- **Category, Tag, OptionSet**: Content entities secured

### ❌ Models WITHOUT UUIDs (Critical Risk)
- **Role**: Only integer `id` and `code` - **HIGH RISK**
- **Permission**: Only integer `id` - **HIGH RISK** 
- **RolePermission, UserRole, UserPermission**: Junction tables - **MEDIUM RISK**
- **PermissionSet, PermissionAudit**: Core RBAC entities - **HIGH RISK**

## Security Vulnerabilities

### 🔴 HIGH RISK: Enumeration Attacks

**Issue**: Core RBAC models use sequential integer IDs
```typescript
// VULNERABLE: Easy to enumerate
GET /api/v1/admin/permissions/roles?roleId=1
GET /api/v1/admin/permissions/roles?roleId=2
GET /api/v1/admin/permissions/roles?roleId=3
// ... reveals all roles in system
```

**Impact**: 
- Attackers can discover all roles and permissions
- System scale revealed (role ID 100 = ~100 roles)
- Enables targeted privilege escalation attacks

### 🔴 HIGH RISK: Permission API Vulnerabilities

**Issue**: Permission endpoints accept integer user IDs
```typescript
// VULNERABLE API calls
POST /api/v1/permissions/check
{
  "userId": 123,  // ← Integer ID easily guessed
  "permission": "admin.full_access"
}

POST /api/v1/permissions/grant
{
  "userId": 456,  // ← Sequential ID enumeration
  "roleId": 789   // ← Role enumeration
}
```

**Impact**:
- Brute force user privilege checks
- Unauthorized permission modifications
- Account takeover possibilities

### 🟡 MEDIUM RISK: Information Disclosure

**Issue**: Mixed identifier usage creates security gaps
```typescript
// INCONSISTENT: User has UUID but permission checks use int ID
{
  "user": {
    "id": 123,      // ← Exposed integer
    "uuid": "abc-def-123",  // ← Secure UUID
    "roles": [1, 2, 3]      // ← Exposed role integers
  }
}
```

**Impact**:
- Reveals internal database structure
- Enables correlation attacks
- Breaks defense-in-depth principle

## Detailed Findings

### Database Schema Issues

```sql
-- MISSING UUIDs in critical models:
CREATE TABLE "Role" (
  id              INT PRIMARY KEY,  -- ❌ Sequential, enumerable
  name            VARCHAR(50),      -- ❌ No UUID for external refs
  code            VARCHAR(50) UNIQUE
);

CREATE TABLE "Permission" (
  id              INT PRIMARY KEY,  -- ❌ Sequential, enumerable  
  name            VARCHAR(100)      -- ❌ No UUID for external refs
);
```

### API Implementation Issues

1. **Auth Plugin** (`/src/plugins/auth.ts`):
   ```typescript
   // ✅ GOOD: Uses UUID for user lookup
   where: { uuid: request.user.sub }
   
   // ❌ BAD: Exposes integer IDs in auth object
   authUser: AuthUser = {
     id: user.id,           // ← Integer ID exposed
     accountId: user.accountId,  // ← Integer ID exposed
     tenantId: user.account.tenantId // ← Integer ID exposed
   }
   ```

2. **Permission Routes** (`/src/routes/v1/permissions/`):
   ```typescript
   // ❌ CRITICAL: Accepts integer user IDs
   POST /permissions/check
   Body: { userId: number, permission: string }
   
   // ❌ CRITICAL: Role operations use integer IDs
   POST /permissions/roles/assign
   Body: { userId: number, roleId: number }
   ```

### JWT Token Structure Issues

```typescript
// Current JWT payload:
{
  "sub": "uuid-abc-123",    // ✅ GOOD: User UUID
  "accountId": 456,         // ❌ BAD: Integer account ID
  "tenantId": 789,          // ❌ BAD: Integer tenant ID
  "roles": ["admin", "user"] // ✅ GOOD: Role names not IDs
}
```

## Impact Assessment

### Business Impact
- **Data Breach Risk**: High - User accounts enumerable
- **Privilege Escalation**: High - Role/permission system vulnerable
- **Compliance Risk**: High - Violates security best practices
- **Audit Failures**: Medium - Integer IDs in audit logs

### Technical Impact
- **System Enumeration**: Reveals user count, role structure
- **Attack Surface**: Large - Multiple enumeration vectors
- **Defense Bypass**: Sequential IDs break rate limiting effectiveness
- **Correlation Attacks**: Mixed identifiers enable cross-system tracking

## Recommendations

### 🔴 IMMEDIATE (Critical - Fix Before Production)

1. **Add UUIDs to Core RBAC Models**:
```sql
-- Add UUID columns
ALTER TABLE "Role" ADD COLUMN "uuid" TEXT DEFAULT gen_random_uuid();
ALTER TABLE "Permission" ADD COLUMN "uuid" TEXT DEFAULT gen_random_uuid();
ALTER TABLE "PermissionSet" ADD COLUMN "uuid" TEXT DEFAULT gen_random_uuid();

-- Create unique constraints
ALTER TABLE "Role" ADD CONSTRAINT "Role_uuid_key" UNIQUE ("uuid");
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_uuid_key" UNIQUE ("uuid");
ALTER TABLE "PermissionSet" ADD CONSTRAINT "PermissionSet_uuid_key" UNIQUE ("uuid");

-- Update existing records
UPDATE "Role" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL;
UPDATE "Permission" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL;
UPDATE "PermissionSet" SET "uuid" = gen_random_uuid() WHERE "uuid" IS NULL;
```

2. **Update API Endpoints**:
```typescript
// BEFORE (vulnerable):
POST /api/v1/permissions/check
{ "userId": 123, "permission": "admin" }

// AFTER (secure):
POST /api/v1/permissions/check  
{ "userUuid": "abc-def-123", "permission": "admin" }
```

3. **Fix JWT Payload**:
```typescript
// BEFORE:
{ "sub": "user-uuid", "accountId": 456, "tenantId": 789 }

// AFTER:
{ "sub": "user-uuid", "accountUuid": "acc-uuid", "tenantUuid": "tenant-uuid" }
```

### 🟡 SHORT TERM (1-2 weeks)

1. **Update All API Responses**:
   - Remove integer IDs from external APIs
   - Use UUIDs for all resource references
   - Maintain integer IDs only for internal operations

2. **Enhance Security Controls**:
   - Add rate limiting on permission check endpoints
   - Implement request validation to prevent enumeration
   - Add monitoring for suspicious patterns

3. **Update Audit System**:
   - Store UUIDs in audit logs instead of integer IDs
   - Add correlation fields for security investigation

### 🟢 MEDIUM TERM (1-2 months)

1. **Frontend Updates**:
   - Update all frontend code to use UUIDs
   - Remove integer ID dependencies in UI components
   - Add UUID validation in forms

2. **Database Optimization**:
   - Consider making UUIDs the primary keys for new tables
   - Add database indexes for UUID lookups
   - Implement UUID-based foreign keys

3. **Documentation Updates**:
   - Update API documentation to reflect UUID usage
   - Create security guidelines for new development
   - Document the migration process

## Implementation Plan

### Phase 1: Emergency Fixes (Week 1)
- [ ] Add UUID columns to Role, Permission, PermissionSet
- [ ] Update critical permission check APIs
- [ ] Fix JWT payload structure
- [ ] Deploy to staging for testing

### Phase 2: API Standardization (Week 2-3)
- [ ] Update all admin permission endpoints
- [ ] Modify auth responses to use UUIDs
- [ ] Add UUID validation middleware
- [ ] Update API documentation

### Phase 3: Frontend & Polish (Week 4-6)
- [ ] Update frontend components
- [ ] Enhance monitoring and alerting
- [ ] Complete audit log migration
- [ ] Final security testing

## Monitoring & Detection

Add alerts for:
- Sequential permission check requests (enumeration attempt)
- High volume role/permission queries from single IP
- Permission checks with non-existent UUIDs
- Rapid user ID incrementing in requests

## Conclusion

The current implementation has **critical security vulnerabilities** that enable:
- Complete role/permission enumeration
- User account enumeration  
- Privilege escalation attacks
- Information disclosure

**Risk Level**: 🔴 **CRITICAL** - Fix required before production deployment.

**Estimated Fix Time**: 2-3 weeks for complete remediation.

**Business Impact**: High - Could result in data breach, compliance violations, and system compromise.