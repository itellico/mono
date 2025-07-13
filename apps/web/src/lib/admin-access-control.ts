
import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// Admin role types that have access to admin interface
export const ADMIN_ROLE_TYPES = [
  'super_admin',
  'tenant_admin', 
  'content_moderator',
  'model_approver',
  'gocare_reviewer',
  'support_agent',
  'analytics_viewer'
] as const;

// Access matrix defining which role types can access which admin routes
export const ADMIN_ACCESS_MATRIX = {
  // Base admin access - all admin roles can access dashboard
  '/admin': ['super_admin', 'tenant_admin', 'content_moderator', 'model_approver', 'gocare_reviewer', 'support_agent', 'analytics_viewer'],

  // User management - only full admins
  '/admin/users': ['super_admin', 'tenant_admin'],

  // Media review - content moderators and GoCare reviewers
  '/admin/media-review': ['super_admin', 'tenant_admin', 'content_moderator', 'gocare_reviewer'],

  // Analytics - viewers and full admins
  '/admin/analytics': ['super_admin', 'tenant_admin', 'analytics_viewer'],

  // Settings - only super admins
  '/admin/settings': ['super_admin'],

  // Categories & Tags - all admin roles
  '/admin/categories': ['super_admin', 'tenant_admin', 'content_moderator'],

  // Queue management - all admin roles
  '/admin/queue': ['super_admin', 'tenant_admin', 'content_moderator'],

  // Tenant management - only super admins
  '/admin/tenants': ['super_admin'],

  // Subscription management - only super admins
  '/admin/subscriptions': ['super_admin']
} as const;

// Permission flags for granular control
export interface AdminPermissions {
  canApproveModels: boolean;
  canReviewPictures: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canManageContent: boolean;
  canImpersonateUsers: boolean;
  canManageCategories?: boolean;
  canManageTags?: boolean;
  canBuildModels?: boolean;
}

export interface AdminUserInfo {
  userId: number;
  userType: string;
  profilePictureUrl?: string | null;
  tenant?: {
    id: number;
    name: string;
    domain?: string;
  };
  adminRole?: {
    id: number;
    roleType: string;
    permissions: AdminPermissions;
    isActive: boolean;
  };
}

/**
 * Get admin role information for a user with profile picture and tenant data
 */
export async function getAdminRole(userId: number | string, tenantId: number | string): Promise<AdminUserInfo | null> {
  try {
    // Convert to numbers if they're strings
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const tenantIdNum = typeof tenantId === 'string' ? parseInt(tenantId, 10) : tenantId;

    if (isNaN(userIdNum) || isNaN(tenantIdNum)) {
      logger.error({ userId, tenantId }, 'Invalid user ID or tenant ID');
      return null;
    }

    // Get user with account information using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      include: {
        account: {
          select: {
            email: true
          }
        }
      }
    });

    if (!user || !user.account) {
      return null;
    }

    const accountData = user.account;

    // Check if account email matches known admin emails
    const isAdmin = accountData.email === '1@1.com' || accountData.email === '2@2.com';

    if (!isAdmin) {
      return null;
    }

    // Determine admin role type based on email (temporary)
    const roleType = accountData.email === '1@1.com' ? 'super_admin' : 'content_moderator';

    return {
      userId: user.id,
      userType: user.userType || 'individual',
      profilePictureUrl: user.profilePhotoUrl,
      tenant: {
        id: tenantIdNum,
        name: 'itellico Mono',
        domain: 'itellico.com'
      },
      adminRole: {
        id: 1, // Temporary ID
        roleType,
        permissions: {
          canApproveModels: roleType === 'super_admin',
          canReviewPictures: true,
          canManageUsers: roleType === 'super_admin',
          canAccessAnalytics: roleType === 'super_admin',
          canManageContent: true,
          canImpersonateUsers: roleType === 'super_admin',
          canManageCategories: true,
          canManageTags: true,
          canBuildModels: true,
        },
        isActive: true
      }
    };

  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting admin role');
    return null;
  }
}

/**
 * Check if user has access to admin interface
 * Can be called with adminInfo object or userId/tenantId parameters
 */
