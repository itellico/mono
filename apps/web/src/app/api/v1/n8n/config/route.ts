import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { unifiedN8NService } from '@/lib/services/n8n.service';

/**
 * @openapi
 * /api/v1/n8n/config:
 *   post:
 *     summary: Configure N8N integration for tenant
 *     description: Create or update LLM provider configuration for tenant
 *     tags:
 *       - N8N Integration
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - llmProvider
 *               - apiKey
 *             properties:
 *               llmProvider:
 *                 type: string
 *                 enum: [openai, anthropic, mistral]
 *                 description: LLM provider to configure
 *               apiKey:
 *                 type: string
 *                 description: API key for the LLM provider
 *               modelConfig:
 *                 type: object
 *                 description: Model-specific configuration
 *               webhookPrefix:
 *                 type: string
 *                 description: Custom webhook prefix for tenant
 *               notificationSettings:
 *                 type: object
 *                 description: Notification settings (Mattermost, Slack, etc.)
 *               rateLimits:
 *                 type: object
 *                 description: Per-tenant rate limiting configuration
 *               quotas:
 *                 type: object
 *                 description: Usage quotas and limits
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     uuid:
 *                       type: string
 *                     tenantId:
 *                       type: number
 *                     llmProvider:
 *                       type: string
 *                     webhookPrefix:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get tenant N8N configurations
 *     description: Retrieve all N8N configurations for the tenant
 *     tags:
 *       - N8N Integration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       uuid:
 *                         type: string
 *                       llmProvider:
 *                         type: string
 *                       webhookPrefix:
 *                         type: string
 *                       modelConfig:
 *                         type: object
 *                       isActive:
 *                         type: boolean
 *                       lastUsed:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 */

const ConfigRequestSchema = z.object({
  llmProvider: z.enum(['openai', 'anthropic', 'mistral']),
  apiKey: z.string().min(1, 'API key is required'),
  modelConfig: z.record(z.any()).default({}),
  webhookPrefix: z.string().optional(),
  notificationSettings: z.record(z.any()).default({}),
  rateLimits: z.record(z.any()).default({}),
  quotas: z.record(z.any()).default({}),
});

export async function POST(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Basic permission check - only authenticated users with tenant access
    // TODO: Implement proper canAccessAPI when available

    // Get tenant ID from session - using placeholder until proper session structure is available
    const tenantId = (session.user as any).tenantId || 1; // Default to tenant 1 for now
    const userId = parseInt(session.user.id as string);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ConfigRequestSchema.parse(body);

    // Configure tenant N8N
    const config = await unifiedN8NService.configureTenant(
      tenantId,
      userId,
      validatedData
    );

    // Remove sensitive data from response
    const { encryptedApiKey, keyHash, ...safeConfig } = config;

    logger.info('N8N configuration created/updated', {
      tenantId,
      userId,
      provider: validatedData.llmProvider,
    });

    return NextResponse.json({
      success: true,
      data: safeConfig,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('N8N configuration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant ID from session
    const tenantId = (session.user as any).tenantId || 1; // Default to tenant 1 for now
    const userId = parseInt(session.user.id as string);

    // Get tenant configurations (placeholder for now)
    const configs: any[] = []; // await unifiedN8NService.getTenantConfigs(tenantId);

    logger.info('N8N configurations retrieved', {
      tenantId,
      userId,
      configCount: configs.length,
    });

    return NextResponse.json({
      success: true,
      data: configs,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve N8N configurations', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 