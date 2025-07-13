---
title: Storage Strategy & Best Practices
category: architecture
tags:
  - storage
  - zustand
  - tanstack-query
  - redis
  - authentication
  - security
priority: high
lastUpdated: '2025-07-06'
---

# Storage Strategy & Best Practices

## Overview

Definitive storage strategy for itellico Mono establishing clear boundaries between storage layers and best practices for data placement, caching, and state management.

## Storage Architecture

### The Five Storage Layers

1. **Zustand** - Client-side UI state and preferences
2. **TanStack Query** - Server state cache with intelligent sync
3. **Redis** - Distributed application cache 
4. **HTTP-Only Cookies** - Secure authentication storage
5. **PostgreSQL** - Source of truth for persistent data

### Data Flow
User Interaction → Data Type Decision → Appropriate Storage Layer → Fallback Chain

**Architecture Diagram**: See complete data flow in storage documentation

## Storage Layer Definitions

### 1. Zustand (Client-side UI State)
**Purpose**: Temporary UI state and user preferences for UX enhancement
**Characteristics**: Fast, reactive, browser-specific, non-critical data

### 2. TanStack Query (Server State Cache)
**Purpose**: Server data caching with intelligent synchronization
**Characteristics**: Background sync, optimistic updates, request deduplication

### 3. Redis (Distributed Application Cache)
**Purpose**: Fast access to frequently used server data
**Characteristics**: Shared across instances, tenant-isolated, TTL-managed

### 4. HTTP-Only Cookies (Secure Authentication)
**Purpose**: Secure token storage and session management
**Characteristics**: XSS-resistant, server-accessible, automatic transmission

### 5. PostgreSQL (Source of Truth)
**Purpose**: Persistent, consistent, ACID-compliant data storage
**Characteristics**: Transactional, relational, audit-logged

## Authentication & Security Storage

### User Permissions & RBAC

#### ✅ Store in Redis (Server-side cache)
Cache user permissions for 5 minutes with tenant isolation and automatic TTL.

**Why Redis?**
- Shared across server instances
- Fast permission checks (&lt;5ms)
- Automatic TTL prevents stale permissions
- Tenant-isolated keys
- Survives server restarts

#### ❌ DON'T store in:
- **Zustand**: Client-side = security risk, can be manipulated
- **localStorage**: Accessible via XSS, not secure
- **TanStack Query**: Permission checks happen server-side
- **Cookies**: Too large, sent with every request

### Authentication Tokens

#### ✅ Store in HTTP-Only Cookies
Secure token storage with XSS protection and automatic transmission.

**Why HTTP-Only Cookies?**
- XSS resistant (JavaScript cannot access)
- Automatic transmission with requests
- Built-in expiry handling
- Server-controlled

#### ❌ DON'T store in:
- **localStorage**: Vulnerable to XSS attacks
- **Zustand**: Persists to localStorage = security risk
- **sessionStorage**: Lost on tab close
- **Memory**: Lost on page refresh

### Session Data

#### ✅ Hybrid Approach: Redis + Lean Cookies
Store minimal session in cookie (&lt;1KB), full session data in Redis with 15-minute TTL.

**Why Hybrid?**
- Cookies stay small (faster requests)
- Sensitive data in secure Redis
- Scalable across multiple servers
- Easy session management

**Implementation**: See `src/lib/services/auth.service.ts`

## UI State Management

### What Goes in Zustand

#### ✅ Store in Zustand:
- **Visual preferences**: theme, sidebar state, view modes
- **Modal states**: dialog visibility, tooltip states
- **Form states**: search queries, filters, selections
- **Navigation state**: breadcrumbs, current page
- **Developer tools**: debug panels, operational modes

**Why Zustand for these?**
- Instant UI responsiveness
- Persists user preferences across sessions
- No network requests needed
- Component-level optimization with selectors
- User-specific, not security-sensitive

#### ❌ DON'T store in Zustand:
- **Server data**: users, profiles, tenant settings (use TanStack Query)
- **Authentication data**: current user, permissions, tokens (use auth system)
- **Large datasets**: search results, analytics (use proper caching)
- **Sensitive business data**: financial, personal information

### Best Practices for Zustand
- Use selectors for performance optimization
- Partition state appropriately with persist configuration
- Use version control for breaking changes
- Only persist preferences, not temporary state

**Implementation**: See `src/stores/ui/` for UI state patterns

## Server State Management

### TanStack Query Configuration

#### ✅ Optimal Configuration:
- 5-minute stale time for balanced freshness/performance
- 10-minute garbage collection for memory management
- Smart retry logic excluding client errors (4xx)
- Efficient refetch strategies

### What to Cache in TanStack Query

#### Long-lived data (infrequent changes)
User data with 5-minute stale time and tenant-specific query keys.

#### Real-time data (frequent updates)
Notifications with 30-second stale time and polling every minute.

#### Static/reference data (rarely changes)
Permissions and configuration with 30-minute stale time.

### Optimistic Updates Pattern
Immediate UI feedback with graceful error handling and automatic rollback on failure.

**Implementation**: See `src/hooks/use*.ts` for query patterns

