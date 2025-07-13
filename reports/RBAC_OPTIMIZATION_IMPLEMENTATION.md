# RBAC Optimization Implementation Guide

## Overview

This guide provides step-by-step instructions to implement the optimized RBAC system for itellico Mono, reducing permissions from ~500+ to ~150 while maintaining full functionality.

---

## 📋 Implementation Checklist

- [ ] Backup current database
- [ ] Run schema migration
- [ ] Migrate existing permissions
- [ ] Seed optimized permissions
- [ ] Test permission resolver
- [ ] Update application code
- [ ] Clear caches
- [ ] Verify system functionality

---

## 🚀 Step 1: Backup Current System

```bash
# Backup current database
pg_dump -h localhost -U developer -d mono > backup_before_rbac_optimization.sql

# Backup current schema
cp prisma/schema.prisma prisma/schema.backup.$(date +%Y%m%d).prisma
```

---

## 🔧 Step 2: Run Schema Migration

```bash
# Apply the optimized RBAC schema migration
psql -h localhost -U developer -d mono < prisma/migrations/optimize_rbac/migration.sql

# Verify migration success
psql -h localhost -U developer -d mono -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('PermissionSet', 'PermissionSetItem', 'UserPermission', 'PermissionInheritance', 'PermissionAudit', 'UserPermissionCache');"
```

---

## 📦 Step 3: Migrate Existing Permissions

```bash
# Run the permission migration script
npm run ts-node scripts/migrate-permissions-to-optimized.ts

# Verify migration
psql -h localhost -U developer -d mono -c "SELECT pattern, resource, action, scope FROM \"Permission\" WHERE \"isWildcard\" = true ORDER BY pattern;"
```

---

## 🌱 Step 4: Seed Optimized Permissions

```bash
# Run the seed script
npm run ts-node prisma/seed-optimized-permissions.ts

# Verify seeded data
psql -h localhost -U developer -d mono -c "SELECT name, code, level FROM \"Role\" ORDER BY level DESC;"
```

---

## 🧪 Step 5: Test Permission Resolver

Create a test file to verify the permission resolver:

```typescript
// test-permission-resolver.ts
import { OptimizedPermissionResolver } from '@/lib/permissions/optimized-permission-resolver';

async function testPermissions() {
  const resolver = OptimizedPermissionResolver.getInstance();
  
  // Test user context
  const context = {
    userId: 1,
    tenantId: 1,
    ipAddress: '127.0.0.1',
    userAgent: 'Test',
    requestId: 'test-123'
  };

  // Test various permission checks
  const tests = [
    'profiles.read.own',
    'profiles.*.own',
    'content.*.tenant',
    'platform.*.global'
  ];

  for (const permission of tests) {
    const result = await resolver.hasPermission(context, permission);
    console.log(`Permission: ${permission}, Granted: ${result.granted}, Source: ${result.source}`);
  }
}

testPermissions().catch(console.error);
```

Run the test:
```bash
npm run ts-node test-permission-resolver.ts
```

---

## 💻 Step 6: Update Application Code

### Update Permission Check Function

Replace the old `canAccessAPI` with the optimized version:

```typescript
// src/lib/permissions/can-access-api-optimized.ts
import { OptimizedPermissionResolver } from './optimized-permission-resolver';

export async function canAccessAPI(
  userId: number,
  requiredPermission: string,
  context?: {
    tenantId?: number;
    resourceType?: string;
    resourceId?: string;
  }
): Promise<boolean> {
  const resolver = OptimizedPermissionResolver.getInstance();
  
  const result = await resolver.hasPermission({
    userId,
    tenantId: context?.tenantId,
    resourceType: context?.resourceType,
    resourceId: context?.resourceId
  }, requiredPermission);
  
  return result.granted;
}
```

### Update API Routes

Update your API routes to use the new permission patterns:

```typescript
// Before
if (!await canAccessAPI(userId, 'profiles.read.account')) {
  return unauthorized();
}

// After
if (!await canAccessAPI(userId, 'profiles.*.own')) {
  return unauthorized();
}
```

### Update Permission Constants

