import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { AuditService } from '@/lib/services/audit.service';
import { PermissionsService } from '@/lib/services/permissions.service';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: number;
  };
  requestId: string;
  clientIP?: string; // Add client IP property
}

export interface ValidationFunction {
  (data: Record<string, unknown>): { valid: boolean; errors?: string[] };
}

export interface ApiConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requiredPermissions?: string[];
  validateInput?: ValidationFunction;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  // Audit configuration
  auditConfig?: {
    enabled?: boolean;
    entityType?: string;
    skipRoutes?: string[];
  };
}

export interface ApiValidationResult {
  isValid: boolean;
  user?: Record<string, unknown>;
  tenantId?: number;
  error?: string;
  status?: number;
}

// ============================================================================
// AUDIT UTILITIES
// ============================================================================

interface EntityInfo {
  entityType: string;
  entityId?: string;
  action: string;
}

interface AuditContext {
  method?: string;
  url: string;
  userAgent?: string | null;
  ip: string;
  requestId: string;
  statusCode: number;
  timestamp: string;
  requestBody?: Record<string, unknown>;
}

/**
 * Parse API route to extract entity information for audit logging
 */
function parseEntityFromUrl(url: string, method: string): EntityInfo {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Expected pattern: /api/v1/admin/{entityType}/[id]
    if (pathParts.length >= 4 && pathParts[0] === 'api' && pathParts[1] === 'v1' && pathParts[2] === 'admin') {
      const entityType = pathParts[3];
      const entityId = pathParts[4]; // Optional - present for specific entity operations
      
      // Map HTTP method to action
      const actionMap: Record<string, string> = {
        'GET': entityId ? 'read' : 'list',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'update',
        'DELETE': 'delete'
      };
      
      return {
        entityType: entityType.replace('-', '_'), // Convert model-schemas to model_schemas
        entityId,
        action: actionMap[method] || 'unknown'
      };
    }
    
    // Fallback for non-admin routes
    return {
      entityType: 'api',
      action: method.toLowerCase()
    };
    
  } catch (error) {
    logger.warn('Failed to parse entity from URL', { url, method, error });
    return {
      entityType: 'api',
      action: method.toLowerCase()
    };
  }
}

/**
 * Automatically log API operations to audit system
 */
async function logApiOperation(
  request: AuthenticatedRequest,
  response: NextResponse,
  entityInfo: EntityInfo,
  requestBody?: Record<string, unknown>
): Promise<void> {
  try {
    // Don't block API response - log asynchronously
    setImmediate(async () => {
      try {
        const user = request.user;
        if (!user || !user.tenantId) return; // Only log authenticated operations with tenant context
        
        const success = response.status >= 200 && response.status < 400;
        
        // Prepare audit context
        const context: AuditContext = {
          method: request.method,
          url: request.url,
          userAgent: request.headers.get('user-agent'),
          ip: request.clientIP || request.headers.get('x-forwarded-for') || 'unknown',
          requestId: request.requestId,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
        
        // For mutations, include request body (excluding sensitive fields)
        if (['POST', 'PUT', 'PATCH'].includes(request.method || '') && requestBody) {
          const sanitizedBody = { ...requestBody };
          // Remove sensitive fields
          delete sanitizedBody.password;
          delete sanitizedBody.token;
          delete sanitizedBody.secret;
          context.requestBody = sanitizedBody;
        }
        
        // Create audit service instance and log the action
        const auditService = new AuditService();
        
        // Map action strings to the allowed audit action types
        const auditActionMap: Record<string, 'create' | 'update' | 'delete'> = {
          'create': 'create',
          'update': 'update', 
          'delete': 'delete'
        };
        
        // Only log mutation operations (not reads) to audit logs
        if (auditActionMap[entityInfo.action]) {
          await auditService.logAction({
            tenantId: user.tenantId,
            entityType: entityInfo.entityType,
            entityId: entityInfo.entityId || 'unknown',
            action: auditActionMap[entityInfo.action],
            userId: parseInt(user.id),
            context
          });
        }
        
        logger.debug('API operation audited', {
          userId: user.id,
          tenantId: user.tenantId,
          entityType: entityInfo.entityType,
          entityId: entityInfo.entityId,
          action: entityInfo.action,
          success
        });
        
      } catch (auditError) {
        // Never fail the API request due to audit logging failure
        logger.error('Failed to log API operation to audit system', {
          requestId: request.requestId,
          error: auditError
        });
      }
    });
    
  } catch (error) {
    logger.error('Audit logging setup failed', { 
      requestId: request.requestId, 
      error 
    });
  }
}

// ============================================================================
// STANDARDIZED RESPONSE UTILITIES
// ============================================================================

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  code?: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  };
}

