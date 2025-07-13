'use client';

import { ApiResponse, AuthUser } from '@mono/shared';

interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  onAuthError?: () => void;
}

interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
  skipCSRF?: boolean;
}

class SecureApiClient {
  private baseURL: string;
  private timeout: number;
  private onAuthError?: () => void;
  private csrfToken: string | null = null;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.onAuthError = config.onAuthError;
  }

  setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  private async request<T = any>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, skipAuth, skipCSRF, ...init } = config;

    // Build URL with query params
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Add default headers
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Add CSRF token for state-changing requests
    if (!skipCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method || 'GET')) {
      if (this.csrfToken) {
        headers.set('X-CSRF-Token', this.csrfToken);
      }
    }

    // Always include credentials for cookie-based auth
    const requestInit: RequestInit = {
      ...init,
      headers,
      credentials: 'include', // This sends cookies with the request
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      // Handle token expiration
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        // Try to refresh token
        const refreshResponse = await this.post('/api/v1/public/auth/refresh', {}, { skipCSRF: true });
        
        if (refreshResponse.success) {
          // Update CSRF token if provided
          if (refreshResponse.data?.csrfToken) {
            this.csrfToken = refreshResponse.data.csrfToken;
          }
          
          // Retry original request
          return this.request<T>(path, config);
        } else {
          // Refresh failed, trigger auth error
          if (this.onAuthError) {
            this.onAuthError();
          }
        }
      }

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

      throw new ApiError('Unknown error', 0);
    }
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

  async delete<T = any>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<{
    user: AuthUser;
    csrfToken: string;
  }>> {
    const response = await this.post('/api/v1/public/auth/login', { email, password }, { skipCSRF: true });
    
    if (response.success && response.data?.csrfToken) {
      this.csrfToken = response.data.csrfToken;
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.post('/api/v1/public/auth/logout');
    this.csrfToken = null;
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.get('/api/v1/public/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ csrfToken?: string }>> {
    return this.post('/api/v1/public/auth/refresh', {}, { skipCSRF: true });
  }
}

// Custom error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create singleton instance
const apiClient = new SecureApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  onAuthError: () => {
    // Redirect to login when auth fails
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  },
});

export default apiClient;