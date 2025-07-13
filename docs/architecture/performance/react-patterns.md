---
title: React Performance Patterns
category: architecture
tags:
  - react
  - performance
  - optimization
  - hooks
  - memo
priority: high
lastUpdated: '2025-07-06'
---

# React Performance Patterns

## Overview

React performance best practices and optimization patterns for itellico Mono with real-world examples and debugging techniques.

## Common Performance Issues

### 1. Missing Dependency Arrays
**Problem**: Effects run on every render without dependency array
**Solution**: Always include proper dependency arrays in useEffect

### 2. Recreating Objects/Functions on Every Render
**Problem**: New objects/functions created on each render cause child re-renders
**Solution**: Use useMemo for objects, useCallback for functions

### 3. Context Provider Re-renders
**Problem**: Context value recreation causes all consumers to re-render
**Solution**: Memoize context values with useMemo

**Examples**: See performance anti-patterns in `src/components/dev/AuthMonitor.tsx`

## useEffect Best Practices

### Always Include Dependencies
Only run effects when specific values change, not on every render.

### Use Effect Cleanup
Prevent memory leaks with proper cleanup functions for subscriptions and timers.

### Avoid Async Functions Directly
Use async functions inside useEffect, not as the effect callback itself.

**Implementation**: See `src/hooks/useAuditTracking.ts` for proper patterns

## Component Optimization with React.memo

### When to Use React.memo
- Components that render frequently
- Components with expensive render logic  
- Components that receive same props often

### When NOT to Use React.memo
- Components that rarely re-render
- Components with simple render logic
- Components that always receive different props

### Custom Comparison Functions
For complex props that need custom equality checks.

**Examples**: See optimized components in `src/components/admin/`

## Context Provider Optimization

### Split Contexts by Update Frequency
Separate frequently changing data from stable data into different contexts.

**Anti-pattern**: Single context with mixed update frequencies
**Solution**: Separate AuthContext, ThemeContext, RealtimeContext

### Use Context Selectors Pattern
Custom hooks with selector functions to prevent unnecessary re-renders.

**Implementation**: See `src/lib/auth/client.ts` for auth context patterns

## Debugging Tools

### AuthMonitor Component
Development tool for tracking authentication-related renders and API calls with proper dependency arrays.

**Location**: `src/components/dev/AuthMonitor.tsx`

### React DevTools Profiler
Use for identifying frequent renders, measuring duration, and finding bottlenecks.

### Custom Performance Hooks
Debugging hooks for logging render reasons and tracking performance.

**Utilities**: See `src/lib/debug/` for performance debugging tools

## Real-World Case Studies

### Case Study 1: AuthMonitor Excessive Renders
**Problem**: AuthMonitor rendering 10+ times rapidly
**Root Cause**: Missing dependency array caused infinite render loop
**Solution**: Added proper dependencies `[loading, user?.email]`
**Result**: Reduced renders from 10+ to 2-3

### Case Study 2: Admin Sidebar Performance
**Problem**: Sidebar re-rendering on every route change
**Solution**: Memoized permission checks, menu items, and menu components
**Result**: Eliminated unnecessary re-renders

### Case Study 3: Table with 1000+ Rows
**Problem**: Filtering/sorting caused full re-render
**Solution**: Virtualization, memoized data processing, memoized row renderer
**Result**: Smooth performance with large datasets

**Detailed Examples**: See case studies in performance documentation

## Performance Checklist

Before deploying features:
- All useEffect hooks have dependency arrays
- Context values are memoized appropriately
- Expensive components use React.memo
- Lists have stable keys
- Event handlers use useCallback when passed as props
- Complex calculations use useMemo
- No inline object/array creation in render
- Large lists use virtualization
- Images are optimized and lazy-loaded
- API calls are debounced/throttled

## Monitoring Performance

### Component Render Tracking
Track render times and warn for slow components (\\\&gt;16ms).

### Web Vitals Monitoring
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

### Bundle Size Analysis
Use dynamic imports, tree-shaking, and bundle analysis tools.

**Monitoring Setup**: See `src/lib/monitoring/performance-metrics.ts`

## Key Principles

**Performance optimization is ongoing**: Use patterns as guidelines, measure actual impact
**Not every component needs optimization**: Focus on frequently rendering or expensive components
**Premature optimization is harmful**: But necessary optimization improves user experience

Remember: Measure first, optimize based on data, not assumptions.