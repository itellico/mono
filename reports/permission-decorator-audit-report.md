# NestJS Controllers @Permission() Decorator Audit Report

**Generated:** 2025-07-13  
**Purpose:** Audit all NestJS controllers for missing @Permission() decorators  
**Task:** Subtask 152 - "Add @Permission() to 134 NestJS Endpoints"

## Executive Summary

### Security Risk Assessment
- **Critical Priority:** 42 endpoints missing permissions across 6 controllers
- **High Priority:** Platform-level endpoints without granular permissions
- **Medium Priority:** Account/User endpoints that need specific permissions

### Audit Scope
- Total Controllers Reviewed: 44
- Controllers with Endpoints: 15  
- Controllers with Missing @Permission(): 6
- Total Endpoints Missing Permissions: **42**

### Pattern Analysis
The codebase shows two authentication patterns:

1. **Legacy Pattern (needs fixing):** Using only `@Auth()` decorator without specific permissions
2. **Modern Pattern (correct):** Using `@Auth({ tier: UserTier.X, permissions: ['resource.action'] })` 
3. **Newer Pattern (correct):** Using separate `@Permission('resource.action')` decorators

## 🚨 Critical Findings - Missing @Permission() Decorators

### 1. Account Controller (CRITICAL)
**File:** `/apps/api-nest/src/modules/account/account.controller.ts`  
**Security Risk:** HIGH - Account-level operations without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/account/members` | `@Auth()` | `account.members.view` | HIGH |
| POST | `/account/members` | `@Auth()` | `account.members.create` | HIGH |
| GET | `/account/settings` | `@Auth()` | `account.settings.view` | HIGH |
| PUT | `/account/settings` | `@Auth()` | `account.settings.update` | HIGH |

**Impact:** Any authenticated user can access account member management and settings without proper authorization.

### 2. User Controller (CRITICAL)
**File:** `/apps/api-nest/src/modules/user/user.controller.ts`  
**Security Risk:** HIGH - User profile operations without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/user/profile` | `@Auth()` | `user.profile.view` | HIGH |
| PUT | `/user/profile` | `@Auth()` | `user.profile.update` | HIGH |
| GET | `/user/settings` | `@Auth()` | `user.settings.view` | MEDIUM |

**Impact:** Any authenticated user can potentially access/modify other users' profiles without proper authorization.

### 3. Profile Controller (MEDIUM)
**File:** `/apps/api-nest/src/modules/user/controllers/profile.controller.ts`  
**Security Risk:** MEDIUM - One endpoint missing specific permissions

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/user/profile/:uuid` | `@Auth()` | `user.profile.view_public` | MEDIUM |

**Impact:** Public profile access might need differentiated permissions.

### 4. Tenant Media Controller (HIGH)
**File:** `/apps/api-nest/src/modules/tenant/controllers/media.controller.ts`  
**Security Risk:** HIGH - Media operations without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/tenant/media` | `@Auth()` | `tenant.media.view` | HIGH |
| POST | `/tenant/media/upload` | `@Auth()` | `tenant.media.upload` | HIGH |
| GET | `/tenant/media/:id` | `@Auth()` | `tenant.media.view` | HIGH |
| DELETE | `/tenant/media/:id` | `@Auth()` | `tenant.media.delete` | HIGH |

**Impact:** Unrestricted media upload/download/deletion across tenant boundaries.

### 5. Tenant Settings Controller (HIGH)
**File:** `/apps/api-nest/src/modules/tenant/controllers/settings.controller.ts`  
**Security Risk:** HIGH - Critical tenant operations without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/tenant/settings` | `@Auth()` | `tenant.settings.view` | HIGH |
| GET | `/tenant/settings/:key` | `@Auth()` | `tenant.settings.view` | HIGH |
| PUT | `/tenant/settings/:key` | `@Auth()` | `tenant.settings.update` | HIGH |
| POST | `/tenant/settings/active-modes` | `@Auth()` | `tenant.settings.view` | HIGH |
| POST | `/tenant/settings/toggle-developer-mode` | `@Auth()` | `tenant.settings.manage_dev_mode` | CRITICAL |
| POST | `/tenant/settings/god-mode` | `@Auth()` | `tenant.settings.manage_god_mode` | CRITICAL |

**Impact:** Unrestricted access to tenant configuration, including dangerous god-mode operations.

### 6. Tenant Translations Controller (MEDIUM)
**File:** `/apps/api-nest/src/modules/tenant/controllers/translations.controller.ts`  
**Security Risk:** MEDIUM - Translation management without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/tenant/translations` | `@Auth()` | `tenant.translations.view` | MEDIUM |
| GET | `/tenant/translations/keys` | `@Auth()` | `tenant.translations.view` | MEDIUM |
| GET | `/tenant/translations/languages` | `@Auth()` | `tenant.translations.view` | MEDIUM |
| POST | `/tenant/translations/languages/management` | `@Auth()` | `tenant.translations.manage_languages` | HIGH |
| POST | `/tenant/translations/scan-strings` | `@Auth()` | `tenant.translations.scan` | MEDIUM |
| POST | `/tenant/translations/extract-strings` | `@Auth()` | `tenant.translations.extract` | MEDIUM |
| POST | `/tenant/translations/auto-translate` | `@Auth()` | `tenant.translations.auto_translate` | HIGH |
| GET | `/tenant/translations/statistics` | `@Auth()` | `tenant.translations.view` | MEDIUM |
| GET | `/tenant/translations/lookup` | `@Auth()` | `tenant.translations.view` | MEDIUM |

