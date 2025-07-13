/**
 * @swagger
 * /api/v1/admin/tenants:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all tenants (Admin only)
 *     description: |
 *       Retrieve a paginated list of all tenants in the system. This endpoint is restricted to administrators only.
 *       
 *       **Caching**: Results are cached in Redis for 5 minutes with automatic invalidation on data changes.
 *       
 *       **Permissions**: Admin access required
 *     security:
 *       - nextAuthSession: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of tenants per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query to filter tenants by name or domain
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, suspended]
 *           default: all
 *         description: Filter tenants by status
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tenant'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                 message:
 *                   type: string
 *                   example: "Tenants retrieved successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

import { NextRequest, NextResponse } from 'next/server';
import { tenantsService } from '@/lib/services/tenants.service';
import { CacheInvalidationService } from '@/lib/services/cache-invalidation.service';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';
import { withPermissions, Permissions, getQueryParams, apiResponse, type EnhancedNextRequest } from '@/lib/api-permissions-wrapper';
import type { 
  GetTenantsParams, 
  CreateTenantData
} from '@/lib/services/tenants.service';

/**
 * Admin Tenants API Route - itellico Mono Implementation
 * 
 * ✅ mono PLATFORM COMPLIANCE:
 * - THREE-LAYER CACHE COORDINATION (Next.js + Redis + TanStack Query)
 * - Tenant isolation and permission validation
 * - Comprehensive audit logging
 * - Proper error handling with user-friendly messages
 * - OpenAPI 3.0.3 documentation
 * - Optimistic update coordination
 * - Security headers and request validation
 */

// ✅ GET /api/v1/admin/tenants - List tenants with filtering and pagination
/**
 * @openapi
 * /api/v1/admin/tenants:
 *   get:
 *     summary: Get tenants list
 *     description: Retrieve a paginated list of tenants with optional filtering
 *     tags:
 *       - Admin - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for tenant name, domain, or slug
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, suspended]
 *           default: all
 *         description: Filter by tenant status
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by default currency (comma-separated)
 *       - in: query
 *         name: userCountRange
 *         schema:
 *           type: string
 *         description: Filter by user count range
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TenantListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export const GET = withPermissions(
  Permissions.TENANT_LIST,
  async (request: EnhancedNextRequest) => {
    const startTime = Date.now();
    
    // ✅ Extract and validate query parameters using helper
    const params = getQueryParams(request, {
      page: { type: 'number', default: 1, validate: (v) => v >= 1 },
      limit: { type: 'number', default: 20, validate: (v) => v >= 1 && v <= 100 },
      search: { type: 'string', default: '' },
      status: { type: 'string', default: 'all', validate: (v) => ['all', 'active', 'inactive', 'suspended'].includes(v) },
      currency: { type: 'string', default: '' },
      userCountRange: { type: 'string', default: '' }
    });

    logger.info('Processing tenants request', {
      params,
      requestId: request.requestId,
      userId: request.userId
    });

    // ✅ SERVICE LAYER CALL - Three-layer caching handled in service
    const result = await tenantsService.getAll(params);

    logger.info('Tenants retrieved successfully', {
      tenantCount: result.tenants.length,
      total: result.pagination.total,
      duration: Date.now() - startTime,
      requestId: request.requestId,
      userId: request.userId
    });

    // ✅ Return standardized response
    return apiResponse(result, {
      message: 'Tenants retrieved successfully',
      meta: {
        version: '1.0',
        requestId: request.requestId,
        duration: Date.now() - startTime,
        source: 'admin-api'
      }
    });
  }
);

/**
 * @swagger
 * /api/v1/admin/tenants:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create new tenant (Admin only)
 *     description: |
 *       Create a new tenant in the system. This endpoint is restricted to administrators only.
 *       
 *       **Cache Invalidation**: Automatically invalidates all tenant list caches upon successful creation.
 *       
 *       **Permissions**: Admin access required
 *     security:
 *       - nextAuthSession: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - primaryCurrency
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Tenant name
 *                 example: "Acme Corporation"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Primary contact email
 *                 example: "admin@acme.com"
 *               primaryCurrency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, CAD, JPY, AUD, CHF, CNY]
 *                 description: Default currency code
 *                 example: "USD"
 *               domain:
 *                 type: string
 *                 description: Custom domain (optional)
 *                 example: "acme.example.com"
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 description: URL-friendly identifier (optional)
 *                 example: "acme-corp"
 *               description:
 *                 type: string
 *                 description: Tenant description (optional)
 *                 example: "Leading provider of innovative solutions"
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CreateTenantResult'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export const POST = withPermissions(
  Permissions.TENANT_CREATE,
  async (request: EnhancedNextRequest) => {
    const startTime = Date.now();

    // ✅ REQUEST BODY VALIDATION
    let body: CreateTenantData;
    try {
      body = await request.json();
    } catch {
      return apiResponse(null, {
        success: false,
        message: 'Invalid JSON in request body',
        status: 400
      });
    }

    // ✅ INPUT VALIDATION
    const validationErrors = validateCreateTenantData(body);
    if (validationErrors.length > 0) {
      logger.warn('Validation failed', {
        errors: validationErrors,
        requestId: request.requestId
      });

      return apiResponse(null, {
        success: false,
        message: 'Validation failed',
        meta: { errors: validationErrors },
        status: 400
      });
    }

    logger.info('Processing tenant creation', {
      tenantName: body.name,
      requestId: request.requestId,
      userId: request.userId
    });

    // ✅ SERVICE LAYER CALL - Create tenant with audit logging
    const result = await tenantsService.create(body, request.userId!);

    if (result.success && result.tenant) {
      // ✅ THREE-LAYER CACHE INVALIDATION COORDINATION
      await Promise.all([
        revalidateTag('tenants'),
        revalidateTag('tenants-list'),
        revalidateTag('tenant-stats'),
        CacheInvalidationService.clearAllCaches()
      ]);

      logger.info('Tenant created successfully', {
        tenantUuid: result.tenant.uuid,
        tenantName: result.tenant.name,
        duration: Date.now() - startTime,
        requestId: request.requestId,
        userId: request.userId
      });

      return apiResponse(result, {
        message: 'Tenant created successfully',
        status: 201,
        meta: {
          version: '1.0',
          requestId: request.requestId,
          duration: Date.now() - startTime,
          source: 'admin-api'
        }
      });
    } else {
      // ✅ BUSINESS LOGIC ERRORS
      logger.warn('Tenant creation failed', {
        errors: result.errors || [result.error],
        duration: Date.now() - startTime,
        requestId: request.requestId
      });

      return apiResponse(null, {
        success: false,
        message: result.error || 'Tenant creation failed',
        meta: { errors: result.errors },
        status: 400
      });
    }
  }
);

// ✅ HELPER FUNCTIONS

/**
 * Validate create tenant data
 */
