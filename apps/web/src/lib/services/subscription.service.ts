/**
 * Subscription Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All subscription operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';
import { auditService } from '@/lib/services/audit.service';

export interface SubscriptionPlan {
  id: string;
  uuid: string;
  planType: string;
  name: string;
  description?: string;
  features: any;
  limits: any;
  price: number;
  currency: string;
  billingPeriod: string;
  isActive: boolean;
  tenantId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformFeature {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  featureKey: string;
  category: string;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureLimit {
  id: string;
  uuid: string;
  featureId: string;
  planId: string;
  limitType: string;
  limitValue: number;
  resetPeriod?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFilters {
  tenantId?: number;
  subscriptionType?: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export class SubscriptionService {
  private static instance: SubscriptionService;
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/plans`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plans: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch subscription plans', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/plans/${id}`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plan: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch subscription plan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  async getSubscriptions(
    filters: SubscriptionFilters, 
    pagination: PaginationParams
  ): Promise<{ subscriptions: SubscriptionPlan[]; total: number }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      // Add pagination
      queryParams.append('limit', String(pagination.limit));
      queryParams.append('offset', String(pagination.offset));

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/subscriptions?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        subscriptions: data.data?.items || data.items || [],
        total: data.data?.total || data.total || 0
      };
    } catch (error) {
      logger.error('Failed to fetch subscriptions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        pagination
      });
      throw error;
    }
  }

  async createSubscription(planData: any): Promise<SubscriptionPlan> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/plans`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create subscription plan: ${response.statusText}`);
      }

      const result = await response.json();
      const newPlan = result.data || result;

      // Audit logging
      await auditService.logEntityChange(
        0, // tenantId (assuming global for platform plans)
        'subscription_plan',
        newPlan.id,
        'create',
        0, // TODO: Get actual userId from session
        null,
        newPlan,
        { name: newPlan.name, type: newPlan.planType }
      );

      logger.info('Subscription plan created', {
        id: newPlan.id,
        name: newPlan.name,
        type: newPlan.planType
      });

      return newPlan;
    } catch (error) {
      logger.error('Failed to create subscription plan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planData
      });
      throw error;
    }
  }

  async updateSubscriptionPlan(id: string, plan: any): Promise<SubscriptionPlan> {
    try {
      // Get existing plan for audit
      const existingPlan = await this.getSubscriptionPlan(id);
      if (!existingPlan) {
        throw new Error('Subscription plan not found');
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/plans/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        throw new Error(`Failed to update subscription plan: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedPlan = result.data || result;

      // Audit logging
      await auditService.logEntityChange(
        0, // tenantId (assuming global for platform plans)
        'subscription_plan',
        updatedPlan.id,
        'update',
        0, // TODO: Get actual userId from session
        existingPlan,
        updatedPlan,
        { name: updatedPlan.name, type: updatedPlan.planType }
      );

      logger.info('Subscription plan updated', {
        id: updatedPlan.id,
        name: updatedPlan.name
      });

      return updatedPlan;
    } catch (error) {
      logger.error('Failed to update subscription plan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        plan
      });
      throw error;
    }
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    try {
      // Get existing plan for audit
      const existingPlan = await this.getSubscriptionPlan(id);
      if (!existingPlan) {
        throw new Error('Subscription plan not found');
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/plans/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete subscription plan: ${response.statusText}`);
      }

      // Audit logging
      await auditService.logEntityChange(
        0, // tenantId (assuming global for platform plans)
        'subscription_plan',
        id,
        'delete',
        0, // TODO: Get actual userId from session
        existingPlan,
        null,
        { name: existingPlan.name, type: existingPlan.planType }
      );

      logger.info('Subscription plan deleted', { id });

      return true;
    } catch (error) {
      logger.error('Failed to delete subscription plan', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  // ============================
  // FEATURE MANAGEMENT
  // ============================

  async getFeatures(): Promise<PlatformFeature[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/features`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch features: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch features', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getFeature(id: string): Promise<PlatformFeature | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/features/${id}`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch feature: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch feature', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  async createFeature(featureData: any): Promise<PlatformFeature> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/features`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featureData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create feature: ${response.statusText}`);
      }

      const result = await response.json();
      const newFeature = result.data || result;

      logger.info('Feature created', {
        id: newFeature.id,
        name: newFeature.name,
        key: newFeature.featureKey
      });

      return newFeature;
    } catch (error) {
      logger.error('Failed to create feature', {
        error: error instanceof Error ? error.message : 'Unknown error',
        featureData
      });
      throw error;
    }
  }

  async updateFeature(id: string, featureData: any): Promise<PlatformFeature> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/features/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featureData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update feature: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedFeature = result.data || result;

      logger.info('Feature updated', {
        id: updatedFeature.id,
        name: updatedFeature.name
      });

      return updatedFeature;
    } catch (error) {
      logger.error('Failed to update feature', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        featureData
      });
      throw error;
    }
  }

  async deleteFeature(id: string): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/features/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete feature: ${response.statusText}`);
      }

      logger.info('Feature deleted', { id });

      return true;
    } catch (error) {
      logger.error('Failed to delete feature', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  // ============================
  // LIMIT MANAGEMENT
  // ============================

  async getLimits(planId?: string): Promise<FeatureLimit[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = planId ? `?planId=${planId}` : '';
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/subscriptions/limits${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch limits: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch limits', {
        error: error instanceof Error ? error.message : 'Unknown error',
        planId
      });
      throw error;
    }
  }

  async getLimit(id: string): Promise<FeatureLimit | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/limits/${id}`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch limit: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  async createLimit(limitData: any): Promise<FeatureLimit> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/limits`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limitData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create limit: ${response.statusText}`);
      }

      const result = await response.json();
      const newLimit = result.data || result;

      logger.info('Limit created', {
        id: newLimit.id,
        featureId: newLimit.featureId,
        planId: newLimit.planId
      });

      return newLimit;
    } catch (error) {
      logger.error('Failed to create limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        limitData
      });
      throw error;
    }
  }

  async updateLimit(id: string, limitData: any): Promise<FeatureLimit> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/limits/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(limitData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update limit: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedLimit = result.data || result;

      logger.info('Limit updated', { id: updatedLimit.id });

      return updatedLimit;
    } catch (error) {
      logger.error('Failed to update limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        limitData
      });
      throw error;
    }
  }

  async deleteLimit(id: string): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/subscriptions/limits/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete limit: ${response.statusText}`);
      }

      logger.info('Limit deleted', { id });

      return true;
    } catch (error) {
      logger.error('Failed to delete limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  // ============================
  // TENANT SUBSCRIPTION MANAGEMENT
  // ============================

  async getTenantSubscription(tenantId: number): Promise<any | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/tenants/${tenantId}/subscription`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant subscription: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch tenant subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      throw error;
    }
  }

  async assignSubscriptionToTenant(tenantId: number, planId: string): Promise<any> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/tenants/${tenantId}/subscription`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to assign subscription: ${response.statusText}`);
      }

      const result = await response.json();
      const subscription = result.data || result;

      logger.info('Subscription assigned to tenant', {
        tenantId,
        planId,
        subscriptionId: subscription.id
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to assign subscription to tenant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        planId
      });
      throw error;
    }
  }

  async updateTenantSubscription(tenantId: number, subscriptionData: any): Promise<any> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/tenants/${tenantId}/subscription`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update tenant subscription: ${response.statusText}`);
      }

      const result = await response.json();
      const subscription = result.data || result;

      logger.info('Tenant subscription updated', {
        tenantId,
        subscriptionId: subscription.id
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to update tenant subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        subscriptionData
      });
      throw error;
    }
  }

  async cancelTenantSubscription(tenantId: number): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/tenants/${tenantId}/subscription`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel tenant subscription: ${response.statusText}`);
      }

      logger.info('Tenant subscription cancelled', { tenantId });

      return true;
    } catch (error) {
      logger.error('Failed to cancel tenant subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();