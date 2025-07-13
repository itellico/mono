---
title: Three-Layer Caching Strategy
category: architecture
tags:
  - caching
  - performance
  - redis
  - nextjs
  - tanstack-query
  - architecture
priority: high
lastUpdated: '2025-07-06'
---

# Three-Layer Caching Strategy

## Overview

Sophisticated three-layer caching strategy ensuring optimal performance while maintaining data consistency across all tenant operations.

## Architecture

### The Three Layers
1. **Next.js `unstable_cache`** - React Server Components caching (fastest)
2. **Redis** - Application-level distributed caching (fast)
3. **TanStack Query** - Client-side state management (fallback)

### Cache Flow
User Request → Next.js Cache → Redis Cache → TanStack Query → Database

**Implementation**: See `src/lib/cache/` for all caching services

## Critical Rules

From `CLAUDE.md`:
- ALWAYS implement all three caching layers
- ALL layers must invalidate together on mutations
- NEVER use Zustand for server state
- ALWAYS use service layer pattern with Redis

### Tenant Isolation
Every cache key MUST include `tenantId`:
```
cache:${tenantId}:users:list:${hash}
```

## Layer 1: Next.js `unstable_cache`

### Purpose
- React Server Components caching
- Request-level deduplication
- Automatic cache tag invalidation
- Fastest layer (in-memory)

### Key Features
- Descriptive cache keys with tenant isolation
- Appropriate TTL settings (5min for user data)
- Tag-based invalidation system

**Implementation**: See `src/lib/services/*.service.ts`

## Layer 2: Redis Application Cache

### Purpose
- Distributed caching across instances
- Service layer caching with tenant isolation
- Complex data structures and computed results
- Session and temporary data storage

### Redis Connection
Configuration with retry logic, offline queue disabled, and connection pooling.

**Setup**: See `src/lib/redis.ts`

### Service Layer Pattern
Tenant-isolated cache key generation, Redis hit/miss handling, graceful error handling, and automatic cache warming.

**Services**: See `src/lib/services/users.service.ts`

### Key Naming Conventions

From `/docs/redis-cache-hierarchy.md`:

#### Entity Caching
```
cache:${tenantId}:users:list:${filtersHash}
cache:${tenantId}:user:${userId}
cache:${tenantId}:search:users:${queryHash}
```

#### Analytics & Reports
```
cache:${tenantId}:analytics:dashboard:${dateRange}
cache:${tenantId}:reports:users:${reportType}
```

#### Global Reference Data
```
cache:global:countries:${locale}
cache:global:timezones
cache:global:currencies:${locale}
```

#### User Preferences
```
cache:${tenantId}:user:${userId}:intl-prefs
cache:${tenantId}:user:${userId}:timezone
```

#### Sessions & Temporary
```
session:${sessionId}
temp:${tenantId}:upload:${uploadId}
lock:${tenantId}:${entityType}:${entityId}
```

### Performance Optimization
- Redis pipeline for batch operations
- Redis sets for cache key tracking
- Efficient category-based invalidation

**Utilities**: See `src/lib/cache/redis-utils.ts`

## Layer 3: TanStack Query Client-Side

### Purpose
- Client-side state management and caching
- Optimistic updates and background refetching
- Request deduplication and error handling
- Real-time data synchronization

### Query Client Setup
5-minute stale time, 10-minute garbage collection, intelligent retry logic, and mutation configuration.

**Setup**: See `src/lib/query-client.ts`

### Query Hook Patterns
- Query key factories for consistency
- Proper tenant isolation in keys
- Optimistic updates with rollback
- Coordinated cache invalidation

**Hooks**: See `src/hooks/useUsers.ts`

### Zustand Integration (UI State Only)
Strict separation: Zustand for UI state, TanStack Query for server state.

**Store**: See `src/stores/ui-store.ts`

## International Data Caching

### Reference Data (24-hour TTL)
- Countries with extended metadata
- Timezones for countries
- Currencies and languages
- Phone formatting data

### User Preferences (30-minute TTL)
- International preferences per user
- Timezone and locale settings
- Personal formatting preferences

**Implementation**: See `src/lib/services/international-cache.service.ts`

### Performance Optimization
Critical data preloading on app start, common countries prioritized, and background cache warming.

## Cache Invalidation

### Coordinated Invalidation Pattern
Invalidate all three layers simultaneously:
1. Next.js cache tags
2. Redis pattern matching
3. TanStack Query predicates

**Service**: See `src/lib/services/cache-invalidation.service.ts`

### Client-Side Invalidation
Server-Sent Events or WebSocket notifications for real-time cache invalidation across all connected clients.

**Implementation**: See `src/components/shared/CacheInvalidationListener.tsx`

## Performance Monitoring

### Cache Metrics
- Hit/miss rates per layer
- Response time tracking
- Memory usage monitoring
- Cache size analytics

**Monitoring**: See `src/lib/monitoring/cache-metrics.ts`

### Health Dashboard
Real-time cache performance visualization with layer-specific metrics and alerts.

**Dashboard**: See `src/app/admin/cache/dashboard/page.tsx`

## Debugging & Troubleshooting

### Debug Tools
- Cache key analysis
- Pattern-based key finding
- Tenant cache size analysis
- Performance profiling

**Debug**: See `src/lib/debug/cache-debug.ts`

### Common Issues

#### Cache Stampede
Redis-based locking to prevent simultaneous cache rebuilds.

#### Memory Leaks
Proper garbage collection and periodic cleanup strategies.

#### Stale Data
Coordinated invalidation patterns ensuring data consistency.

**Solutions**: See troubleshooting documentation in each service

## Implementation Checklist

### Setup Phase
- Configure Redis with proper settings
- Implement Next.js unstable_cache in services
- Initialize TanStack Query with defaults
- Create cache key utilities
- Base service classes with caching

### Development Phase
- Cache invalidation service
- Monitoring and metrics
- Debug tools
- Health dashboard
- Performance hooks

### Testing Phase
- Unit tests for cache functions
- Invalidation scenario testing
- Tenant isolation verification
- Load testing
- Failure scenario testing

### Production Phase
- Redis clustering for HA
- Monitoring alerts
- Cache warming strategies
- Backup procedures
- Hit rate optimization

## Performance Targets

### Cache Hit Rates
- Next.js Cache: 85%+
- Redis Cache: 90%+
- TanStack Query: 95%+

### Response Times
- Next.js Cache: \\\\&lt;1ms
- Redis Cache: \\\\&lt;5ms
- TanStack Query: \\\\&lt;0.1ms
- Database Fallback: \\\\&lt;50ms

### Cache Efficiency
- Memory Usage: \\\\&lt;500MB Redis per 10K users
- Cache Size: \\\&lt;1KB average per item
- TTL Effectiveness: \\&lt;5% expired access
- Invalidation Speed: \\\&lt;10ms clearing