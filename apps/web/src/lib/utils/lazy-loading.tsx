
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Creates a lazy-loaded component with a loading skeleton
 */
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <Skeleton className="h-64 w-full" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Creates a lazy-loaded page component
 */
export function createLazyPage<T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  return createLazyComponent(importFn, (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  ));
}
