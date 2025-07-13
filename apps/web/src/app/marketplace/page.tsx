import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { MarketplaceClientPage } from '@/components/marketplace/MarketplaceClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Marketplace - itellico Mono',
  description: 'Browse and hire talent for your projects',
};

async function MarketplaceServerLoader() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const basicUserContext = extractUserContext(session);
  
  if (!basicUserContext.isAuthenticated) {
    redirect('/unauthorized');
  }

  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    logger.warn('No permissions found for user in marketplace page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  let initialData = null;
  try {
    const filters = {
      page: 1,
      limit: 20,
      search: '',
      status: 'published' as const,
    };
    
    // TODO: Implement initial data fetching when ready
    // const response = await apiClient.getGigs(filters);
    // if (response.success) {
    //   initialData = response.data;
    // }
  } catch (error) {
    logger.error('Failed to fetch initial marketplace data', { error });
  }

  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'user',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions,
  };

  const initialFilters = {
    page: 1,
    limit: 20,
    search: '',
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    deliveryTime: undefined,
    talentLevel: '',
    sortBy: 'popularity' as const,
  };

  const fallbackData = {
    gigs: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    categories: [],
    featured: [],
  };

  return { 
    initialData: initialData || fallbackData, 
    initialFilters, 
    userContext 
  };
}

function MarketplaceLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-6 w-[600px]" />
        <Skeleton className="h-10 w-full max-w-lg" />
      </div>
      
      {/* Featured Gigs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Categories Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceLoadingSkeleton />}>
      <MarketplaceServerContent />
    </Suspense>
  );
}

async function MarketplaceServerContent() {
  const { initialData, initialFilters, userContext } = await MarketplaceServerLoader();

  return (
    <MarketplaceClientPage 
      initialData={initialData}
      initialFilters={initialFilters}
      userContext={userContext}
    />
  );
}