export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json(
    createApiResponse(true, data, undefined, message),
    { status: 200 }
  );
}

export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    createApiResponse(false, undefined, error, undefined, code, details),
    { status }
  );
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse('Unauthorized', 401, 'AUTH_REQUIRED');
}

export function forbiddenResponse(message?: string): NextResponse {
  return errorResponse(message || 'Forbidden', 403, 'ACCESS_DENIED');
}

export function notFoundResponse(resource?: string): NextResponse {
  return errorResponse(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND');
}

export function validationErrorResponse(errors: string[]): NextResponse {
  return errorResponse('Validation failed', 422, 'VALIDATION_ERROR', { errors });
}

// ============================================================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ============================================================================

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  config: ApiConfig = {}
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  let requestBody: Record<string, unknown> | undefined;

  try {
    // Parse request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method || '')) {
      try {
        requestBody = await request.json();
      } catch {
        // Ignore JSON parsing errors
      }
    }

    // Get session
    const session = await auth();

    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Cast session user to include our custom properties
    const sessionUser = session.user as any; // NextAuth session type is complex, use any for now

    if (!sessionUser.id) {
      return unauthorizedResponse();
    }

    // Initialize permissions service
    const permissionsService = PermissionsService.getInstance();

    // Check admin requirements using new permission system
    if (config.requireAdmin) {
      const canAccessAdmin = await permissionsService.canAccessAdmin(sessionUser.id);
      if (!canAccessAdmin) {
        logger.warn('Admin access denied', { 
          requestId, 
          userId: sessionUser.id 
        });
        return forbiddenResponse('Admin access required');
      }
    }

    // Check specific permission requirements
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const hasAllPermissions = await permissionsService.hasAllPermissions(
        sessionUser.id, 
        config.requiredPermissions,
        sessionUser.tenantId
      );
      
      if (!hasAllPermissions) {
        logger.warn('Permission check failed', { 
          requestId, 
          userId: sessionUser.id,
          requiredPermissions: config.requiredPermissions
        });
        return forbiddenResponse('Insufficient permissions');
      }
    }

    // Create authenticated request by extending the original request with user context
    const authenticatedReq = Object.assign(request, {
      user: {
        id: sessionUser.id,
        email: sessionUser.email || '',
        role: sessionUser.role || 'user',
        tenantId: sessionUser.tenantId
      },
      requestId,
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }) as AuthenticatedRequest;

    // Execute the handler
    const response = await handler(authenticatedReq);
    
    // **AUTOMATIC AUDIT LOGGING** - This is the key enhancement
    if (config.auditConfig?.enabled !== false) {
      const entityInfo = parseEntityFromUrl(request.url, request.method || 'GET');
      
      // Skip audit logging for certain routes if specified
      const skipRoutes = config.auditConfig?.skipRoutes || [];
      const shouldSkip = skipRoutes.some(route => request.url.includes(route));
      
      if (!shouldSkip) {
        await logApiOperation(authenticatedReq, response, entityInfo, requestBody);
      }
    }

    return response;

  } catch (error) {
    logger.error('Auth middleware error', { requestId, error });
    return errorResponse('Internal server error', 500);
  }
}

// ============================================================================
// SETTINGS MANAGEMENT UTILITIES
// ============================================================================

interface SettingsCache {
  [category: string]: {
    data: Record<string, unknown>[];
    expiry: number;
  };
}

const settingsCache: SettingsCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSettings(category: string, useCache: boolean = true): Promise<Record<string, unknown>[]> {
  const cacheKey = `settings:${category}`;

  // Check cache first
  if (useCache && settingsCache[cacheKey] && settingsCache[cacheKey].expiry > Date.now()) {
    return settingsCache[cacheKey].data;
  }

  try {
    // TODO: Replace with Prisma query once siteSettings is migrated
    const settings: Record<string, unknown>[] = []; // await prisma.siteSettings.findMany({ where: { category } });

    // Cache the result
    settingsCache[cacheKey] = {
      data: settings,
      expiry: Date.now() + CACHE_DURATION
    };

    return settings;
  } catch (error) {
    logger.error('Failed to fetch settings', { category, error });
    return [];
  }
}