function validateCreateTenantData(data: unknown): string[] {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be an object');
    return errors;
  }
  
  const tenant = data as Partial<CreateTenantData>;
  
  // Required fields
  if (!tenant.name || typeof tenant.name !== 'string' || !tenant.name.trim()) {
    errors.push('Name is required and must be a non-empty string');
  } else if (tenant.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }
  
  if (!tenant.email || typeof tenant.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tenant.email)) {
      errors.push('Email must be a valid email address');
    }
  }
  
  if (!tenant.primaryCurrency || typeof tenant.primaryCurrency !== 'string') {
    errors.push('Primary currency is required and must be a string');
  } else {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'CHF', 'CNY'];
    if (!validCurrencies.includes(tenant.primaryCurrency)) {
      errors.push(`Primary currency must be one of: ${validCurrencies.join(', ')}`);
    }
  }
  
  // Optional field validations
  if (tenant.domain !== undefined) {
    if (typeof tenant.domain !== 'string') {
      errors.push('Domain must be a string if provided');
    } else if (tenant.domain.length > 255) {
      errors.push('Domain must be 255 characters or less');
    }
  }
  
  if (tenant.slug !== undefined) {
    if (typeof tenant.slug !== 'string') {
      errors.push('Slug must be a string if provided');
    } else {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(tenant.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
      } else if (tenant.slug.length > 50) {
        errors.push('Slug must be 50 characters or less');
      }
    }
  }
  
  if (tenant.description !== undefined) {
    if (typeof tenant.description !== 'string') {
      errors.push('Description must be a string if provided');
    } else if (tenant.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }
  
  return errors;
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 