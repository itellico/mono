/**
 * User Permissions API Route
 * 
 * Provides endpoints for user permission management
 * Integrates with RBAC service and domain routing
 */

import { NextRequest, NextResponse } from 'next/server';
import { rbacService, UserContext } from '@/lib/services/rbac.service';
import { checkApiPermission } from '@/lib/middleware/rbac.middleware';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

/**
 * GET /api/v1/user/permissions
 * Fetch current user's permissions
 */
export async function GET(request: NextRequest) {
  try {
    const userContext = await extractUserContext(request);
    
    if (!userContext.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Get user permissions from RBAC service using private method through public interface
    const permissions = await rbacService.getUserPermissions(userContext);
    
    return NextResponse.json({
      success: true,
      data: {
        permissions,
        userContext: {
          userId: userContext.userId,
          userUuid: userContext.userUuid,
          tenantId: userContext.tenantId,
          tenantSlug: userContext.tenantSlug,
          accountId: userContext.accountId,
          roles: userContext.roles
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch user permissions', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch permissions'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/user/permissions/check
 * Check specific permission for current user
 */
export async function POST(request: NextRequest) {
  try {
    const userContext = await extractUserContext(request);
    
    if (!userContext.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHENTICATED',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { permission, resource, tenantId, accountId } = body;

    if (!permission) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Permission parameter is required'
        },
        { status: 400 }
      );
    }

    // Check permission using RBAC service
    const result = await rbacService.hasPermission(userContext, {
      permission,
      resource,
      tenantId: tenantId || userContext.tenantId,
      accountId: accountId || userContext.accountId
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to check permission', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check permission'
      },
      { status: 500 }
    );
  }
}

// Helper function to extract user context
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

  // Add tenant context from headers if available
  if (headerTenantId && !userContext.tenantId) {
    userContext.tenantId = parseInt(headerTenantId);
  }
  if (headerTenantSlug && !userContext.tenantSlug) {
    userContext.tenantSlug = headerTenantSlug;
  }

  return userContext;
}