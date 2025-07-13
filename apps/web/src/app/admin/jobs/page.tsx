import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { JobsClientPage } from '@/components/admin/jobs/JobsClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Job Management - Admin',
  description: 'Manage job postings and applications across all tenants',
};

async function JobsServerLoader() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const basicUserContext = extractUserContext(session);
  
  if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.includes('super_admin')) {
    redirect('/unauthorized');
  }

  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    logger.warn('No permissions found for user in jobs page', { 
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
      status: 'all' as const,
    };
    
    // TODO: Implement apiClient.getJobs() when ready
    // const response = await apiClient.getJobs(filters);
    // if (response.success) {
    //   initialData = response.data;
    // }
  } catch (error) {
    logger.error('Failed to fetch initial jobs data', { error });
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
    status: 'all' as const,
  };

  const fallbackData = {
    jobs: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
  };

  return { 
    initialData: initialData || fallbackData, 
    initialFilters, 
    userContext 
  };
}

function JobsLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function AdminJobsPage() {
  return (
    <Suspense fallback={<JobsLoadingSkeleton />}>
      <JobsServerContent />
    </Suspense>
  );
}

async function JobsServerContent() {
  const { initialData, initialFilters, userContext } = await JobsServerLoader();

  return (
    <JobsClientPage 
      initialData={initialData}
      initialFilters={initialFilters}
      userContext={userContext}
    />
  );
}