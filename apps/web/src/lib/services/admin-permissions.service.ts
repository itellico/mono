/**
 * Admin Permissions Service
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses centralized authentication and NestJS API
 * Handles permission checks for admin area through proper middleware flow
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

interface UserPermissionAccess {
  userId: string;
  email: string;
  tenantId: number;
  isSuperAdmin: boolean;
  hasAdminAccess: boolean;
  roles: Array<{
    id: number;
    name: string;
    code: string;
    level: number;
  }>;
  permissions: Array<{
    id: number;
    name: string;
    action: string;
    resource: string;
  }>;
  accessGranted: boolean;
}

export class AdminPermissionsService {
  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use centralized auth and correct API path
   * Check if current user has permission to access admin areas
   * Uses NestJS API with proper authentication middleware
   */
  static async getUserPermissionAccess(): Promise<UserPermissionAccess | null> {
    try {
      // Use centralized auth service and correct API path (/api/v2/ not /api/v2/)
      const result = await ApiAuthService.makeAuthenticatedRequest<UserPermissionAccess>(
        '/admin/permissions/user-access'
      );

      if (!result) {
        console.error('Failed to fetch user permission access from API');
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error fetching user permission access:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(userAccess: UserPermissionAccess, permissionName: string): boolean {
    return userAccess.permissions.some(permission => 
      permission.name === permissionName
    );
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(userAccess: UserPermissionAccess, roleCodes: string[]): boolean {
    return userAccess.roles.some(role => 
      roleCodes.includes(role.code)
    );
  }

  /**
   * Check if user has admin access (super admin or specific admin permissions)
   */
  static hasAdminAccess(userAccess: UserPermissionAccess): boolean {
    return userAccess.isSuperAdmin || userAccess.hasAdminAccess;
  }
}