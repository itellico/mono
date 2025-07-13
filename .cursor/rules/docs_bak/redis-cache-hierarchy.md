# 🔑 Redis Cache Hierarchy & Naming Conventions

## Overview

This document defines the Redis caching hierarchy and naming conventions for itellico Mono's multi-tenant SaaS architecture, based on 2024 best practices.

## Key Naming Structure

### Base Pattern
```
{scope}:{entity}:{identifier}:{field}
```

### Hierarchy Levels

1. **Platform (Global)**
2. **Tenant**
3. **Account**
4. **User**

## Naming Conventions

### 1. Platform/Global Level
Keys that apply across the entire platform:

```redis
platform:config:{key}
platform:settings:{key}
platform:permissions:all
platform:roles:all
platform:features:{feature_id}
platform:maintenance:status
```

### 2. Tenant Level
Keys specific to a tenant (using UUIDs for security):

```redis
tenant:{tenant_uuid}:config
tenant:{tenant_uuid}:settings
tenant:{tenant_uuid}:features
tenant:{tenant_uuid}:limits
tenant:{tenant_uuid}:subscription
tenant:{tenant_uuid}:stats
```

**Example with actual UUIDs:**
```redis
tenant:550e8400-e29b-41d4-a716-446655440000:config
tenant:550e8400-e29b-41d4-a716-446655440000:settings
```

### 3. Account Level
Keys for account (agency/company) data:

```redis
tenant:{tenant_id}:account:{account_id}:profile
tenant:{tenant_id}:account:{account_id}:settings
tenant:{tenant_id}:account:{account_id}:team
tenant:{tenant_id}:account:{account_id}:billing
tenant:{tenant_id}:account:{account_id}:limits
```

### 4. User Level
Keys for individual users (consistent UUID format):

```redis
tenant:{tenant_uuid}:user:{user_uuid}:permissions
tenant:{tenant_uuid}:user:{user_uuid}:roles
tenant:{tenant_uuid}:user:{user_uuid}:profile
tenant:{tenant_uuid}:user:{user_uuid}:preferences
tenant:{tenant_uuid}:user:{user_uuid}:sessions
tenant:{tenant_uuid}:user:{user_uuid}:activity
```

**Example with actual UUIDs:**
```redis
tenant:550e8400-e29b-41d4-a716-446655440000:user:8a114e68-2c84-48a7-abb8-6eba1b305f8a:permissions
tenant:550e8400-e29b-41d4-a716-446655440000:user:8a114e68-2c84-48a7-abb8-6eba1b305f8a:profile
tenant:550e8400-e29b-41d4-a716-446655440000:user:8a114e68-2c84-48a7-abb8-6eba1b305f8a:sessions
```

### 5. Cross-Reference Keys
For relationships and lookups:

```redis
tenant:{tenant_id}:account:{account_id}:users        # Set of user IDs
tenant:{tenant_id}:user:{user_id}:accounts          # User's accounts
tenant:{tenant_id}:role:{role_id}:users             # Users with role
tenant:{tenant_id}:permission:{perm_name}:users     # Users with permission
```

### 6. Search and List Keys
For cached search results and lists:

```redis
tenant:{tenant_id}:search:users:{query_hash}
tenant:{tenant_id}:search:profiles:{query_hash}
tenant:{tenant_id}:list:users:page:{page}:limit:{limit}
tenant:{tenant_id}:list:recent_activity
```

### 7. Temporary/Session Keys
For temporary data with TTL:

```redis
temp:session:{session_id}
temp:refresh:{session_id}
temp:ratelimit:{method}:{route}:{ip}
temp:auth:token:{token_hash}
temp:otp:{user_id}:{purpose}
temp:upload:{upload_id}
temp:job:{job_id}:status
```

## Best Practices

### 1. **Use Colons as Separators**
- Standard convention in Redis
- Creates logical namespaces
- Easy to parse and filter

### 2. **Lowercase Only**
- Avoid case sensitivity issues
- Consistent across all keys
- Example: `tenant:1:user:123` not `Tenant:1:User:123`

### 3. **Descriptive but Concise**
- Balance readability with key length
- Use standard abbreviations consistently
- `perm` for permission, `config` for configuration

### 4. **Include Tenant ID for Isolation**
- Always prefix tenant-specific data with tenant ID
- Enables proper data isolation
- Supports access control patterns

### 5. **Version Prefixing (Optional)**
```redis
v1:tenant:{tenant_id}:user:{user_id}:permissions
v2:tenant:{tenant_id}:user:{user_id}:permissions
```

## TTL Strategy

