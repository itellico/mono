/**
 * Roles API Client
 * 
 * Handles communication with role management endpoints
 */

import { ApiAuthService } from './api-auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api/v1/admin/roles`;

// Interface matching the RolesService types
export interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    permissions: number;
  };
  permissions?: RolePermission[];
}

export interface RolePermission {
  permission: {
    id: number;
    name: string;
    description: string | null;
    category: string;
  };
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

interface RolesApiResponse {
  success: boolean;
  data: Role[];
}

interface RoleApiResponse {
  success: boolean;
  data: Role;
}

interface DeleteRoleResponse {
  success: boolean;
  message: string;
}

export class RolesApiService {
  
  /**
   * Get all roles with optional tenant filtering
   */
  static async getAllRoles(tenantId?: number | null): Promise<Role[]> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId.toString());
      }

      const url = `${BASE_URL}${params.toString() ? `?${params}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RolesApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return [];
    }
  }

  /**
   * Get role by ID
   */
  static async getRoleById(roleId: number, tenantId?: number | null): Promise<Role | null> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId.toString());
      }

      const url = `${BASE_URL}/${roleId}${params.toString() ? `?${params}` : ''}`;

      const response = await fetch(url, {
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

      const result: RoleApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch role by ID:', error);
      return null;
    }
  }

  /**
   * Create new role
   */
  static async createRole(
    data: CreateRoleRequest, 
    tenantId?: number | null
  ): Promise<Role> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId.toString());
      }

      const url = `${BASE_URL}${params.toString() ? `?${params}` : ''}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RoleApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Update existing role
   */
  static async updateRole(
    roleId: number,
    data: UpdateRoleRequest,
    tenantId?: number | null
  ): Promise<Role> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId.toString());
      }

      const url = `${BASE_URL}/${roleId}${params.toString() ? `?${params}` : ''}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RoleApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId: number, tenantId?: number | null): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (tenantId) {
        params.append('tenantId', tenantId.toString());
      }

      const url = `${BASE_URL}/${roleId}${params.toString() ? `?${params}` : ''}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DeleteRoleResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete role:', error);
      return false;
    }
  }

  /**
   * Check if role can be deleted (no assigned users)
   */
  static async canDeleteRole(roleId: number, tenantId?: number | null): Promise<boolean> {
    try {
      const role = await this.getRoleById(roleId, tenantId);
      
      if (!role) {
        return false;
      }

      // System roles typically cannot be deleted (additional business rule)
      if (role.isSystem) {
        return false;
      }

      // Check if role has assigned users
      return role._count.users === 0;
    } catch (error) {
      console.error('Failed to check if role can be deleted:', error);
      return false;
    }
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: number, tenantId?: number | null): Promise<RolePermission[]> {
    try {
      const role = await this.getRoleById(roleId, tenantId);
      return role?.permissions || [];
    } catch (error) {
      console.error('Failed to get role permissions:', error);
      return [];
    }
  }

  /**
   * Get roles by permission
   */
  static async getRolesByPermission(permissionName: string, tenantId?: number | null): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles(tenantId);
      
      return allRoles.filter(role => 
        role.permissions?.some(rp => rp.permission.name === permissionName)
      );
    } catch (error) {
      console.error('Failed to get roles by permission:', error);
      return [];
    }
  }

  /**
   * Get system roles
   */
  static async getSystemRoles(tenantId?: number | null): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles(tenantId);
      return allRoles.filter(role => role.isSystem);
    } catch (error) {
      console.error('Failed to get system roles:', error);
      return [];
    }
  }

  /**
   * Get custom roles (non-system)
   */
  static async getCustomRoles(tenantId?: number | null): Promise<Role[]> {
    try {
      const allRoles = await this.getAllRoles(tenantId);
      return allRoles.filter(role => !role.isSystem);
    } catch (error) {
      console.error('Failed to get custom roles:', error);
      return [];
    }
  }
}