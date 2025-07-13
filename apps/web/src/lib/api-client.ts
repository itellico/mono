'use client';

import { ApiResponse, AuthTokens, AuthUser } from '@mono/shared';

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  onAuthError?: () => void;
}

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private onAuthError?: () => void;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.onAuthError = config.onAuthError;

    // TODO: Load tokens from new auth system
    // if (typeof window !== 'undefined') {
    //   this.accessToken = localStorage.getItem('accessToken');
    //   this.refreshToken = localStorage.getItem('refreshToken');
    // }
  }

  private async request<T = any>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, ...init } = config;

    // Build URL with query params
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Request deduplication for GET requests
    const method = init.method || 'GET';
    const requestKey = `${method}-${url.toString()}`;
    
    if (method === 'GET' && this.pendingRequests.has(requestKey)) {
      // Return existing promise for identical GET requests
      return this.pendingRequests.get(requestKey);
    }

    // Add default headers
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Auth is handled via cookies with credentials: 'include'
    // No need to manually add Authorization header

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Create request promise
    const requestPromise = (async () => {
      try {
        const response = await fetch(url.toString(), {
          ...init,
          headers,
          signal: controller.signal,
          credentials: 'include', // Include cookies for authentication
        });

        clearTimeout(timeoutId);

        // Handle 401 Unauthorized
        if (response.status === 401 && !skipAuth && this.refreshToken) {
          // Try to refresh token
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken();
          }
          
          await this.refreshPromise;
          this.refreshPromise = null;

          // Retry request with new token
          if (this.accessToken) {
            headers.set('Authorization', `Bearer ${this.accessToken}`);
            return this.request<T>(path, config);
          }
        }

        const data = await response.json();

        if (!response.ok) {
          throw new ApiError(data.error || 'Request failed', response.status, data);
        }

        return data as ApiResponse<T>;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof ApiError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new ApiError('Request timeout', 408);
          }
          throw new ApiError(error.message, 0);
        }

        throw new ApiError('Unknown error occurred', 0);
      } finally {
        // Clean up pending request
        if (method === 'GET') {
          this.pendingRequests.delete(requestKey);
        }
      }
    })();

    // Store promise for deduplication
    if (method === 'GET') {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.clearTokens();
      throw new ApiError('No refresh token available', 401);
    }

    try {
      const response = await this.request<{ tokens: AuthTokens }>(
        '/api/v1/public/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          skipAuth: true,
        }
      );

      if (response.success && response.data) {
        this.setTokens(response.data.tokens);
      } else {
        throw new ApiError('Failed to refresh token', 401);
      }
    } catch (error) {
      this.clearTokens();
      this.onAuthError?.();
      throw error;
    }
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;

    // TODO: Implement new token storage mechanism
    // if (typeof window !== 'undefined') {
    //   localStorage.setItem('accessToken', tokens.accessToken);
    //   localStorage.setItem('refreshToken', tokens.refreshToken);
      
    //   // Also set as cookies for server-side access
    //   // Note: These are not httpOnly, so they can be accessed by JS
    //   // For production, tokens should be set as httpOnly cookies by the server
    //   document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    //   document.cookie = `refreshToken=${tokens.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    // }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    // TODO: Implement new token clearing mechanism
    // if (typeof window !== 'undefined') {
    //   localStorage.removeItem('accessToken');
    //   localStorage.removeItem('refreshToken');
      
    //   // Also clear cookies
    //   document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    //   document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // HTTP methods
  async get<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  async post<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...config,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{
    user: AuthUser;
    tokens: AuthTokens;
  }>> {
    const response = await this.post('/api/v1/public/auth/login', { email, password }, { skipAuth: true });
    if (response.success && response.data) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{
    user: AuthUser;
    tokens: AuthTokens;
  }>> {
    const response = await this.post('/api/v1/public/auth/register', data, { skipAuth: true });
    if (response.success && response.data) {
      this.setTokens(response.data.tokens);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/api/v1/public/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.get('/api/v1/public/auth/me');
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse<{ user: any }>> {
    return this.get('/api/v1/users/me');
  }

  async updateUserProfile(data: any): Promise<ApiResponse<{ user: any }>> {
    return this.patch('/api/v1/users/me', data);
  }

  async searchUsers(params: {
    q: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    users: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/users/search', { params });
  }

  // Admin User Management endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    userType?: string;
    isActive?: boolean;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    users: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/admin/users', { params });
  }

  async getUser(uuid: string): Promise<ApiResponse<any>> {
    return this.get(`/api/v1/admin/users/${uuid}`);
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.post('/api/v1/admin/users', data);
  }

  async updateUser(uuid: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    userType?: string;
    isActive?: boolean;
    isVerified?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.patch(`/api/v1/admin/users/${uuid}`, data);
  }

  async deleteUser(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/admin/users/${uuid}`);
  }

  async getUserStatistics(): Promise<ApiResponse<{
    total: number;
    active: number;
    verified: number;
    byUserType: Record<string, number>;
    recentRegistrations: number;
    activityStats: any;
  }>> {
    return this.get('/api/v1/admin/users/statistics');
  }

  async bulkUpdateUsers(data: {
    userIds: string[];
    updates: {
      isActive?: boolean;
      isVerified?: boolean;
      userType?: string;
      metadata?: any;
    };
  }): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.patch('/api/v1/admin/users/bulk', data);
  }

  async exportUsers(params?: {
    format?: 'json' | 'csv';
    userType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ url: string }>> {
    return this.get('/api/v1/admin/users/export', { params });
  }

  // Media endpoints
  async uploadFile(file: File): Promise<ApiResponse<{
    id: string;
    filename: string;
    url: string;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post('/api/v1/media/upload', formData);
  }

  async uploadMultipleFiles(files: File[]): Promise<ApiResponse<{
    files: Array<{
      id: string;
      filename: string;
      url: string;
    }>;
  }>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.post('/api/v1/media/upload/multiple', formData);
  }

  async getUserMedia(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<ApiResponse<{
    media: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/media', { params });
  }

  async deleteMedia(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/media/${id}`);
  }

  // Subscription endpoints
  async getSubscriptionPlans(): Promise<ApiResponse<{ plans: any[] }>> {
    return this.get('/api/v1/subscriptions/plans');
  }

  async getCurrentSubscription(): Promise<ApiResponse<{ subscription: any }>> {
    return this.get('/api/v1/subscriptions/current');
  }

  async subscribeToPlan(planId: number): Promise<ApiResponse<{
    subscription: any;
    paymentUrl?: string;
  }>> {
    return this.post('/api/v1/subscriptions/subscribe', { planId });
  }

  async cancelSubscription(): Promise<ApiResponse<{ message: string }>> {
    return this.post('/api/v1/subscriptions/cancel');
  }

  // Admin endpoints
  async getAdminStats(): Promise<ApiResponse<any>> {
    return this.get('/api/v1/admin/stats');
  }

  async getTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{
    tenants: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/admin/tenants', { params });
  }

  // Categories endpoints (Admin)
  async getCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    parentId?: number;
    isActive?: boolean;
    status?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    categories: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/admin/categories', { params });
  }

  async getCategory(uuid: string): Promise<ApiResponse<{ category: any }>> {
    return this.get(`/api/v1/admin/categories/${uuid}`);
  }

  async createCategory(data: {
    name: string;
    type: string;
    description?: string;
    parentId?: number;
    orderIndex?: number;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{ category: any }>> {
    return this.post('/api/v1/admin/categories', data);
  }

  async updateCategory(uuid: string, data: {
    name?: string;
    description?: string;
    orderIndex?: number;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{ category: any }>> {
    return this.patch(`/api/v1/admin/categories/${uuid}`, data);
  }

  async deleteCategory(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/admin/categories/${uuid}`);
  }

  async getCategoryStatistics(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }>> {
    return this.get('/api/v1/admin/categories/stats');
  }

  async bulkCreateCategories(data: {
    categories: Array<{
      name: string;
      type: string;
      description?: string;
      parentId?: number;
      orderIndex?: number;
      isActive?: boolean;
      metadata?: any;
    }>;
  }): Promise<ApiResponse<{ categories: any[] }>> {
    return this.post('/api/v1/admin/categories/bulk/create', data);
  }

  async bulkUpdateCategories(data: {
    categoryIds: string[];
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
      metadata?: any;
    };
  }): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.patch('/api/v1/admin/categories/bulk/update', data);
  }

  async bulkDeleteCategories(data: {
    categoryIds: string[];
  }): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.delete('/api/v1/admin/categories/bulk/delete', data);
  }

  async exportCategories(params?: {
    format?: 'json' | 'csv';
    type?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ url: string }>> {
    return this.get('/api/v1/admin/categories/export', { params });
  }

  async importCategories(data: {
    file: File;
    mode: 'append' | 'replace';
    validateOnly?: boolean;
  }): Promise<ApiResponse<{ 
    imported: number;
    errors: any[];
    preview?: any[];
  }>> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('mode', data.mode);
    if (data.validateOnly) formData.append('validateOnly', 'true');
    
    return this.post('/api/v1/admin/categories/import', formData);
  }

  // Tags endpoints
  async getTags(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    categoryType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{
    tags: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/tags', { params });
  }

  async getTag(uuid: string): Promise<ApiResponse<{ tag: any }>> {
    return this.get(`/api/v1/tags/${uuid}`);
  }

  async createTag(data: {
    name: string;
    categoryId: number;
    description?: string;
    orderIndex?: number;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{ tag: any }>> {
    return this.post('/api/v1/tags', data);
  }

  async createBulkTags(data: {
    tags: Array<{
      name: string;
      categoryId: number;
      description?: string;
    }>;
  }): Promise<ApiResponse<{
    created: number;
    tags: any[];
  }>> {
    return this.post('/api/v1/tags/bulk', data);
  }

  async updateTag(uuid: string, data: {
    name?: string;
    description?: string;
    orderIndex?: number;
    isActive?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{ tag: any }>> {
    return this.patch(`/api/v1/tags/${uuid}`, data);
  }

  async deleteTag(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/tags/${uuid}`);
  }

  // Permissions endpoints
  async getUserPermissions(userId?: string): Promise<ApiResponse<{
    permissions: string[];
    roles: string[];
    tenantId: number;
    cached: boolean;
    source: string;
  }>> {
    return this.get('/api/v1/permissions', { params: userId ? { userId } : undefined });
  }

  async checkPermission(permission: string, userId?: string): Promise<ApiResponse<{
    hasPermission: boolean;
    permission: string;
    userId: string;
  }>> {
    return this.post('/api/v1/permissions/check', { permission, userId });
  }

  async checkBulkPermissions(permissions: string[], userId?: string): Promise<ApiResponse<{
    results: Array<{ permission: string; hasPermission: boolean }>;
    userId: string;
  }>> {
    return this.post('/api/v1/permissions/bulk', { permissions, userId });
  }

  async getAllPermissions(): Promise<ApiResponse<{
    permissions: Array<{
      id: number;
      name: string;
      description?: string;
      category?: string;
    }>;
  }>> {
    return this.get('/api/v1/permissions/all');
  }

  async getAllRoles(): Promise<ApiResponse<{
    roles: Array<{
      id: number;
      name: string;
      description?: string;
      permissions: string[];
    }>;
  }>> {
    return this.get('/api/v1/permissions/roles');
  }

  // Forms endpoints
  async getForms(params?: {
    page?: number;
    limit?: number;
    status?: string;
    formType?: string;
    search?: string;
    tenantId?: string;
  }): Promise<ApiResponse<{
    forms: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/forms', { params });
  }

  async getForm(uuid: string): Promise<ApiResponse<{ form: any }>> {
    return this.get(`/api/v1/forms/${uuid}`);
  }

  async createForm(data: {
    name: string;
    description?: string;
    status?: string;
    formType: string;
    schema: any;
    isPublic?: boolean;
    allowAnonymous?: boolean;
    maxSubmissions?: number;
    expiresAt?: string;
  }): Promise<ApiResponse<{ form: any }>> {
    return this.post('/api/v1/forms', data);
  }

  async updateForm(uuid: string, data: {
    name?: string;
    description?: string;
    status?: string;
    schema?: any;
    isPublic?: boolean;
    allowAnonymous?: boolean;
    maxSubmissions?: number;
    expiresAt?: string;
  }): Promise<ApiResponse<{ form: any }>> {
    return this.patch(`/api/v1/forms/${uuid}`, data);
  }

  async deleteForm(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/forms/${uuid}`);
  }

  async getAvailableSchemas(): Promise<ApiResponse<{
    schemas: Array<{
      id: number;
      uuid: string;
      name: string;
      description?: string;
      category: string;
      fields: any;
    }>;
  }>> {
    return this.get('/api/v1/forms/available-schemas');
  }

  async generateFormFromSchema(data: {
    schemaId: number;
    formName: string;
    formType: string;
    includeValidation?: boolean;
    includeLabels?: boolean;
  }): Promise<ApiResponse<{ form: any }>> {
    return this.post('/api/v1/forms/generate-from-schema', data);
  }

  // Workflows endpoints
  async getWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: string;
    trigger?: string;
    search?: string;
    category?: string;
  }): Promise<ApiResponse<{
    workflows: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/workflows', { params });
  }

  // Model Schemas endpoints
  async getModelSchemas(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    tenantId?: number;
  }): Promise<ApiResponse<{
    schemas: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/model-schemas', { params });
  }

  async getModelSchema(uuid: string): Promise<ApiResponse<{ schema: any }>> {
    return this.get(`/api/v1/model-schemas/${uuid}`);
  }

  async createModelSchema(data: {
    name: string;
    description?: string;
    category: string;
    status?: string;
    fields: any;
    validation?: any;
    metadata?: any;
  }): Promise<ApiResponse<{ schema: any }>> {
    return this.post('/api/v1/model-schemas', data);
  }

  async updateModelSchema(uuid: string, data: {
    name?: string;
    description?: string;
    category?: string;
    status?: string;
    fields?: any;
    validation?: any;
    metadata?: any;
  }): Promise<ApiResponse<{ schema: any }>> {
    return this.patch(`/api/v1/model-schemas/${uuid}`, data);
  }

  async deleteModelSchema(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/model-schemas/${uuid}`);
  }

  async duplicateModelSchema(uuid: string, data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<{ schema: any }>> {
    return this.post(`/api/v1/model-schemas/${uuid}/duplicate`, data);
  }

  async exportModelSchemas(params?: {
    format?: string;
    category?: string;
    status?: string;
  }): Promise<any> {
    return this.get('/api/v1/model-schemas/export/all', { params });
  }

  async importModelSchemas(data: {
    schemas: any[];
    conflictResolution?: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/api/v1/model-schemas/import', data);
  }

  // Option Sets endpoints
  async getOptionSets(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isGlobal?: boolean;
    tenantId?: number;
  }): Promise<ApiResponse<{
    optionSets: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/option-sets', { params });
  }

  async getOptionSet(uuid: string): Promise<ApiResponse<{ optionSet: any }>> {
    return this.get(`/api/v1/option-sets/${uuid}`);
  }

  async createOptionSet(data: {
    name: string;
    description?: string;
    category: string;
    isGlobal?: boolean;
    allowCustomValues?: boolean;
    isRequired?: boolean;
    metadata?: any;
    values?: Array<{
      value: string;
      label: string;
      description?: string;
      orderIndex?: number;
      metadata?: any;
    }>;
  }): Promise<ApiResponse<{ optionSet: any }>> {
    return this.post('/api/v1/option-sets', data);
  }

  async updateOptionSet(uuid: string, data: {
    name?: string;
    description?: string;
    category?: string;
    allowCustomValues?: boolean;
    isRequired?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{ optionSet: any }>> {
    return this.patch(`/api/v1/option-sets/${uuid}`, data);
  }

  async deleteOptionSet(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/option-sets/${uuid}`);
  }

  async getOptionValues(uuid: string, params?: {
    search?: string;
  }): Promise<ApiResponse<{ values: any[] }>> {
    return this.get(`/api/v1/option-sets/${uuid}/values`, { params });
  }

  async addOptionValue(uuid: string, data: {
    value: string;
    label: string;
    description?: string;
    orderIndex?: number;
    metadata?: any;
  }): Promise<ApiResponse<{ value: any }>> {
    return this.post(`/api/v1/option-sets/${uuid}/values`, data);
  }

  async exportOptionSets(params?: {
    format?: string;
    category?: string;
    includeGlobal?: boolean;
  }): Promise<any> {
    return this.get('/api/v1/option-sets/export/all', { params });
  }

  // Notifications endpoints
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }): Promise<ApiResponse<{
    notifications: any[];
    pagination: any;
    unreadCount: number;
  }>> {
    return this.get('/api/v1/notifications', { params });
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse<{ notification: any }>> {
    return this.patch(`/api/v1/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ updated: number }>> {
    return this.patch('/api/v1/notifications/read-all');
  }

  async deleteNotification(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/notifications/${id}`);
  }

  async getNotificationPreferences(): Promise<ApiResponse<{ preferences: any }>> {
    return this.get('/api/v1/notifications/preferences');
  }

  async updateNotificationPreferences(data: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    categories?: any;
  }): Promise<ApiResponse<{ preferences: any }>> {
    return this.put('/api/v1/notifications/preferences', data);
  }

  async sendNotification(data: {
    userId?: number;
    tenantId?: number;
    type: string;
    priority?: string;
    title: string;
    message: string;
    data?: any;
    channels?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    scheduledFor?: string;
  }): Promise<ApiResponse<{ notification: any }>> {
    return this.post('/api/v1/notifications/send', data);
  }

  async getNotificationTemplates(params?: {
    category?: string;
    type?: string;
  }): Promise<ApiResponse<{ templates: any[] }>> {
    return this.get('/api/v1/notifications/templates', { params });
  }

  async createNotificationTemplate(data: {
    name: string;
    description?: string;
    category: string;
    type: string;
    titleTemplate: string;
    messageTemplate: string;
    variables?: string[];
    defaultChannels?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  }): Promise<ApiResponse<{ template: any }>> {
    return this.post('/api/v1/notifications/templates', data);
  }

  // Tenants endpoints
  async getTenants(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    domain?: string;
  }): Promise<ApiResponse<{
    tenants: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/tenants', { params });
  }

  async getTenant(uuid: string): Promise<ApiResponse<{ tenant: any }>> {
    return this.get(`/api/v1/tenants/${uuid}`);
  }

  async createTenant(data: {
    name: string;
    domain: string;
    slug?: string;
    description?: any;
    features?: any;
    settings?: any;
    categories?: any;
    allowedCountries?: any;
    defaultCurrency?: string;
    isActive?: boolean;
    planId?: number;
  }): Promise<ApiResponse<{ tenant: any }>> {
    return this.post('/api/v1/tenants', data);
  }

  async updateTenant(uuid: string, data: {
    name?: string;
    domain?: string;
    slug?: string;
    description?: any;
    features?: any;
    settings?: any;
    categories?: any;
    allowedCountries?: any;
    defaultCurrency?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{ tenant: any }>> {
    return this.patch(`/api/v1/tenants/${uuid}`, data);
  }

  async deleteTenant(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/tenants/${uuid}`);
  }

  async getTenantStats(uuid: string): Promise<ApiResponse<{ stats: any }>> {
    return this.get(`/api/v1/tenants/${uuid}/stats`);
  }

  async updateTenantSubscription(uuid: string, data: {
    planId: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<{ subscription: any }>> {
    return this.post(`/api/v1/tenants/${uuid}/subscription`, data);
  }

  async getTenantConfig(uuid: string): Promise<ApiResponse<{ config: any }>> {
    return this.get(`/api/v1/tenants/${uuid}/config`);
  }

  // Translations endpoints
  async getTranslations(params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    languageCode?: string;
    key?: string;
    search?: string;
    needsReview?: boolean;
    isAutoTranslated?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{
    translations: any[];
    pagination: any;
  }>> {
    return this.get('/api/v1/admin/translations', { params });
  }

  async getTranslationKeys(entityType?: string): Promise<ApiResponse<any[]>> {
    const params = entityType ? { entityType } : undefined;
    return this.get('/api/v1/admin/translations/keys', { params });
  }

  async getTranslationStatistics(): Promise<ApiResponse<{
    languages: any[];
    totalKeys: number;
    entityTypes: string[];
  }>> {
    return this.get('/api/v1/admin/translations/statistics');
  }

  async createTranslation(data: {
    entityType: string;
    entityId: string;
    languageCode: string;
    key: string;
    value: string;
    context?: string;
    isAutoTranslated?: boolean;
    needsReview?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.post('/api/v1/admin/translations', data);
  }

  async updateTranslation(id: string, data: {
    value?: string;
    context?: string;
    isAutoTranslated?: boolean;
    needsReview?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.patch(`/api/v1/admin/translations/${id}`, data);
  }

  async deleteTranslation(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/admin/translations/${id}`);
  }

  async autoTranslateText(data: {
    text: string;
    fromLanguage: string;
    toLanguage: string;
    context?: string;
  }): Promise<ApiResponse<{
    originalText: string;
    translatedText: string;
    fromLanguage: string;
    toLanguage: string;
    context: string | null;
  }>> {
    return this.post('/api/v1/admin/translations/auto-translate', data);
  }

  async bulkUpdateTranslations(filters: {
    entityType?: string;
    entityId?: string;
    languageCode?: string;
    key?: string;
    needsReview?: boolean;
    isAutoTranslated?: boolean;
  }, updates: {
    value?: string;
    isAutoTranslated?: boolean;
    needsReview?: boolean;
  }): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.patch('/api/v1/admin/translations/bulk', { filters, updates });
  }

  async lookupTranslation(
    entityType: string,
    entityId: string,
    languageCode: string,
    key: string
  ): Promise<ApiResponse<{
    value: string;
    language: string;
    isDefault: boolean;
  } | null>> {
    return this.get('/api/v1/admin/translations/lookup', {
      params: { entityType, entityId, languageCode, key }
    });
  }

  // Language management endpoints
  async getSupportedLanguages(activeOnly = true, includeGlobal = true): Promise<ApiResponse<any[]>> {
    return this.get('/api/v1/admin/translations/languages', {
      params: { activeOnly, includeGlobal }
    });
  }

  async getDefaultLanguage(): Promise<ApiResponse<any | null>> {
    return this.get('/api/v1/admin/translations/languages/default');
  }

  async createLanguageSettings(data: {
    code: string;
    name: string;
    nativeName: string;
    isActive?: boolean;
    isLive?: boolean;
    fallbackLanguageCode?: string;
    translationPriority?: number;
    autoTranslateEnabled?: boolean;
    qualityThreshold?: number;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.post('/api/v1/admin/translations/languages/management', data);
  }

  async updateLanguageSettings(code: string, data: {
    isActive?: boolean;
    isLive?: boolean;
    fallbackLanguageCode?: string;
    translationPriority?: number;
    autoTranslateEnabled?: boolean;
    qualityThreshold?: number;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.patch(`/api/v1/admin/translations/languages/management/${code}`, data);
  }

  async calculateCompletionPercentages(): Promise<ApiResponse<{
    updated: Array<{
      code: string;
      oldPercentage: string;
      newPercentage: string;
    }>;
    totalLanguages: number;
  }>> {
    return this.post('/api/v1/admin/translations/languages/management/calculate-completion');
  }

  async deleteLanguageSettings(code: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/admin/translations/languages/management/${code}`);
  }

  // String extraction endpoints
  async extractStrings(data: {
    content: string;
    contentType: string;
    extractionRules?: any;
    context?: any;
  }): Promise<ApiResponse<{
    extractedStrings: any[];
    statistics: any;
  }>> {
    return this.post('/api/v1/admin/translations/extract-strings', data);
  }

  async scanProjectStrings(data: {
    projectPath: string;
    filePatterns?: string[];
    excludePatterns?: string[];
    extractionRules?: any;
    maxFiles?: number;
  }): Promise<ApiResponse<{
    scannedFiles: any[];
    allStrings: any[];
    statistics: any;
  }>> {
    return this.post('/api/v1/admin/translations/extract-strings/scan-strings', data);
  }

  // Admin Settings endpoints
  async getAdminSettings(params?: {
    category?: string;
    search?: string;
    isGlobal?: boolean;
  }): Promise<ApiResponse<{
    settings: any[];
    categories: string[];
  }>> {
    return this.get('/api/v1/admin/settings', { params });
  }

  async getAdminSetting(key: string): Promise<ApiResponse<{ setting: any }>> {
    return this.get(`/api/v1/admin/settings/${key}`);
  }

  async setAdminSetting(key: string, data: {
    value: any;
    category?: string;
    description?: string;
    type?: string;
    isPublic?: boolean;
    isGlobal?: boolean;
    validation?: any;
  }): Promise<ApiResponse<{ setting: any }>> {
    return this.put(`/api/v1/admin/settings/${key}`, data);
  }

  async deleteAdminSetting(key: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/admin/settings/${key}`);
  }

  async getSystemInfo(): Promise<ApiResponse<{ system: any }>> {
    return this.get('/api/v1/admin/settings/system/info');
  }

  async updateRBACConfig(data: {
    enableWildcards?: boolean;
    enableInheritance?: boolean;
    enableCaching?: boolean;
    cacheExpirationMinutes?: number;
    maxPermissionsPerUser?: number;
    enableAuditLog?: boolean;
    auditRetentionDays?: number;
  }): Promise<ApiResponse<{ config: any }>> {
    return this.put('/api/v1/admin/settings/rbac/config', data);
  }

  async importAdminSettings(data: {
    settings: Array<{
      key: string;
      value: any;
      category?: string;
      description?: string;
      type?: string;
      isPublic?: boolean;
    }>;
    overwriteExisting?: boolean;
  }): Promise<ApiResponse<{
    imported: number;
    skipped: number;
    errors: string[];
  }>> {
    return this.post('/api/v1/admin/settings/import', data);
  }

  async exportAdminSettings(params?: {
    category?: string;
    includeGlobal?: boolean;
    format?: string;
  }): Promise<any> {
    return this.get('/api/v1/admin/settings/export', { params });
  }

  async getWorkflow(uuid: string): Promise<ApiResponse<{ workflow: any }>> {
    return this.get(`/api/v1/workflows/${uuid}`);
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    trigger: string;
    category?: string;
    definition: any;
    settings?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<{ workflow: any }>> {
    return this.post('/api/v1/workflows', data);
  }

  async updateWorkflow(uuid: string, data: {
    name?: string;
    description?: string;
    status?: string;
    definition?: any;
    settings?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<{ workflow: any }>> {
    return this.patch(`/api/v1/workflows/${uuid}`, data);
  }

  async deleteWorkflow(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/workflows/${uuid}`);
  }

  async executeWorkflow(uuid: string, data?: {
    input?: any;
    context?: any;
  }): Promise<ApiResponse<{ execution: any }>> {
    return this.post(`/api/v1/workflows/${uuid}/execute`, data || {});
  }

  async getWorkflowExecutions(uuid: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{
    executions: any[];
    pagination: any;
  }>> {
    return this.get(`/api/v1/workflows/${uuid}/executions`, { params });
  }

  // Audit endpoints
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: number;
    tenantId?: number;
    action?: string;
    resource?: string;
    resourceId?: string;
    level?: 'info' | 'warning' | 'error' | 'critical';
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    includeMetadata?: boolean;
  }): Promise<ApiResponse<{
    logs: any[];
    pagination: any;
    summary: any;
  }>> {
    return this.get('/api/v1/audit', { params });
  }

  async getAuditLog(id: number): Promise<ApiResponse<{ log: any }>> {
    return this.get(`/api/v1/audit/${id}`);
  }

  async createAuditLog(data: {
    action: string;
    resource: string;
    resourceId?: string;
    level?: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metadata?: any;
    targetUserId?: number;
    targetTenantId?: number;
  }): Promise<ApiResponse<{ log: any }>> {
    return this.post('/api/v1/audit', data);
  }

  async getAuditStats(params?: {
    days?: number;
    tenantId?: number;
  }): Promise<ApiResponse<{ stats: any }>> {
    return this.get('/api/v1/audit/stats/dashboard', { params });
  }

  async exportAuditLogs(params?: {
    format?: 'csv' | 'json';
    dateFrom?: string;
    dateTo?: string;
    userId?: number;
    tenantId?: number;
    action?: string;
    level?: string;
    limit?: number;
  }): Promise<any> {
    return this.get('/api/v1/audit/export', { params });
  }

  async cleanupAuditLogs(data: {
    retentionDays: number;
    dryRun?: boolean;
    tenantId?: number;
  }): Promise<ApiResponse<{
    deletedCount: number;
    oldestRemaining: string | null;
    dryRun: boolean;
  }>> {
    return this.delete('/api/v1/audit/cleanup', { body: data });
  }

  // User Profile endpoints
  async getCurrentUserProfile(): Promise<ApiResponse<{ profile: any }>> {
    return this.get('/v1/user-profiles/me');
  }

  async updateCurrentUserProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    dateOfBirth?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    socialLinks?: any;
    preferences?: any;
  }): Promise<ApiResponse<{ profile: any }>> {
    return this.patch('/v1/user-profiles/me', data);
  }

  async updateUserAvatar(data: {
    avatar: string | null;
  }): Promise<ApiResponse<{ avatar: string | null }>> {
    return this.patch('/v1/user-profiles/me/avatar', data);
  }

  async changeUserPassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.patch('/v1/user-profiles/me/password', data);
  }

  async getUserActivity(params?: {
    page?: number;
    limit?: number;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{
    activities: any[];
    pagination: any;
  }>> {
    return this.get('/v1/user-profiles/me/activity', { params });
  }

  async getUserSecurity(): Promise<ApiResponse<{ security: any }>> {
    return this.get('/v1/user-profiles/me/security');
  }

  async deleteUserAccount(data: {
    password: string;
    reason?: string;
    feedback?: string;
  }): Promise<ApiResponse<{
    message: string;
    deletedAt: string;
  }>> {
    return this.delete('/v1/user-profiles/me', { body: data });
  }

  async requestEmailVerification(): Promise<ApiResponse<{
    message: string;
    sentAt: string;
  }>> {
    return this.post('/v1/user-profiles/me/verify-email');
  }

  // Media endpoints
  async uploadMedia(files: File[], context: string, metadata?: any): Promise<ApiResponse<{
    uploadedFiles: Array<{
      id: number;
      fileName: string;
      originalName: string;
      url: string;
      thumbnailUrl?: string;
      fileSize: number;
      mimeType: string;
      mediaType: string;
      pictureType: string;
      dimensions?: { width: number; height: number };
      metadata?: any;
      processingStatus: string;
      jobId?: string;
    }>;
    totalSize: number;
    processedCount: number;
  }>> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('context', context);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    return this.post('/api/v1/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getMediaAssets(params?: {
    page?: number;
    limit?: number;
    mediaType?: string;
    pictureType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    isProcessed?: boolean;
    includeDeleted?: boolean;
  }): Promise<ApiResponse<{
    media: Array<{
      id: number;
      fileName: string;
      originalName: string;
      url: string;
      thumbnailUrl?: string;
      fileSize: number;
      mimeType: string;
      mediaType: string;
      pictureType: string;
      isProcessed: boolean;
      processingStatus: string;
      uploadedAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      totalSize: number;
      photoCount: number;
      videoCount: number;
      audioCount: number;
      documentCount: number;
    };
  }>> {
    return this.get('/api/v1/media', { params });
  }

  async getMediaAsset(id: number): Promise<ApiResponse<{
    id: number;
    fileName: string;
    originalName: string;
    url: string;
    thumbnailUrl?: string;
    fileSize: number;
    mimeType: string;
    mediaType: string;
    pictureType: string;
    dimensions?: { width: number; height: number };
    isProcessed: boolean;
    processingStatus: string;
    uploadedAt: string;
    updatedAt: string;
  }>> {
    return this.get(`/api/v1/media/${id}`);
  }

  async deleteMediaAsset(id: number): Promise<ApiResponse<{
    message: string;
  }>> {
    return this.delete(`/api/v1/media/${id}`);
  }

  async deleteMediaAssetWithGracePeriod(data: {
    mediaAssetId: number;
    gracePeriodHours?: number;
  }): Promise<ApiResponse<{
    message: string;
    data: {
      mediaAssetId: number;
      fileName: string;
      status: string;
      gracePeriodHours: number;
      scheduledDeletion: string;
    };
  }>> {
    return this.post('/api/v1/media/delete', data);
  }

  async runGarbageCollection(data: {
    dryRun?: boolean;
    olderThanDays?: number;
  }): Promise<ApiResponse<{
    deletedCount: number;
    freedSpaceBytes: number;
    dryRun: boolean;
    processedAssets: Array<{
      id: number;
      fileName: string;
      fileSize: number;
    }>;
  }>> {
    return this.post('/api/v1/media/garbage-collect', data);
  }

  async getProcessingStatus(mediaAssetIds: number[]): Promise<ApiResponse<Array<{
    id: number;
    isProcessed: boolean;
    processingStatus: string;
    jobId?: string;
    thumbnailUrl?: string;
    dimensions?: { width: number; height: number };
  }>>> {
    return this.post('/api/v1/media/processing-status', { mediaAssetIds });
  }

  // Queue endpoints
  async getQueueStats(): Promise<ApiResponse<{
    queues: Array<{
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: boolean;
    }>;
    workers: {
      active: number;
      total: number;
      healthy: number;
      status: string;
    };
    system: {
      memoryUsage: number;
      cpuUsage: number;
      uptime: number;
    };
    processing: {
      totalJobs: number;
      completedToday: number;
      failedToday: number;
      averageProcessingTime: number;
    };
  }>> {
    return this.get('/api/v1/queue/stats');
  }

  async getQueueJobs(params?: {
    page?: number;
    limit?: number;
    queue?: string;
    status?: string;
    jobType?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{
    jobs: Array<{
      id: string;
      queueName: string;
      jobType: string;
      status: string;
      priority: number;
      attempts: number;
      maxAttempts: number;
      progress: number;
      data: any;
      result?: any;
      error?: string;
      processingTimeMs?: number;
      createdAt: string;
      updatedAt: string;
      startedAt?: string;
      completedAt?: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    return this.get('/api/v1/queue/jobs', { params });
  }

  async retryJob(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/api/v1/queue/jobs/${id}/retry`);
  }

  async cancelJob(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/api/v1/queue/jobs/${id}/cancel`);
  }

  async pauseWorkers(queueName?: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/api/v1/queue/workers/pause', { queueName });
  }

  async resumeWorkers(queueName?: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/api/v1/queue/workers/resume', { queueName });
  }

  async cleanupQueue(data: {
    olderThanDays?: number;
    status?: string[];
    dryRun?: boolean;
  }): Promise<ApiResponse<{
    deletedCount: number;
    dryRun: boolean;
    affectedQueues: string[];
  }>> {
    return this.post('/api/v1/queue/cleanup', data);
  }

  // LLM endpoints
  async executeLLM(data: {
    provider: string;
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    tools?: any[];
    stream?: boolean;
    metadata?: any;
  }): Promise<ApiResponse<{
    id: string;
    provider: string;
    model: string;
    response: {
      content: string;
      role: string;
      finishReason: string;
    };
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    metadata?: any;
    processingTimeMs: number;
    createdAt: string;
  }>> {
    return this.post('/api/v1/llm/execute', data);
  }

  async getLLMProviders(): Promise<ApiResponse<Array<{
    provider: string;
    name: string;
    description: string;
    models: Array<{
      id: string;
      name: string;
      description: string;
      maxTokens: number;
      inputCostPer1k: number;
      outputCostPer1k: number;
      capabilities: string[];
    }>;
    isConfigured: boolean;
    isActive: boolean;
  }>>> {
    return this.get('/api/v1/llm/providers');
  }

  async getLLMAnalytics(params?: {
    period?: string;
    provider?: string;
    model?: string;
  }): Promise<ApiResponse<{
    summary: {
      totalRequests: number;
      totalTokens: number;
      totalCost: number;
      averageResponseTime: number;
      successRate: number;
    };
    usage: Array<{
      date: string;
      requests: number;
      tokens: number;
      cost: number;
      averageResponseTime: number;
    }>;
    byProvider: Array<{
      provider: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
    byModel: Array<{
      model: string;
      provider: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
  }>> {
    return this.get('/api/v1/llm/analytics', { params });
  }

  async getLLMApiKeys(): Promise<ApiResponse<Array<{
    id: number;
    provider: string;
    name: string;
    keyPreview: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>>> {
    return this.get('/api/v1/llm/api-keys');
  }

  async createLLMApiKey(data: {
    provider: string;
    name: string;
    apiKey: string;
    isActive?: boolean;
  }): Promise<ApiResponse<{
    id: number;
    provider: string;
    name: string;
    keyPreview: string;
    isActive: boolean;
  }>> {
    return this.post('/api/v1/llm/api-keys', data);
  }

  // Template endpoints
  async getTemplates(params?: {
    page?: number;
    limit?: number;
    category?: string;
    industry?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<{
    templates: Array<{
      id: number;
      uuid: string;
      name: string;
      description?: string;
      category: string;
      industry?: string;
      version: string;
      status: string;
      isPublic: boolean;
      usageCount: number;
      rating?: number;
      preview?: string;
      tags: string[];
      author: { id: number; name: string };
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      categories: string[];
      industries: string[];
      statuses: string[];
    };
  }>> {
    return this.get('/api/v1/templates', { params });
  }

  async getTemplate(uuid: string): Promise<ApiResponse<{
    id: number;
    uuid: string;
    name: string;
    description?: string;
    category: string;
    industry?: string;
    version: string;
    status: string;
    isPublic: boolean;
    content: any;
    config?: any;
    variables?: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
      description?: string;
    }>;
    usageCount: number;
    rating?: number;
    preview?: string;
    tags: string[];
    author: {
      id: number;
      name: string;
      avatar?: string;
    };
    versions: Array<{
      version: string;
      createdAt: string;
      changelog?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.get(`/api/v1/templates/${uuid}`);
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    category: string;
    industry?: string;
    content: any;
    config?: any;
    variables?: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
      description?: string;
    }>;
    isPublic?: boolean;
    tags?: string[];
    preview?: string;
  }): Promise<ApiResponse<{
    id: number;
    uuid: string;
    name: string;
    version: string;
    status: string;
  }>> {
    return this.post('/api/v1/templates', data);
  }

  async updateTemplate(uuid: string, data: {
    name?: string;
    description?: string;
    category?: string;
    industry?: string;
    content?: any;
    config?: any;
    variables?: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
      description?: string;
    }>;
    status?: string;
    isPublic?: boolean;
    tags?: string[];
    preview?: string;
    versionBump?: string;
    changelog?: string;
  }): Promise<ApiResponse<{
    id: number;
    uuid: string;
    name: string;
    version: string;
    status: string;
  }>> {
    return this.patch(`/api/v1/templates/${uuid}`, data);
  }

  async deleteTemplate(uuid: string): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/api/v1/templates/${uuid}`);
  }

  async cloneTemplate(uuid: string, data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<ApiResponse<{
    id: number;
    uuid: string;
    name: string;
    version: string;
    status: string;
  }>> {
    return this.post(`/api/v1/templates/${uuid}/clone`, data);
  }

  async rateTemplate(uuid: string, data: {
    rating: number;
    review?: string;
  }): Promise<ApiResponse<{
    averageRating: number;
    totalRatings: number;
  }>> {
    return this.post(`/api/v1/templates/${uuid}/rate`, data);
  }

  // User Profile endpoints
  async getCurrentUserProfile(): Promise<ApiResponse<{
    id: number;
    uuid: string;
    userId: number;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    socialLinks: Record<string, any> | null;
    preferences: Record<string, any> | null;
    metadata: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  }>> {
    return this.get('/api/v1/user-profiles/me');
  }

  async updateCurrentUserProfile(data: {
    username?: string;
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: Record<string, any>;
    preferences?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{
    id: number;
    uuid: string;
    username: string | null;
    displayName: string | null;
    bio: string | null;
    updatedAt: string;
  }>> {
    return this.patch('/api/v1/user-profiles/me', data);
  }

  async updateUserAvatar(formData: FormData): Promise<ApiResponse<{
    avatarUrl: string;
    updatedAt: string;
  }>> {
    // Use the base fetch method directly for FormData
    const response = await fetch(`${this.config.baseURL}/api/v1/user-profiles/me/avatar`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(
        error.message || 'Failed to upload avatar',
        response.status,
        error
      );
    }

    return response.json();
  }

  async changeUserPassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.patch('/api/v1/user-profiles/me/password', data);
  }

  async getUserActivity(params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    activities: Array<{
      id: number;
      action: string;
      resourceType: string;
      resourceId: string;
      metadata: Record<string, any>;
      createdAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }>> {
    return this.get('/api/v1/user-profiles/me/activity', params);
  }

  async getUserSecurity(): Promise<ApiResponse<{
    lastLoginAt: string | null;
    lastPasswordChangeAt: string | null;
    twoFactorEnabled: boolean;
    sessions: Array<{
      id: string;
      userAgent: string;
      ipAddress: string;
      createdAt: string;
      lastActivityAt: string;
      isCurrent: boolean;
    }>;
  }>> {
    return this.get('/api/v1/user-profiles/me/security');
  }

  async deleteUserAccount(data: {
    password: string;
    reason?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.delete('/api/v1/user-profiles/me', { data });
  }

  async requestEmailVerification(): Promise<ApiResponse<{ message: string }>> {
    return this.post('/api/v1/user-profiles/me/verify-email', {});
  }
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create singleton instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  onAuthError: () => {
    // Handle auth errors globally (e.g., redirect to login)
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  },
});

// Export for use in React components
export default apiClient;