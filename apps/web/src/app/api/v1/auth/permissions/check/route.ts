import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';
import { logger } from '@/lib/logger';

/**
 * 🔐 UNIFIED PERMISSION CHECK API
 * 
 * This endpoint is used by the PermissionGate component for client-side
 * permission checking with TanStack Query integration.
 * 
 * Features:
 * ✅ Uses unified canAccessAPI function
 * ✅ Proper error handling and logging
 * ✅ Standardized API response format
 * ✅ Tenant isolation support
 * ✅ Read-only fallback support
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const resourceId = searchParams.get('resourceId');
    const tenantId = searchParams.get('tenantId');
    const allowReadOnly = searchParams.get('allowReadOnly') === 'true';

    // Validate required parameters
    if (!action || !resource) {
      logger.warn('❌ Permission check API: Missing required parameters', {
        action,
        resource,
        url: request.url
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: action and resource are required',
          code: 'INVALID_PARAMETERS'
        },
        { status: 400 }
      );
    }

    // Call unified permission checker
    const result = await canAccessAPI({
      action,
      resource,
      resourceId: resourceId ? (isNaN(Number(resourceId)) ? resourceId : Number(resourceId)) : undefined,
      tenantId: tenantId ? Number(tenantId) : undefined,
      allowReadOnly,
      metadata: {
        endpoint: '/api/v1/auth/permissions/check',
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    });

    // Log the permission check result
    logger.info('✅ Permission check completed', {
      action,
      resource,
      resourceId,
      tenantId,
      allowReadOnly,
      result: {
        allowed: result.allowed,
        reason: result.reason,
        isSuperAdminBypass: result.isSuperAdminBypass,
        isReadOnly: result.isReadOnly
      },
      userId: result.userId
    });

    // Return standardized response
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        endpoint: '/api/v1/auth/permissions/check'
      }
    });

  } catch (error) {
    logger.error('❌ Permission check API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during permission check',
        code: 'PERMISSION_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
} 