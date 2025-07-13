'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { 
  useOptionSets, 
  useInfiniteOptionSets,
  useCreateOptionSet,
  useUpdateOptionSet,
  useDeleteOptionSet,
  usePrefetchOptionSet,
  useOptionSetSync,
  optionSetsKeys
} from '@/hooks/use-option-sets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, RefreshCw } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  browserLogger.error('Component error boundary triggered', { error });

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{error.message}</p>
        <Button onClick={resetErrorBoundary} variant="outline">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

// Loading skeleton component
function OptionSetSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// Individual option set component with prefetching
function OptionSetCard({ 
  optionSet, 
  onEdit, 
  onDelete 
}: {
  optionSet: any;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const prefetchOptionSet = usePrefetchOptionSet();

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onMouseEnter={() => {
        // Prefetch details on hover (best practice)
        prefetchOptionSet(optionSet.id, optionSet.tenantId);
      }}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{optionSet.label}</h3>
          <Badge variant="secondary">{optionSet.slug}</Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Tenant: {optionSet.tenantId || 'Global'}
        </p>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(optionSet.id)}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onDelete(optionSet.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component demonstrating all patterns
function ModernOptionSetsExample() {
  const [search, setSearch] = React.useState('');
  const [tenantId, setTenantId] = React.useState<number | null>(null);
  const [newOptionSet, setNewOptionSet] = React.useState({
    slug: '',
    label: '',
  });

  const queryClient = useQueryClient();
  const sync = useOptionSetSync();

  // 1. Basic query with caching
  const { 
    data: optionSets, 
    isLoading, 
    error,
    isStale,
    dataUpdatedAt 
  } = useOptionSets(
    { tenantId, search: search || undefined, limit: 10 },
    {
      // Advanced configurations
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 2 * 60 * 1000, // Override default
      select: (data) => {
        // Transform data if needed
        browserLogger.info('Data selected from cache', { count: data?.length });
        return data;
      },
    }
  );

  // 2. Infinite query for large datasets
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOptionSets({ tenantId, limit: 5 });

  // 3. Mutations with optimistic updates
  const createMutation = useCreateOptionSet({
    onMutate: () => {
      browserLogger.info('Creating option set (optimistic)');
    },
    onError: (error) => {
      browserLogger.error('Failed to create option set', { error });
    },
    onSuccess: () => {
      setNewOptionSet({ slug: '', label: '' });
    },
  });

  const updateMutation = useUpdateOptionSet();
  const deleteMutation = useDeleteOptionSet();

  // 4. Manual cache management
  const handleManualCacheUpdate = () => {
    queryClient.setQueryData(
      optionSetsKeys.list({ tenantId, search }),
      (old: any[] = []) => [
        {
          id: Date.now(),
          slug: 'manual-cache',
          label: 'Manually Added',
          tenantId,
          createdAt: new Date().toISOString(),
        },
        ...old,
      ]
    );
  };

  // 5. Background sync
  const handleSync = () => {
    sync.syncAll();
    browserLogger.info('Background sync initiated');
  };

  // 6. Cache debugging
  const debugCache = () => {
    const cacheData = queryClient.getQueryCache().findAll();
    browserLogger.info('Current cache state', { 
      queries: cacheData.length,
      optionSetQueries: cacheData.filter(q => 
        q.queryKey[0] === 'option-sets'
      ).length
    });
  };

  const handleCreate = () => {
    if (!newOptionSet.slug || !newOptionSet.label) return;

    createMutation.mutate({
      ...newOptionSet,
      tenantId,
    });
  };

  const handleEdit = (id: number) => {
    updateMutation.mutate({
      id,
      data: { label: `Updated ${Date.now()}` },
      tenantId,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id, tenantId });
  };

  if (error) {
    throw error; // Let ErrorBoundary handle it
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Modern Redis + TanStack Query Integration
        </h1>
        <p className="text-gray-600">
          Demonstrating industry best practices for caching with Next.js 15 + React 19
        </p>
      </div>

      {/* Cache Status Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Cache Status & Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium">Data Status</p>
              <Badge variant={isStale ? "secondary" : "default"}>
                {isStale ? "Stale" : "Fresh"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-gray-600">
                {new Date(dataUpdatedAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Cache Actions</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSync}>
                  Sync
                </Button>
                <Button size="sm" variant="outline" onClick={debugCache}>
                  Debug
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Manual Cache</p>
              <Button size="sm" variant="outline" onClick={handleManualCacheUpdate}>
                Add to Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search option sets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tenant ID</label>
              <Input
                type="number"
                placeholder="Enter tenant ID"
                value={tenantId || ''}
                onChange={(e) => setTenantId(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Option Set */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Option Set
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Slug"
              value={newOptionSet.slug}
              onChange={(e) => setNewOptionSet(prev => ({ ...prev, slug: e.target.value }))}
            />
            <Input
              placeholder="Label"
              value={newOptionSet.label}
              onChange={(e) => setNewOptionSet(prev => ({ ...prev, label: e.target.value }))}
            />
            <Button 
              onClick={handleCreate}
              disabled={createMutation.isPending || !newOptionSet.slug || !newOptionSet.label}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Option Sets List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Standard Query (with caching)
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <OptionSetSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {optionSets?.map((optionSet) => (
                <OptionSetCard
                  key={optionSet.id}
                  optionSet={optionSet}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Infinite Query Demo */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Infinite Query (for large datasets)
          </h2>

          <div className="space-y-4">
            {infiniteData?.pages.map((page, pageIndex) => (
              <div key={pageIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {page.map((optionSet: any) => (
                  <OptionSetCard
                    key={`infinite-${optionSet.id}`}
                    optionSet={optionSet}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ))}

            {hasNextPage && (
              <div className="text-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with error boundary and suspense
function ModernOptionSetsExampleWithBoundaries() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }>
        <ModernOptionSetsExample />
      </Suspense>
    </ErrorBoundary>
  );
}

export default ModernOptionSetsExampleWithBoundaries; 