/**
 * Platform Admin Service
 * 
 * Handles platform administration through authenticated NestJS API calls
 * Replaces direct database access with proper middleware flow
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  // Add other tenant fields as needed
}

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  // Add other subscription fields as needed
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  // Add other plan fields as needed
}

interface Feature {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  // Add other feature fields as needed
}

export class PlatformAdminService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.178.94:3001';

  private static async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    try {
      // Get auth token from session/cookie
      // This will be implemented when we fix authentication token handling
      const authToken = 'TODO: Get from session';
      
      const response = await fetch(`${this.API_BASE_URL}/api/v2${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        cache: 'no-store' // Always get fresh data for admin operations
      });

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success || !result.data) {
        console.error('API returned error:', result.error, result.message);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error(`Error calling API endpoint ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Get all tenants (requires platform.tenants.view permission)
   */
  static async getTenants(): Promise<Tenant[]> {
    const data = await this.makeAuthenticatedRequest<Tenant[]>('/platform/system/tenants');
    return data || [];
  }

  /**
   * Get specific tenant by ID
   */
  static async getTenant(tenantId: string): Promise<Tenant | null> {
    return await this.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}`);
  }

  /**
   * Get all subscriptions (requires platform.subscriptions.view permission)
   */
  static async getSubscriptions(): Promise<Subscription[]> {
    const data = await this.makeAuthenticatedRequest<Subscription[]>('/platform/system/subscriptions');
    return data || [];
  }

  /**
   * Get specific subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return await this.makeAuthenticatedRequest<Subscription>(`/platform/system/subscriptions/${subscriptionId}`);
  }

  /**
   * Create new subscription (requires platform.subscriptions.create permission)
   */
  static async createSubscription(subscriptionData: {
    tenantId: string;
    planId: string;
    startDate: string;
    endDate?: string;
    status: string;
  }): Promise<Subscription | null> {
    return await this.makeAuthenticatedRequest<Subscription>('/platform/system/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }

  /**
   * Update subscription (requires platform.subscriptions.update permission)
   */
  static async updateSubscription(subscriptionId: string, subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    return await this.makeAuthenticatedRequest<Subscription>(`/platform/system/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData)
    });
  }

  /**
   * Delete subscription (requires platform.subscriptions.delete permission)
   */
  static async deleteSubscription(subscriptionId: string): Promise<boolean> {
    const result = await this.makeAuthenticatedRequest<any>(`/platform/system/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Get all subscription plans (requires platform.plans.view permission)
   */
  static async getPlans(): Promise<Plan[]> {
    const data = await this.makeAuthenticatedRequest<Plan[]>('/platform/system/plans');
    return data || [];
  }

  /**
   * Get specific plan by ID
   */
  static async getPlan(planId: string): Promise<Plan | null> {
    return await this.makeAuthenticatedRequest<Plan>(`/platform/system/plans/${planId}`);
  }

  /**
   * Create new plan (requires platform.plans.create permission)
   */
  static async createPlan(planData: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: { featureId: string; limit: number }[];
  }): Promise<Plan | null> {
    return await this.makeAuthenticatedRequest<Plan>('/platform/system/plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  }

  /**
   * Update plan (requires platform.plans.update permission)
   */
  static async updatePlan(planId: string, planData: Partial<Plan>): Promise<Plan | null> {
    return await this.makeAuthenticatedRequest<Plan>(`/platform/system/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData)
    });
  }

  /**
   * Delete plan (requires platform.plans.delete permission)
   */
  static async deletePlan(planId: string): Promise<boolean> {
    const result = await this.makeAuthenticatedRequest<any>(`/platform/system/plans/${planId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Get all features (requires platform.features.view permission)
   */
  static async getFeatures(): Promise<Feature[]> {
    const data = await this.makeAuthenticatedRequest<Feature[]>('/platform/system/features');
    return data || [];
  }

  /**
   * Get specific feature by ID
   */
  static async getFeature(featureId: string): Promise<Feature | null> {
    return await this.makeAuthenticatedRequest<Feature>(`/platform/system/features/${featureId}`);
  }

  /**
   * Create new feature (requires platform.features.create permission)
   */
  static async createFeature(featureData: {
    key: string;
    name: string;
    description?: string;
  }): Promise<Feature | null> {
    return await this.makeAuthenticatedRequest<Feature>('/platform/system/features', {
      method: 'POST',
      body: JSON.stringify(featureData)
    });
  }

  /**
   * Update feature (requires platform.features.update permission)
   */
  static async updateFeature(featureId: string, featureData: {
    key?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Feature | null> {
    return await this.makeAuthenticatedRequest<Feature>(`/platform/system/features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(featureData)
    });
  }

  /**
   * Delete feature (requires platform.features.delete permission)
   */
  static async deleteFeature(featureId: string): Promise<boolean> {
    const result = await this.makeAuthenticatedRequest<any>(`/platform/system/features/${featureId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }

  /**
   * Create new tenant (requires platform.tenants.create permission)
   */
  static async createTenant(tenantData: Partial<Tenant>): Promise<Tenant | null> {
    return await this.makeAuthenticatedRequest<Tenant>('/platform/system/tenants', {
      method: 'POST',
      body: JSON.stringify(tenantData)
    });
  }

  /**
   * Update tenant (requires platform.tenants.update permission)
   */
  static async updateTenant(tenantId: string, tenantData: Partial<Tenant>): Promise<Tenant | null> {
    return await this.makeAuthenticatedRequest<Tenant>(`/platform/system/tenants/${tenantId}`, {
      method: 'PUT',
      body: JSON.stringify(tenantData)
    });
  }

  /**
   * Delete tenant (requires platform.tenants.delete permission)
   */
  static async deleteTenant(tenantId: string): Promise<boolean> {
    const result = await this.makeAuthenticatedRequest<any>(`/platform/system/tenants/${tenantId}`, {
      method: 'DELETE'
    });
    return result !== null;
  }
}