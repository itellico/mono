# Next.js API Routes Audit Report

## CRITICAL FINDINGS

**📊 SUMMARY:**
- **Total Next.js API Routes Found**: 207
- **Routes Following 5-Tier Structure**: 3 (1.4%)
- **Routes Requiring Migration**: 204 (98.6%)
- **VIOLATION SEVERITY**: CRITICAL - 98.6% non-compliance

## 🚨 ARCHITECTURAL VIOLATIONS

### ❌ PRIMARY VIOLATIONS

1. **Using Next.js API Routes Instead of Fastify**
   - **Issue**: All 207 routes use Next.js App Router instead of Fastify
   - **Impact**: Missing central middleware, no role-based access control, no Redis caching
   - **Severity**: CRITICAL

2. **Not Following 5-Tier Architecture**
   - **Issue**: Only 3 routes follow `public|user|account|tenant|platform` structure
   - **Impact**: Inconsistent permission patterns, tenant isolation failures
   - **Severity**: CRITICAL

3. **No Central Middleware Security**
   - **Issue**: Each route implements its own authentication/authorization
   - **Impact**: Security inconsistencies, code duplication
   - **Severity**: HIGH

4. **No Redis Caching Integration**
   - **Issue**: Missing unified cache middleware
   - **Impact**: Poor performance, database overload
   - **Severity**: HIGH

## 📋 ROUTE CLASSIFICATION BY 5-TIER STRUCTURE

### PUBLIC TIER (`/api/v1/public/*`) - Authentication Not Required
**Target Routes for Migration (15 routes):**
```
src/app/api/v1/auth/permissions/route.ts           → /api/v1/public/auth/permissions
src/app/api/v1/auth/permissions/check/route.ts     → /api/v1/public/auth/permissions/check
src/app/api/v1/zones/route.ts                      → /api/v1/public/zones
src/app/api/v1/zone-components/route.ts            → /api/v1/public/components
src/app/api/v1/email-templates/route.ts            → /api/v1/public/email-templates
src/app/api/v1/model-types/route.ts                → /api/v1/public/model-types
src/app/api/v1/audit/track-page/route.ts           → /api/v1/public/audit/track-page
src/app/api/v1/locks/check/route.ts                → /api/v1/public/locks/check
src/app/api/v1/locking/status/route.ts             → /api/v1/public/locking/status
```

### USER TIER (`/api/v1/user/*`) - Individual User Operations
**Target Routes for Migration (45 routes):**
```
src/app/api/v1/saved-searches/route.ts             → /api/v1/user/saved-searches
src/app/api/v1/saved-searches/[id]/route.ts        → /api/v1/user/saved-searches/[id]
src/app/api/v1/subscriptions/route.ts              → /api/v1/user/subscriptions
src/app/api/v1/user/permissions/route.ts           → /api/v1/user/permissions
src/app/api/v1/user/check-permission/route.ts      → /api/v1/user/permissions/check
src/app/api/v1/llm/execute/route.ts                → /api/v1/user/llm/execute
src/app/api/v1/locks/acquire/route.ts              → /api/v1/user/locks/acquire
src/app/api/v1/locks/release/route.ts              → /api/v1/user/locks/release
src/app/api/v1/locking/acquire/route.ts            → /api/v1/user/locking/acquire
src/app/api/v1/locking/release/route.ts            → /api/v1/user/locking/release
```

### ACCOUNT TIER (`/api/v1/account/*`) - Account/Organization Management
**Target Routes for Migration (25 routes):**
```
src/app/api/v1/permissions/bulk/route.ts           → /api/v1/account/permissions/bulk
src/app/api/v1/workflows/manage/route.ts           → /api/v1/account/workflows/manage
src/app/api/v1/admin/housekeeping/route.ts         → /api/v1/account/housekeeping
src/app/api/v1/admin/preferences/route.ts          → /api/v1/account/preferences
src/app/api/v1/admin/language-settings/route.ts    → /api/v1/account/language-settings
```

### TENANT TIER (`/api/v1/tenant/*`) - Tenant Administration
**Target Routes for Migration (95 routes):**
```
src/app/api/v1/admin/tags/route.ts                 → /api/v1/tenant/content/tags
src/app/api/v1/admin/tags/[uuid]/route.ts          → /api/v1/tenant/content/tags/[uuid]
src/app/api/v1/admin/tags/stats/route.ts           → /api/v1/tenant/content/tags/stats
src/app/api/v1/admin/categories/route.ts           → /api/v1/tenant/content/categories
src/app/api/v1/admin/categories/[uuid]/route.ts    → /api/v1/tenant/content/categories/[uuid]
src/app/api/v1/admin/model-schemas/route.ts        → /api/v1/tenant/schemas/models
src/app/api/v1/admin/option-sets/route.ts          → /api/v1/tenant/schemas/option-sets
src/app/api/v1/admin/tenants/route.ts              → /api/v1/tenant/management
src/app/api/v1/admin/tenants/[uuid]/route.ts       → /api/v1/tenant/management/[uuid]
src/app/api/v1/admin/permissions/route.ts          → /api/v1/tenant/access/permissions
src/app/api/v1/admin/roles/route.ts                → /api/v1/tenant/access/roles
src/app/api/v1/admin/integrations/route.ts         → /api/v1/tenant/config/integrations
src/app/api/v1/admin/settings/route.ts             → /api/v1/tenant/config/settings
```

