import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';
import { AdminCategoriesClientPage } from '@/components/admin/categories/AdminCategoriesClientPage';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
  }>;
}

export default async function CategoriesPage(props: CategoriesPageProps) {
  const searchParams = await props.searchParams;
  
  const t = await getTranslations('admin-common');

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn('Unauthenticated access to admin categories page');
      redirect('/auth/signin?callbackUrl=/admin/categories');
    }

    // Extract basic user context
    const basicUserContext = extractUserContext(session);
    
    // Check basic admin access
    if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.some(role => 
      ['super_admin', 'tenant_admin', 'content_moderator'].includes(role)
    )) {
      logger.warn('Admin categories page access denied - no admin role', {
        userId: session.user.id,
        roles: basicUserContext.roles
      });
      redirect('/unauthorized');
    }

    // Load actual permissions from the permission service
    await ensureCacheReady();
    const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

    if (!userPermissions) {
      logger.warn('No permissions found for user in categories page', { 
        userId: basicUserContext.userId 
      });
      redirect('/unauthorized');
    }

    logger.info('✅ Permissions loaded for categories page', {
      userId: basicUserContext.userId,
      permissionCount: userPermissions.permissions.length,
      roles: userPermissions.roles,
      hasViewCategories: userPermissions.permissions.includes('view:categories')
    });

    const filters = {
      page: parseInt(searchParams.page || '1'),
      limit: Math.min(parseInt(searchParams.limit || '20'), 100),
      search: searchParams.search || '',
    };

    // Fetch initial data from Next.js API
    let initialData = null;
    try {
      const searchParams = new URLSearchParams();
      if (filters.page) searchParams.set('page', filters.page.toString());
      if (filters.limit) searchParams.set('limit', filters.limit.toString());
      if (filters.search) searchParams.set('search', filters.search);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/v1/admin/categories?${searchParams.toString()}`, {
        headers: {
          'Cookie': `accessToken=${(await cookies()).get('accessToken')?.value || ''}`
        }
      });
      
      if (response.ok) {
        initialData = await response.json();
      }
    } catch (error) {
      logger.error('Failed to fetch initial categories data', { error });
      // Continue without initial data - client will fetch it
    }

    // Build full user context with permissions
    const userContext = {
      userId: basicUserContext.userId || '',
      adminRole: basicUserContext.roles?.[0] || 'user',
      roles: basicUserContext.roles || [],
      tenantId: basicUserContext.tenantId || null,
      permissions: userPermissions.permissions,
      isAuthenticated: true
    };

    logger.info('Admin categories page loaded', {
      userId: session.user.id,
      adminRole: userContext.adminRole,
      categoriesCount: initialData?.categories?.length || 0,
      filters,
      permissions: userContext.permissions.length
    });

    return (
      <AdminOnly fallback={
        <div className="text-center py-12">
          <p className="text-gray-600">{t('permissions.accessDenied', { resource: 'categories' })}</p>
        </div>
      }>
        <Suspense fallback={<CategoriesPageSkeleton />}>
          <AdminCategoriesClientPage 
            initialData={initialData}
            initialFilters={filters}
            userContext={userContext}
          />
        </Suspense>
      </AdminOnly>
    );

  } catch (error) {
    logger.error('Error loading admin categories page', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          {t('errors.failedToLoad')}
        </h2>
        <p className="text-gray-600">
          {error instanceof Error ? error.message : t('errors.unknown')}
        </p>
      </div>
    );
  }
}

function CategoriesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
