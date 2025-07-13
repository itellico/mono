import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { JobCreateClient } from '@/components/admin/jobs/JobCreateClient';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Create Job Posting - Admin',
  description: 'Create a new job posting',
};

async function JobCreateServerLoader() {
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
    logger.warn('No permissions found for user in job create page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  // Check if user has permission to create jobs
  const canCreateJobs = userPermissions.permissions.includes('jobs:create') || 
                        userPermissions.permissions.includes('*') ||
                        basicUserContext.roles?.includes('super_admin');

  if (!canCreateJobs) {
    redirect('/unauthorized');
  }

  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'user',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions,
  };

  return { userContext };
}

function JobCreateLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function JobCreatePage() {
  return (
    <Suspense fallback={<JobCreateLoadingSkeleton />}>
      <JobCreateServerContent />
    </Suspense>
  );
}

async function JobCreateServerContent() {
  const { userContext } = await JobCreateServerLoader();

  return (
    <JobCreateClient userContext={userContext} />
  );
}