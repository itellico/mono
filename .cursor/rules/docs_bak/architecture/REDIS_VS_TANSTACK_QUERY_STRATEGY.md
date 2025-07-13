# 🚀 Redis vs TanStack Query: Caching Strategy Guide

## Overview

This document defines when to use Redis server-side caching versus TanStack Query client-side caching in itellico Mono. The goal is to optimize performance while avoiding over-engineering and maintaining data consistency.

## 🎯 **Decision Matrix**

### **Data Characteristics That Drive Cache Choice:**

| Factor | TanStack Query | Redis | 
|--------|----------------|-------|
| **Query Frequency** | Occasional (<50/min) | Very High (>100/sec) |
| **Data Freshness** | Can be stale 1-5 min | Needs real-time |
| **Computation Cost** | Simple DB query (<1s) | Expensive joins/calculations (>1s) |
| **Sharing Across Users** | Personal data | Multi-user shared data |
| **Data Size** | Small-medium lists | Small objects only |
| **Update Frequency** | Changes rarely | Changes frequently |

## 🔄 **TanStack Query - Use Cases**

### ✅ **Personal/User-Specific Data**
```typescript
// ✅ User's own data - rarely shared, medium frequency
const { data: userProjects } = useQuery(['user-projects', userId], fetchUserProjects);
const { data: userProfile } = useQuery(['user-profile', userId], fetchUserProfile);
const { data: savedSearches } = useQuery(['saved-searches', userId], fetchSavedSearches);
```

### ✅ **Static/Semi-Static Lists**
```typescript
// ✅ Changes infrequently, acceptable to be stale
const { data: categories } = useQuery(['categories'], fetchCategories, {
  staleTime: 30 * 60 * 1000 // 30 minutes - categories don't change often
});

const { data: roles } = useQuery(['roles'], fetchRoles, {
  staleTime: 60 * 60 * 1000 // 1 hour - roles change rarely
});

const { data: permissions } = useQuery(['permissions'], fetchPermissions, {
  staleTime: 60 * 60 * 1000 // 1 hour - permissions change rarely
});
```

### ✅ **Small-Medium Lists (<1000 items)**
```typescript
// ✅ Reasonable to cache on client, not too big
const { data: tenantUsers } = useQuery(['tenant-users', tenantId], fetchTenantUsers);
const { data: workflows } = useQuery(['workflows', tenantId], fetchWorkflows);
```

### ✅ **Reference Data**
```typescript
// ✅ Configuration, lookup tables, options
const { data: countries } = useQuery(['countries'], fetchCountries, {
  staleTime: 24 * 60 * 60 * 1000 // 24 hours - rarely changes
});

const { data: currencies } = useQuery(['currencies'], fetchCurrencies, {
  staleTime: 24 * 60 * 60 * 1000 // 24 hours - rarely changes
});
```

## 🚀 **Redis - Use Cases**

### ✅ **High-Frequency Shared Data**
```typescript
// ✅ Queried by MANY users VERY often
// Example: Active tenant list shown on every admin page
const tenants = await cache.get('tenant:active:list', {
  ttl: 300, // 5 minutes
  fallback: async () => fetchActiveTenants()
});
```

### ✅ **Expensive Computations**
```typescript
// ✅ Takes 2+ seconds to calculate, shared across users
const analytics = await cache.get('tenant:analytics:dashboard:daily', {
  ttl: 1800, // 30 minutes
  fallback: async () => calculateComplexAnalytics() // Expensive query
});

const permissionMatrix = await cache.get('platform:permissions:matrix', {
  ttl: 3600, // 1 hour
  fallback: async () => calculatePermissionMatrix() // Complex inheritance
});
```

### ✅ **Real-Time Requirements**
```typescript
// ✅ Data that MUST be fresh
const subscriptionStatus = await cache.get(`tenant:${tenantId}:subscription:status`, {
  ttl: 300, // 5 minutes
  fallback: async () => checkSubscriptionStatus(tenantId)
});

const userPermissions = await cache.get(`tenant:${tenantId}:user:${userId}:permissions`, {
  ttl: 300, // 5 minutes - security critical
  fallback: async () => calculateUserPermissions(tenantId, userId)
});
```

### ✅ **Session/Temporary Data** 
```redis
temp:session:{session_id}       # Fast session lookup
temp:refresh:{session_id}       # Fast token validation  
temp:ratelimit:{key}           # Fast rate limiting
temp:otp:{user_id}:{purpose}   # Temporary verification codes
```

### ✅ **Cross-Request State**
```redis
tenant:{uuid}:user:{uuid}:sessions    # Active session tracking
tag:permissions                       # Cache invalidation groups
```

## 🏢 **Real-World Decision Examples**

### **Tenant List**

#### **Small SaaS (10-50 tenants)**
```typescript
// ✅ TanStack Query - Simple, not queried frequently
const { data: tenants } = useQuery(['tenants'], fetchTenants, {
  staleTime: 10 * 60 * 1000 // 10 minutes
});
```

