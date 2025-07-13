/**
 * Platform Users Service
 * 
 * Handles platform user management through authenticated NestJS API calls
 * Replaces direct database access with proper middleware flow
 */

import { ApiAuthService } from '../api-clients/api-auth.service';

interface PlatformUser {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  userType: string;
  isActive: boolean;
  tenantId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  account?: {
    email: string;
    isVerified: boolean;
    createdAt: string;
  };
  tenant?: {
    id: string;
    name: string;
    domain: string;
  };
  _count?: {
    sessions: number;
  };
}

interface PlatformUserStats {
  sessionCount: number;
  lastLoginAt: string | null;
  accountCreatedAt: string;
  isActive: boolean;
  daysSinceCreated: number;
  daysSinceLastLogin: number | null;
}

export class PlatformUsersService {

  /**
   * Get all platform users (requires platform.users.view permission)
   */
  static async getUsers(query?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    userType?: string;
  }): Promise<{ items: PlatformUser[]; pagination: any } | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/admin/users${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<{ items: PlatformUser[]; pagination: any }>(endpoint);
  }

  /**
   * Get platform user by UUID (requires platform.users.view permission)
   */
  static async getUserByUuid(uuid: string): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>(`/platform/admin/users/${uuid}`);
  }

  /**
   * Get platform user with extended details (requires platform.users.view permission)
   */
  static async getUserExtendedByUuid(uuid: string): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>(`/platform/admin/users/${uuid}/extended`);
  }

  /**
   * Create new platform user (requires platform.users.create permission)
   */
  static async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    userType?: string;
    tenantId?: string;
    isActive?: boolean;
  }): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>('/platform/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Update platform user (requires platform.users.update permission)
   */
  static async updateUser(uuid: string, userData: {
    firstName?: string;
    lastName?: string;
    userType?: string;
    isActive?: boolean;
    tenantId?: string;
  }): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>(`/platform/admin/users/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Delete platform user (requires platform.users.delete permission)
   */
  static async deleteUser(uuid: string): Promise<boolean> {
    const result = await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/admin/users/${uuid}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Activate platform user (requires platform.users.activate permission)
   */
  static async activateUser(uuid: string): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>(`/platform/admin/users/${uuid}/activate`, {
      method: 'POST'
    });
  }

  /**
   * Deactivate platform user (requires platform.users.deactivate permission)
   */
  static async deactivateUser(uuid: string, reason?: string): Promise<PlatformUser | null> {
    return await ApiAuthService.makeAuthenticatedRequest<PlatformUser>(`/platform/admin/users/${uuid}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Get platform user statistics (requires platform.users.view permission)
   */
  static async getUserStats(uuid: string): Promise<{ userId: string; stats: PlatformUserStats } | null> {
    return await ApiAuthService.makeAuthenticatedRequest<{ userId: string; stats: PlatformUserStats }>(`/platform/admin/users/${uuid}/stats`);
  }

  /**
   * Get platform user activity log (requires platform.users.view permission)
   */
  static async getUserActivity(uuid: string, query?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: any[]; pagination: any } | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/admin/users/${uuid}/activity${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<{ items: any[]; pagination: any }>(endpoint);
  }
}