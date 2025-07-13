import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI, type AccessContext, type AccessResult } from '@/lib/permissions/canAccessAPI';
import { logger } from '@/lib/logger';
import { AuditLogger } from '@/lib/middleware/audit-log';

/**
 * Enhanced API Route wrapper that enforces permissions using canAccessAPI
 * Version 2.0 - Supports optimized permission patterns with wildcards
 * 
 * P0 Security Requirement: ALL API routes MUST use this wrapper
 * 
 * Features:
 * ✅ Automatic permission checking via canAccessAPI
 * ✅ Wildcard permission pattern support
 * ✅ Scope-based access control (global/tenant/own)
 * ✅ Tenant isolation enforcement
 * ✅ Request context injection
 * ✅ Comprehensive error handling
 * ✅ Audit logging integration
 */

export interface PermissionRequirementsV2 {
  permission?: string; // Direct permission string (e.g., 'tenants.*.global')
  action?: string; // Legacy support
  resource?: string; // Legacy support
  scope?: 'global' | 'tenant' | 'own'; // Scope level
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
 * Build permission string from components
 */
function buildPermissionString(
  resource: string,
  action: string,
  scope: 'global' | 'tenant' | 'own' = 'tenant'
): string {
  return `${resource}.${action}.${scope}`;
}

/**
 * Main permission wrapper for API routes - V2
 */
export function withPermissions(
  requirements: PermissionRequirementsV2,
  handler: ApiHandler
): ApiHandler {
  return async (request: EnhancedNextRequest, context?: any) => {
    const startTime = Date.now();
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    
    try {
      // Extract tenant ID from headers (set by middleware)
      const tenantId = request.headers.get('X-Tenant-ID');
      const userId = request.headers.get('X-User-ID');
      
      // Determine the required permission
      let requiredPermission: string;
      let action: string;
      let resource: string;
      
      if (requirements.permission) {
        // Direct permission string provided
        requiredPermission = requirements.permission;
        // Extract action and resource from permission string
        const parts = requiredPermission.split('.');
        resource = parts[0];
        action = parts[1] || '*';
      } else if (requirements.action && requirements.resource) {
        // Build permission from components
        resource = requirements.resource;
        action = requirements.action;
        requiredPermission = buildPermissionString(
          resource,
          action,
          requirements.scope || 'tenant'
        );
      } else {
        throw new Error('Invalid permission requirements: must provide either permission string or action/resource');
      }
      
      // Build access context
      const accessContext: AccessContext = {
        action,
        resource,
        allowReadOnly: requirements.allowReadOnly,
        tenantId: tenantId && !requirements.skipTenantCheck 
          ? parseInt(tenantId) 
          : undefined,
        metadata: {
          path: request.nextUrl.pathname,
          method: request.method,
          requestId,
          requiredPermission
        }
      };
      
      // Extract resource ID from URL if present
      const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
      const resourceIndex = pathSegments.indexOf(resource);
      if (resourceIndex !== -1 && pathSegments[resourceIndex + 1]) {
        accessContext.resourceId = pathSegments[resourceIndex + 1];
      }
      
      // ✅ PERMISSION CHECK - P0 Security Requirement
      const accessResult = await canAccessAPI(accessContext);
      
      if (!accessResult.allowed) {
        logger.warn('🚫 API access denied', {
          userId,
          requirements,
          requiredPermission,
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
            requirements,
            requiredPermission
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
 * Optimized permission configurations
 * Following the new wildcard pattern system
 */
export const OptimizedPermissions = {
  // Platform Admin Operations (Global Scope)
  PLATFORM_ALL: { permission: 'platform.*.global' },
  TENANTS_ALL: { permission: 'tenants.*.global' },
  SYSTEM_ALL: { permission: 'system.*.global' },
  EMERGENCY_ACCESS: { permission: 'emergency.access.global' },
  AUDIT_ALL: { permission: 'audit.*.global' },
  
  // Configuration (Global Scope)
  CONFIG_ALL: { permission: 'config.*.global' },
  INTEGRATIONS_ALL: { permission: 'integrations.*.global' },
  SUBSCRIPTIONS_ALL: { permission: 'subscriptions.*.global' },
  SECURITY_ALL: { permission: 'security.*.global' },
  COMPLIANCE_ALL: { permission: 'compliance.*.global' },
  
  // User Management (Global Scope)
  USERS_ALL_GLOBAL: { permission: 'users.*.global' },
  ACCOUNTS_ALL_GLOBAL: { permission: 'accounts.*.global' },
  IMPERSONATE_ALL: { permission: 'impersonate.*.global' },
  ANALYTICS_ALL_GLOBAL: { permission: 'analytics.*.global' },
  REPORTS_ALL_GLOBAL: { permission: 'reports.*.global' },
  
  // Tenant Admin Operations (Tenant Scope)
  TENANT_MANAGE: { permission: 'tenant.manage.tenant' },
  ACCOUNTS_ALL_TENANT: { permission: 'accounts.*.tenant' },
  USERS_ALL_TENANT: { permission: 'users.*.tenant' },
  ANALYTICS_READ_TENANT: { permission: 'analytics.read.tenant' },
  BILLING_MANAGE_TENANT: { permission: 'billing.manage.tenant' },
  
  // Content Management (Tenant Scope)
  CONTENT_ALL_TENANT: { permission: 'content.*.tenant' },
  MODERATION_ALL_TENANT: { permission: 'moderation.*.tenant' },
  CATEGORIES_MANAGE_TENANT: { permission: 'categories.manage.tenant' },
  SCHEMAS_MANAGE_TENANT: { permission: 'schemas.manage.tenant' },
  TEMPLATES_MANAGE_TENANT: { permission: 'templates.manage.tenant' },
  
  // Account Owner Operations (Own Scope)
  ACCOUNT_MANAGE_OWN: { permission: 'account.manage.own' },
  TEAM_ALL_OWN: { permission: 'team.*.own' },
  BILLING_MANAGE_OWN: { permission: 'billing.manage.own' },
  ANALYTICS_READ_OWN: { permission: 'analytics.read.own' },
  SETTINGS_MANAGE_OWN: { permission: 'settings.manage.own' },
  
  // Talent Management (Own Scope)
  PROFILES_ALL_OWN: { permission: 'profiles.*.own' },
  MEDIA_ALL_OWN: { permission: 'media.*.own' },
  PORTFOLIO_ALL_OWN: { permission: 'portfolio.*.own' },
  AVAILABILITY_ALL_OWN: { permission: 'availability.*.own' },
  COMPLIANCE_MANAGE_OWN: { permission: 'compliance.manage.own' },
  
  // Legacy support - maps to new patterns
  ADMIN_READ: { resource: 'admin', action: 'read', scope: 'tenant' as const },
  ADMIN_WRITE: { resource: 'admin', action: 'write', scope: 'tenant' as const },
  
  // Specific operations with explicit scope
  TENANT_LIST: { resource: 'tenants', action: 'read', scope: 'global' as const, skipTenantCheck: true },
  TENANT_CREATE: { resource: 'tenants', action: 'create', scope: 'global' as const, skipTenantCheck: true },
  TENANT_UPDATE: { resource: 'tenants', action: 'update', scope: 'global' as const },
  TENANT_DELETE: { resource: 'tenants', action: 'delete', scope: 'global' as const },
  
  USER_LIST: { resource: 'users', action: 'read', scope: 'tenant' as const },
  USER_CREATE: { resource: 'users', action: 'create', scope: 'tenant' as const },
  USER_UPDATE: { resource: 'users', action: 'update', scope: 'tenant' as const },
  USER_DELETE: { resource: 'users', action: 'delete', scope: 'tenant' as const },
  
  PERMISSION_LIST: { resource: 'permissions', action: 'read', scope: 'global' as const },
  PERMISSION_GRANT: { resource: 'permissions', action: 'grant', scope: 'tenant' as const },
  PERMISSION_REVOKE: { resource: 'permissions', action: 'revoke', scope: 'tenant' as const },
} as const;

// Export legacy Permissions for backward compatibility
export const Permissions = OptimizedPermissions;

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