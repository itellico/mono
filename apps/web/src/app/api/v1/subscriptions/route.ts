/**
 * @fileoverview Subscription Management API Routes
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @openapi
 * /api/v1/subscriptions:
 *   get:
 *     summary: Get subscriptions with filtering
 *     description: Retrieve subscriptions with optional filtering and pagination
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Filter by tenant ID (null for platform-level)
 *       - in: query
 *         name: subscriptionType
 *         schema:
 *           type: string
 *         description: Filter by subscription type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
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
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subscription'
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 *   
 *   post:
 *     summary: Create new subscription
 *     description: Create a new subscription plan with features and limits
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subscriptionType
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Plan"
 *               description:
 *                 type: string
 *                 example: "Premium subscription with advanced features"
 *               subscriptionType:
 *                 type: string
 *                 enum: [platform, tenant, account]
 *                 example: "tenant"
 *               tenantId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               pricing:
 *                 type: object
 *                 example:
 *                   monthly: 29.99
 *                   yearly: 299.99
 *                   currency: "USD"
 *               metadata:
 *                 type: object
 *                 example: {}
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     featureName:
 *                       type: string
 *                     featureDescription:
 *                       type: string
 *                     requiredPermissions:
 *                       type: array
 *                       items:
 *                         type: string
 *               limits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     limitType:
 *                       type: string
 *                     resourceType:
 *                       type: string
 *                     maxValue:
 *                       type: integer
 *                     period:
 *                       type: string
 *                     scope:
 *                       type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 * 
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         subscriptionType:
 *           type: string
 *           enum: [platform, tenant, account]
 *         tenantId:
 *           type: integer
 *           nullable: true
 *         createdByUserId:
 *           type: integer
 *         pricing:
 *           type: object
 *         isActive:
 *           type: boolean
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { UnifiedPermissionService } from '@/lib/services/unified-permission.service';
import { subscriptionService } from '@/lib/services/subscription.service';
import { z } from 'zod';

// Validation schemas
const subscriptionFiltersSchema = z.object({
  tenantId: z.coerce.number().nullable().optional(),
  subscriptionType: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subscriptionType: z.enum(['platform', 'tenant', 'account']),
  tenantId: z.number().nullable().optional(),
  pricing: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  features: z.array(z.object({
    featureName: z.string(),
    featureDescription: z.string().optional(),
    requiredPermissions: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  limits: z.array(z.object({
    limitType: z.string(),
    resourceType: z.string(),
    maxValue: z.number().int().min(0),
    period: z.string().optional(),
    scope: z.string()
  })).optional()
});

/**
 * GET /api/v1/subscriptions
 * Retrieve subscriptions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: 'Authentication required' 
          }
        },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const filtersResult = subscriptionFiltersSchema.safeParse({
      tenantId: searchParams.get('tenantId'),
      subscriptionType: searchParams.get('subscriptionType'),
      isActive: searchParams.get('isActive'),
      search: searchParams.get('search'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    if (!filtersResult.success) {
      logger.warn('Invalid subscription filters', {
        userId,
        errors: filtersResult.error.errors
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Invalid query parameters',
            details: filtersResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const { tenantId, limit, offset, ...filters } = filtersResult.data;

    // Check permissions - user needs to be able to read subscriptions
    const permissionContext = { tenantId };
    const canRead = await UnifiedPermissionService.hasPermission(
      userId,
      'subscriptions.read.tenant',
      permissionContext
    );

    if (!canRead.hasPermission) {
      logger.warn('Insufficient permissions for subscription access', {
        userId,
        tenantId,
        permission: 'subscriptions.read.tenant'
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to view subscriptions'
          }
        },
        { status: 403 }
      );
    }

    // Get subscriptions
    const result = await SubscriptionService.getSubscriptions(
      { ...filters, tenantId },
      { limit, offset }
    );

    const totalPages = Math.ceil(result.total / limit);

    logger.info('Subscriptions retrieved', {
      userId,
      tenantId,
      total: result.total,
      returned: result.subscriptions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: result.subscriptions,
        total: result.total,
        pagination: {
          limit,
          offset,
          totalPages
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: crypto.randomUUID()
      }
    });

  } catch (error) {
    logger.error('Error retrieving subscriptions', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve subscriptions'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/subscriptions
 * Create a new subscription plan
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED',
            message: 'Authentication required' 
          }
        },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createSubscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      logger.warn('Invalid subscription creation data', {
        userId,
        errors: validationResult.error.errors
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid subscription data',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const subscriptionData = validationResult.data;

    // Check permissions - user needs to be able to create subscriptions
    const permissionContext = { tenantId: subscriptionData.tenantId };
    const canCreate = await UnifiedPermissionService.hasPermission(
      userId,
      'subscriptions.create.tenant',
      permissionContext
    );

    if (!canCreate.hasPermission) {
      logger.warn('Insufficient permissions for subscription creation', {
        userId,
        tenantId: subscriptionData.tenantId,
        permission: 'subscriptions.create.tenant'
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You do not have permission to create subscriptions'
          }
        },
        { status: 403 }
      );
    }

    // Create subscription
    const subscription = await subscriptionService.createSubscription({
      ...subscriptionData,
      createdByUserId: userId
    });

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      name: subscription.name,
      type: subscription.subscriptionType,
      createdBy: userId,
      tenantId: subscription.tenantId
    });

    return NextResponse.json(
      {
        success: true,
        data: subscription,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: crypto.randomUUID()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('Error creating subscription', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create subscription'
        }
      },
      { status: 500 }
    );
  }
} 