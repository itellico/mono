import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const integrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all system integrations (Admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        category: Type.Optional(Type.String()),
        enabled: Type.Optional(Type.Boolean()),
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
        category: request.query.category,
        enabled: request.query.enabled,
        search: request.query.search,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder as 'asc' | 'desc',
      };

      const result = await IntegrationsService.getIntegrations(params);

      request.log.info('System integrations fetched', {
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
      request.log.error('Failed to fetch system integrations', {
        error: error.message,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_SYSTEM_INTEGRATIONS',
      });
    }
  });

  // Get integration by slug
  fastify.get('/:slug', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
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
            }),
            Type.Null(),
          ]),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const integration = await IntegrationsService.getIntegrationBySlug(request.params.slug);

      if (!integration) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND',
        });
      }

      request.log.info('Integration fetched', {
        slug: request.params.slug,
        name: integration.name,
      });

      return {
        success: true,
        data: integration,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch integration', {
        error: error.message,
        slug: request.params.slug,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_INTEGRATION',
      });
    }
  });

  // Create new integration (Admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:create')],
    schema: {
      tags: ['platform.integrations'],
      body: Type.Object({
        slug: Type.String({ minLength: 1, maxLength: 100 }),
        name: Type.String({ minLength: 1, maxLength: 200 }),
        description: Type.Optional(Type.String()),
        iconUrl: Type.Optional(Type.String({ maxLength: 500 })),
        settingsSchema: Type.Object({}, { additionalProperties: true }),
        defaultSettings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        isTemporalEnabled: Type.Optional(Type.Boolean({ default: false })),
        handler: Type.Optional(Type.String({ maxLength: 100 })),
        enabled: Type.Optional(Type.Boolean({ default: true })),
        version: Type.Optional(Type.String({ maxLength: 20, default: '1.0.0' })),
        author: Type.Optional(Type.String({ maxLength: 100 })),
        supportUrl: Type.Optional(Type.String({ maxLength: 500 })),
        documentationUrl: Type.Optional(Type.String({ maxLength: 500 })),
        webhookUrl: Type.Optional(Type.String({ maxLength: 500 })),
        requiresAuth: Type.Optional(Type.Boolean({ default: false })),
        authType: Type.Optional(Type.String({ maxLength: 20 })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
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
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const integration = await IntegrationsService.createIntegration(request.body);

      request.log.info('Integration created', {
        slug: integration.slug,
        name: integration.name,
        });

      return reply.code(201).send({
        success: true,
        data: integration,
      });

    } catch (error: any) {
      request.log.error('Failed to create integration', {
        error: error.message,
        body: request.body,
      });

      if (error.message?.includes('unique') || error.code === '23505') {
        return reply.code(409).send({
          success: false,
          error: 'INTEGRATION_WITH_THIS_SLUG_ALREADY_EXISTS',
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_INTEGRATION',
      });
    }
  });

  // Update integration (Admin only)
  fastify.patch('/:slug', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:update')],
    schema: {
      tags: ['platform.integrations'],
      params: Type.Object({
        slug: Type.String(),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        description: Type.Optional(Type.String()),
        iconUrl: Type.Optional(Type.String({ maxLength: 500 })),
        settingsSchema: Type.Optional(Type.Object({}, { additionalProperties: true })),
        defaultSettings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        category: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        isTemporalEnabled: Type.Optional(Type.Boolean()),
        handler: Type.Optional(Type.String({ maxLength: 100 })),
        enabled: Type.Optional(Type.Boolean()),
        version: Type.Optional(Type.String({ maxLength: 20 })),
        author: Type.Optional(Type.String({ maxLength: 100 })),
        supportUrl: Type.Optional(Type.String({ maxLength: 500 })),
        documentationUrl: Type.Optional(Type.String({ maxLength: 500 })),
        webhookUrl: Type.Optional(Type.String({ maxLength: 500 })),
        requiresAuth: Type.Optional(Type.Boolean()),
        authType: Type.Optional(Type.String({ maxLength: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
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
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const integration = await IntegrationsService.updateIntegration(
        request.params.slug,
        request.body
      );

      if (!integration) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND',
        });
      }

      request.log.info('Integration updated', {
        slug: integration.slug,
        name: integration.name,
        });

      return {
        success: true,
        data: integration,
      };

    } catch (error: any) {
      request.log.error('Failed to update integration', {
        error: error.message,
        slug: request.params.slug,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_INTEGRATION',
      });
    }
  });

  // Delete integration (Admin only)
  fastify.delete('/:slug', {
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
      
      const integration = await IntegrationsService.deleteIntegration(request.params.slug);

      if (!integration) {
        return reply.code(404).send({
          success: false,
          error: 'INTEGRATION_NOT_FOUND',
        });
      }

      request.log.info('Integration deleted', {
        slug: integration.slug,
        name: integration.name,
        });

      return {
        success: true,
        message: 'Integration deleted successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to delete integration', {
        error: error.message,
        slug: request.params.slug,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_INTEGRATION',
      });
    }
  });

  // Get integration statistics (Admin only)
  fastify.get('/statistics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('integrations:read')],
    schema: {
      tags: ['platform.integrations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalIntegrations: Type.Number(),
            enabledIntegrations: Type.Number(),
            categoryCounts: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { IntegrationsService } = await import('@/lib@/services/integrations.service');
      
      const statistics = await IntegrationsService.getIntegrationStatistics();

      request.log.info('Integration statistics fetched', {
        totalIntegrations: statistics.totalIntegrations,
        enabledIntegrations: statistics.enabledIntegrations,
      });

      return {
        success: true,
        data: statistics,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch integration statistics', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_INTEGRATION_STATISTICS',
      });
    }
  });
};