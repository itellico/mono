import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { PlatformUserEditClient } from '../components/PlatformUserEditClient';

export const metadata: Metadata = {
  title: 'Create Platform User - Admin',
  description: 'Create a new platform user with cross-tenant access',
};

/**
 * Server Component: Create Platform User Page
 * 
 * ✅ SUPER ADMIN ONLY: Platform-wide user creation
 * - Create users with cross-tenant access
 * - Set global user permissions
 * - Platform-level user configuration
 */

async function CreatePlatformUserServerLoader() {
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
    logger.warn('No permissions found for user in create platform user page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  logger.info('✅ Permissions loaded for create platform user page', {
    userId: basicUserContext.userId,
    permissionCount: userPermissions.permissions.length,
    roles: userPermissions.roles
  });

  // Convert to expected format for PlatformUserEditClient
  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'super_admin',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions.map(p => p.name) || []
  };

  // Create empty initial user data for new user
  const initialUserData = {
    id: '',
    uuid: '',
    firstName: '',
    lastName: '',
    email: '',
    isActive: true,
    isVerified: false,
    userType: 'individual' as const,
    tenantId: 4, // Default to mono tenant
    tenant: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    stats: {
      sessionCount: 0,
      lastActivityAt: null
    }
  };

  return { userContext, initialUserData };
}

function CreatePlatformUserLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

async function CreatePlatformUserServerContent() {
  const { userContext, initialUserData } = await CreatePlatformUserServerLoader();

  return (
    <PlatformUserEditClient 
      initialUserData={initialUserData}
      userContext={userContext}
      isCreate={true}
    />
  );
}

/**
 * Server Component: Create Platform User Page
 * Orchestrates server-side loading with client-side form interaction
 */
export default async function CreatePlatformUserPage() {
  return (
    <Suspense fallback={<CreatePlatformUserLoadingSkeleton />}>
      <CreatePlatformUserServerContent />
    </Suspense>
  );
}