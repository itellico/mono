import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { PlatformUserEditClient } from '../../components/PlatformUserEditClient';
import { PlatformUsersService } from '@/lib/services/platform-users.service';

interface PlatformUserEditPageProps {
  params: {
    uuid: string;
  };
}

export async function generateMetadata({ params }: PlatformUserEditPageProps): Promise<Metadata> {
  try {
    // ✅ PROPER ARCHITECTURE: Use NestJS API instead of direct database access
    const user = await PlatformUsersService.getUserByUuid(params.uuid);

    if (!user) {
      return {
        title: 'User Not Found - Admin',
        description: 'The requested user could not be found',
      };
    }

    return {
      title: `Edit ${user.firstName} ${user.lastName} - Platform User`,
      description: `Edit platform user details for ${user.account?.email}`,
    };
  } catch (error) {
    return {
      title: 'Edit Platform User - Admin',
      description: 'Edit platform user details',
    };
  }
}

/**
 * Server Component: Edit Platform User Page
 * 
 * ✅ SUPER ADMIN ONLY: Platform-wide user editing
 * - Edit user details across tenants
 * - Modify global user permissions
 * - Platform-level user configuration
 */

async function EditPlatformUserServerLoader({ uuid }: { uuid: string }) {
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
    logger.warn('No permissions found for user in edit platform user page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  // ✅ PROPER ARCHITECTURE: Use NestJS API instead of direct database access
  const platformUser = await PlatformUsersService.getUserExtendedByUuid(uuid);

  if (!platformUser) {
    notFound();
  }

  logger.info('✅ Platform user data fetched for edit', {
    adminUserId: basicUserContext.userId,
    editUserId: platformUser.id,
    editUserEmail: platformUser.account?.email
  });

  // Convert to expected format for PlatformUserEditClient
  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'super_admin',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions.map(p => p.name) || []
  };

  // Transform platform user data (data now comes from NestJS API)
  const userData = {
    id: platformUser.id.toString(),
    uuid: platformUser.uuid,
    firstName: platformUser.firstName || '',
    lastName: platformUser.lastName || '',
    email: platformUser.account?.email || '',
    isActive: platformUser.isActive,
    isVerified: platformUser.account?.isVerified || false,
    userType: platformUser.userType || 'individual',
    tenantId: platformUser.tenantId,
    tenant: platformUser.tenant ? {
      id: platformUser.tenant.id,
      name: platformUser.tenant.name,
      domain: platformUser.tenant.domain
    } : null,
    lastLoginAt: platformUser.lastLoginAt || null,
    createdAt: platformUser.createdAt,
    stats: {
      sessionCount: platformUser._count?.sessions || 0,
      lastActivityAt: platformUser.lastLoginAt || null
    }
  };

  return { userContext, userData };
}

function EditPlatformUserLoadingSkeleton() {
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

async function EditPlatformUserServerContent({ uuid }: { uuid: string }) {
  const { userContext, userData } = await EditPlatformUserServerLoader({ uuid });

  return (
    <PlatformUserEditClient 
      initialUserData={userData}
      userContext={userContext}
      isCreate={false}
    />
  );
}

/**
 * Server Component: Edit Platform User Page
 * Orchestrates server-side loading with client-side form interaction
 */
export default async function EditPlatformUserPage({ params }: PlatformUserEditPageProps) {
  return (
    <Suspense fallback={<EditPlatformUserLoadingSkeleton />}>
      <EditPlatformUserServerContent uuid={params.uuid} />
    </Suspense>
  );
}