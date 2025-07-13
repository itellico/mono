/**
 * User Permission Check API Route
 * 
 * Provides a GET endpoint for quick permission checking
 * Supports query parameters for flexible permission validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { rbacService, UserContext } from '@/lib/services/rbac.service';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

/**
 * GET /api/v1/user/check-permission?permission=...&resource=...
 * Quick permission check via query parameters
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

    const { searchParams } = new URL(request.url);
    const permission = searchParams.get('permission');
    const resource = searchParams.get('resource');
    const tenantId = searchParams.get('tenantId');
    const accountId = searchParams.get('accountId');

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
      resource: resource || undefined,
      tenantId: tenantId ? parseInt(tenantId) : userContext.tenantId,
      accountId: accountId ? parseInt(accountId) : userContext.accountId
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

/**
 * POST /api/v1/user/check-permission
 * Batch permission checking with request body
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
    const { permissions } = body;

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Permissions array is required'
        },
        { status: 400 }
      );
    }

    // Check multiple permissions
    const results = await Promise.all(
      permissions.map(async (permCheck: any) => {
        const result = await rbacService.hasPermission(userContext, {
          permission: permCheck.permission,
          resource: permCheck.resource,
          tenantId: permCheck.tenantId || userContext.tenantId,
          accountId: permCheck.accountId || userContext.accountId
        });
        
        return {
          permission: permCheck.permission,
          resource: permCheck.resource,
          result
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        checks: results,
        summary: {
          total: results.length,
          allowed: results.filter(r => r.result.allowed).length,
          denied: results.filter(r => !r.result.allowed).length
        }
      }
    });
  } catch (error) {
    logger.error('Failed to check permissions batch', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check permissions'
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