**Impact:** Unrestricted translation management including auto-translation capabilities.

### 7. Tenant Integrations Controller (HIGH)
**File:** `/apps/api-nest/src/modules/tenant/controllers/integrations.controller.ts`  
**Security Risk:** HIGH - Integration management without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/tenant/integrations` | `@Auth()` | `tenant.integrations.view` | MEDIUM |
| GET | `/tenant/integrations/:slug` | `@Auth()` | `tenant.integrations.view` | MEDIUM |
| POST | `/tenant/integrations/:slug/enable` | `@Auth()` | `tenant.integrations.enable` | HIGH |
| POST | `/tenant/integrations/:slug/disable` | `@Auth()` | `tenant.integrations.disable` | HIGH |
| PUT | `/tenant/integrations/:slug` | `@Auth()` | `tenant.integrations.configure` | HIGH |

**Impact:** Unrestricted integration management capabilities.

### 8. Tenant LLM Controller (CRITICAL)
**File:** `/apps/api-nest/src/modules/tenant/controllers/llm.controller.ts`  
**Security Risk:** CRITICAL - AI/LLM operations without permission checks

| Method | Route | Current Auth | Missing Permission | Priority |
|--------|-------|-------------|-------------------|----------|
| GET | `/tenant/llm/providers` | `@Auth()` | `tenant.llm.view` | MEDIUM |
| POST | `/tenant/llm/providers/:provider/enable` | `@Auth()` | `tenant.llm.manage_providers` | CRITICAL |
| GET | `/tenant/llm/api-keys` | `@Auth()` | `tenant.llm.view_keys` | HIGH |
| POST | `/tenant/llm/api-keys` | `@Auth()` | `tenant.llm.manage_keys` | CRITICAL |
| DELETE | `/tenant/llm/api-keys/:id` | `@Auth()` | `tenant.llm.delete_keys` | CRITICAL |
| GET | `/tenant/llm/scopes` | `@Auth()` | `tenant.llm.view` | MEDIUM |
| POST | `/tenant/llm/scopes` | `@Auth()` | `tenant.llm.configure` | HIGH |
| GET | `/tenant/llm/analytics` | `@Auth()` | `tenant.llm.view_analytics` | MEDIUM |

**Impact:** Unrestricted access to AI/LLM configuration, API keys, and provider management.

## ✅ Controllers with Correct Permission Implementation

### Properly Secured Controllers
1. **Platform Controllers** - Using `@Permission('platform.*')` decorators
2. **Account Billing/Analytics/Users** - Using `@Permission('account.*')` decorators  
3. **User Profile/Settings** (partial) - Using `@Auth({ permissions: ['user.*'] })`
4. **Tenant Model Schemas** - Using `@Permission('tenant.schemas.*')` decorators
5. **Public Controllers** - Using `@Public()` decorator correctly
6. **Auth Controllers** - Using `@Public()` and guards correctly

### Mixed Pattern Controllers (Need Consistency)
1. **Tenant Controller** - Uses modern `@Auth({ permissions: [...] })` pattern (correct)
2. **User Profile Controller** - Mix of both patterns

## 📊 Summary Statistics

| Security Level | Endpoints Missing Permissions | Risk Level |
|---------------|-------------------------------|------------|
| Platform | 0 | ✅ SECURE |
| Tenant | 29 | 🚨 HIGH RISK |
| Account | 4 | 🚨 HIGH RISK |
| User | 4 | ⚠️ MEDIUM RISK |
| Public | 0 | ✅ SECURE |
| **TOTAL** | **42** | **🚨 HIGH RISK** |

## 🔧 Recommended Implementation Plan

### Phase 1: Critical Security Fixes (Immediate)
1. **Tenant Settings God-Mode** - `tenant.settings.manage_god_mode`
2. **Tenant LLM API Keys** - `tenant.llm.manage_keys`
3. **Account Member Management** - `account.members.*`

### Phase 2: High Priority (Week 1)
1. **All Tenant Media endpoints**
2. **All Account endpoints**
3. **Tenant Integration management**

### Phase 3: Medium Priority (Week 2)
1. **Tenant Translation management**
2. **User profile endpoints**
3. **Tenant LLM analytics**

### Implementation Pattern
For each endpoint, add the appropriate decorator:

```typescript
// Add this import
import { Permission } from '@common/decorators/permission.decorator';

// Add decorator before HTTP method decorator
@Permission('tier.resource.action')
@Get()
async methodName() {
  // endpoint implementation
}
```

### Permission String Patterns
- **Platform:** `platform.{resource}.{action}`
- **Tenant:** `tenant.{resource}.{action}`
- **Account:** `account.{resource}.{action}`
- **User:** `user.{resource}.{action}`

Common actions: `view`, `create`, `update`, `delete`, `manage`, `configure`

## 🎯 Next Steps

1. **Immediate Action Required:** Fix the 8 CRITICAL endpoints first
2. **Create Kanban Task:** Track implementation progress
3. **Security Review:** All permission strings should follow the established pattern
4. **Testing:** Verify permissions work correctly after implementation
5. **Documentation:** Update API documentation with new permission requirements

---

**Report Status:** Complete  
**Requires Action:** Yes - 42 endpoints need @Permission() decorators  
**Security Priority:** HIGH - Multiple critical vulnerabilities identified