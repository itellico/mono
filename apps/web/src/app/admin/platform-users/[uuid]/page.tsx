import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { PlatformUserViewClient } from '../components/PlatformUserViewClient';
import { PlatformUsersService } from '@/lib/services/platform-users.service';

interface PlatformUserViewPageProps {
  params: {
    uuid: string;
  };
}

export async function generateMetadata({ params }: PlatformUserViewPageProps): Promise<Metadata> {
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
      title: `${user.firstName} ${user.lastName} - Platform User`,
      description: `View platform user details for ${user.account?.email}`,
    };
  } catch (error) {
    return {
      title: 'Platform User - Admin',
      description: 'View platform user details',
    };
  }
}

/**
 * Server Component: View Platform User Page
 * 
 * ✅ SUPER ADMIN ONLY: Platform-wide user viewing
 * - View user details across tenants
 * - See global user permissions
 * - Platform-level user information
 */

async function ViewPlatformUserServerLoader({ uuid }: { uuid: string }) {
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
    logger.warn('No permissions found for user in view platform user page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  // ✅ PROPER ARCHITECTURE: Use NestJS API instead of direct database access
  const platformUser = await PlatformUsersService.getUserExtendedByUuid(uuid);

  if (!platformUser) {
    notFound();
  }

  logger.info('✅ Platform user data fetched for view', {
    adminUserId: basicUserContext.userId,
    viewedUserId: platformUser.id,
    viewedUserEmail: platformUser.account?.email
  });

  // Convert to expected format for PlatformUserViewClient
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

function ViewPlatformUserLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

async function ViewPlatformUserServerContent({ uuid }: { uuid: string }) {
  const { userContext, userData } = await ViewPlatformUserServerLoader({ uuid });

  return (
    <PlatformUserViewClient 
      userData={userData}
      userContext={userContext}
    />
  );
}

/**
 * Server Component: View Platform User Page
 * Orchestrates server-side loading with client-side interaction
 */
export default async function ViewPlatformUserPage({ params }: PlatformUserViewPageProps) {
  return (
    <Suspense fallback={<ViewPlatformUserLoadingSkeleton />}>
      <ViewPlatformUserServerContent uuid={params.uuid} />
    </Suspense>
  );
}