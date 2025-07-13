/**
 * Tenants API Client Service
 * 
 * Handles tenant management through authenticated NestJS API calls
 * Replaces direct database access with proper middleware flow
 */

import { ApiAuthService } from './api-auth.service';

interface Tenant {
  id: string;
  uuid: string;
  name: string;
  domain: string;
  slug: string | null;
  description: unknown;
  defaultCurrency: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
  plan?: string;
  currency?: string;
  userCount?: number;
  accountCount?: number;
  status?: string;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  newTenantsToday: number;
}

interface TenantFilters {
  statuses: { value: string; label: string; count: number }[];
  currencies: { value: string; label: string; count: number }[];
}

export class TenantsApiService {

  /**
   * Get all tenants with pagination and filtering (requires platform.tenants.view permission)
   */
  static async getTenants(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'suspended' | 'trial' | 'expired';
    plan?: string;
  }): Promise<{ items: Tenant[]; pagination: any } | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/system/tenants${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<{ items: Tenant[]; pagination: any }>(endpoint);
  }

  /**
   * Get tenant by ID (requires platform.tenants.view permission)
   */
  static async getTenant(tenantId: string): Promise<Tenant | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}`);
  }

  /**
   * Create new tenant (requires platform.tenants.create permission)
   */
  static async createTenant(tenantData: {
    name: string;
    domain: string;
    slug?: string;
    description?: string;
    defaultCurrency?: string;
    isActive?: boolean;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<Tenant | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Tenant>('/platform/system/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData)
    });
  }

  /**
   * Update tenant (requires platform.tenants.update permission)
   */
  static async updateTenant(tenantId: string, tenantData: {
    name?: string;
    domain?: string;
    slug?: string;
    description?: string;
    defaultCurrency?: string;
    isActive?: boolean;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<Tenant | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData)
    });
  }

  /**
   * Delete tenant (requires platform.tenants.delete permission)
   */
  static async deleteTenant(tenantId: string): Promise<boolean> {
    const result = await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Suspend tenant (requires platform.tenants.suspend permission)
   */
  static async suspendTenant(tenantId: string, data: { reason: string; notifyUsers?: boolean }): Promise<Tenant | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}/suspend`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Activate tenant (requires platform.tenants.activate permission)
   */
  static async activateTenant(tenantId: string): Promise<Tenant | null> {
    return await ApiAuthService.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}/activate`, {
      method: 'POST'
    });
  }

  /**
   * Get tenant statistics (requires platform.tenants.view permission)
   */
  static async getTenantStats(tenantId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/stats`);
  }

  /**
   * Get tenant usage metrics (requires platform.tenants.view permission)
   */
  static async getTenantUsage(tenantId: string, query?: {
    metric?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/system/tenants/${tenantId}/usage${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<any>(endpoint);
  }

  /**
   * Get tenant subscription details (requires platform.tenants.view permission)
   */
  static async getTenantSubscription(tenantId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/subscription`);
  }

  /**
   * Update tenant subscription (requires platform.tenants.manage-subscription permission)
   */
  static async updateTenantSubscription(tenantId: string, data: {
    planId: string;
    expiresAt?: string;
    customLimits?: Record<string, number>;
  }): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Get tenant features (requires platform.tenants.view permission)
   */
  static async getTenantFeatures(tenantId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/features`);
  }

  /**
   * Enable tenant feature (requires platform.tenants.manage-features permission)
   */
  static async enableFeature(tenantId: string, featureId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/features/${featureId}/enable`, {
      method: 'POST'
    });
  }

  /**
   * Disable tenant feature (requires platform.tenants.manage-features permission)
   */
  static async disableFeature(tenantId: string, featureId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/features/${featureId}/disable`, {
      method: 'POST'
    });
  }

  /**
   * Get tenant settings (requires platform.tenants.view permission)
   */
  static async getTenantSettings(tenantId: string): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/settings`);
  }

  /**
   * Update tenant settings (requires platform.tenants.update permission)
   */
  static async updateTenantSettings(tenantId: string, settings: Record<string, any>): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  /**
   * Create tenant backup (requires platform.tenants.backup permission)
   */
  static async createTenantBackup(tenantId: string, data: { includeMedia?: boolean; compress?: boolean }): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/backup`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Export tenant data (requires platform.tenants.export permission)
   */
  static async exportTenantData(tenantId: string, query?: { format?: 'json' | 'csv' | 'sql' }): Promise<any | null> {
    const queryString = query ? new URLSearchParams(
      Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const endpoint = `/platform/system/tenants/${tenantId}/export${queryString ? `?${queryString}` : ''}`;
    return await ApiAuthService.makeAuthenticatedRequest<any>(endpoint);
  }

  /**
   * Clone tenant (requires platform.tenants.create permission)
   */
  static async cloneTenant(tenantId: string, data: {
    name: string;
    subdomain: string;
    cloneData?: boolean;
    cloneUsers?: boolean;
    cloneSettings?: boolean;
  }): Promise<any | null> {
    return await ApiAuthService.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}/clone`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}