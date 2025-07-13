/**
 * Admin Settings API Client
 * 
 * Handles communication with admin settings endpoints
 */

import { ApiAuthService } from './api-auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BASE_URL = `${API_URL}/api/v1/admin/settings`;

interface AdminSetting {
  id: number;
  key: string;
  displayName: string | null;
  description: string | null;
  value: any;
  defaultValue: any;
  category: string;
  level: string;
  governance: string;
  isReadonly: boolean;
  requiresRestart: boolean;
  helpText: string | null;
  tenantId: number | null;
}

interface AdminSettingsFilters {
  category?: string;
  level?: string;
  tenantId?: number;
  userSpecific?: boolean;
}

interface AdminSettingsResponse {
  success: boolean;
  data: AdminSetting[];
}

interface SettingValueResponse {
  success: boolean;
  data: any;
}

interface UpdateSettingRequest {
  value: any;
  reason?: string;
}

interface UpdateSettingResponse {
  success: boolean;
  message?: string;
}

interface ActiveModesResponse {
  success: boolean;
  data: {
    godMode: boolean;
    developerMode: boolean;
    debugMode: boolean;
    maintenanceMode: boolean;
  };
}

export class AdminSettingsApiService {
  
  /**
   * Get all admin settings with filtering
   */
  static async getAdminSettings(filters?: AdminSettingsFilters): Promise<AdminSetting[]> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.tenantId !== undefined) params.append('tenantId', filters.tenantId.toString());

      const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
      
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

      const result: AdminSettingsResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch admin settings:', error);
      return [];
    }
  }

  /**
   * Get specific setting value
   */
  static async getSettingValue(key: string, userId?: number, tenantId?: number): Promise<any> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const params = new URLSearchParams({ key });
      if (userId) params.append('userId', userId.toString());
      if (tenantId) params.append('tenantId', tenantId.toString());

      const response = await fetch(`${BASE_URL}/value?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SettingValueResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch setting value:', error);
      return null;
    }
  }

  /**
   * Update setting value
   */
  static async updateSettingValue(
    key: string,
    value: any,
    reason?: string,
    tenantId?: number
  ): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const body: UpdateSettingRequest = { value };
      if (reason) body.reason = reason;

      const params = new URLSearchParams({ key });
      if (tenantId) params.append('tenantId', tenantId.toString());

      const response = await fetch(`${BASE_URL}/value?${params}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UpdateSettingResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to update setting value:', error);
      return false;
    }
  }

  /**
   * Get active modes for user
   */
  static async getActiveModes(userId: number): Promise<{
    godMode: boolean;
    developerMode: boolean;
    debugMode: boolean;
    maintenanceMode: boolean;
  }> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/modes?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ActiveModesResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch active modes:', error);
      return {
        godMode: false,
        developerMode: false,
        debugMode: false,
        maintenanceMode: false,
      };
    }
  }

  /**
   * Toggle developer mode
   */
  static async toggleDeveloperMode(userId: number): Promise<boolean> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/toggle-developer-mode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UpdateSettingResponse = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to toggle developer mode:', error);
      return false;
    }
  }

  /**
   * Initialize predefined settings
   */
  static async initializePredefinedSettings(createdBy: number): Promise<void> {
    try {
      const authToken = await ApiAuthService.getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${BASE_URL}/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createdBy }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to initialize predefined settings:', error);
      throw error;
    }
  }
}