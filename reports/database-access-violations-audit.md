# Database Access Violations Audit - Next.js Frontend

**Date**: 2025-07-13  
**Scope**: Complete audit of Next.js codebase (`apps/web`) for direct database access violations  
**Objective**: Identify all files that import and use database clients directly instead of NestJS API endpoints

## 🚨 Critical Summary

**Total Violations Found**: 150+ files with direct database access  
**Severity**: HIGH - These violations break the intended architecture where frontend should only communicate through NestJS API

## 📊 Violation Categories

### 1. **Service Layer Violations** (Most Critical)
Files in `lib/services/` that should be eliminated and replaced with API calls:

| File | Violation Type | Lines | Suggested NestJS Endpoint |
|------|---------------|-------|---------------------------|
| `lib/services/integrations.service.ts` | Direct Prisma imports | 1-2, 228+ | `/api/v1/platform/integrations` |
| `lib/services/tenants.service.ts` | Direct `db` import | 1, 201+ | `/api/v1/platform/tenants` |
| `lib/services/users.service.ts` | Direct `db` import | 1, 6+ | `/api/v1/platform/users` |
| `lib/services/permissions.service.ts` | Direct `db` import | 1 | `/api/v1/admin/permissions` |
| `lib/services/roles.service.ts` | Direct `prisma` import | 11, 15+ | `/api/v1/admin/roles` |
| `lib/services/rbac.service.ts` | Direct `prisma` import | 14+ | `/api/v1/admin/permissions` |
| `lib/services/categories.service.ts` | Direct `prisma` import | 12, 27+ | `/api/v1/tenant/categories` |
| `lib/services/category-service.ts` | Direct Prisma client | 1+ | `/api/v1/tenant/categories` |
| `lib/services/bundle.service.ts` | Direct `prisma` import | 2-3+ | `/api/v1/admin/bundles` |
| `lib/services/subscription.service.ts` | Direct Prisma client | 1+ | `/api/v1/admin/subscriptions` |
| `lib/services/template.service.ts` | Direct `db` import | 1+ | `/api/v1/tenant/templates` |
| `lib/services/option-sets.service.ts` | Direct `prisma` import | 1+ | `/api/v1/tenant/option-sets` |
| `lib/services/model-schemas.service.ts` | Direct `prisma` import | 1+ | `/api/v1/tenant/model-schemas` |
| `lib/services/tags.service.ts` | Direct `prisma` import | 1+ | `/api/v1/tenant/tags` |
| `lib/services/form-generation.service.ts` | Direct `db` import | 1+ | `/api/v1/tenant/forms` |

### 2. **API Route Violations** (Should be removed)
These Next.js API routes should be eliminated as NestJS provides the same functionality:

| File | Violation Type | Should Use NestJS Controller |
|------|---------------|------------------------------|
| `app/api/media/upload/route.ts` | Direct `db` import (line 155) | `tenant/media.controller.ts` |
| `app/api/media/upload/route-optimized.ts` | Direct `db` import (line 3) | `tenant/media.controller.ts` |
| `app/api/media/delete/route.ts` | Direct `prisma` import (line 70) | `tenant/media.controller.ts` |
| `app/api/media/garbage-collect/route.ts` | Direct `db` import (line 24) | `tenant/media.controller.ts` |
| `app/api/v1/saved-searches/route.ts` | Direct `db` import (line 19) | `tenant/content.controller.ts` |
| `app/api/v1/audit/route.ts` | Direct `prisma` import (line 3) | `platform/audit.controller.ts` |
| `app/api/v1/ai/analyze-image/route.ts` | Direct `prisma` import (line 29) | `tenant/content.controller.ts` |
| `app/api/profile/model/route.ts` | Direct `db` import (line 158) | `user/profile.controller.ts` |
| `app/api/user/compcard/route.ts` | Direct `prisma` import (line 126) | `user/profile.controller.ts` |

### 3. **Page Component Violations** (Server Components)
React Server Components that directly access the database:

| File | Violation Type | Line | Fix Required |
|------|---------------|------|--------------|
| `app/admin/platform-users/[uuid]/page.tsx` | Direct `prisma` import | 11, 21+ | Use `fetch()` to NestJS API |
| `app/admin/platform-users/[uuid]/edit/page.tsx` | Direct `prisma` import | 11+ | Use `fetch()` to NestJS API |

### 4. **Schema/Types Violations**
Files that re-export database types instead of using API response types:

