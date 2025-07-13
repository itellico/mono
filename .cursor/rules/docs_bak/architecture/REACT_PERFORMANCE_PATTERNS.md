# React Performance Patterns for itellico Mono

This guide documents React performance best practices and common optimization patterns used throughout the itellico Mono. It includes real-world examples and debugging techniques to help developers maintain optimal application performance.

## Table of Contents

1. [Common Performance Issues](#common-performance-issues)
2. [useEffect Best Practices](#useeffect-best-practices)
3. [Component Optimization with React.memo](#component-optimization-with-reactmemo)
4. [Context Provider Optimization](#context-provider-optimization)
5. [Debugging Tools](#debugging-tools)
6. [Real-World Case Studies](#real-world-case-studies)

## Common Performance Issues

### 1. Missing Dependency Arrays

**❌ Problem:**
```typescript
useEffect(() => {
  // This runs after EVERY render!
  doSomething();
}); // ← Missing dependency array
```

**✅ Solution:**
```typescript
useEffect(() => {
  // Only runs when dependencies change
  doSomething();
}, [dependency1, dependency2]); // ← Proper dependencies
```

### 2. Recreating Objects/Functions on Every Render

**❌ Problem:**
```typescript
function MyComponent() {
  // New object created every render
  const config = { api: '/api/v1', timeout: 5000 };
  
  // New function created every render
  const handleClick = () => console.log('clicked');
  
  return <ChildComponent config={config} onClick={handleClick} />;
}
```

**✅ Solution:**
```typescript
function MyComponent() {
  // Memoized object
  const config = useMemo(() => ({ 
    api: '/api/v1', 
    timeout: 5000 
  }), []);
  
  // Memoized callback
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return <ChildComponent config={config} onClick={handleClick} />;
}
```

### 3. Context Provider Re-renders

**❌ Problem:**
```typescript
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New object every render = all consumers re-render
  const value = { user, setUser, loading, setLoading };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

**✅ Solution:**
```typescript
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Memoized context value
  const value = useMemo(() => ({ 
    user, 
    setUser, 
    loading, 
    setLoading 
  }), [user, loading]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

## useEffect Best Practices

### 1. Always Include Dependencies

```typescript
// ✅ Good: Effect only runs when user.id changes
useEffect(() => {
  if (user?.id) {
    fetchUserPreferences(user.id);
  }
}, [user?.id]);

// ❌ Bad: Effect runs on every render
useEffect(() => {
  if (user?.id) {
    fetchUserPreferences(user.id);
  }
});
```

### 2. Use Effect Cleanup

```typescript
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  // ✅ Cleanup function prevents memory leaks
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 3. Avoid Async Functions Directly in useEffect

```typescript
// ❌ Bad: Can't use async directly
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);

// ✅ Good: Use async function inside effect
useEffect(() => {
  const loadData = async () => {
    const data = await fetchData();
    setData(data);
  };
  
  loadData();
}, []);
```

## Component Optimization with React.memo

### When to Use React.memo

```typescript
// ✅ Good candidate for React.memo:
// - Renders frequently
// - Has expensive render logic
// - Receives same props often
export const ExpensiveList = memo(function ExpensiveList({ items, onItemClick }) {
  console.log('ExpensiveList render');
  
  return (
    <div>
      {items.map(item => (
        <ExpensiveItem key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
});

// Custom comparison function for complex props
export const ComplexComponent = memo(
  function ComplexComponent({ data, config }) {
    // Component logic
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return (
      prevProps.data.id === nextProps.data.id &&
      prevProps.config.version === nextProps.config.version
    );
  }
);
```

### When NOT to Use React.memo

```typescript
// ❌ Don't memo components that:
// - Rarely re-render
// - Have simple render logic
// - Always receive different props

// This is overkill:
export const SimpleButton = memo(({ onClick, label }) => (
  <button onClick={onClick}>{label}</button>
));
```

## Context Provider Optimization

### 1. Split Contexts by Update Frequency

```typescript
// ❌ Bad: Combines frequently and rarely changing data
const AppContext = createContext({
  user: null,          // Rarely changes
  theme: 'light',      // Rarely changes  
  notifications: [],   // Changes frequently
  wsStatus: 'disconnected' // Changes frequently
});

// ✅ Good: Separate contexts
const AuthContext = createContext({ user: null });
const ThemeContext = createContext({ theme: 'light' });
const RealtimeContext = createContext({ 
  notifications: [], 
  wsStatus: 'disconnected' 
});
```

### 2. Use Context Selectors Pattern

```typescript
// Custom hook with selector pattern
function useAuthContext<T>(selector: (state: AuthState) => T) {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  
  return useMemo(() => selector(context), [context, selector]);
}

// Usage - only re-renders when selected value changes
function UserAvatar() {
  const avatarUrl = useAuthContext(state => state.user?.avatarUrl);
  return <img src={avatarUrl} alt="User" />;
}
```

## Debugging Tools

### 1. AuthMonitor Component

The AuthMonitor is a development tool that tracks authentication-related renders and API calls:

```typescript
export const AuthMonitor = memo(function AuthMonitor() {
  const { user, loading } = useAuth();
  const callsRef = useRef<AuthCall[]>([]);
  const renderCountRef = useRef(0);

  // Track renders only when auth state changes
  useEffect(() => {
    renderCountRef.current++;
    
    const call: AuthCall = {
      timestamp: new Date().toISOString(),
      source: 'AuthMonitor',
      type: `Render #${renderCountRef.current}`,
      stackTrace: new Error().stack,
    };
    
    callsRef.current.push(call);
    console.group(`[AuthMonitor] Render #${renderCountRef.current}`);
    console.log('Loading:', loading);
    console.log('User:', user?.email || 'null');
    console.groupEnd();
  }, [loading, user?.email]); // ← Critical: dependency array!

  // ... rest of component
});
```

### 2. React DevTools Profiler

Use the React DevTools Profiler to:
- Identify components that render frequently
- Measure render duration
- Find performance bottlenecks

### 3. Custom Performance Hooks

```typescript
// Hook to log render reasons
function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, any> = {};
      
      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}
```

## Real-World Case Studies

### Case Study 1: AuthMonitor Excessive Renders

**Problem:** AuthMonitor was rendering 10+ times in rapid succession.

**Root Cause:** Missing dependency array in useEffect caused it to run after every render.

```typescript
// ❌ Before: Effect runs on every render
useEffect(() => {
  renderCountRef.current++;
  logRender();
}); // No dependency array!

// ✅ After: Effect only runs when auth state changes
useEffect(() => {
  renderCountRef.current++;
  logRender();
}, [loading, user?.email]);
```

**Result:** Reduced renders from 10+ to 2-3 (initial mount + auth state change).

### Case Study 2: Admin Sidebar Performance

**Problem:** Admin sidebar re-rendering on every route change.

**Solution:**
```typescript
// 1. Memoize permission checks
const hasPermission = useMemo(() => {
  return checkUserPermissions(user, requiredPermissions);
}, [user?.permissions, requiredPermissions]);

// 2. Memoize menu items
const menuItems = useMemo(() => {
  return generateMenuItems(user, permissions);
}, [user?.id, permissions]);

// 3. Use React.memo for menu components
const MenuItem = memo(({ item, isActive }) => {
  // Component logic
});
```

### Case Study 3: Table with 1000+ Rows

**Problem:** Filtering/sorting caused full re-render of all rows.

**Solution:**
```typescript
// 1. Virtualize the list
import { FixedSizeList } from 'react-window';

// 2. Memoize filtered/sorted data
const processedData = useMemo(() => {
  let result = [...data];
  if (filter) result = result.filter(filterFn);
  if (sortBy) result.sort(sortFn);
  return result;
}, [data, filter, sortBy]);

// 3. Memoize row renderer
const Row = memo(({ index, style, data }) => {
  const item = data[index];
  return <div style={style}>{/* row content */}</div>;
});
```

## Performance Checklist

Before deploying a feature, verify:

- [ ] All useEffect hooks have dependency arrays
- [ ] Context values are memoized when appropriate
- [ ] Expensive components use React.memo
- [ ] Lists have stable keys
- [ ] Event handlers use useCallback when passed as props
- [ ] Complex calculations use useMemo
- [ ] No inline object/array creation in render
- [ ] Large lists use virtualization
- [ ] Images are optimized and lazy-loaded
- [ ] API calls are debounced/throttled where appropriate

## Monitoring Performance in Production

1. **Use Performance Monitoring**
   ```typescript
   // Track component render time
   const startTime = performance.now();
   // ... component logic
   const renderTime = performance.now() - startTime;
   
   if (renderTime > 16) { // More than one frame
     console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
   }
   ```

2. **Track Web Vitals**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Cumulative Layout Shift (CLS)

3. **Monitor Bundle Size**
   - Use dynamic imports for large components
   - Tree-shake unused code
   - Analyze bundle with webpack-bundle-analyzer

## Conclusion

Performance optimization is an ongoing process. Use these patterns as guidelines, but always measure the actual impact of optimizations. Not every component needs to be optimized - focus on the components that render frequently or have expensive render logic.

Remember: **Premature optimization is the root of all evil**, but **necessary optimization is the key to great user experience**.