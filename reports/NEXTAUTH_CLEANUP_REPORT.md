# NextAuth Cleanup Report

## Summary
This report identifies all remaining NextAuth references in the codebase that need to be removed or replaced with the custom JWT authentication system.

## Status
- ✅ Fastify API server (`/apps/api/src`) - No NextAuth references found
- ✅ Auth context (`/src/contexts/auth-context.tsx`) - Already using custom JWT auth
- ✅ SessionProvider - Already removed
- ⚠️ Frontend code still has NextAuth imports and usage
- ⚠️ Middleware still uses NextAuth for token validation
- ⚠️ Package dependency still exists

## Remaining NextAuth References

### 1. Package Dependency
- **File**: `package.json`
- **Line**: 117
- **Content**: `"next-auth": "^4.24.11",`
- **Action**: Remove after all code references are cleaned up

### 2. Type Definitions
- **File**: `next-auth.d.ts`
- **Action**: Delete this file after migrating all type references

### 3. Middleware
- **File**: `middleware.ts`
- **Import**: `import { getToken } from 'next-auth/jwt';`
- **Usage**: Token validation on line 34-37
- **Action**: Replace with custom JWT validation

### 4. Client Permissions Module
- **File**: `/src/lib/permissions/client-permissions.ts`
- **Import**: `import { type Session } from 'next-auth';`
- **Action**: Replace Session type with custom auth types

### 5. API Permission Checks
Multiple files using `getServerSession`:
- `/src/lib/permissions/canAccessAPI.ts`
- `/src/lib/permissions/can-access-api.ts`
- `/src/lib/middleware/auth.middleware.ts`
- `/src/lib/auth/session-optimization.ts`
- Various API route files in `/src/app/api/v1/`
**Action**: Replace with custom JWT session validation

### 6. Client Components Using useSession
24 files found using `useSession()` hook, including:
- `/src/lib/date-formatting.ts`
- `/src/components/providers/database-theme-provider.tsx`
- `/src/components/auth/PermissionGate.tsx`
- Various hooks in `/src/lib/hooks/`
- UI components in `/src/components/ui/`
**Action**: Replace with `useAuth()` hook from auth context

### 7. SignOut Manager
- **File**: `/src/lib/auth/signout-manager.ts`
- **Status**: Already commented out NextAuth import
- **Lines**: 55-61 - signOut method commented out
- **Action**: Implement new signout method using custom auth

### 8. Auth Configuration
- **File**: `/src/lib/auth.ts`
- **Status**: Likely contains NextAuth configuration
- **Action**: Verify if this file is still needed or can be removed

## Migration Steps

1. **Create Custom Types**: Replace NextAuth Session type with custom AuthUser type
2. **Update Middleware**: Replace `getToken` with custom JWT validation
3. **Update API Routes**: Replace `getServerSession` with custom session validation
4. **Update Client Components**: Replace `useSession` with `useAuth` hook
5. **Implement SignOut**: Complete the signout implementation in SignoutManager
6. **Remove Dependencies**: Remove next-auth from package.json
7. **Clean Up**: Delete next-auth.d.ts and any unused auth configuration files

## Priority Items
1. Middleware token validation (blocking all protected routes)
2. API route session validation (blocking API access)
3. Client component session hooks (blocking UI functionality)

## Testing Required
- Authentication flow (login/logout)
- Protected route access
- API endpoint authorization
- Session persistence
- Token refresh mechanism