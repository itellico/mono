import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { TenantsClientPage } from '@/components/admin/tenants/TenantsClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

export const metadata: Metadata = {
  title: 'Tenant Management - Admin',
  description: 'Manage platform tenants and their configurations',
};

/**
 * Server Component: Admin Tenants List Page
 * 
 * ✅ MONO BEST PRACTICES:
 * - Server component for initial data loading
 * - Permission checking at server level using central permission system
 * - Proper error handling and redirects
 * - Initial data hydration for TanStack Query
 * - Three-layer caching coordination
 */

async function TenantsServerLoader() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // ✅ SECURITY: Server-side permission check
  const basicUserContext = extractUserContext(session);
  
  // Debug: Log session and context data
  console.log('🔍 DEBUG - Session data:', {
    user: session.user ? {
      id: session.user.id,
      email: session.user.email,
      roles: (session.user as any).roles
    } : 'NO USER'
  });
  console.log('🔍 DEBUG - Extracted context:', basicUserContext);
  
  if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.includes('super_admin')) {
    console.log('🔍 DEBUG - Permission check failed:', {
      isAuthenticated: basicUserContext.isAuthenticated,
      roles: basicUserContext.roles,
      hasSuperAdmin: basicUserContext.roles?.includes('super_admin')
    });
    redirect('/unauthorized');
  }

  // ✅ CENTRAL PERMISSION SYSTEM: Load actual permissions using permissionsService
  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    logger.warn('No permissions found for user in tenants page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  logger.info('✅ Permissions loaded for tenants page', {
    userId: basicUserContext.userId,
    permissionCount: userPermissions.permissions.length,
    roles: userPermissions.roles
  });

  // ✅ PERFORMANCE: Server-side data pre-loading using Fastify API
  let initialData = null;
  try {
    const filters = {
      page: 1,
      limit: 20,
      search: '',
      status: 'all' as const,
    };
    
    const response = await apiClient.getTenants(filters);
    if (response.success) {
      initialData = response.data;
    } else {
      logger.error('Failed to fetch initial tenants data from API', { 
        error: response.error 
      });
    }
  } catch (error) {
    logger.error('Failed to fetch initial tenants data', { error });
  }

  // ✅ CENTRAL PERMISSION SYSTEM: Use actual permissions from permissionsService
  const userContext = {
    userId: basicUserContext.userId || '',
    adminRole: basicUserContext.roles?.[0] || 'user',
    tenantId: basicUserContext.tenantId || null,
    permissions: userPermissions.permissions, // ✅ FIXED: Load actual permissions
  };

  const initialFilters = {
    page: 1,
    limit: 20,
    search: '',
    status: 'all' as const,
  };

  // Use API data if available, otherwise provide empty fallback
  const fallbackData = {
    tenants: [],
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

function TenantsLoadingSkeleton() {
    return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      </div>
    );
  }

/**
 * Server Component: Admin Tenants Page
 * Orchestrates server-side loading with client-side interaction
 */
export default async function AdminTenantsPage() {
    return (
    <Suspense fallback={<TenantsLoadingSkeleton />}>
      <TenantsServerContent />
    </Suspense>
  );
}

async function TenantsServerContent() {
  const { initialData, initialFilters, userContext } = await TenantsServerLoader();

  return (
    <TenantsClientPage 
      initialData={initialData}
      initialFilters={initialFilters}
      userContext={userContext}
    />
  );
} 