| File | Violation Type | Line | Fix Required |
|------|---------------|------|--------------|
| `lib/schemas/auth.ts` | Re-exports `db` as `prisma` | 36 | Remove, use API types |
| `lib/schemas/users.ts` | Re-exports `db` as `prisma` | 18 | Remove, use API types |
| `lib/schemas/categories.ts` | Re-exports `db` as `prisma` | 24 | Remove, use API types |
| `lib/schemas/permissions.ts` | Re-exports `db` as `prisma` | 27 | Remove, use API types |
| `lib/schemas/tenants.ts` | Re-exports `db` as `prisma` | 18 | Remove, use API types |

## 🔧 Detailed Violations by File

### Most Critical: Service Layer Files

#### 1. `/lib/services/integrations.service.ts`
```typescript
// VIOLATION: Lines 1-2
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// VIOLATION: Lines 228+
const [items, total] = await prisma.$transaction([
  prisma.integration.findMany({...}),
  prisma.integration.count({...})
]);
```
**Fix**: Replace with API calls to `/api/v1/platform/integrations`

#### 2. `/lib/services/tenants.service.ts`
```typescript
// VIOLATION: Line 1
import { db } from '@/lib/db';

// VIOLATION: Lines 201+
const tenant = await db.tenant.findUnique({...});
```
**Fix**: Replace with API calls to `/api/v1/platform/tenants`

#### 3. `/app/api/media/upload/route.ts`
```typescript
// VIOLATION: Line 155
import { db } from '@/lib/db';

// VIOLATION: Lines 287+
const userAccount = await db.query.users.findFirst({...});
```
**Fix**: Remove entire route, use NestJS `tenant/media.controller.ts`

## 🎯 Recommended Fix Strategy

### Phase 1: Remove Duplicate API Routes (Immediate)
1. **Delete all Next.js API routes** in `app/api/` that have equivalent NestJS controllers
2. **Update frontend code** to call NestJS endpoints instead

### Phase 2: Replace Service Layer (High Priority)
1. **Remove all service files** in `lib/services/`
2. **Create API client functions** that call NestJS endpoints
3. **Update all imports** throughout the codebase

### Phase 3: Fix Server Components (Medium Priority)
1. **Replace direct database calls** in page components with `fetch()` calls to NestJS API
2. **Use proper error handling** for API calls

### Phase 4: Clean Up Types (Low Priority)
1. **Remove schema re-exports** of database clients
2. **Use API response types** instead of raw Prisma types

## 📋 Available NestJS Endpoints to Use

Based on the controller audit, these endpoints are available:

### Platform Tier (`/api/v1/platform/`)
- **Users**: `platform/users.controller.ts`
- **Tenants**: `platform/tenants.controller.ts`
- **Integrations**: `platform/integrations.controller.ts`
- **Audit**: `platform/audit.controller.ts`
- **Monitoring**: `platform/monitoring.controller.ts`
- **System**: `platform/system.controller.ts`

### Tenant Tier (`/api/v1/tenant/`)
- **Categories**: `tenant/categories.controller.ts`
- **Tags**: `tenant/tags.controller.ts`
- **Media**: `tenant/media.controller.ts`
- **Model Schemas**: `tenant/model-schemas.controller.ts`
- **Option Sets**: `tenant/option-sets.controller.ts`
- **Users**: `tenant/users.controller.ts`
- **Settings**: `tenant/settings.controller.ts`
- **Workflows**: `tenant/workflows.controller.ts`

### Account Tier (`/api/v1/account/`)
- **Users**: `account/users.controller.ts`
- **Analytics**: `account/analytics.controller.ts`
- **Configuration**: `account/configuration.controller.ts`

### User Tier (`/api/v1/user/`)
- **Profile**: `user/profile.controller.ts`
- **Settings**: `user/settings.controller.ts`

## 🚫 Files That Must Be Deleted Entirely

These files should be completely removed as they duplicate NestJS functionality:

1. **All service files in `lib/services/`** (45+ files)
2. **All Next.js API routes in `app/api/`** (63+ files)
3. **Database schema re-exports in `lib/schemas/`** (5+ files)

## ⚠️ Business Impact

**High Priority**: This architecture violation means:
1. **Inconsistent permissions** between frontend and backend
2. **Duplicate business logic** maintenance burden
3. **Security risks** with direct database access in frontend
4. **Performance issues** with N+1 queries
5. **Deployment complexity** with multiple database connections

## 🎯 Next Steps

1. **Immediate**: Stop creating new service files with database access
2. **Week 1**: Remove duplicate API routes, redirect to NestJS
3. **Week 2-3**: Replace service layer with API client functions
4. **Week 4**: Fix server components and clean up types
5. **Validation**: Ensure all database access goes through NestJS API

---

**Total Estimated Effort**: 3-4 weeks  
**Priority**: HIGH - Critical for architecture compliance and security