### Short-lived (5-15 minutes)
```redis
tenant:{tenant_id}:user:{user_id}:permissions     # 300s (5 min)
tenant:{tenant_id}:user:{user_id}:session        # 900s (15 min)
tenant:{tenant_id}:search:*                      # 300s (5 min)
```

### Medium-lived (1-24 hours)
```redis
tenant:{tenant_id}:stats:daily                   # 3600s (1 hour)
tenant:{tenant_id}:account:{account_id}:profile  # 86400s (24 hours)
platform:config:*                                # 3600s (1 hour)
```

### Long-lived (Days/Persistent)
```redis
platform:permissions:all                         # 604800s (7 days)
platform:roles:all                              # 604800s (7 days)
tenant:{tenant_id}:config                       # No TTL (persistent)
```

## Security Patterns

### 1. **Key Prefix Access Control**
```redis
# Fabrikam tenant can only access:
tenant:fabrikam:*

# Contoso tenant can only access:
tenant:contoso:*
```

### 2. **Wildcard Patterns for ACL**
```redis
# Super admin can access all:
*

# Tenant admin can access:
tenant:{their_tenant_id}:*

# Regular user can access:
tenant:{their_tenant_id}:user:{their_user_id}:*
```

## Implementation Example

```typescript
// Cache key builder utility
class CacheKeyBuilder {
  static platform(entity: string, identifier?: string): string {
    return identifier 
      ? `platform:${entity}:${identifier}`
      : `platform:${entity}`;
  }

  static tenant(tenantId: number, entity: string, identifier?: string): string {
    return identifier
      ? `tenant:${tenantId}:${entity}:${identifier}`
      : `tenant:${tenantId}:${entity}`;
  }

  static user(tenantId: number, userId: string, field: string): string {
    return `tenant:${tenantId}:user:${userId}:${field}`;
  }

  static account(tenantId: number, accountId: string, field: string): string {
    return `tenant:${tenantId}:account:${accountId}:${field}`;
  }

  static search(tenantId: number, entity: string, queryHash: string): string {
    return `tenant:${tenantId}:search:${entity}:${queryHash}`;
  }
}

// Usage examples:
const permissionsKey = CacheKeyBuilder.user(1, "123", "permissions");
// Result: "tenant:1:user:123:permissions"

const globalConfigKey = CacheKeyBuilder.platform("config", "features");
// Result: "platform:config:features"
```

## Anti-Patterns to Avoid

### ❌ Don't Use
- Spaces in keys: `user 123 permissions`
- Mixed case: `User:123:Permissions`
- Deep nesting: `a:b:c:d:e:f:g:h:i:j`
- Generic keys: `data1`, `temp123`
- No tenant isolation: `user:123:permissions` (missing tenant)

### ✅ Do Use
- Clear hierarchy: `tenant:1:user:123:permissions`
- Consistent separators: always use `:`
- Descriptive names: `search:profiles:active`
- Proper scoping: always include tenant ID for tenant data

## Monitoring Keys

Use Redis SCAN (not KEYS) to monitor key patterns:

```bash
# Count keys by pattern
redis-cli --scan --pattern "tenant:1:*" | wc -l

# Find all user permission keys
redis-cli --scan --pattern "tenant:*:user:*:permissions"

# Monitor key distribution
redis-cli --scan --pattern "*" | awk -F: '{print $1":"$2}' | sort | uniq -c
```

## Cache Invalidation Patterns

### Tag-Based Invalidation
```redis
# Tag keys for bulk invalidation
tag:tenant:1 -> [key1, key2, key3]
tag:user:123 -> [key4, key5]
tag:permissions -> [key1, key4, key6]
```

### Pattern-Based Deletion
```typescript
// Invalidate all user data
await redis.del(...await redis.keys(`tenant:${tenantId}:user:${userId}:*`));

// Invalidate all search results for a tenant
await redis.del(...await redis.keys(`tenant:${tenantId}:search:*`));
```

## Real-World Implementation Examples

### Auth Service Implementation (Updated 2025)

```typescript
// ✅ CORRECT: Session storage with temp namespace
await redis.setex(
  `temp:session:${sessionId}`,
  sessionTimeout,
  JSON.stringify(sessionData)
);

// ✅ CORRECT: User sessions with tenant isolation
await redis.sadd(
  `tenant:${tenantId}:user:${userId}:sessions`,
  sessionId
);

// ✅ CORRECT: Refresh token storage
await redis.setex(
  `temp:refresh:${sessionId}`,
  7 * 24 * 60 * 60, // 7 days
  refreshToken
);
```

### Common Mistakes to Avoid

