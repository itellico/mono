'use client';

/**
 * Client-Only Tenant Foundation
 * Provides tenant context without database imports for client components
 */

import { createTenantLogger } from './logging';

/**
 * Tenant context interface
 */
export interface TenantContext {
  id: number;
  domain: string;
  name: string;
  subscriptionTier: string;
  limits: {
    maxUsers: number;
    maxStorage: string;
    maxApiCalls: number;
    currentUsers: number;
    currentStorage: string;
    currentApiCalls: number;
  };
}

/**
 * Client-only tenant service (no database operations)
 */
export class ClientTenantService {
  private context: TenantContext | null = null;
  private log = createTenantLogger('ClientTenantService');

  /**
   * Set tenant context from API response
   */
  async setTenantContext(tenantId: number): Promise<void> {
    try {
      // Fetch tenant data via API instead of direct database access
      const response = await fetch(`/api/v1/tenants/${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant: ${response.status}`);
      }

      const { data: tenant } = await response.json();

      this.context = {
        id: tenant.id,
        domain: tenant.domain,
        name: tenant.name,
        subscriptionTier: tenant.subscriptionTier,
        limits: {
          maxUsers: this.getSubscriptionLimit('maxUsers', tenant.subscriptionTier),
          maxStorage: this.getSubscriptionLimit('maxStorage', tenant.subscriptionTier),
          maxApiCalls: this.getSubscriptionLimit('maxApiCalls', tenant.subscriptionTier),
          currentUsers: tenant.currentUsers || 0,
          currentStorage: tenant.currentStorage || '0MB',
          currentApiCalls: tenant.currentApiCalls || 0
        }
      };

      this.log = createTenantLogger('ClientTenantService', tenantId);
      this.log.debug('Client tenant context set', { tenantId, domain: tenant.domain });
    } catch (error) {
      this.log.error('Failed to set tenant context', { tenantId, error });
      throw error;
    }
  }

  /**
   * Get current tenant context
   */
  getCurrentTenant(): TenantContext {
    if (!this.context) {
      throw new Error('Tenant context not set. Call setTenantContext() first.');
    }
    return this.context;
  }

  /**
   * Check if an action is within subscription limits (client-side validation)
   */
  canPerformAction(action: string, count: number = 1): boolean {
    try {
      const tenant = this.getCurrentTenant();

      switch (action) {
        case 'create_user':
          return tenant.limits.currentUsers + count <= tenant.limits.maxUsers;

        case 'api_call':
          return tenant.limits.currentApiCalls + count <= tenant.limits.maxApiCalls;

        default:
          this.log.debug('Unknown action for limit check', { action });
          return true;
      }
    } catch (error) {
      this.log.error('Error checking action limits', { action, error });
      return false;
    }
  }

  /**
   * Get subscription limits based on tier
   */
  private getSubscriptionLimit(limitType: string, tier: string): any {
    const limits = {
      basic: {
        maxUsers: 10,
        maxStorage: '1GB',
        maxApiCalls: 1000
      },
      premium: {
        maxUsers: 100,
        maxStorage: '10GB',
        maxApiCalls: 10000
      },
      enterprise: {
        maxUsers: 1000,
        maxStorage: '100GB',
        maxApiCalls: 100000
      }
    };

    return limits[tier]?.[limitType] || limits.basic[limitType];
  }
}

/**
 * React hook for client tenant service
 */
export function useTenantService(): ClientTenantService {
  // Create a new instance for each component
  return new ClientTenantService();
} 