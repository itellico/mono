import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI, type AccessContext, type AccessResult } from '@/lib/permissions/canAccessAPI';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/middleware/audit-log';

/**
 * Enhanced API Route wrapper that enforces permissions using canAccessAPI
 * 
 * P0 Security Requirement: ALL API routes MUST use this wrapper
 * 
 * Features:
 * ✅ Automatic permission checking via canAccessAPI
 * ✅ Tenant isolation enforcement
 * ✅ Request context injection
 * ✅ Comprehensive error handling
 * ✅ Audit logging integration
 */

export interface PermissionRequirements {
  action: string;
  resource: string;
  allowReadOnly?: boolean;
  skipTenantCheck?: boolean; // For platform-level operations
}

export interface EnhancedNextRequest extends NextRequest {
  accessResult?: AccessResult;
  tenantId?: number;
  userId?: string;
  requestId?: string;
}

export type ApiHandler = (
  request: EnhancedNextRequest,
  context?: any
) => Promise<Response | NextResponse>;

/**
 * Main permission wrapper for API routes
 */
export function withPermissions(
  requirements: PermissionRequirements,
  handler: ApiHandler
): ApiHandler {
  return async (request: EnhancedNextRequest, context?: any) => {
    const startTime = Date.now();
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    
    try {
      // Extract tenant ID from headers (set by middleware)
      const tenantId = request.headers.get('X-Tenant-ID');
      const userId = request.headers.get('X-User-ID');
      
      // Build access context
      const accessContext: AccessContext = {
        action: requirements.action,
        resource: requirements.resource,
        allowReadOnly: requirements.allowReadOnly,
        tenantId: tenantId && !requirements.skipTenantCheck 
          ? parseInt(tenantId) 
          : undefined,
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
          requestId
        }
      };
      
      // Extract resource ID from URL if present
      const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
      const resourceIndex = pathSegments.indexOf(requirements.resource);
      if (resourceIndex !== -1 && pathSegments[resourceIndex + 1]) {
        accessContext.resourceId = pathSegments[resourceIndex + 1];
      }
      
      // ✅ PERMISSION CHECK - P0 Security Requirement
      const accessResult = await canAccessAPI(accessContext);
      
      if (!accessResult.allowed) {
        logger.warn('🚫 API access denied', {
          userId,
          requirements,
          reason: accessResult.reason,
          path: request.nextUrl.pathname,
          requestId,
          duration: Date.now() - startTime
        });
        
        // Audit security event
        await AuditLogger.logSecurityEvent('api_access_denied', userId || undefined, 
          accessResult.tenantId, {
            path: request.nextUrl.pathname,
            reason: accessResult.reason,
            requirements
          }
        );
        
        return NextResponse.json(
          {
            success: false,
            error: accessResult.reason,
            code: 'ACCESS_DENIED'
          },
          {
            status: 403,
            headers: {
              'X-Request-ID': requestId,
              'X-Response-Time': `${Date.now() - startTime}ms`
            }
          }
        );
      }
      
      // ✅ Enhance request with access result
      request.accessResult = accessResult;
      request.tenantId = accessResult.tenantId;
      request.userId = accessResult.userId;
      request.requestId = requestId;
      
      // ✅ Call the actual handler
      const response = await handler(request, context);
      
      // Add performance headers to response
      if (response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
        response.headers.set('X-Request-ID', requestId);
      }
      
      logger.info('✅ API request completed', {
        path: request.nextUrl.pathname,
        method: request.method,
        userId: accessResult.userId,
        tenantId: accessResult.tenantId,
        duration: Date.now() - startTime,
        status: response instanceof NextResponse ? response.status : 200
      });
      
      return response;
      
    } catch (error) {
      logger.error('❌ API handler error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: request.nextUrl.pathname,
        method: request.method,
        requirements,
        requestId,
        duration: Date.now() - startTime
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        {
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        }
      );
    }
  };
}

/**
 * Common permission configurations
 */
export const Permissions = {
  // Admin operations
  ADMIN_READ: { action: 'read', resource: 'admin' },
  ADMIN_WRITE: { action: 'write', resource: 'admin' },
  
  // Tenant operations
  TENANT_LIST: { action: 'list', resource: 'tenant', skipTenantCheck: true },
  TENANT_READ: { action: 'read', resource: 'tenant' },
  TENANT_CREATE: { action: 'create', resource: 'tenant', skipTenantCheck: true },
  TENANT_UPDATE: { action: 'update', resource: 'tenant' },
  TENANT_DELETE: { action: 'delete', resource: 'tenant' },
  
  // User operations
  USER_LIST: { action: 'list', resource: 'user' },
  USER_READ: { action: 'read', resource: 'user' },
  USER_CREATE: { action: 'create', resource: 'user' },
  USER_UPDATE: { action: 'update', resource: 'user' },
  USER_DELETE: { action: 'delete', resource: 'user' },
  
  // Permission operations
  PERMISSION_LIST: { action: 'list', resource: 'permission' },
  PERMISSION_GRANT: { action: 'grant', resource: 'permission' },
  PERMISSION_REVOKE: { action: 'revoke', resource: 'permission' },
  
  // Content operations
  CONTENT_LIST: { action: 'list', resource: 'content' },
  CONTENT_READ: { action: 'read', resource: 'content', allowReadOnly: true },
  CONTENT_CREATE: { action: 'create', resource: 'content' },
  CONTENT_UPDATE: { action: 'update', resource: 'content' },
  CONTENT_DELETE: { action: 'delete', resource: 'content' },
  
  // Media operations
  MEDIA_UPLOAD: { action: 'upload', resource: 'media' },
  MEDIA_DELETE: { action: 'delete', resource: 'media' },
  
  // Settings operations
  SETTINGS_READ: { action: 'read', resource: 'settings' },
  SETTINGS_UPDATE: { action: 'update', resource: 'settings' }
} as const;

/**
 * Helper to extract query parameters with validation
 */
export function getQueryParams<T extends Record<string, any>>(
  request: NextRequest,
  schema: Record<keyof T, { 
    type: 'string' | 'number' | 'boolean';
    default?: any;
    validate?: (value: any) => boolean;
  }>
): T {
  const searchParams = request.nextUrl.searchParams;
  const result: any = {};
  
  for (const [key, config] of Object.entries(schema)) {
    const value = searchParams.get(key);
    
    if (value === null) {
      result[key] = config.default;
      continue;
    }
    
    // Type conversion
    let converted: any = value;
    if (config.type === 'number') {
      converted = parseInt(value, 10);
      if (isNaN(converted)) {
        converted = config.default;
      }
    } else if (config.type === 'boolean') {
      converted = value === 'true';
    }
    
    // Validation
    if (config.validate && !config.validate(converted)) {
      converted = config.default;
    }
    
    result[key] = converted;
  }
  
  return result as T;
}

/**
 * Generate standardized API response
 */
export function apiResponse<T>(
  data: T,
  options: {
    success?: boolean;
    message?: string;
    meta?: Record<string, any>;
    status?: number;
    headers?: Record<string, string>;
  } = {}
): NextResponse {
  const {
    success = true,
    message,
    meta = {},
    status = 200,
    headers = {}
  } = options;
  
  return NextResponse.json(
    {
      success,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    },
    {
      status,
      headers
    }
  );
}