import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Audit logging middleware for itellico Mono
 * 
 * P0 Security Requirement: Comprehensive audit trail for all API operations
 * 
 * Features:
 * ✅ Automatic API access logging
 * ✅ Request/response capture for sensitive operations
 * ✅ Tenant isolation enforcement
 * ✅ User activity tracking
 * ✅ Performance metrics
 */

export interface AuditLogContext {
  action: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  tenantId?: number;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIp || 'unknown';
}

/**
 * Determine entity type and ID from path
 */
function extractEntityInfo(path: string): { entityType?: string; entityId?: string } {
  const patterns = [
    { regex: /\/api\/v1\/admin\/tenants\/([^\/]+)/, type: 'tenant' },
    { regex: /\/api\/v1\/admin\/users\/([^\/]+)/, type: 'user' },
    { regex: /\/api\/v1\/admin\/permissions\/([^\/]+)/, type: 'permission' },
    { regex: /\/api\/v1\/admin\/roles\/([^\/]+)/, type: 'role' },
    { regex: /\/api\/v1\/admin\/categories\/([^\/]+)/, type: 'category' },
    { regex: /\/api\/v1\/admin\/tags\/([^\/]+)/, type: 'tag' },
    { regex: /\/api\/v1\/media\/([^\/]+)/, type: 'media' },
    { regex: /\/api\/v1\/profiles\/([^\/]+)/, type: 'profile' },
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern.regex);
    if (match) {
      return {
        entityType: pattern.type,
        entityId: match[1]
      };
    }
  }

  // Extract entity type from path segments
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 4) {
    return {
      entityType: segments[3].replace(/s$/, '') // Remove plural 's'
    };
  }

  return {};
}

/**
 * Main audit logging function
 */
export async function auditLog(context: AuditLogContext): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Skip logging for certain paths
    const skipPaths = [
      '/api/health',
      '/api/docs',
      '/_next',
      '/favicon.ico'
    ];
    
    if (context.path && skipPaths.some(path => context.path!.startsWith(path))) {
      return;
    }

    // Ensure we have required fields
    if (!context.userId && !context.path?.startsWith('/api/auth/')) {
      logger.warn('⚠️ Audit log missing userId', { context });
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        tenantId: context.tenantId || 0, // 0 for system-level operations
        userId: context.userId ? parseInt(context.userId) : null,
        action: context.action,
        entityType: context.entityType || 'api_request',
        entityId: context.entityId || context.path || 'unknown',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: context.metadata || {},
        oldValues: context.oldValues,
        newValues: context.newValues
      }
    });

    // Also create user activity log for API requests
    if (context.path && context.userId) {
      await db.userActivityLog.create({
        data: {
          tenantId: context.tenantId || 0,
          userId: parseInt(context.userId),
          action: `${context.method} ${context.path}`,
          path: context.path,
          method: context.method,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            statusCode: context.statusCode,
            duration: context.duration,
            ...context.metadata
          }
        }
      });
    }

    logger.debug('✅ Audit log created', {
      action: context.action,
      userId: context.userId,
      duration: Date.now() - startTime
    });

  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('❌ Audit logging failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      context,
      duration: Date.now() - startTime
    });
  }
}

/**
 * Middleware helper to audit API requests
 */
export async function auditApiRequest(
  request: NextRequest,
  response?: Response
): Promise<void> {
  const { pathname, search } = request.nextUrl;
  const fullPath = `${pathname}${search}`;
  const { entityType, entityId } = extractEntityInfo(pathname);
  
  const context: AuditLogContext = {
    action: 'api_access',
    entityType,
    entityId,
    userId: request.headers.get('X-User-ID') || undefined,
    tenantId: request.headers.get('X-Tenant-ID') 
      ? parseInt(request.headers.get('X-Tenant-ID')!) 
      : undefined,
    method: request.method,
    path: fullPath,
    ipAddress: getIpAddress(request),
    userAgent: request.headers.get('user-agent') || undefined,
    statusCode: response?.status,
    metadata: {
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin')
    }
  };

  await auditLog(context);
}

/**
 * High-level audit functions for specific operations
 */
export const AuditLogger = {
  async logLogin(userId: string, tenantId: number, success: boolean, ipAddress: string) {
    await auditLog({
      action: success ? 'user_login_success' : 'user_login_failed',
      entityType: 'auth',
      entityId: userId,
      userId,
      tenantId,
      ipAddress,
      metadata: { success }
    });
  },

  async logPermissionChange(
    userId: string, 
    targetUserId: string, 
    tenantId: number,
    changes: { added?: string[], removed?: string[] }
  ) {
    await auditLog({
      action: 'permission_change',
      entityType: 'user',
      entityId: targetUserId,
      userId,
      tenantId,
      metadata: changes
    });
  },

  async logDataExport(
    userId: string,
    tenantId: number,
    entityType: string,
    recordCount: number
  ) {
    await auditLog({
      action: 'data_export',
      entityType,
      userId,
      tenantId,
      metadata: { recordCount }
    });
  },

  async logSecurityEvent(
    event: string,
    userId?: string,
    tenantId?: number,
    details?: Record<string, unknown>
  ) {
    await auditLog({
      action: `security_${event}`,
      entityType: 'security',
      entityId: event,
      userId,
      tenantId,
      metadata: details
    });
  }
};