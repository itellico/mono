/**
 * Permissions API Client
 * 
 * Handles communication with permission endpoints
 */

import { ApiAuthService } from './api-auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api/v1/admin/permissions`;

// Interface matching the PermissionsService types
export interface UserPermissionData {
  userId: string;
  tenantId: number;
  accountId: string;
  roles: Array<{
    id: number;
    name: string;
    code: string;
    description?: string;
  }>;
  permissions: string[];
  lastUpdated: number;
}

export interface PermissionCheckContext {
  userId: string;
  tenantId?: number;
  path?: string;
  method?: string;
  resource?: string;
  action?: string;
}

interface UserPermissionResponse {
  success: boolean;
  data: {
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
  };
}

export class PermissionsApiService {
  
  /**
   * Get user permissions data
   */
  static async getUserPermissions(userId: string): Promise<UserPermissionData | null> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/user-access`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UserPermissionResponse = await response.json();
      
      if (!result.success) {
        return null;
      }

      // Convert API response to service format
      const userPermissionData: UserPermissionData = {
        userId: result.data.userId,
        tenantId: result.data.tenantId,
        accountId: result.data.userId, // Using userId as accountId fallback
        roles: result.data.roles.map(role => ({
          id: role.id,
          name: role.name,
          code: role.code,
          description: `${role.name} (Level ${role.level})`,
        })),
        permissions: result.data.permissions.map(permission => permission.name),
        lastUpdated: Date.now(),
      };

      return userPermissionData;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      if (!userPermissions) {
        return false;
      }

      // Check if user is super admin (has all permissions)
      const isSuperAdmin = userPermissions.roles.some(role => role.code === 'super_admin');
      if (isSuperAdmin) {
        return true;
      }

      // Check specific permission
      return userPermissions.permissions.includes(permission);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  static async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      if (!userPermissions) {
        return false;
      }

      // Check if user is super admin (has all permissions)
      const isSuperAdmin = userPermissions.roles.some(role => role.code === 'super_admin');
      if (isSuperAdmin) {
        return true;
      }

      // Check if user has any of the specified permissions
      return permissions.some(permission => userPermissions.permissions.includes(permission));
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  static async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      if (!userPermissions) {
        return false;
      }

      // Check if user is super admin (has all permissions)
      const isSuperAdmin = userPermissions.roles.some(role => role.code === 'super_admin');
      if (isSuperAdmin) {
        return true;
      }

      // Check if user has all specified permissions
      return permissions.every(permission => userPermissions.permissions.includes(permission));
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<Array<{ id: number; name: string; code: string; description?: string; }> | null> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions?.roles || null;
    } catch (error) {
      console.error('Failed to get user roles:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      
      if (!roles) {
        return false;
      }

      return roles.some(role => role.code === roleCode);
    } catch (error) {
      console.error('Failed to check role:', error);
      return false;
    }
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      return await this.hasRole(userId, 'super_admin');
    } catch (error) {
      console.error('Failed to check super admin status:', error);
      return false;
    }
  }

  /**
   * Check if user has admin access
   */
  static async hasAdminAccess(userId: string): Promise<boolean> {
    try {
      const adminPermissions = [
        'admin.full_access',
        'admin.manage',
        'admin.permissions.view'
      ];

      return await this.hasAnyPermission(userId, adminPermissions);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      return false;
    }
  }

  /**
   * Get complete user permission summary
   */
  static async getUserPermissionSummary(userId: string): Promise<{
    hasPermissions: boolean;
    isSuperAdmin: boolean;
    hasAdminAccess: boolean;
    rolesCount: number;
    permissionsCount: number;
    roles: string[];
    permissions: string[];
  } | null> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      if (!userPermissions) {
        return null;
      }

      const isSuperAdmin = userPermissions.roles.some(role => role.code === 'super_admin');
      const hasAdminAccess = await this.hasAdminAccess(userId);

      return {
        hasPermissions: userPermissions.permissions.length > 0,
        isSuperAdmin,
        hasAdminAccess,
        rolesCount: userPermissions.roles.length,
        permissionsCount: userPermissions.permissions.length,
        roles: userPermissions.roles.map(role => role.code),
        permissions: userPermissions.permissions,
      };
    } catch (error) {
      console.error('Failed to get user permission summary:', error);
      return null;
    }
  }
}