```typescript
// ❌ BAD: No namespace prefix
await redis.set('session:123', data);

// ❌ BAD: Missing tenant isolation
await redis.set('user:sessions:456', data);

// ❌ BAD: Old naming pattern
await redis.set('permissions:list:all', data);

// ❌ BAD: Rate limiting without temp prefix
await redis.set('fastify-rate-limit-POST/api/login-127.0.0.1', count);

// ✅ GOOD: Rate limiting with proper temp prefix
const keyGenerator = (request) => `temp:ratelimit:${request.method}:${request.url}:${request.ip}`;
```

## Migration Guide

### For Existing Applications

1. **Audit Current Keys**:
```bash
# List all non-compliant keys
redis-cli keys "*" | grep -v "^tenant:" | grep -v "^platform:" | grep -v "^temp:" | grep -v "^tag:"
```

2. **Gradual Migration**:
```typescript
// Support both old and new keys during transition
const sessionData = await redis.get(`temp:session:${id}`) || 
                   await redis.get(`session:${id}`); // Legacy fallback
```

3. **Clean Up Old Keys**:
```bash
# After migration, remove old keys
redis-cli --scan --pattern "session:*" | xargs redis-cli del
redis-cli --scan --pattern "refresh:*" | xargs redis-cli del
```

## Monitoring and Compliance

### Key Distribution Analysis
```bash
# Analyze key distribution by pattern
redis-cli --scan --pattern "*" | awk -F: '{print $1":"$2}' | sort | uniq -c | sort -nr
```

### Compliance Check Script
```bash
#!/bin/bash
# Check for non-compliant keys
INVALID_KEYS=$(redis-cli keys "*" | grep -v "^tenant:" | grep -v "^platform:" | grep -v "^temp:" | grep -v "^tag:")
if [ -n "$INVALID_KEYS" ]; then
  echo "❌ Found non-compliant Redis keys:"
  echo "$INVALID_KEYS"
  exit 1
else
  echo "✅ All Redis keys follow naming conventions"
fi
```

## Enforcement in Code Reviews

### PR Checklist
- [ ] All Redis keys use correct namespace prefix
- [ ] Tenant-scoped data includes tenant ID
- [ ] Temporary data uses `temp:` prefix
- [ ] No hardcoded key patterns without CacheKeyBuilder
- [ ] TTL is set for all temporary keys

### Automated Linting
```typescript
// eslint rule to catch incorrect Redis key patterns
const invalidPatterns = [
  /redis\.(set|get|del)\(['"`](?!tenant:|platform:|temp:|tag:)/,
  /redis\.keys\(['"`]\*['"`]\)/, // Disallow keys('*')
  /redis\.(set|setex)\(['"`][^:]+['"`]/, // Single segment keys
];
```

## UUID Migration (Updated 2025)

### Converting Legacy Numeric Keys to UUIDs

For existing installations with numeric tenant IDs in Redis keys, use the migration script:

```bash
# Run the migration to convert tenant keys from numeric IDs to UUIDs
npx tsx scripts/migrate-redis-tenant-keys-to-uuid.ts

# Verify the migration
./scripts/verify-redis-compliance.sh
```

**Before Migration:**
```redis
tenant:1:user:8a114e68-2c84-48a7-abb8-6eba1b305f8a:permissions
```

**After Migration:**
```redis
tenant:550e8400-e29b-41d4-a716-446655440000:user:8a114e68-2c84-48a7-abb8-6eba1b305f8a:permissions
```

## Conclusion

This hierarchy provides:
- ✅ **UUID Consistency**: Both tenants and users use UUIDs for security
- ✅ **Clear tenant isolation**: Complete data separation between tenants
- ✅ **Efficient key organization**: Logical namespace structure
- ✅ **Scalable patterns**: Supports multi-tenant growth
- ✅ **Security through UUIDs**: Prevents enumeration attacks
- ✅ **Easy monitoring and debugging**: Clear key patterns
- ✅ **Consistent naming**: Uniform across the platform
- ✅ **RedisInsight-friendly**: Clean tree structure for browsing

**Remember**: Every Redis key tells a story. Make it a clear one:
- `temp:session:abc` → "This is a temporary session"
- `tenant:550e8400-...:user:8a114e68-...:permissions` → "User UUID's permissions in tenant UUID"
- `platform:roles:list:all` → "Global list of all roles"

**Benefits of UUID Approach:**
- **🔒 Enhanced Security**: No internal database IDs exposed
- **🛡️ Anti-enumeration**: Impossible to guess tenant/user identifiers
- **🏗️ Consistency**: Uniform identifier format across all entities
- **🌍 Global Uniqueness**: UUIDs work across distributed systems
- **🔄 Data Portability**: Better for backups, migrations, and integrations

Follow these conventions to ensure maintainable and secure Redis caching in itellico Mono.