import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { MessagesClientPage } from '@/components/messaging/MessagesClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Messages - itellico Mono',
  description: 'Manage conversations and messages',
};

async function MessagesServerLoader() {
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
    logger.warn('No permissions found for user in messages page', { 
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
    
    // TODO: Implement initial data fetching when ready
    // const response = await apiClient.getConversations(filters);
    // if (response.success) {
    //   initialData = response.data;
    // }
  } catch (error) {
    logger.error('Failed to fetch initial messages data', { error });
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
    conversations: [],
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

function MessagesLoadingSkeleton() {
  return (
    <div className="h-screen flex">
      {/* Conversations sidebar skeleton */}
      <div className="w-1/3 border-r border-border p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 w-full border-b border-border" />
        <div className="flex-1 p-4">
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-16 w-full border-t border-border" />
      </div>
    </div>
  );
}

export default async function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesServerContent />
    </Suspense>
  );
}

async function MessagesServerContent() {
  const { initialData, initialFilters, userContext } = await MessagesServerLoader();

  return (
    <MessagesClientPage 
      initialData={initialData}
      initialFilters={initialFilters}
      userContext={userContext}
    />
  );
}