## Redis Caching Strategy

### What to Cache in Redis

#### ✅ High-Value Cache Targets:
- **User permissions**: Security-critical, frequently accessed (5 min TTL)
- **Search results**: Expensive to compute (5 min TTL)
- **Computed analytics**: Expensive aggregations (1 hour TTL)
- **API responses**: Reduce database load (5 min TTL)
- **Session data**: Fast session lookup (15 min TTL)
- **International data**: Countries, timezones, currencies (24 hour TTL)
- **User preferences**: Timezone, locale settings (30 min TTL)

#### ❌ Don't Cache in Redis:
- Large binary data (use object storage)
- Frequently changing data (cache thrashing)
- Rarely accessed data (waste of memory)
- Data requiring perfect consistency

### Redis Key Naming Strategy
Consistent hierarchical naming following tenant isolation patterns.

**Implementation**: See `src/lib/cache/redis-utils.ts` and `/docs/redis-cache-hierarchy.md`

### Cache Invalidation Patterns
Coordinated invalidation across all layers: Next.js cache, Redis cache, and client notifications.

**Service**: See `src/lib/services/cache-invalidation.service.ts`

## Storage Decision Matrix

| Data Type | Zustand | TanStack Query | Redis | Cookies | Database |
|-----------|---------|----------------|-------|---------|----------|
| **UI Preferences** | ✅ Primary | ❌ No | ❌ No | ❌ No | ❌ No |
| **Auth Tokens** | ❌ Security Risk | ❌ No | ❌ No | ✅ Primary | ❌ No |
| **User Permissions** | ❌ Security Risk | ❌ Server-side | ✅ Primary | ❌ Too large | ✅ Source |
| **User Lists** | ❌ Server data | ✅ Primary | ✅ L2 Cache | ❌ No | ✅ Source |
| **Search Results** | ❌ Server data | ✅ Primary | ✅ L2 Cache | ❌ No | ✅ Source |

**Legend**: ✅ Primary = Best choice, ✅ L2 Cache = Secondary cache, ✅ Source = Source of truth

## Implementation Guidelines

### 1. Authentication Storage Implementation
Secure authentication storage with HTTP-only cookies for tokens, Redis for permissions, and session management.

### 2. UI State Management Implementation  
Zustand for UI state only with proper persistence partitioning and version control.

### 3. Server State Management Implementation
TanStack Query for server state with appropriate caching strategies and optimistic updates.

### 4. Redis Caching Implementation
Strategic Redis caching with proper TTL management, error handling, and cache invalidation.

**Implementation Examples**: See service layer implementations in `src/lib/services/`

## Migration Recommendations

### Current Issues to Address

#### 1. NextAuth Migration (High Priority)
Complete NextAuth removal and fix runtime errors in layout.tsx and PermissionInspector component.

#### 2. Permission Storage Consistency
Standardize permission checking with server-side verification and Redis caching.

#### 3. Storage Layer Cleanup
Audit existing stores for inappropriate data storage and migrate server data to TanStack Query.

### Implementation Timeline

#### Phase 1: Security Critical (Week 1)
- Complete NextAuth removal
- Move authentication tokens to HTTP-only cookies
- Implement Redis-based permission caching
- Fix PermissionInspector component

#### Phase 2: Data Migration (Week 2)
- Audit Zustand stores for server data
- Migrate server data to TanStack Query
- Implement proper cache invalidation
- Add security middleware validation

#### Phase 3: Optimization (Week 3)
- Implement three-layer caching strategy
- Add performance monitoring
- Optimize cache TTL values
- Add cache debugging tools

#### Phase 4: Documentation & Testing (Week 4)
- Update documentation
- Create developer guidelines
- Add automated tests for storage patterns
- Performance benchmarking

## Best Practices Summary

### ✅ Do This:
1. **Authentication & Security**: HTTP-only cookies for tokens, Redis for permissions, lean sessions
2. **UI State Management**: Zustand for UI state only, persist preferences not temporary data
3. **Server State Management**: TanStack Query for all server data with proper cache keys
4. **Redis Caching**: Cache frequently accessed data with appropriate TTLs and tenant isolation
5. **General Principles**: Consider security implications, design for multi-tenant isolation

### ❌ Don't Do This:
1. **Security Anti-patterns**: Never store tokens in localStorage, never cache permissions client-side
2. **State Management Anti-patterns**: Don't put server data in Zustand, don't mix UI with server state
3. **Caching Anti-patterns**: Don't cache without tenant isolation, don't skip cache invalidation
4. **Performance Anti-patterns**: Don't refetch unnecessarily, don't ignore memory management

## Monitoring & Metrics

### Key Performance Indicators
- Redis cache hit rate: &gt;90%
- TanStack Query cache hit rate: &gt;85%
- Authentication latency: &lt;100ms
- Permission check latency: &lt;5ms

### Health Checks
Regular monitoring of Redis health, Zustand persistence, and authentication cookies.

**Monitoring Setup**: See `src/lib/monitoring/storage-metrics.ts`

This comprehensive storage strategy ensures optimal user experience and system reliability while maintaining security and performance across the itellico Mono platform.