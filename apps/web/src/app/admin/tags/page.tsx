import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { tagsService } from '@/lib/services/tags-service';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';
import { AdminTagsClientPage } from '@/components/admin/tags/AdminTagsClientPage';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { Skeleton } from '@/components/ui/skeleton';

interface TagsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function TagsPage(props: TagsPageProps) {
  const searchParams = await props.searchParams;
  
  const t = await getTranslations('admin-common');

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn('Unauthenticated access to admin tags page');
      redirect('/auth/signin?callbackUrl=/admin/tags');
    }

    const userContext = extractUserContext(session);
    
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/tags', 'GET');
    if (!hasAccess.allowed) {
      logger.warn('Admin tags page access denied', {
        userId: session.user.id,
        userRole: userContext.adminRole,
        reason: hasAccess.reason
      });
      redirect('/admin?error=access_denied');
    }

        const filters = {
      page: parseInt(searchParams.page || '1'),
      limit: Math.min(parseInt(searchParams.limit || '20'), 100),
      search: searchParams.search || '',
      status: (searchParams.status || 'all') as 'active' | 'inactive' | 'all'
    };

    const initialData = await tagsService.getAll(filters);

    logger.info('Admin tags page loaded', {
      userId: session.user.id,
      userRole: userContext.adminRole,
      tagsCount: initialData.tags.length,
      filters
    });

    return (
      <AdminOnly fallback={
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. You don't have permission to view tags.</p>
        </div>
      }>
        <Suspense fallback={<TagsPageSkeleton />}>
          <AdminTagsClientPage 
            initialData={initialData}
            initialFilters={filters}
            userContext={userContext}
          />
        </Suspense>
      </AdminOnly>
    );

  } catch (error) {
    logger.error('Error loading admin tags page', { 
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

function TagsPageSkeleton() {
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
