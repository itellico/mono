import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const tenantIntegrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get tenant integrations
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('inactive'),
          Type.Literal('disabled')
        ])),
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String({ default: 'name' })),
        sortOrder: Type.Optional(Type.Union([
          Type.Literal('asc'),
          Type.Literal('desc')
        ], { default: 'asc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            integrations: Type.Array(Type.Object({
              tenantId: Type.Number(),
              integrationSlug: Type.String(),
              status: Type.String(),
              settings: Type.Object({}, { additionalProperties: true }),
              fieldMappings: Type.Object({}, { additionalProperties: true }),
              lastSyncedAt: Type.Union([Type.String(), Type.Null()]),
              lastErrorAt: Type.Union([Type.String(), Type.Null()]),
              lastErrorMessage: Type.Union([Type.String(), Type.Null()]),
              syncCount: Type.Number(),
              errorCount: Type.Number(),
              isTestMode: Type.Boolean(),
              createdBy: Type.Union([Type.Number(), Type.Null()]),
              createdAt: Type.String(),
              updatedAt: Type.String(),
              integration: Type.Optional(Type.Object({
                slug: Type.String(),
                name: Type.String(),
                description: Type.Union([Type.String(), Type.Null()]),
                iconUrl: Type.Union([Type.String(), Type.Null()]),
                category: Type.String(),
                enabled: Type.Boolean(),
                version: Type.String(),
                documentationUrl: Type.Union([Type.String(), Type.Null()]),
                supportUrl: Type.Union([Type.String(), Type.Null()]),
                webhookUrl: Type.Union([Type.String(), Type.Null()]),
                requiresAuth: Type.Boolean(),
                authType: Type.Union([Type.String(), Type.Null()]),
              })),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const params = {
        page: request.query.page,
        limit: request.query.limit,
        status: request.query.status,
        category: request.query.category,
        search: request.query.search,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder as 'asc' | 'desc',
      };

      const result = await IntegrationsService.getTenantIntegrations(
        request.user!.tenantId!,
        params
      );

      request.log.info('Tenant integrations fetched', {
        tenantId: request.user!.tenantId,
        count: result.data.length,
        total: result.pagination.total,
        page: params.page,
      });

      return {
        success: true,
        data: {
          integrations: result.data,
          pagination: result.pagination,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to fetch tenant integrations', {
        error: error.message,
        tenantId: request.user!.tenantId,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_TENANT_INTEGRATIONS',
      });
    }
  });

  // Get available integrations for tenant (not yet configured)
  fastify.get('/available', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            slug: Type.String(),
            name: Type.String(),
            description: Type.Union([Type.String(), Type.Null()]),
            iconUrl: Type.Union([Type.String(), Type.Null()]),
            settingsSchema: Type.Object({}, { additionalProperties: true }),
            defaultSettings: Type.Object({}, { additionalProperties: true }),
            category: Type.String(),
            isTemporalEnabled: Type.Boolean(),
            handler: Type.Union([Type.String(), Type.Null()]),
            enabled: Type.Boolean(),
            version: Type.String(),
            author: Type.Union([Type.String(), Type.Null()]),
            supportUrl: Type.Union([Type.String(), Type.Null()]),
            documentationUrl: Type.Union([Type.String(), Type.Null()]),
            webhookUrl: Type.Union([Type.String(), Type.Null()]),
            requiresAuth: Type.Boolean(),
            authType: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const availableIntegrations = await IntegrationsService.getAvailableIntegrations(
        request.user!.tenantId!
      );

      request.log.info('Available integrations fetched', {
        tenantId: request.user!.tenantId,
        count: availableIntegrations.length,
      });

      return {
        success: true,
        data: availableIntegrations,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch available integrations', {
        error: error.message,
        tenantId: request.user!.tenantId,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_AVAILABLE_INTEGRATIONS',
      });
    }
  });

  // Enable integration for tenant
  fastify.post('/enable', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:create')],
    schema: {
      tags: ['platform.integrations'],
      body: Type.Object({
        integrationSlug: Type.String({ minLength: 1 }),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        fieldMappings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isTestMode: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenantId: Type.Number(),
            integrationSlug: Type.String(),
            status: Type.String(),
            settings: Type.Object({}, { additionalProperties: true }),
            fieldMappings: Type.Object({}, { additionalProperties: true }),
            lastSyncedAt: Type.Union([Type.String(), Type.Null()]),
            lastErrorAt: Type.Union([Type.String(), Type.Null()]),
            lastErrorMessage: Type.Union([Type.String(), Type.Null()]),
            syncCount: Type.Number(),
            errorCount: Type.Number(),
            isTestMode: Type.Boolean(),
            createdBy: Type.Union([Type.Number(), Type.Null()]),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const tenantIntegration = await IntegrationsService.enableTenantIntegration(
        request.user!.tenantId!,
        request.body,
        request.user!.id
      );

      request.log.info('Integration enabled for tenant', {
        tenantId: request.user!.tenantId,
        integrationSlug: request.body.integrationSlug,
        tenantIntegrationId: tenantIntegration.uuid as UUID,
      });

      return reply.code(201).send({
        success: true,
        data: tenantIntegration,
      });

    } catch (error: any) {
      request.log.error('Failed to enable integration for tenant', {
        error: error.message,
        tenantId: request.user!.tenantId,
        body: request.body,
      });

      if (error.message?.includes('already enabled')) {
        return reply.code(409).send({
          success: false,
          error: 'INTEGRATION_IS_ALREADY_ENABLED_FOR_THIS_TENANT',
        });
      }

      if (error.message?.includes('not available')) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND_OR_NOT_AVAILABLE',
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_ENABLE_INTEGRATION',
      });
    }
  });

  // Update tenant integration settings
  fastify.patch('/:slug', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:update')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      body: Type.Object({
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('inactive'),
          Type.Literal('disabled')
        ])),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        fieldMappings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isTestMode: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenantId: Type.Number(),
            integrationSlug: Type.String(),
            status: Type.String(),
            settings: Type.Object({}, { additionalProperties: true }),
            fieldMappings: Type.Object({}, { additionalProperties: true }),
            lastSyncedAt: Type.Union([Type.String(), Type.Null()]),
            lastErrorAt: Type.Union([Type.String(), Type.Null()]),
            lastErrorMessage: Type.Union([Type.String(), Type.Null()]),
            syncCount: Type.Number(),
            errorCount: Type.Number(),
            isTestMode: Type.Boolean(),
            createdBy: Type.Union([Type.Number(), Type.Null()]),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const tenantIntegration = await IntegrationsService.updateTenantIntegration(
        request.user!.tenantId!,
        request.params.slug,
        request.body
      );

      if (!tenantIntegration) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND_FOR_THIS_TENANT',
        });
      }

      request.log.info('Tenant integration updated', {
        tenantId: request.user!.tenantId,
        integrationSlug: request.params.slug,
        tenantIntegrationId: tenantIntegration.uuid as UUID,
      });

      return {
        success: true,
        data: tenantIntegration,
      };

    } catch (error: any) {
      request.log.error('Failed to update tenant integration', {
        error: error.message,
        tenantId: request.user!.tenantId,
        slug: request.params.slug,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_INTEGRATION_SETTINGS',
      });
    }
  });

  // Disable integration for tenant
  fastify.post('/:slug/disable', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:delete')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const tenantIntegration = await IntegrationsService.disableTenantIntegration(
        request.user!.tenantId!,
        request.params.slug
      );

      if (!tenantIntegration) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND_FOR_THIS_TENANT',
        });
      }

      request.log.info('Integration disabled for tenant', {
        tenantId: request.user!.tenantId,
        integrationSlug: request.params.slug,
        tenantIntegrationId: tenantIntegration.uuid as UUID,
      });

      return {
        success: true,
        message: 'Integration disabled successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to disable tenant integration', {
        error: error.message,
        tenantId: request.user!.tenantId,
        slug: request.params.slug,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DISABLE_INTEGRATION',
      });
    }
  });

  // Get tenant integration statistics
  fastify.get('/statistics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalIntegrations: Type.Number(),
            activeIntegrations: Type.Number(),
            totalSyncs: Type.Number(),
            totalErrors: Type.Number(),
            lastSyncDate: Type.Union([Type.String(), Type.Null()]),
            statusCounts: Type.Object({}, { additionalProperties: true }),
            categoryCounts: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const statistics = await IntegrationsService.getTenantIntegrationStatistics(
        request.user!.tenantId!
      );

      request.log.info('Tenant integration statistics fetched', {
        tenantId: request.user!.tenantId,
        totalIntegrations: statistics.totalIntegrations,
        activeIntegrations: statistics.activeIntegrations,
      });

      return {
        success: true,
        data: statistics,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch tenant integration statistics', {
        error: error.message,
        tenantId: request.user!.tenantId,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_INTEGRATION_STATISTICS',
      });
    }
  });

  // Test integration configuration
  fastify.post('/:slug/test', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:execute')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      body: Type.Optional(Type.Object({
        testPayload: Type.Optional(Type.Object({}, { additionalProperties: true })),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })), // Override settings for testing
      })),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            testResult: Type.String(),
            response: Type.Optional(Type.Object({}, { additionalProperties: true })),
            duration: Type.Number(),
            errors: Type.Optional(Type.Array(Type.String())),
            warnings: Type.Optional(Type.Array(Type.String())),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const startTime = Date.now();
      
      // Mock test implementation
      const mockTestResult = {
        testResult: 'success',
        response: {
          status: 'connected',
          version: '1.0.0',
          features: ['webhooks', 'sync', 'auth'],
        },
        duration: Date.now() - startTime,
        warnings: ['Test mode: using mock data'],
      };

      request.log.info('Integration test completed', {
        tenantId: request.user!.tenantId,
        integrationSlug: request.params.slug,
        result: mockTestResult.testResult,
        duration: mockTestResult.duration,
      });

      return {
        success: true,
        data: mockTestResult,
      };

    } catch (error: any) {
      request.log.error('Integration test failed', {
        error: error.message,
        tenantId: request.user!.tenantId,
        slug: request.params.slug,
      });

      return reply.code(500).send({
        success: false,
        error: 'INTEGRATION_TEST_FAILED',
      });
    }
  });

  // Trigger manual sync for integration
  fastify.post('/:slug/sync', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:execute')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      body: Type.Optional(Type.Object({
        syncType: Type.Optional(Type.Union([
          Type.Literal('full'),
          Type.Literal('incremental'),
          Type.Literal('test')
        ], { default: 'incremental' })),
        options: Type.Optional(Type.Object({}, { additionalProperties: true })),
      })),
      response: {
        202: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            syncId: Type.String(),
            status: Type.String(),
            startedAt: Type.String(),
            estimatedDuration: Type.Optional(Type.Number()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock sync trigger implementation
      const syncInfo = {
        syncId,
        status: 'started',
        startedAt: new Date().toISOString(),
        estimatedDuration: 300, // 5 minutes
      };

      // Update sync statistics
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      await IntegrationsService.updateSyncStatistics(
        request.user!.tenantId!,
        request.params.slug,
        true
      );

      request.log.info('Integration sync triggered', {
        tenantId: request.user!.tenantId,
        integrationSlug: request.params.slug,
        syncId,
        syncType: request.body?.syncType,
      });

      return reply.code(202).send({
        success: true,
        data: syncInfo,
      });

    } catch (error: any) {
      request.log.error('Failed to trigger integration sync', {
        error: error.message,
        tenantId: request.user!.tenantId,
        slug: request.params.slug,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_TRIGGER_SYNC',
      });
    }
  });
};