import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

export const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // Webhook endpoint for receiving integration callbacks
  fastify.post('/integration/:slug', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.webhooks.read')
    ],
    schema: {
      tags: ['platform.webhooks'],
      params: Type.Object({
        slug: Type.String(),
      }),
      headers: Type.Object({
        'x-webhook-signature': Type.Optional(Type.String()),
        'x-webhook-timestamp': Type.Optional(Type.String()),
        'user-agent': Type.Optional(Type.String()),
        'content-type': Type.Optional(Type.String()),
      }),
      body: Type.Object({}, { additionalProperties: true }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          processedAt: Type.String(),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now();
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { slug } = request.params;
      const signature = request.headers['x-webhook-signature'];
      const timestamp = request.headers['x-webhook-timestamp'];
      const userAgent = request.headers['user-agent'];
      const payload = request.body;

      request.log.info('Webhook received', {
        webhookId,
        slug,
        userAgent,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        payloadSize: JSON.stringify(payload).length,
      });

      // Get integration configuration
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      const integration = await IntegrationsService.getIntegrationBySlug(slug);

      if (!integration || !integration.enabled) {
        request.log.warn('Webhook for unknown or disabled integration', {
          webhookId,
          slug,
          integrationFound: !!integration,
          enabled: integration?.enabled,
        });
        
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND_OR_DISABLED',
        });
      }

      // Validate webhook signature if integration requires auth
      if (integration.requiresAuth && signature) {
        const isValidSignature = await validateWebhookSignature(
          signature,
          JSON.stringify(payload),
          integration.webhookUrl || '', // Secret would be stored securely
          timestamp
        );

        if (!isValidSignature) {
          request.log.warn('Invalid webhook signature', {
            webhookId,
            slug,
            signature: signature?.substring(0, 20) + '...',
          });
          
          return reply.code(401).send({
            success: false,
            error: 'INVALID_WEBHOOK_SIGNATURE',
          });
        }
      }

      // Process webhook based on integration type
      const result = await processWebhook(slug, payload, {
        webhookId,
        userAgent,
        timestamp,
        integration,
      });

      const duration = Date.now() - startTime;

      request.log.info('Webhook processed successfully', {
        webhookId,
        slug,
        duration,
        result: result.type,
      });

      return {
        success: true,
        message: `Webhook processed successfully: ${result.message}`,
        processedAt: new Date().toISOString(),
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      request.log.error('Webhook processing failed', {
        webhookId,
        slug: request.params.slug,
        error: error.message,
        duration,
      });

      return reply.code(500).send({
        success: false,
        error: 'WEBHOOK_PROCESSING_FAILED',
      });
    }
  });

  // Get webhook logs for tenant
  fastify.get('/logs', {
    preHandler: [fastify.authenticate, fastify.requirePermission('webhooks:read')],
    schema: {
      tags: ['platform.webhooks'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        integrationSlug: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('success'),
          Type.Literal('error'),
          Type.Literal('pending')
        ])),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String({ default: 'createdAt' })),
        sortOrder: Type.Optional(Type.Union([
          Type.Literal('asc'),
          Type.Literal('desc')
        ], { default: 'desc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logs: Type.Array(Type.Object({
              tenantId: Type.Number(),
              integrationSlug: Type.String(),
              status: Type.String(),
              payload: Type.Object({}, { additionalProperties: true }),
              response: Type.Optional(Type.Object({}, { additionalProperties: true })),
              errorMessage: Type.Union([Type.String(), Type.Null()]),
              errorCode: Type.Union([Type.String(), Type.Null()]),
              duration: Type.Union([Type.Number(), Type.Null()]),
              workflowId: Type.Union([Type.String(), Type.Null()]),
              runId: Type.Union([Type.String(), Type.Null()]),
              correlationId: Type.Union([Type.String(), Type.Null()]),
              triggeredBy: Type.Union([Type.Number(), Type.Null()]),
              startedAt: Type.String(),
              finishedAt: Type.Union([Type.String(), Type.Null()]),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
            statistics: Type.Object({
              totalLogs: Type.Number(),
              successfulLogs: Type.Number(),
              errorLogs: Type.Number(),
              averageDuration: Type.Union([Type.Number(), Type.Null()]),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const {
        page = 1,
        limit = 50,
        integrationSlug,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = request.query;

      // Mock implementation - in real app, query the integration_logs table
      const mockLogs = [
        {
          id: 1,
          tenantId: request.user!.tenantId!,
          integrationSlug: 'slack',
          status: 'success',
          payload: { message: 'Test webhook', channel: '#general' },
          response: { ok: true, message: { ts: '1234567890.123' } },
          errorMessage: null,
          errorCode: null,
          duration: 245,
          workflowId: 'wf_123456789',
          runId: 'run_987654321',
          correlationId: 'corr_123',
          triggeredBy: request.user!.id,
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          finishedAt: new Date(Date.now() - 3600000 + 245).toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 2,
          tenantId: request.user!.tenantId!,
          integrationSlug: 'webhook',
          status: 'error',
          payload: { data: 'invalid payload' },
          response: null,
          errorMessage: 'Invalid payload format',
          errorCode: 'INVALID_PAYLOAD',
          duration: 120,
          workflowId: null,
          runId: null,
          correlationId: 'corr_124',
          triggeredBy: null,
          startedAt: new Date(Date.now() - 7200000).toISOString(),
          finishedAt: new Date(Date.now() - 7200000 + 120).toISOString(),
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      // Apply filters
      let filteredLogs = mockLogs.filter(log => log.tenantId === request.user!.tenantId);
      
      if (integrationSlug) {
        filteredLogs = filteredLogs.filter(log => log.integrationSlug === integrationSlug);
      }
      
      if (status) {
        filteredLogs = filteredLogs.filter(log => log.status === status);
      }

      if (startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.createdAt) >= new Date(startDate));
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.createdAt) <= new Date(endDate));
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      const total = filteredLogs.length;

      // Calculate statistics
      const successfulLogs = filteredLogs.filter(log => log.status === 'success').length;
      const errorLogs = filteredLogs.filter(log => log.status === 'error').length;
      const durationsWithValues = filteredLogs.filter(log => log.duration !== null).map(log => log.duration!);
      const averageDuration = durationsWithValues.length > 0
        ? durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length
        : null;

      const statistics = {
        totalLogs: total,
        successfulLogs,
        errorLogs,
        averageDuration,
      };

      request.log.info('Webhook logs fetched', {
        tenantId: request.user!.tenantId,
        count: paginatedLogs.length,
        total,
        page,
        filters: { integrationSlug, status, startDate, endDate },
      });

      return {
        success: true,
        data: {
          logs: paginatedLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          statistics,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to fetch webhook logs', {
        error: error.message,
        tenantId: request.user!.tenantId,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_WEBHOOK_LOGS',
      });
    }
  });

  // Get webhook configuration for tenant
  fastify.get('/config', {
    preHandler: [fastify.authenticate, fastify.requirePermission('webhooks:read')],
    schema: {
      tags: ['platform.webhooks'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            webhookEndpoints: Type.Array(Type.Object({
              integration: Type.String(),
              url: Type.String(),
              enabled: Type.Boolean(),
              secret: Type.String(), // Masked
              events: Type.Array(Type.String()),
              retryPolicy: Type.Object({
                maxRetries: Type.Number(),
                backoffMultiplier: Type.Number(),
                maxBackoffMs: Type.Number(),
              }),
            })),
            globalSettings: Type.Object({
              timeoutMs: Type.Number(),
              verifySignatures: Type.Boolean(),
              allowedUserAgents: Type.Array(Type.String()),
              rateLimiting: Type.Object({
                enabled: Type.Boolean(),
                requestsPerMinute: Type.Number(),
              }),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      // Mock webhook configuration
      const webhookConfig = {
        webhookEndpoints: [
          {
            integration: 'slack',
            url: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/webhooks/integration/slack`,
            enabled: true,
            secret: 'whsec_****************************',
            events: ['message.posted', 'channel.created', 'user.joined'],
            retryPolicy: {
              maxRetries: 3,
              backoffMultiplier: 2,
              maxBackoffMs: 30000,
            },
          },
          {
            integration: 'github',
            url: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/v1/webhooks/integration/github`,
            enabled: true,
            secret: 'whsec_****************************',
            events: ['push', 'pull_request', 'issues'],
            retryPolicy: {
              maxRetries: 5,
              backoffMultiplier: 1.5,
              maxBackoffMs: 60000,
            },
          },
        ],
        globalSettings: {
          timeoutMs: 30000,
          verifySignatures: true,
          allowedUserAgents: ['*'],
          rateLimiting: {
            enabled: true,
            requestsPerMinute: 100,
          },
        },
      };

      request.log.info('Webhook configuration fetched', {
        tenantId: request.user!.tenantId,
        endpointCount: webhookConfig.webhookEndpoints.length,
      });

      return {
        success: true,
        data: webhookConfig,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch webhook configuration', {
        error: error.message,
        tenantId: request.user!.tenantId,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_WEBHOOK_CONFIGURATION',
      });
    }
  });

  // Regenerate webhook secret
  fastify.post('@/config/:integration/regenerate-secret', {
    preHandler: [fastify.authenticate, fastify.requirePermission('webhooks:manage')],
    schema: {
      tags: ['platform.webhooks'],
      params: Type.Object({
        integration: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            secret: Type.String(),
            generatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      // Generate new webhook secret
      const newSecret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

      // In real implementation, store this securely in the database
      // and invalidate the old secret

      request.log.info('Webhook secret regenerated', {
        tenantId: request.user!.tenantId,
        integration: request.params.integration,
        secretPrefix: newSecret.substring(0, 10) + '...',
      });

      return {
        success: true,
        data: {
          secret: newSecret,
          generatedAt: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      request.log.error('Failed to regenerate webhook secret', {
        error: error.message,
        tenantId: request.user!.tenantId,
        integration: request.params.integration,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_REGENERATE_WEBHOOK_SECRET',
      });
    }
  });

  // Test webhook endpoint
  fastify.post('/test', {
    preHandler: [fastify.authenticate, fastify.requirePermission('webhooks:test')],
    schema: {
      tags: ['platform.webhooks'],
      body: Type.Object({
        url: Type.String({ format: 'uri' }),
        payload: Type.Object({}, { additionalProperties: true }),
        headers: Type.Optional(Type.Object({}, { additionalProperties: true })),
        method: Type.Optional(Type.Union([
          Type.Literal('POST'),
          Type.Literal('PUT'),
          Type.Literal('PATCH')
        ], { default: 'POST' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            testId: Type.String(),
            status: Type.String(),
            response: Type.Optional(Type.Object({}, { additionalProperties: true })),
            duration: Type.Number(),
            timestamp: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now();
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { url, payload, headers = {}, method = 'POST' } = request.body;

      // Mock webhook test - in real implementation, make actual HTTP request
      const mockResponse = {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-response-time': '150ms',
        },
        body: {
          success: true,
          message: 'Webhook received successfully',
          id: 'msg_123456789',
        },
      };

      const duration = Date.now() - startTime;

      request.log.info('Webhook test completed', {
        testId,
        tenantId: request.user!.tenantId,
        url: url.replace(/\/\/.*@/, '//***@'), // Hide credentials in logs
        duration,
        status: mockResponse.status,
      });

      return {
        success: true,
        data: {
          testId,
          status: 'success',
          response: mockResponse,
          duration,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;

      request.log.error('Webhook test failed', {
        testId,
        tenantId: request.user!.tenantId,
        error: error.message,
        duration,
      });

      return reply.code(500).send({
        success: false,
        error: 'WEBHOOK_TEST_FAILED',
      });
    }
  });
};

// Helper functions
async function validateWebhookSignature(
  signature: string,
  payload: string,
  secret: string,
  timestamp?: string
): Promise<boolean> {
  try {
    // Basic HMAC-SHA256 signature validation (similar to GitHub, Stripe, etc.)
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

async function processWebhook(
  integrationSlug: string,
  payload: any,
  context: {
    webhookId: string;
    userAgent?: string;
    timestamp?: string;
    integration: any;
  }
): Promise<{ type: string; message: string }> {
  // Process webhook based on integration type
  switch (integrationSlug) {
    case 'slack':
      return processSlackWebhook(payload, context);
    case 'github':
      return processGitHubWebhook(payload, context);
    case 'stripe':
      return processStripeWebhook(payload, context);
    default:
      return processGenericWebhook(payload, context);
  }
}

async function processSlackWebhook(payload: any, context: any) {
  // Handle Slack-specific webhook events
  if (payload.type === 'url_verification') {
    return { type: 'verification', message: 'URL verification challenge' };
  }
  
  if (payload.event) {
    return { type: 'event', message: `Processed Slack event: ${payload.event.type}` };
  }
  
  return { type: 'unknown', message: 'Unknown Slack webhook event' };
}

async function processGitHubWebhook(payload: any, context: any) {
  // Handle GitHub-specific webhook events
  const event = context.userAgent?.includes('GitHub-Hookshot') ? 'github_event' : 'unknown';
  return { type: event, message: `Processed GitHub webhook` };
}

async function processStripeWebhook(payload: any, context: any) {
  // Handle Stripe-specific webhook events
  if (payload.type && payload.data) {
    return { type: 'stripe_event', message: `Processed Stripe event: ${payload.type}` };
  }
  
  return { type: 'unknown', message: 'Unknown Stripe webhook event' };
}

async function processGenericWebhook(payload: any, context: any) {
  // Handle generic webhook
  return { type: 'generic', message: 'Processed generic webhook' };
}