#### **Enterprise Platform (1000+ tenants)**
```typescript
// ✅ Redis + TanStack Query - Queried frequently, expensive to fetch
// Server-side (API):
const tenants = await cache.get('tenant:list:active', {
  ttl: 300, // 5 minutes
  fallback: async () => {
    return await db.tenant.findMany({
      where: { isActive: true },
      include: { subscription: true, _count: { select: { users: true } } }
      // Complex query with joins
    });
  }
});

// Client-side (still use TanStack Query):
const { data: tenants } = useQuery(['tenants'], fetchTenants, {
  staleTime: 2 * 60 * 1000 // 2 minutes client cache
});
```

### **User Permissions**

#### **Simple Permissions**
```typescript
// ✅ TanStack Query - User-specific, simple lookup
const { data: permissions } = useQuery(['user-permissions'], fetchUserPermissions, {
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

#### **Complex RBAC with Inheritance**
```typescript
// ✅ Redis - Expensive calculation, security-critical
const permissions = await cache.get(`tenant:${tenantId}:user:${userId}:permissions`, {
  ttl: 300,
  fallback: async () => {
    // Complex permission inheritance calculation
    return await calculateUserPermissions(tenantId, userId);
  }
});
```

## 🏗️ **Hybrid Architecture Pattern**

### **Recommended Approach:**
```typescript
// API Layer: Redis for expensive/shared data
app.get('/api/analytics/dashboard', async (req, res) => {
  const analytics = await cache.get(`tenant:${req.tenantId}:analytics:dashboard`, {
    ttl: 1800, // 30 minutes
    fallback: async () => {
      // Expensive analytics calculation
      return await calculateDashboardAnalytics(req.tenantId);
    }
  });
  
  res.json(analytics);
});

// Frontend: TanStack Query for client-side caching
const { data: analytics } = useQuery(['dashboard-analytics'], fetchDashboardAnalytics, {
  staleTime: 5 * 60 * 1000 // 5 minutes client cache
});
```

## 📋 **Decision Framework Checklist**

### **Use Redis When:**
- [ ] Queried >50 times per minute across all users
- [ ] Computation takes >1 second
- [ ] Data is shared across multiple users
- [ ] Real-time freshness is critical
- [ ] Complex joins or calculations involved
- [ ] Session/temporary data with TTL

### **Use TanStack Query When:**
- [ ] User-specific personal data
- [ ] Simple database queries (<1 second)
- [ ] Data changes infrequently
- [ ] Acceptable to be stale for 1-5 minutes
- [ ] Small to medium datasets (<1000 items)
- [ ] Reference/lookup data

### **Use Both (Hybrid) When:**
- [ ] Expensive calculations shared across users (Redis)
- [ ] Client needs additional local caching (TanStack Query)
- [ ] High-frequency access patterns
- [ ] Complex enterprise scenarios

## ⚠️ **Anti-Patterns to Avoid**

### **❌ Don't Use Redis For:**
```typescript
// ❌ BAD: Pre-populating with static data
redis.set('platform:roles:all', JSON.stringify(roles)); // Use TanStack Query

// ❌ BAD: User-specific data rarely accessed
redis.set(`user:${userId}:preferences`, data); // Use TanStack Query

// ❌ BAD: Large datasets that change frequently
redis.set('platform:all:transactions', largeArray); // Use database + pagination
```

### **❌ Don't Use TanStack Query For:**
```typescript
// ❌ BAD: Session data (belongs in Redis)
const { data: session } = useQuery(['session'], fetchSession); // Use Redis

// ❌ BAD: Real-time data that must be fresh
const { data: subscriptionStatus } = useQuery(['subscription'], fetchStatus, {
  staleTime: 0 // Use Redis instead
});
```

## 🔧 **Implementation Guidelines**

### **Redis Cache Keys**
```typescript
// Follow itellico Mono naming conventions
const cacheKey = CacheKeyBuilder.tenant(tenantId, 'analytics', 'dashboard');
// Result: tenant:550e8400-...:analytics:dashboard
```

### **TanStack Query Keys**
```typescript
// Use consistent, hierarchical key structure
const queryKey = ['tenant', tenantId, 'users', { filter, sort }];
```

### **Cache Invalidation**
```typescript
// Redis: Use tags for coordinated invalidation
await cache.invalidateByTag('permissions');

// TanStack Query: Use queryClient for fine-grained control
queryClient.invalidateQueries(['tenant', tenantId, 'users']);
```

## 📊 **Performance Monitoring**

### **Metrics to Track:**
- Redis hit/miss ratios
- TanStack Query cache efficiency
- API response times
- Database query frequency
- Cache invalidation patterns

### **Optimization Triggers:**
- Redis hit ratio <80%
- API response time >500ms
- Database queries >100/minute for same data
- Frequent cache invalidations

## 🎯 **Summary**

**Golden Rule**: Start with TanStack Query for everything. Move to Redis only when you have **measured performance problems** or **specific requirements** (sessions, rate limiting, real-time data).

**Data Flow**: Database → Redis (when needed) → API → TanStack Query → UI

**Avoid**: Pre-populating caches, duplicating data unnecessarily, over-engineering simple use cases.

Follow this strategy to build a performant, maintainable caching layer that scales with your application needs.