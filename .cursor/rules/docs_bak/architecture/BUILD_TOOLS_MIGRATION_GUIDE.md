# Build Tools Migration Guide

## Overview

This guide documents the migration from mixed package managers (npm/pnpm) to a standardized pnpm + Turbo monorepo setup. The migration optimizes development experience and prepares the platform for future expansion with blog, academy, and promo page features.

## Current State Analysis

### Issues Identified

1. **Package Manager Inconsistency**
   - Both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm) exist
   - Mixed scripts: some use `pnpm --filter`, others use standard `npm`
   - Risk of dependency conflicts and unpredictable behavior

2. **Incomplete Monorepo Setup**
   - `pnpm-workspace.yaml` configured correctly
   - `apps/web` directory exists but is empty (no package.json)
   - Scripts reference `@mono/web` which doesn't exist
   - Frontend code resides in root instead of workspace

3. **Turbo Configuration Issues**
   - `turbo.json` exists but Turbo is not installed as dependency
   - No turbo commands in package.json scripts
   - Missing monorepo build optimization benefits

4. **Module Resolution Inconsistencies**
   - 33+ API files use `.js` extensions in TypeScript imports
   - Mixed TypeScript module resolution configurations
   - Path alias inconsistencies between workspaces

## Migration Impact Assessment

### Low Impact Areas (90% of codebase)
- ✅ Frontend React components and pages
- ✅ Business logic and services  
- ✅ Database schemas and migrations
- ✅ Authentication and authorization
- ✅ API route handlers and controllers
- ✅ Admin interfaces and UI components

### Medium Risk Areas (8% of codebase)
- ⚠️ Build and deployment scripts
- ⚠️ Development startup scripts
- ⚠️ TypeScript configuration files
- ⚠️ Import path resolution

### High Risk Areas (2% of codebase)
- 🔴 Module import patterns in API (33 files)
- 🔴 Build output paths and distribution
- 🔴 Development server configurations

## Migration Strategy

### Phase 1: Package Manager Standardization (15 minutes)

**Objective**: Eliminate npm/pnpm conflicts and standardize on pnpm

**Steps**:
```bash
# 1. Remove npm lock file
rm package-lock.json

# 2. Reinstall with pnpm
pnpm install

# 3. Verify workspace configuration
pnpm list --depth=0
```

**Verification**:
- Only `pnpm-lock.yaml` exists
- All workspaces resolve correctly
- No dependency conflicts reported

### Phase 2: Turbo Integration (10 minutes)

**Objective**: Add Turbo for optimized monorepo builds

**Steps**:
```bash
# 1. Install Turbo locally
pnpm add -D turbo

# 2. Update package.json scripts (see configuration below)

# 3. Test turbo commands
pnpm turbo build
pnpm turbo dev
```

**Configuration Updates**:
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "turbo:dev": "turbo dev --no-cache",
    "turbo:build": "turbo build --no-cache"
  }
}
```

### Phase 3: Module Import Fixes (30 minutes)

**Objective**: Fix TypeScript import patterns and module resolution

**Files Requiring Updates** (33 files):
```typescript
// Current (problematic)
import { EmailService } from '../services/email.service.js';
import { config } from '../config/index.js';

// Fixed (remove .js extensions)
import { EmailService } from '../services/email.service';
import { config } from '../config/index';
```

**TypeScript Configuration Alignment**:
```json
// Standardize across workspaces
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### Phase 4: Testing and Validation (30 minutes)

**Objective**: Ensure all systems work correctly after migration

**Test Commands**:
```bash
# 1. API server startup
pnpm dev:api

# 2. Frontend development server
pnpm dev

# 3. Build processes
pnpm build:api
pnpm build

# 4. TypeScript compilation
pnpm type-check

# 5. Linting
pnpm lint
```

**Validation Checklist**:
- [ ] API server starts without errors
- [ ] Frontend development server starts
- [ ] All imports resolve correctly
- [ ] Build processes complete successfully
- [ ] TypeScript compilation passes
- [ ] No console errors during development

## Enhanced Turbo Configuration

### Updated turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  },
  "globalEnv": ["NODE_ENV", "DATABASE_URL", "NEXTAUTH_SECRET"],
  "globalDotEnv": [".env", ".env.local"]
}
```

### Benefits After Migration

1. **Faster Development**
   - Turbo's incremental builds
   - Optimized dependency resolution with pnpm
   - Better file watching with Turbopack

2. **Improved Reliability**
   - Consistent package management
   - Predictable build outputs
   - Eliminated dependency conflicts

3. **Enhanced Scalability**
   - Proper monorepo foundation
   - Ready for blog/academy/promo workspaces
   - Optimized for team collaboration

4. **Better Developer Experience**
   - Faster installs with pnpm's symlink approach
   - Cleaner build caches
   - More predictable development environment

## Future Expansion Readiness

### Blog/Academy/Promo Integration

The migration prepares the platform for modular expansion:

```bash
# Future workspace structure
apps/
├── api/          # Fastify API server
├── web/          # Main Next.js application  
├── blog/         # Blog system (future)
├── academy/      # Learning management system (future)
└── promo/        # Promotional pages CMS (future)

packages/
├── shared/       # Shared utilities and types
├── ui/           # Component library
└── config/       # Shared configurations
```

### Monorepo Benefits for Content Systems

1. **Shared Components**: UI library reuse across all applications
2. **Consistent Styling**: Unified design system
3. **Type Safety**: Shared TypeScript definitions
4. **Build Optimization**: Turbo's intelligent caching
5. **Development Efficiency**: Single repository management

## Rollback Plan

If issues arise during migration:

```bash
# 1. Restore npm lock file (if backed up)
git checkout package-lock.json

# 2. Reinstall with npm
rm pnpm-lock.yaml
npm install

# 3. Revert package.json scripts
git checkout package.json

# 4. Remove Turbo
npm uninstall turbo
```

## Success Metrics

- [ ] Development server startup time improved
- [ ] Build process reliability increased
- [ ] No dependency conflicts reported
- [ ] All existing functionality preserved
- [ ] Team development experience enhanced

## Next Steps

After successful migration:

1. **Monitor Performance**: Track build and startup times
2. **Team Training**: Ensure all developers use pnpm commands
3. **Documentation Updates**: Update development guides
4. **Expand Workspaces**: Prepare for blog/academy/promo implementation

## Related Documentation

- [itellico Mono Architecture Overview](./README.md)
- [Development Workflow](../getting-started/README.md)
- [Implementation Status Tracker](../roadmap/IMPLEMENTATION_STATUS_TRACKER.md)