export async function hasAdminAccess(
  userIdOrAdminInfo: number | string | AdminUserInfo | null, 
  tenantId?: number | string
): Promise<AdminUserInfo | null> {
  // If called with AdminUserInfo object
  if (typeof userIdOrAdminInfo === 'object' && userIdOrAdminInfo !== null) {
    const adminInfo = userIdOrAdminInfo;
    if (!adminInfo?.adminRole) {
      return null;
    }

    const hasAccess = ADMIN_ROLE_TYPES.includes(adminInfo.adminRole.roleType as any) && 
                     adminInfo.adminRole.isActive;

    return hasAccess ? adminInfo : null;
  }

  // If called with userId and tenantId
  if ((typeof userIdOrAdminInfo === 'number' || typeof userIdOrAdminInfo === 'string') && tenantId) {
    const adminInfo = await getAdminRole(userIdOrAdminInfo, tenantId);

    if (!adminInfo?.adminRole) {
      return null;
    }

    const hasAccess = ADMIN_ROLE_TYPES.includes(adminInfo.adminRole.roleType as any) && 
                     adminInfo.adminRole.isActive;

    return hasAccess ? adminInfo : null;
  }

  return null;
}

/**
 * Check if user can access specific admin route
 */
export async function canAccessAdminRoute(adminInfo: AdminUserInfo | null, path: string): Promise<boolean> {
  const validAdminInfo = await hasAdminAccess(adminInfo);
  if (!validAdminInfo) {
    return false;
  }

  const allowedRoles = ADMIN_ACCESS_MATRIX[path as keyof typeof ADMIN_ACCESS_MATRIX];
  if (!allowedRoles) {
    // If route not in matrix, allow access if user has basic admin access
    return true;
  }

  return allowedRoles.includes(validAdminInfo.adminRole!.roleType as any);
}

/**
 * Check specific permission
 */
export async function hasPermission(adminInfo: AdminUserInfo | null, permission: keyof AdminPermissions): Promise<boolean> {
  const validAdminInfo = await hasAdminAccess(adminInfo);
  if (!validAdminInfo) {
    return false;
  }

  return validAdminInfo.adminRole!.permissions[permission];
}

/**
 * Require admin access for API routes
 * Returns admin info if authorized, throws if not
 */
export async function requireAdminAccess(
  session: any, 
  allowedRoles?: string[]
): Promise<AdminUserInfo | null> {
  if (!session?.user?.id) {
    return null;
  }

  // Get tenant ID from session - default to 4 (mono tenant)
  const tenantId = session.user.tenant?.id || session.user.tenantId || 4;

  const adminInfo = await getAdminRole(session.user.id, tenantId);

  const validAdminInfo = await hasAdminAccess(adminInfo);
  if (!validAdminInfo) {
    return null;
  }

  // Check specific role requirements if provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(validAdminInfo.adminRole!.roleType)) {
      return null;
    }
  }

  return validAdminInfo;
}

/**
 * Get filtered sidebar menu items based on user's admin role
 */
export async function getFilteredMenuItems(adminInfo: AdminUserInfo | null) {
  const validAdminInfo = await hasAdminAccess(adminInfo);
  if (!validAdminInfo) {
    return [];
  }

  const allMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { name: 'Users', href: '/admin/users', requiresPath: '/admin/users' },
    { name: 'Media Review', href: '/admin/media-review', requiresPath: '/admin/media-review' },
    { name: 'Analytics', href: '/admin/analytics', requiresPath: '/admin/analytics' },
    { name: 'Queue MGMT', href: '/admin/queue', requiresPath: '/admin/queue' },
    { name: 'Tenants', href: '/admin/tenants', requiresPath: '/admin/tenants' },
    { name: 'Subscription MGMT', href: '/admin/subscriptions', requiresPath: '/admin/subscriptions' },
    { name: 'Categories & Tags', href: '/admin/categories', requiresPath: '/admin/categories' },
    { name: 'EAV Model Builder', href: '/admin/eav-builder', requiresPath: '/admin/eav-builder' },
    { name: 'Preferences', href: '/admin/preferences' },
    { name: 'Settings', href: '/admin/settings', requiresPath: '/admin/settings' }
  ];

  const filteredItems = [];
  for (const item of allMenuItems) {
    if (!item.requiresPath) {
      filteredItems.push(item);
    } else {
      const canAccess = await canAccessAdminRoute(validAdminInfo, item.requiresPath);
      if (canAccess) {
        filteredItems.push(item);
      }
    }
  }

  return filteredItems;
}

/**
 * Get dashboard configuration based on admin role
 */
export async function getDashboardConfig(adminInfo: AdminUserInfo | null) {
  const validAdminInfo = await hasAdminAccess(adminInfo);
  if (!validAdminInfo) {
    return null;
  }

  const roleType = validAdminInfo.adminRole!.roleType;

  return {
    canViewUserAnalytics: roleType === 'super_admin' || roleType === 'tenant_admin',
    canModerateContent: roleType === 'content_moderator' || roleType === 'super_admin',
    canApproveApplications: roleType === 'model_approver' || roleType === 'super_admin',
    canManageSystem: roleType === 'super_admin',
    showQuickActions: true,
    preferredStartTab: roleType === 'content_moderator' ? 'content' : 'overview'
  };
} 