export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tier: string;
  roles?: string[];
}

// Authentication is handled by HTTP-only cookies from the server
// No client-side token storage needed

export class AuthClient {
  private baseURL: string;

  constructor() {
    // If NEXT_PUBLIC_API_URL is not set, use relative URLs
    // This allows the frontend to work from any host/IP
    if (process.env.NEXT_PUBLIC_API_URL) {
      this.baseURL = process.env.NEXT_PUBLIC_API_URL;
    } else if (typeof window !== 'undefined') {
      // Use the same origin but on port 3001 for the API
      const url = new URL(window.location.href);
      url.port = '3001';
      this.baseURL = url.origin;
    } else {
      // Server-side fallback
      this.baseURL = 'http://localhost:3001';
    }
    console.log('AuthClient initialized with baseURL:', this.baseURL);
  }

  async login(email: string, password: string) {
    try {
      console.log('Attempting login to:', `${this.baseURL}/api/v2/auth/signin`);
      const response = await fetch(`${this.baseURL}/api/v2/auth/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON, throw a generic error
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Token is now stored in HTTP-only cookie by the server
      // No need to store in localStorage or document.cookie

      // Return the user data from the new NestJS response format
      return data.data;
    } catch (error) {
      console.error('Auth client login error:', error);
      
      // Handle network errors or other fetch failures
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      
      // Handle CORS errors
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error('CORS error: The server is not configured to accept requests from this origin.');
      }
      
      // Re-throw the error if it's already an Error with a message
      if (error instanceof Error && error.message) {
        throw error;
      }
      
      // Otherwise throw a generic error
      throw new Error('An unexpected error occurred during login');
    }
  }

  async logout() {
    await fetch(`${this.baseURL}/api/v2/auth/signout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    // Cookie will be cleared by the server
  }

  async getMe(): Promise<AuthUser | null> {
    try {
      // Authentication is handled by HTTP-only cookies
      const response = await fetch(`${this.baseURL}/api/v2/auth/me`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data; // New NestJS format returns user data in data field
    } catch (error) {
      return null;
    }
  }

  async refresh() {
    const response = await fetch(`${this.baseURL}/api/v2/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body - using HTTP-only cookies
    });

    return response.ok;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await fetch(`${this.baseURL}/api/v2/auth/change-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Password change failed');
    }

    return data;
  }

  async makeRequest(url: string, options: RequestInit = {}) {
    return fetch(`${this.baseURL}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}

export const authClient = new AuthClient();