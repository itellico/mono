'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { browserLogger } from '@/lib/browser-logger';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ Platform Standards: 5 minute stale time, 10 minute garbage collection
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes 
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
            // ✅ Log all mutations for debugging
            onError: (error, variables, context) => {
              browserLogger.error('Mutation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                variables,
                context
              });
            },
            onSuccess: (data, variables, context) => {
              browserLogger.info('Mutation succeeded', {
                variables,
                context
              });
            }
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* ✅ Development tools in development mode only */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
} 