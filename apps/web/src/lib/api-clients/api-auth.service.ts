/**
 * API Authentication Service
 * 
 * Centralized authentication handling for all API clients
 * Handles both server-side (cookies) and client-side authentication
 */

import { cookies } from 'next/headers';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiAuthService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.178.94:3001';

  /**
   * Get authentication token from cookies (server-side) or session storage (client-side)
   */
  private static async getAuthToken(): Promise<string | null> {
    // Server-side: Get from cookies
    if (typeof window === 'undefined') {
      try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('access-token') || 
                         cookieStore.get('auth-token') || 
                         cookieStore.get('accessToken');
        return authToken?.value || null;
      } catch (error) {
        console.error('Failed to get auth token from cookies:', error);
        return null;
      }
    }

    // Client-side: Get from session storage or localStorage
    try {
      // Try session storage first
      const sessionToken = sessionStorage.getItem('access-token') || 
                          sessionStorage.getItem('auth-token') ||
                          sessionStorage.getItem('accessToken');
      
      if (sessionToken) {
        return sessionToken;
      }

      // Fallback to localStorage
      const localToken = localStorage.getItem('access-token') || 
                        localStorage.getItem('auth-token') ||
                        localStorage.getItem('accessToken');
      
      return localToken;
    } catch (error) {
      console.error('Failed to get auth token from storage:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request with proper error handling
   */
  static async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    try {
      const authToken = await this.getAuthToken();
      
      if (!authToken) {
        console.error('No authentication token available');
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        cache: 'no-store' // Always get fresh data for admin operations
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
          // TODO: Implement token refresh logic here
        } else if (response.status === 403) {
          console.error('Access forbidden - insufficient permissions');
        } else {
          console.error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return null;
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        console.error('API returned error:', result.error, result.message);
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error(`Error calling API endpoint ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Make authenticated API request and return full response (including pagination)
   */
  static async makeAuthenticatedRequestWithResponse<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T> | null> {
    try {
      const authToken = await this.getAuthToken();
      
      if (!authToken) {
        console.error('No authentication token available');
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        return null;
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.success) {
        console.error('API returned error:', result.error, result.message);
        return null;
      }

      return result;
    } catch (error) {
      console.error(`Error calling API endpoint ${endpoint}:`, error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  /**
   * Get current user session
   */
  static async getCurrentUser(): Promise<any | null> {
    try {
      const authToken = await this.getAuthToken();
      
      if (!authToken) {
        return null;
      }

      const response = await fetch(`${this.API_BASE_URL}/api/v2/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}