### PLATFORM TIER (`/api/v1/platform/*`) - Platform-Wide Operations
**Target Routes for Migration (27 routes):**
```
src/app/api/v1/admin/platform-users/route.ts       → /api/v1/platform/admin/users
src/app/api/v1/admin/locks/active/route.ts         → /api/v1/platform/admin/locks
src/app/api/v1/admin/operational-modes/route.ts    → /api/v1/platform/operations/modes
src/app/api/v1/admin/versions/route.ts             → /api/v1/platform/operations/versions
src/app/api/v1/admin/monitoring/metrics/route.ts   → /api/v1/platform/monitoring/metrics
src/app/api/v1/locks/force-release/route.ts        → /api/v1/platform/admin/locks/force-release
src/app/api/v1/admin/llm/providers/route.ts        → /api/v1/platform/ai/providers
src/app/api/v1/admin/llm/api-keys/route.ts         → /api/v1/platform/ai/api-keys
```

## 🛠️ MIGRATION REQUIREMENTS

### ✅ REQUIRED FIXES FOR ALL ROUTES

1. **Move from Next.js to Fastify**
   ```typescript
   // ❌ WRONG: Next.js API Route
   export async function GET(request: NextRequest) { ... }
   
   // ✅ CORRECT: Fastify Route
   export const routeName: FastifyPluginAsync = async (fastify) => {
     fastify.get('/', { 
       preHandler: [fastify.authenticate, fastify.requirePermission('tier.resource.action')],
       schema: { tags: ['tier.resource'] }
     }, async (request, reply) => { ... });
   };
   ```

2. **Implement Central Middleware Security**
   ```typescript
   // ✅ REQUIRED: Use Fastify middleware
   preHandler: [
     fastify.authenticate,
     fastify.requirePermission('tier.resource.action')
   ]
   ```

3. **Add UUID Type Safety**
   ```typescript
   import { UUID, uuidSchema, toUUID } from '../../../../../../../src/lib/types/uuid';
   ```

4. **Implement Tenant Isolation**
   ```typescript
   // ✅ REQUIRED: For tenant/account/user tiers
   where: { tenantId: request.user.tenantId }
   ```

5. **Use Standard Response Format**
   ```typescript
   // ✅ REQUIRED: Unified response format
   return { success: true, data: { ... } };
   ```

6. **Add Redis Cache Integration**
   ```typescript
   // ✅ REQUIRED: Use Redis for caching
   const cacheKey = `tenant:${tenantId}:resource:${uuid}`;
   ```

## 🚨 CRITICAL SECURITY ISSUES

### ❌ AUTHENTICATION INCONSISTENCIES
- **Issue**: Each route implements custom auth logic
- **Examples**: 
  - Some use `auth()` from NextAuth
  - Others use custom session validation
  - Inconsistent permission checking
- **Fix**: Use Fastify `authenticate` middleware

### ❌ MISSING TENANT ISOLATION
- **Issue**: Many routes don't enforce tenant boundaries
- **Risk**: Data leakage between tenants
- **Fix**: Add `tenantId` filtering to all queries

### ❌ NO PERMISSION STANDARDIZATION
- **Issue**: Permission patterns vary widely
- **Examples**:
  - Some check `roles.includes('admin')`
  - Others use custom permission logic
- **Fix**: Use `requirePermission('tier.resource.action')`

## 📊 PERFORMANCE ISSUES

### ❌ NO REDIS CACHING
- **Issue**: All routes hit database directly
- **Impact**: Poor performance, high database load
- **Fix**: Implement unified Redis cache middleware

### ❌ NO REQUEST OPTIMIZATION
- **Issue**: No query optimization or batching
- **Impact**: N+1 queries, slow response times
- **Fix**: Use Fastify performance patterns

## 🎯 MIGRATION PRIORITY

### 🔴 PRIORITY 1 - CRITICAL (Complete First)
1. **Authentication Routes** (security critical)
2. **Admin Settings Routes** (system stability)
3. **Permission Management** (access control)

### 🟡 PRIORITY 2 - HIGH (Complete Second) 
1. **Content Management** (tags, categories, schemas)
2. **User Management** (profiles, subscriptions)
3. **Tenant Management** (tenant operations)

### 🟢 PRIORITY 3 - MEDIUM (Complete Last)
1. **Utility Routes** (locks, monitoring)
2. **Integration Routes** (webhooks, external APIs)
3. **Legacy Routes** (deprecated endpoints)

## 📋 NEXT STEPS

1. **Create Mass Migration Script**
   - Automate route file generation
   - Apply UUID type system
   - Add proper middleware

2. **Update Route Registration**
   - Register routes in Fastify 5-tier structure
   - Remove Next.js route files
   - Update imports and references

3. **Validate Migration**
   - Test all endpoints
   - Verify security patterns
   - Check Redis cache integration

4. **Clean Up**
   - Remove Next.js API directory
   - Update documentation
   - Update client-side API calls

## ⚠️ RECOMMENDATIONS

1. **IMMEDIATE ACTION REQUIRED**
   - This is a critical architectural violation
   - All 204 routes need migration
   - No new Next.js API routes should be created

2. **MIGRATION STRATEGY**
   - Migrate in priority order
   - Test each tier thoroughly
   - Maintain backward compatibility during transition

3. **QUALITY ASSURANCE**
   - All routes MUST follow 5-tier patterns
   - All routes MUST use central middleware
   - All routes MUST implement Redis caching

**⏰ ESTIMATED EFFORT**: 3-4 hours for complete migration with automated script
**🎯 TARGET COMPLIANCE**: 100% (all routes in Fastify 5-tier structure)