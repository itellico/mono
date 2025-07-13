# NestJS API Validation and Swagger Audit Report

## Summary
This audit identifies controllers and endpoints that are missing required decorators or have improper validation setup according to the CLAUDE.md best practices.

## Critical Issues Found

### 1. Missing UUID Validation with ParseUUIDPipe

The following controllers use string parameters that should be UUIDs but lack proper validation:

#### `/apps/api-nest/src/modules/tenant/controllers/media.controller.ts`
- Line 50: `@Param('id') id: string` - Should use ParseUUIDPipe
- Line 60: `@Param('id') id: string` - Should use ParseUUIDPipe
- Missing @ApiParam decorators with UUID format specification

#### `/apps/api-nest/src/modules/tenant/controllers/llm.controller.ts`
- Line 57: `@Param('id') id: string` - Should use ParseUUIDPipe
- Missing @ApiParam decorators with UUID format specification

### 2. Missing @Permission Decorators

#### `/apps/api-nest/src/modules/tenant/controllers/translations.controller.ts`
ALL endpoints are missing @Permission decorators:
- Line 13: `@Get()` - Missing @Permission('tenant.translations.view')
- Line 25: `@Get('keys')` - Missing @Permission('tenant.translations.view')
- Line 34: `@Get('languages')` - Missing @Permission('tenant.translations.view')
- Line 43: `@Post('languages/management')` - Missing @Permission('tenant.translations.manage')
- Line 52: `@Post('scan-strings')` - Missing @Permission('tenant.translations.scan')
- Line 61: `@Post('extract-strings')` - Missing @Permission('tenant.translations.extract')
- Line 70: `@Post('auto-translate')` - Missing @Permission('tenant.translations.translate')
- Line 79: `@Get('statistics')` - Missing @Permission('tenant.translations.view')
- Line 88: `@Get('lookup')` - Missing @Permission('tenant.translations.view')

### 3. Correct Implementation Examples

For reference, here's how it should be implemented (from `platform/controllers/users.controller.ts`):

```typescript
@Get(':uuid')
@Permission('platform.users.view')
@ApiOperation({ summary: 'Get platform user by UUID' })
@ApiParam({ 
  name: 'uuid', 
  type: String, 
  format: 'uuid',
  description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
  example: '123e4567-e89b-12d3-a456-426614174000'
})
async getUserByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
  return this.usersService.getUserByUuid(uuid);
}
```

## Recommendations

1. **Immediate Actions Required:**
   - Add ParseUUIDPipe validation to all UUID parameters
   - Add @Permission decorators to all endpoints in translations.controller.ts
   - Add proper @ApiParam decorators with UUID format specification

2. **Best Practices to Follow:**
   - Every endpoint must have a @Permission decorator
   - All UUID parameters must use ParseUUIDPipe
   - All UUID parameters must have @ApiParam with format: 'uuid'
   - Follow the permission naming convention: `{tier}.{resource}.{action}`

3. **Security Implications:**
   - Missing permission decorators means endpoints are unprotected
   - Missing UUID validation could lead to invalid data or injection attacks
   - These issues violate the mandatory security checks outlined in CLAUDE.md

## Files Requiring Updates

1. `/apps/api-nest/src/modules/tenant/controllers/media.controller.ts`
2. `/apps/api-nest/src/modules/tenant/controllers/translations.controller.ts`
3. `/apps/api-nest/src/modules/tenant/controllers/llm.controller.ts`

### 4. Additional Controllers Missing @Permission Decorators

Based on comprehensive analysis, **26 controller methods** are missing @Permission decorators:

#### `/apps/api-nest/src/modules/auth/auth.controller.ts`
- 4 methods using `@UseGuards(JwtAuthGuard)` but lacking specific permissions
- Methods: signOut, refresh, getMe, changePassword

#### `/apps/api-nest/src/modules/tenant/controllers/llm.controller.ts`
- 8 methods missing permissions for LLM provider management
- All API key and provider configuration endpoints need permissions

#### `/apps/api-nest/src/modules/tenant/controllers/integrations.controller.ts`
- 5 methods missing permissions for integration management
- All integration enable/disable/update endpoints need permissions

### 5. UUID Parameters Without Validation

#### `/apps/api-nest/src/modules/user/controllers/profile.controller.ts`
- Line 40: `@Param('uuid') uuid: string` - Should use ParseUUIDPipe

## Security Impact

- **26 endpoints** are accessible without proper permission checks
- **5+ UUID parameters** lack validation, risking invalid data or injection attacks
- Violates the mandatory 5-tier RBAC architecture requirements

## Next Steps

1. **Critical Priority:**
   - Add @Permission decorators to all 26 identified endpoints
   - Add ParseUUIDPipe validation to all UUID parameters
   - Add proper @ApiParam decorators with UUID format specification

2. **Validation Script Available:**
   - Use `/scripts/check-missing-permissions.ts` to verify fixes
   - Run regularly to catch new violations

3. **Files Requiring Immediate Updates:**
   - `/apps/api-nest/src/modules/tenant/controllers/translations.controller.ts` (9 endpoints)
   - `/apps/api-nest/src/modules/tenant/controllers/llm.controller.ts` (8 endpoints)
   - `/apps/api-nest/src/modules/tenant/controllers/integrations.controller.ts` (5 endpoints)
   - `/apps/api-nest/src/modules/auth/auth.controller.ts` (4 endpoints)
   - `/apps/api-nest/src/modules/tenant/controllers/media.controller.ts` (UUID validation)
   - `/apps/api-nest/src/modules/user/controllers/profile.controller.ts` (UUID validation)