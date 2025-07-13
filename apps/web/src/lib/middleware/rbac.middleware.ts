/**
 * RBAC Middleware
 * 
 * Provides permission checking middleware for Next.js routes
 * Integrates with domain routing for context-aware permission checks
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { rbacService, UserContext, PermissionResult } from '@/lib/services/rbac.service';
import { parseDomain } from '@/lib/config/domains';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

export interface PermissionOptions {
  permission: string;
  resource?: string;
  redirectTo?: string;
  allowUnauthenticated?: boolean;
  requireTenantContext?: boolean;
}

/**
 * Create permission middleware for route protection
 */
export function requirePermission(options: PermissionOptions) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      const userContext = await extractUserContext(request);
      
      // Check if authentication is required
      if (!options.allowUnauthenticated && !userContext.userId) {
        return redirectToAuth(request, options.redirectTo);
      }

      // Check tenant context requirement
      if (options.requireTenantContext && !userContext.tenantId) {
        return createErrorResponse('Tenant context required', 403);
      }

      // Get domain type for context-aware checks
      const hostname = request.headers.get('host');
      const domainInfo = parseDomain(hostname || '');
      
      // Check domain-specific permission
      const result = await rbacService.checkDomainPermission(
        userContext,
        options.permission,
        domainInfo.type as 'admin' | 'tenant' | 'api'
      );

      if (!result.allowed) {
        logger.warn('Permission denied', { 
          userId: userContext.userId,
          permission: options.permission,
          reason: result.reason,
          hostname 
        });
        
        return createErrorResponse(result.reason || 'Permission denied', 403);
      }

      // Permission granted - continue to route
      return null;
    } catch (error) {
      logger.error('Permission middleware error', { error, options });
      return createErrorResponse('Permission check failed', 500);
    }
  };
}

/**
 * Extract user context from request
 */
async function extractUserContext(request: NextRequest): Promise<UserContext> {
  const accessTokenCookie = request.cookies.get('accessToken');
  const headerTenantId = request.headers.get('x-tenant-id');
  const headerTenantSlug = request.headers.get('x-tenant-slug');
  const hostname = request.headers.get('host');

  let userContext: UserContext = {
    userId: 0,
    userUuid: '',
    roles: [],
    hostname: hostname || undefined
  };

  // Decode JWT token if available
  if (accessTokenCookie) {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
      const token = jwt.verify(accessTokenCookie.value, jwtSecret) as any;
      
      userContext = {
        userId: token.userId || 0,
        userUuid: token.userUuid || '',
        tenantId: token.tenantId || (headerTenantId ? parseInt(headerTenantId) : undefined),
        tenantSlug: headerTenantSlug || undefined,
        accountId: token.accountId,
        roles: token.roles || [],
        hostname: hostname || undefined
      };
    } catch (error) {
      logger.warn('Failed to decode JWT token', { error });
    }
  }

  // Add tenant context from domain routing headers if available
  if (headerTenantId && !userContext.tenantId) {
    userContext.tenantId = parseInt(headerTenantId);
  }
  if (headerTenantSlug && !userContext.tenantSlug) {
    userContext.tenantSlug = headerTenantSlug;
  }

  return userContext;
}

/**
 * Redirect to authentication
 */
function redirectToAuth(request: NextRequest, customRedirect?: string): NextResponse {
  const callbackUrl = encodeURIComponent(request.url);
  const signInUrl = customRedirect || `/auth/signin?callbackUrl=${callbackUrl}`;
  
  return NextResponse.redirect(new URL(signInUrl, request.url));
}

/**
 * Create error response
 */
function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'PERMISSION_DENIED',
      message
    },
    { status }
  );
}

/**
 * Permission checking helper for API routes
 */
export async function checkApiPermission(
  request: NextRequest,
  permission: string,
  options?: {
    resource?: string;
    requireTenantContext?: boolean;
  }
): Promise<{ allowed: boolean; userContext: UserContext; result: PermissionResult }> {
  const userContext = await extractUserContext(request);
  
  // Check tenant context requirement
  if (options?.requireTenantContext && !userContext.tenantId) {
    return {
      allowed: false,
      userContext,
      result: { allowed: false, reason: 'Tenant context required' }
    };
  }

  const result = await rbacService.hasPermission(userContext, {
    permission,
    resource: options?.resource,
    tenantId: userContext.tenantId
  });

  return {
    allowed: result.allowed,
    userContext,
    result
  };
}

/**
 * Higher-order component for page-level permission checking
 */
export function withPermission<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  options: PermissionOptions
) {
  return function PermissionGatedComponent(props: T) {
    // This would be implemented on the client side for React components
    // For now, it's a placeholder for the pattern
    return React.createElement(WrappedComponent, props);
  };
}

/**
 * Permission constants for common use cases
 */
export const PERMISSIONS = {
  // Admin domain permissions
  ADMIN: {
    ACCESS: 'admin.access',
    DASHBOARD: 'admin.dashboard.view',
    USERS: 'admin.users.manage',
    TENANTS: 'admin.tenants.manage',
    SYSTEM: 'admin.system.manage'
  },
  
  // Tenant permissions
  TENANT: {
    MANAGE: 'tenant.manage',
    MODERATE: 'content.moderate.tenant',
    ANALYTICS: 'analytics.view.tenant',
    USERS: 'users.manage.tenant'
  },
  
  // Account permissions
  ACCOUNT: {
    MANAGE: 'account.manage.own',
    PROFILES: 'profiles.manage.account',
    JOBS: 'jobs.manage.account',
    BILLING: 'billing.view.account'
  },
  
  // User permissions
  USER: {
    PROFILE: 'profiles.edit.own',
    SETTINGS: 'settings.edit.own',
    MEDIA: 'media.upload.own',
    JOBS_APPLY: 'jobs.apply.own'
  }
} as const;