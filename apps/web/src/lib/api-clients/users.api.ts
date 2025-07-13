/**
 * Users API Client
 * 
 * Handles communication with platform user endpoints
 */

import { ApiAuthService } from './api-auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api/v1/platform/admin/users`;

// Interface matching the UsersService types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  newUsersToday: number;
  modelsCount: number;
  clientsCount: number;
}

export interface UserFilters {
  userTypes: { value: string; label: string; count: number }[];
  statuses: { value: string; label: string; count: number }[];
  countries: { value: string; label: string; count: number }[];
}

export interface UserListItem {
  id: string;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profilesCount: number;
  applicationsCount: number;
  country: string | null;
  profilePicture: string | null;
}

export interface UsersPageData {
  stats: UserStats;
  users: UserListItem[];
  filters: UserFilters;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  tenantId?: string | null;
  active?: boolean;
  userType?: string;
}

interface UsersApiResponse {
  success: boolean;
  data: {
    items: UserListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface UserApiResponse {
  success: boolean;
  data: UserListItem;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  userType?: string;
  tenantId?: string;
  isActive?: boolean;
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  userType?: string;
  isActive?: boolean;
  tenantId?: string;
}

interface UserActivityQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export class UsersApiService {
  
  /**
   * Get users with pagination and filtering
   */
  static async getUsers(params: GetUsersParams): Promise<{ users: UserListItem[]; pagination: any }> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.active !== undefined) searchParams.append('active', params.active.toString());
      if (params.userType) searchParams.append('userType', params.userType);

      const url = `${BASE_URL}${searchParams.toString() ? `?${searchParams}` : ''}`;
      
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

      const result: UsersApiResponse = await response.json();
      return {
        users: result.data.items,
        pagination: result.data.pagination,
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return { users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
  }

  /**
   * Get user by UUID
   */
  static async getUserByUuid(userUuid: string): Promise<UserListItem | null> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}`, {
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

      const result: UserApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch user by UUID:', error);
      return null;
    }
  }

  /**
   * Get user with extended details
   */
  static async getUserExtendedByUuid(userUuid: string): Promise<any> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}/extended`, {
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

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch extended user by UUID:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData: CreateUserRequest): Promise<UserListItem> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UserApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update user by UUID
   */
  static async updateUserByUuid(userUuid: string, updateData: UpdateUserRequest): Promise<UserListItem | null> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UserApiResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to update user:', error);
      return null;
    }
  }

  /**
   * Delete user by UUID
   */
  static async deleteUserByUuid(userUuid: string): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}`, {
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

      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  /**
   * Activate user
   */
  static async activateUser(userUuid: string): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to activate user:', error);
      return false;
    }
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(userUuid: string, reason?: string): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userUuid: string): Promise<any> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/${userUuid}/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return null;
    }
  }

  /**
   * Get user activity
   */
  static async getUserActivity(userUuid: string, query: UserActivityQuery = {}): Promise<any> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const searchParams = new URLSearchParams();
      if (query.page) searchParams.append('page', query.page.toString());
      if (query.limit) searchParams.append('limit', query.limit.toString());
      if (query.startDate) searchParams.append('startDate', query.startDate);
      if (query.endDate) searchParams.append('endDate', query.endDate);

      const url = `${BASE_URL}/${userUuid}/activity${searchParams.toString() ? `?${searchParams}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      return null;
    }
  }

  /**
   * Generate user statistics (for UsersPageData)
   * This synthesizes data from the API to match the existing interface
   */
  static async generateUsersPageData(tenantId?: string | null): Promise<UsersPageData> {
    try {
      // Get all users to calculate stats
      const usersResult = await this.getUsers({ limit: 1000 }); // Get a large set for stats
      
      const allUsers = usersResult.users;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate statistics
      const stats: UserStats = {
        totalUsers: usersResult.pagination.total || allUsers.length,
        activeUsers: allUsers.filter(u => u.isActive).length,
        pendingUsers: allUsers.filter(u => !u.isVerified).length,
        newUsersToday: allUsers.filter(u => new Date(u.createdAt) >= today).length,
        modelsCount: allUsers.filter(u => u.userType === 'model').length,
        clientsCount: allUsers.filter(u => u.userType === 'client').length,
      };

      // Generate filters based on actual data
      const userTypeStats = allUsers.reduce((acc, user) => {
        const type = user.userType || 'individual';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const filters: UserFilters = {
        userTypes: [
          { value: 'all', label: 'All Types', count: stats.totalUsers },
          { value: 'individual', label: 'Individual', count: userTypeStats.individual || 0 },
          { value: 'business', label: 'Business', count: userTypeStats.business || 0 },
          { value: 'organization', label: 'Organization', count: userTypeStats.organization || 0 },
        ],
        statuses: [
          { value: 'all', label: 'All Statuses', count: stats.totalUsers },
          { value: 'active', label: 'Active', count: stats.activeUsers },
          { value: 'inactive', label: 'Inactive', count: stats.totalUsers - stats.activeUsers },
          { value: 'verified', label: 'Verified', count: stats.totalUsers - stats.pendingUsers },
        ],
        countries: [
          { value: 'all', label: 'All Countries', count: stats.totalUsers },
        ],
      };

      return {
        stats,
        users: allUsers.slice(0, 50), // Return first 50 for initial display
        filters,
      };
    } catch (error) {
      console.error('Failed to generate users page data:', error);
      
      // Return empty data structure on error
      return {
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          newUsersToday: 0,
          modelsCount: 0,
          clientsCount: 0,
        },
        users: [],
        filters: {
          userTypes: [],
          statuses: [],
          countries: [],
        },
      };
    }
  }
}