# Missing @Permission Decorators Analysis

## Summary

Found **26 controller methods** across **4 controllers** that have HTTP method decorators (@Get, @Post, @Put, @Delete, @Patch) but are missing @Permission decorators.

## Critical Findings

### 1. Authentication Controller Methods Without Permissions
**File**: `/modules/auth/auth.controller.ts`

These methods use `@UseGuards(JwtAuthGuard)` for authentication but lack permission checks:
- Line 68: `@Post() signOut()` - Should have permission like `user.auth.signout`
- Line 99: `@Post() refresh()` - Token refresh might not need permission (public endpoint)
- Line 149: `@Get() getMe()` - Should have permission like `user.profile.read`
- Line 175: `@Post() changePassword()` - Should have permission like `user.auth.change-password`

### 2. Tenant Controllers with Class-Level @Auth but No Method Permissions

#### Translations Controller
**File**: `/modules/tenant/controllers/translations.controller.ts`
- Has class-level `@Auth()` and `@Tier(UserTier.TENANT)` decorators
- Missing @Permission on all 9 methods:
  - Line 13: `@Get() getTranslations()` - Needs `tenant.translations.read`
  - Line 25: `@Get() getTranslationKeys()` - Needs `tenant.translations.read`
  - Line 34: `@Get() getLanguages()` - Needs `tenant.translations.read`
  - Line 43: `@Post() manageLanguages()` - Needs `tenant.translations.manage`
  - Line 52: `@Post() scanStrings()` - Needs `tenant.translations.scan`
  - Line 61: `@Post() extractStrings()` - Needs `tenant.translations.extract`
  - Line 70: `@Post() autoTranslate()` - Needs `tenant.translations.translate`
  - Line 79: `@Get() getStatistics()` - Needs `tenant.translations.read`
  - Line 88: `@Get() lookupTranslation()` - Needs `tenant.translations.read`

#### LLM Controller
**File**: `/modules/tenant/controllers/llm.controller.ts`
- Has class-level `@Auth()` and `@Tier(UserTier.TENANT)` decorators
- Missing @Permission on all 8 methods:
  - Line 13: `@Get() getProviders()` - Needs `tenant.llm.read`
  - Line 28: `@Post() enableProvider()` - Needs `tenant.llm.manage`
  - Line 37: `@Get() getApiKeys()` - Needs `tenant.llm.read`
  - Line 46: `@Post() addApiKey()` - Needs `tenant.llm.manage`
  - Line 55: `@Delete() deleteApiKey()` - Needs `tenant.llm.manage`
  - Line 64: `@Get() getScopes()` - Needs `tenant.llm.read`
  - Line 73: `@Post() configureScope()` - Needs `tenant.llm.configure`
  - Line 82: `@Get() getAnalytics()` - Needs `tenant.llm.analytics`

#### Integrations Controller
**File**: `/modules/tenant/controllers/integrations.controller.ts`
- Missing @Permission on all 5 methods:
  - Line 13: `@Get() getIntegrations()` - Needs `tenant.integrations.read`
  - Line 25: `@Get() getIntegration()` - Needs `tenant.integrations.read`
  - Line 34: `@Post() enableIntegration()` - Needs `tenant.integrations.manage`
  - Line 43: `@Post() disableIntegration()` - Needs `tenant.integrations.manage`
  - Line 52: `@Put() updateIntegration()` - Needs `tenant.integrations.update`

## Security Implications

1. **Authorization Bypass**: Without @Permission decorators, users with valid JWT tokens can access these endpoints regardless of their actual permissions.

2. **RBAC Violation**: The 5-tier architecture (Platform → Tenant → Account → User → Public) relies on proper permission checks at each endpoint.

3. **Audit Trail Issues**: Permission checks are likely logged for audit purposes. Missing decorators mean these actions won't be properly tracked.

## Recommendations

1. **Immediate Action Required**: Add @Permission decorators to all 26 methods identified.

2. **Permission Naming Convention**: Follow the established pattern: `{tier}.{resource}.{action}`
   - Examples: `tenant.translations.read`, `tenant.llm.manage`, `user.profile.read`

3. **Consider Public Endpoints**: The `refresh()` method in auth.controller.ts might be intentionally public since it's used to refresh tokens. Consider if it needs a @Public decorator instead.

4. **Automated Testing**: Add a pre-commit hook or CI check using the `check-missing-permissions.ts` script to prevent future violations.

## Script Usage

To re-run this analysis:
```bash
pnpm tsx scripts/check-missing-permissions.ts
```

The script excludes:
- Methods with @Public decorator
- Classes with @Public decorator
- Methods with @Permission decorator
- Methods with @Auth decorator (though class-level @Auth still requires method-level @Permission)