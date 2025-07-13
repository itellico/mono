/**
 * Authentication Middleware Utilities
 * 
 * Provides authentication and authorization helpers for middleware
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthResult {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    roles: string[];
    tenantId?: number;
  };
  error?: string;
}

/**
 * Check if user is authenticated
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return { isAuthenticated: false, error: 'No token found' };
    }

    // Verify JWT token
    const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
    if (!publicKey) {
      return { isAuthenticated: false, error: 'JWT public key not configured' };
    }

    const decoded = jwt.verify(accessToken, publicKey, { algorithms: ['RS256'] }) as any;

    return {
      isAuthenticated: true,
      user: {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        roles: decoded.roles || [],
        tenantId: decoded.tenantId
      }
    };
  } catch (error) {
    return { 
      isAuthenticated: false, 
      error: error instanceof Error ? error.message : 'Auth check failed' 
    };
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(userRoles: string[]): boolean {
  return userRoles.some(role => ['super_admin', 'tenant_admin', 'content_moderator'].includes(role));
}

/**
 * Check if user can access admin routes
 */
export async function checkAdminAccess(request: NextRequest): Promise<AuthResult> {
  const authResult = await checkAuth(request);
  
  if (!authResult.isAuthenticated) {
    return authResult;
  }

  if (!authResult.user || !isAdmin(authResult.user.roles)) {
    return {
      isAuthenticated: false,
      error: 'Admin access required'
    };
  }

  return authResult;
} 