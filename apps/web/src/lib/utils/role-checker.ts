import { db } from '@/lib/db';

/**
 * Secure server-side role checking utility
 * This follows security best practices by checking roles fresh from the database
 * instead of relying on potentially stale JWT token data
 */

// Define admin role types that map to our enhanced permission system
export type AdminRoleType = 'super_admin' | 'tenant_admin' | 'content_moderator';

// Enhanced admin permissions interface
export interface AdminPermissions {
  roleType: AdminRoleType;
  tenantId: number | null;
  canManageUsers: boolean;
  canManageContent: boolean;
  canImpersonateUsers: boolean;
  canApproveModels: boolean;
  canReviewPictures: boolean;
  canAccessAnalytics: boolean;
  isSuperAdmin: boolean;
}

/**
 * Get admin role and permissions for a user using ENHANCED permission system
 * Super admins bypass tenant restrictions and can access all tenants
 * @param userId - The user ID from the session
 * @param tenantId - The tenant ID from the session (optional for super admins)
 * @returns Admin permissions or null if user is not an admin
 */
export async function getAdminPermissions(
  userId: number,
  tenantId: number | null = null
): Promise<AdminPermissions | null> {
  try {
    // Get user's roles and permissions from the enhanced system
    const userRolesData = await db.userRole.findMany({
      where: {
        userId,
        OR: [
          { validUntil: null }, // Permanent roles
          { validUntil: { gte: new Date() } } // Active roles
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Flatten the permissions data
    const userPermissions = [];
    for (const userRole of userRolesData) {
      for (const rp of userRole.role.permissions) {
        userPermissions.push({
          roleName: userRole.role.name,
          roleLevel: userRole.role.level,
          userRoleTenantId: userRole.role.tenantid,
          permissionName: rp.permission.name,
          permissionAction: rp.permission.action,
          permissionResource: rp.permission.resource,
          permissionScope: rp.permission.scope
        });
      }
    }

    if (userPermissions.length === 0) {
      return null;
    }

    // Check if user has super admin role (global permissions)
    const isSuperAdmin = userPermissions.some(p => 
      p.roleName === 'super_admin' || 
      (p.permissionScope === 'global' && p.permissionAction === 'manage')
    );

    // Determine the primary role type
    let roleType: AdminRoleType = 'content_moderator';
    if (userPermissions.some(p => p.roleName === 'super_admin')) {
      roleType = 'super_admin';
    } else if (userPermissions.some(p => p.roleName === 'tenant_admin')) {
      roleType = 'tenant_admin';
    }

    // Extract specific permissions
    const permissionMap = new Set(userPermissions.map(p => `${p.permissionAction}.${p.permissionResource}`));
    
    return {
      roleType,
      tenantId: isSuperAdmin ? null : tenantId,
      canManageUsers: permissionMap.has('manage.users') || isSuperAdmin,
      canManageContent: permissionMap.has('manage.media') || permissionMap.has('update.media') || isSuperAdmin,
      canImpersonateUsers: permissionMap.has('impersonate.users') || isSuperAdmin,
      canApproveModels: permissionMap.has('approve.applications') || isSuperAdmin,
      canReviewPictures: permissionMap.has('moderate.media') || isSuperAdmin,
      canAccessAnalytics: permissionMap.has('read.analytics') || isSuperAdmin,
      isSuperAdmin,
    };
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return null;
  }
}

/**
 * Check if user has specific admin role(s) using ENHANCED system
 * Super admins always pass this check regardless of tenant
 * @param userId - The user ID from the session
 * @param tenantId - The tenant ID from the session (optional for super admins)
 * @param allowedRoles - Array of allowed role types
 * @returns True if user has one of the allowed roles
 */
export async function hasAdminRole(
  userId: number,
  tenantId: number | null,
  allowedRoles: AdminRoleType[]
): Promise<boolean> {
  const permissions = await getAdminPermissions(userId, tenantId);
  return permissions !== null && allowedRoles.includes(permissions.roleType);
}

/**
 * Check if user has specific permission using ENHANCED system
 * Super admins always pass permission checks
 * @param userId - The user ID from the session
 * @param tenantId - The tenant ID from the session (optional for super admins)
 * @param permission - The specific permission to check
 * @returns True if user has the permission
 */
export async function hasPermission(
  userId: number,
  tenantId: number | null,
  permission: keyof Omit<AdminPermissions, 'roleType' | 'tenantId' | 'isSuperAdmin'>
): Promise<boolean> {
  const permissions = await getAdminPermissions(userId, tenantId);
  return permissions !== null && permissions[permission];
}

/**
 * Check if user is super admin using ENHANCED system
 * @param userId - The user ID from the session
 * @returns True if user is super admin
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  try {
    const superAdminRole = await db.userRole.findFirst({
      where: {
        userId,
        OR: [
          { validUntil: null }, // Permanent roles
          { validUntil: { gte: new Date() } } // Active roles
        ],
        role: {
          name: 'super_admin'
        }
      },
      include: {
        role: true
      }
    });

    return superAdminRole !== null;
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
}

/**
 * Middleware helper to check admin access in API routes using ENHANCED system
 * Handles super admin bypass logic automatically
 * @param session - NextAuth session object
 * @param allowedRoles - Array of allowed role types
 * @returns Admin permissions if authorized, null if not
 */
export async function checkApiAdminAccess(
  session: any,
  allowedRoles: AdminRoleType[] = ['super_admin', 'tenant_admin', 'content_moderator']
): Promise<AdminPermissions | null> {
  // More robust user ID extraction - try multiple possible session structures
  const userId = session?.user?.userId || session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    return null;
  }

  // If we don't have a userId but have an email, look it up in the database
  let resolvedUserId = userId;
  if (!resolvedUserId && userEmail) {
    try {
      const account = await db.account.findFirst({
        where: {
          email: userEmail
        }
      });

      if (account) {
        const user = await db.user.findFirst({
          where: {
            accountId: account.id
          }
        });

        if (user) {
          resolvedUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error resolving user ID from email:', error);
    }
  }

  if (!resolvedUserId) {
    return null;
  }

  // Check if user is super admin first (bypasses tenant requirements)
  const permissions = await getAdminPermissions(
    resolvedUserId,
    session?.user?.tenantId
  );

  if (!permissions || !allowedRoles.includes(permissions.roleType)) {
    return null;
  }

  return permissions;
} 