import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { PlatformUsersClientPage } from '@/components/admin/platform-users/PlatformUsersClientPage';

export const metadata: Metadata = {
  title: 'Platform User Management - Admin',
  description: 'Cross-tenant user management for platform administrators',
};

/**
 * Server Component: Platform Users Management Page
 * 
 * ✅ SUPER ADMIN ONLY: Cross-tenant user management
 * - View users across all tenants
 * - Manage global user permissions
 * - Platform-wide user operations
 */

async function PlatformUsersServerLoader() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // ✅ SECURITY: Server-side permission check
  const basicUserContext = extractUserContext(session);
  
  // Super admin only feature
  if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.includes('super_admin')) {
    redirect('/unauthorized');
  }

  // ✅ CENTRAL PERMISSION SYSTEM: Load actual permissions using permissionsService
  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    logger.warn('No permissions found for user in platform users page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  logger.info('✅ Permissions loaded for platform users page', {
    userId: basicUserContext.userId,
    permissionCount: userPermissions.permissions.length,
    roles: userPermissions.roles
  });

  // Convert to expected format for PlatformUsersClientPage
  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'super_admin',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions.map(p => p.name) || []
  };

  const initialFiltersData = {
    page: 1,
    limit: 20,
    search: '',
    userTypes: [],
    statuses: [],
    tenantIds: []
  };

  return { userContext, initialFiltersData };
}

function PlatformUsersLoadingSkeleton() {
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

async function PlatformUsersServerContent() {
  const { userContext, initialFiltersData } = await PlatformUsersServerLoader();

  return (
    <PlatformUsersClientPage 
      initialFiltersData={initialFiltersData}
      userContext={userContext}
    />
  );
}

/**
 * Server Component: Platform Users Page
 * Orchestrates server-side loading with placeholder content
 */
export default async function AdminPlatformUsersPage() {
  return (
    <Suspense fallback={<PlatformUsersLoadingSkeleton />}>
      <PlatformUsersServerContent />
    </Suspense>
  );
}