```typescript
// src/lib/permissions/constants.ts
export const OPTIMIZED_PERMISSIONS = {
  // Platform Level
  PLATFORM_ALL: 'platform.*.global',
  TENANTS_ALL: 'tenants.*.global',
  EMERGENCY_ACCESS: 'emergency.access.global',
  
  // Tenant Level
  TENANT_MANAGE: 'tenant.manage.tenant',
  CONTENT_ALL: 'content.*.tenant',
  MARKETPLACE_ALL: 'marketplace.*.tenant',
  MODERATION_ALL: 'moderation.*.tenant',
  
  // Account Level
  ACCOUNT_MANAGE: 'account.manage.own',
  PROFILES_ALL: 'profiles.*.own',
  JOBS_ALL: 'jobs.*.own',
  BOOKINGS_ALL: 'bookings.*.own',
  
  // User Level
  PROFILE_OWN: 'profile.*.own',
  APPLICATIONS_OWN: 'applications.*.own',
  MESSAGES_OWN: 'messages.*.own'
} as const;
```

---

## 🗑️ Step 7: Clear Caches

```bash
# Clear Redis cache
redis-cli FLUSHDB

# Clear database permission cache
psql -h localhost -U developer -d mono -c "TRUNCATE TABLE \"UserPermissionCache\";"
```

---

## ✅ Step 8: Verify System Functionality

### Run Integration Tests

```bash
# Run permission tests
npm test -- --testPathPattern=permissions

# Run API tests
npm test -- --testPathPattern=api
```

### Manual Testing Checklist

1. **Super Admin Functions**
   - [ ] Can access platform settings
   - [ ] Can manage tenants
   - [ ] Can impersonate users

2. **Tenant Admin Functions**
   - [ ] Can manage accounts
   - [ ] Can moderate content
   - [ ] Can view analytics

3. **Account Owner Functions**
   - [ ] Can manage profiles
   - [ ] Can post jobs
   - [ ] Can manage team

4. **Regular User Functions**
   - [ ] Can edit own profile
   - [ ] Can apply to jobs
   - [ ] Can send messages

---

## 📊 Performance Monitoring

Monitor the following metrics after implementation:

```sql
-- Check permission check performance
SELECT 
  AVG("checkDurationMs") as avg_duration,
  MAX("checkDurationMs") as max_duration,
  COUNT(*) as total_checks,
  COUNT(CASE WHEN granted THEN 1 END) as granted_count
FROM "PermissionAudit"
WHERE timestamp > NOW() - INTERVAL '1 hour';

-- Check cache hit rates
SELECT 
  COUNT(CASE WHEN source = 'cache' THEN 1 END)::float / COUNT(*) * 100 as cache_hit_rate
FROM "PermissionAudit"
WHERE timestamp > NOW() - INTERVAL '1 hour';

-- Check wildcard usage
SELECT 
  "permissionPattern",
  COUNT(*) as usage_count
FROM "PermissionAudit"
WHERE "permissionPattern" LIKE '%*%'
GROUP BY "permissionPattern"
ORDER BY usage_count DESC;
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if wildcards are properly expanded
   - Verify permission inheritance is working
   - Clear user permission cache

2. **Slow Permission Checks**
   - Ensure caching is enabled
   - Check database indexes
   - Monitor cache hit rates

3. **Migration Failures**
   - Verify database connectivity
   - Check for conflicting permissions
   - Review migration logs

### Debug Commands

```bash
# Check user permissions
psql -h localhost -U developer -d mono -c "SELECT * FROM user_effective_permissions WHERE \"userId\" = 1;"

# Check permission inheritance
psql -h localhost -U developer -d mono -c "SELECT p1.pattern as parent, p2.pattern as child FROM \"PermissionInheritance\" pi JOIN \"Permission\" p1 ON pi.\"parentId\" = p1.id JOIN \"Permission\" p2 ON pi.\"childId\" = p2.id;"

# Clear specific user cache
redis-cli DEL "user:1:permissions"
```

---

## 🔄 Rollback Plan

If issues arise, rollback using:

```bash
# Restore database backup
psql -h localhost -U developer -d mono < backup_before_rbac_optimization.sql

# Restore schema
cp prisma/schema.backup.$(date +%Y%m%d).prisma prisma/schema.prisma

# Regenerate Prisma client
npx prisma generate
```

---

## 📈 Expected Results

After successful implementation:

- **70% reduction** in total permissions
- **80% faster** permission checks with caching
- **90%+ cache hit rate** after warm-up
- **Simplified** permission management
- **Better** developer experience

---

## 🎯 Next Steps

1. Monitor system performance for 24-48 hours
2. Collect feedback from developers
3. Fine-tune cache expiration times
4. Document any custom permission patterns
5. Schedule regular permission audits

---

This implementation transforms itellico Mono's RBAC system into a streamlined, efficient, and maintainable solution while maintaining all security requirements.