export async function updateSettings(
  category: string,
  updates: Record<string, unknown>,
  _userId: string // Prefix with underscore to indicate intentionally unused
): Promise<void> {
  try {
    // TODO: Implement with Prisma
    logger.info('Settings updated', { category, updates });
    
    // Invalidate cache
    delete settingsCache[`settings:${category}`];
  } catch (error) {
    logger.error('Failed to update settings', { category, updates, error });
    throw error;
  }
}

// ============================================================================
// USER-FRIENDLY DATE/TIME FORMATTING
// ============================================================================

/**
 * Format date for API responses using user preferences from headers
 */
export function formatDateForUser(
  date: Date,
  request?: AuthenticatedRequest
): string {
  try {
    // Simple default formatting
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    };
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    logger.warn('Failed to format date for user', { error });
    return date.toDateString();
  }
}

/**
 * Format time for API responses using user preferences from headers
 */
export function formatTimeForUser(
  date: Date,
  request?: AuthenticatedRequest
): string {
  try {
    // Simple default formatting
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    };
    
    return date.toLocaleTimeString('en-US', options);
  } catch (error) {
    logger.warn('Failed to format time for user', { error });
    return date.toTimeString();
  }
}

// ============================================================================
// ENHANCED API WRAPPER UTILITY WITH AUTOMATIC AUDIT LOGGING
// ============================================================================

export function withMiddleware(
  handlers: { [key: string]: (req: AuthenticatedRequest) => Promise<NextResponse> },
  config: ApiConfig = {}
) {
  // Enable audit logging and response transformation by default
  const enhancedConfig = {
    ...config,
    auditConfig: {
      enabled: true,
      ...config.auditConfig
    },
    transformResponse: config.transformResponse !== false // Enable by default
  };

  return Object.entries(handlers).reduce((acc, [method, handler]) => {
    return {
      ...acc,
      [method]: async (request: NextRequest, _context?: Record<string, unknown>) => {
        return withAuth(request, handler, enhancedConfig);
      },
    };
  }, {});
}

// ============================================================================
// ADDITIONAL UTILITIES (UNCHANGED)
// ============================================================================

export async function validateApiAccess(
  request: NextRequest,
  options?: {
    requireAuth?: boolean;
    requireTenant?: boolean;
    allowedMethods?: string[];
    requireRole?: string[];
  }
): Promise<ApiValidationResult> {
  const {
    requireAuth = true,
    requireTenant = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    requireRole = []
  } = options || {};

  try {
    // Check HTTP method
    if (!allowedMethods.includes(request.method || '')) {
      return {
        isValid: false,
        error: `Method ${request.method} not allowed`,
        status: 405
      };
    }

    // Check authentication if required
    if (requireAuth) {
      const session = await auth();

      if (!session?.user) {
        return {
          isValid: false,
          error: 'Authentication required',
          status: 401
        };
      }

      // Check role requirements
      const userRecord = session.user as Record<string, unknown>;
      if (requireRole.length > 0 && !requireRole.includes(userRecord.role as string || '')) {
        return {
          isValid: false,
          error: 'Insufficient permissions',
          status: 403
        };
      }

      const user = session.user;
      const tenantId = userRecord.tenantId as number;

      // Check tenant requirement
      if (requireTenant && !tenantId) {
        return {
          isValid: false,
          error: 'Tenant context required',
          status: 400
        };
      }

      return {
        isValid: true,
        user,
        tenantId
      };
    }

    // If no auth required, just validate method
    return {
      isValid: true
    };

  } catch (error) {
    logger.error('API validation failed', { error });
    return {
      isValid: false,
      error: 'Internal server error',
      status: 500
    };
  }
}

/**
 * Rate limiting middleware
 */
export class ApiRateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove expired requests
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  reset(identifier?: string) {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

/**
 * Parse pagination parameters
 */
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Parse search parameters
 */
export function parseSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = (searchParams.get('order') || 'desc').toLowerCase() as 'asc' | 'desc';

  return { search, sort, order };
}

/**
 * Extract tenant ID from request headers or URL
 */
export function extractTenantId(request: NextRequest): number | null {
  // Try header first
  const headerTenantId = request.headers.get('X-Tenant-ID');
  if (headerTenantId) {
    const parsed = parseInt(headerTenantId);
    if (!isNaN(parsed)) return parsed;
  }

  // Try query parameter
  const { searchParams } = new URL(request.url);
  const queryTenantId = searchParams.get('tenantId');
  if (queryTenantId) {
    const parsed = parseInt(queryTenantId);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
}

export default {
  validateApiAccess,
  ApiRateLimiter,
  parsePaginationParams,
  parseSearchParams,
  extractTenantId,
}; 