import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { JobApplicationsClient } from '@/components/admin/jobs/JobApplicationsClient';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface PageProps {
  params: {
    uuid: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Job Applications - Admin`,
    description: `Manage applications for job posting`,
  };
}

async function JobApplicationsServerLoader(jobUuid: string) {
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
    logger.warn('No permissions found for user in job applications page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  // Check if user has permission to read job applications
  const canReadApplications = userPermissions.permissions.includes('jobs:read') || 
                              userPermissions.permissions.includes('applications:read') ||
                              userPermissions.permissions.includes('*') ||
                              basicUserContext.roles?.includes('super_admin');

  if (!canReadApplications) {
    redirect('/unauthorized');
  }

  let jobData = null;
  let applicationsData = null;
  
  try {
    // TODO: Fetch job details and applications from API
    // const jobResponse = await apiClient.getJob(jobUuid);
    // const applicationsResponse = await apiClient.getJobApplications(jobUuid);
    
    // Mock data for now
    jobData = {
      id: '1',
      uuid: jobUuid,
      title: 'Senior Fashion Model',
      company: 'Elite Fashion Co.',
      status: 'published',
      applicationsCount: 24,
      createdAt: '2024-01-15T10:00:00Z'
    };

    applicationsData = {
      applications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    };
    
  } catch (error) {
    logger.error('Failed to fetch job applications data', { error, jobUuid });
  }

  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'user',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions,
  };

  return { 
    jobData,
    applicationsData,
    userContext 
  };
}

function JobApplicationsLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function JobApplicationsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<JobApplicationsLoadingSkeleton />}>
      <JobApplicationsServerContent jobUuid={params.uuid} />
    </Suspense>
  );
}

async function JobApplicationsServerContent({ jobUuid }: { jobUuid: string }) {
  const { jobData, applicationsData, userContext } = await JobApplicationsServerLoader(jobUuid);

  if (!jobData) {
    redirect('/admin/jobs');
  }

  return (
    <JobApplicationsClient 
      jobData={jobData}
      initialApplicationsData={applicationsData}
      userContext={userContext}
    />
  );
}