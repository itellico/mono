// Dynamic import helper for server-side only
async function getCookies() {
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    const { cookies } = await import('next/headers');
    return cookies;
  } catch (e) {
    // Server-side modules not available
    return null;
  }
}

interface User {
  id: string;
  uuid: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: number;
}

interface Session {
  user: User;
}

/**
 * Server-side auth helper for Next.js App Router
 * Checks if user is authenticated by validating the session with the API
 */
export async function auth(): Promise<Session | null> {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    const cookies = await getCookies();
    if (!cookies) {
      return null;
    }
    
    const cookieStore = await cookies();
    // Try both cookie names for compatibility
    const authToken = cookieStore.get('access-token') || cookieStore.get('auth-token') || cookieStore.get('accessToken');
    
    if (!authToken) {
      return null;
    }

    // Validate token with API server with retry logic
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${apiUrl}/api/v2/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Cookie': `access-token=${authToken.value}; refresh-token=${cookieStore.get('refresh-token')?.value || ''}`,
        },
        cache: 'no-store', // Disable caching for auth checks
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Handle the API response format { success: true, data: {...} }
      if (data.success && data.data) {
        return {
          user: data.data
        };
      }

      return null;
    } catch (fetchError) {
      // If API server is not reachable, don't fail completely
      // In production, you might want to validate JWT locally
      console.warn('API server not reachable for auth check:', fetchError);
      return null;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Helper to check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.roles) return false;
  return session.user.roles.includes(role);
}

/**
 * Helper to check if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.permissions) return false;
  return session.user.permissions.includes(permission);
}

/**
 * Helper to check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.roles) return false;
  return session.user.roles.some(role => 
    ['super_admin', 'platform_admin', 'tenant_admin', 'tenant_manager'].includes(role)
  );
}

/**
 * Server-side signOut helper
 */
export async function signOut() {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return;
  }
  
  try {
    const cookies = await getCookies();
    if (!cookies) {
      return;
    }
    
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken');
    
    if (accessToken) {
      // Call logout endpoint to invalidate session on server
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v2/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Cookie': `auth-token=${accessToken.value}`,
        },
      });
    }
    
    // Clear cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}