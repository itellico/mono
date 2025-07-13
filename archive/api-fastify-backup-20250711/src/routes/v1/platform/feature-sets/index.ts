import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { FeatureSetService } from '@/services/feature-set.service';

export const featureSetsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize feature set service
  const featureSetService = new FeatureSetService(
    fastify.prisma,
    fastify.redis,
    fastify.log
  );

  // Search feature sets
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        minimumTier: Type.Optional(Type.String()),
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        resourceUsage: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('medium'),
          Type.Literal('high'),
        ])),
        isActive: Type.Optional(Type.Boolean()),
        availableInTier: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('name'),
          Type.Literal('category'),
          Type.Literal('minimumTier'),
          Type.Literal('complexity'),
          Type.Literal('createdAt'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featureSets: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              complexity: Type.String(),
              resourceUsage: Type.String(),
              minimumTier: Type.String(),
              availableInTiers: Type.Array(Type.String()),
              setupRequired: Type.Boolean(),
              isActive: Type.Boolean(),
              createdAt: Type.String(),
              _count: Type.Object({
                tenantFeatures: Type.Number(),
              }),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const result = await featureSetService.searchFeatureSets(request.query);

    return {
      success: true,
      data: result,
    };
  });

  // Get features by category
  fastify.get('/by-category', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Record(Type.String(), Type.Array(Type.Any())),
        }),
      },
    },
  }, async (request, reply) => {
    const featuresByCategory = await featureSetService.getFeaturesByCategory();

    return {
      success: true,
      data: featuresByCategory,
    };
  });

  // Get feature set statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalFeatureSets: Type.Number(),
            activeFeatureSets: Type.Number(),
            totalActivations: Type.Number(),
            categoryUsage: Type.Record(Type.String(), Type.Number()),
            tierUsage: Type.Record(Type.String(), Type.Number()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const stats = await featureSetService.getFeatureSetStats();

    return {
      success: true,
      data: stats,
    };
  });

  // Create feature set
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:create')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 200 }),
        slug: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String()),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        isActive: Type.Optional(Type.Boolean()),
        
        // Feature configuration
        features: Type.Record(Type.String(), Type.Any()),
        dependencies: Type.Optional(Type.Array(Type.String())),
        conflicts: Type.Optional(Type.Array(Type.String())),
        
        // Subscription tiers
        availableInTiers: Type.Optional(Type.Array(Type.String())),
        minimumTier: Type.Optional(Type.String()),
        
        // API and service configurations
        apiEndpoints: Type.Optional(Type.Record(Type.String(), Type.Any())),
        serviceConfig: Type.Optional(Type.Record(Type.String(), Type.Any())),
        databaseSchema: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // UI and permissions
        uiComponents: Type.Optional(Type.Record(Type.String(), Type.Any())),
        permissions: Type.Optional(Type.Array(Type.String())),
        navigationItems: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // Metadata
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        resourceUsage: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('medium'),
          Type.Literal('high'),
        ])),
        setupRequired: Type.Optional(Type.Boolean()),
        version: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featureSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const featureSet = await featureSetService.createFeatureSet(request.body);

      return reply.code(201).send({
        success: true,
        data: {
          featureSet: {
            uuid: featureSet.uuid,
            name: featureSet.name,
            slug: featureSet.slug,
            createdAt: featureSet.createdAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get feature set by UUID
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featureSet: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    const featureSet = await featureSetService.getFeatureSet(uuid);

    if (!featureSet) {
      return reply.code(404).send({
        success: false,
        error: 'FEATURE_SET_NOT_FOUND',
      });
    }

    return {
      success: true,
      data: { featureSet },
    };
  });

  // Update feature set
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:update')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        slug: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        isActive: Type.Optional(Type.Boolean()),
        
        // Feature configuration
        features: Type.Optional(Type.Record(Type.String(), Type.Any())),
        dependencies: Type.Optional(Type.Array(Type.String())),
        conflicts: Type.Optional(Type.Array(Type.String())),
        
        // Subscription tiers
        availableInTiers: Type.Optional(Type.Array(Type.String())),
        minimumTier: Type.Optional(Type.String()),
        
        // API and service configurations
        apiEndpoints: Type.Optional(Type.Record(Type.String(), Type.Any())),
        serviceConfig: Type.Optional(Type.Record(Type.String(), Type.Any())),
        databaseSchema: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // UI and permissions
        uiComponents: Type.Optional(Type.Record(Type.String(), Type.Any())),
        permissions: Type.Optional(Type.Array(Type.String())),
        navigationItems: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // Metadata
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        resourceUsage: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('medium'),
          Type.Literal('high'),
        ])),
        setupRequired: Type.Optional(Type.Boolean()),
        version: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featureSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Get feature set by UUID first
    const existingFeatureSet = await fastify.prisma.featureSet.findUnique({
      where: { uuid },
    });

    if (!existingFeatureSet) {
      return reply.code(404).send({
        success: false,
        error: 'FEATURE_SET_NOT_FOUND',
      });
    }

    try {
      const featureSet = await featureSetService.updateFeatureSet(
        existingFeatureSet.uuid as UUID,
        request.body
      );

      return {
        success: true,
        data: {
          featureSet: {
            uuid: featureSet.uuid,
            name: featureSet.name,
            slug: featureSet.slug,
            updatedAt: featureSet.updatedAt.toISOString(),
          },
        },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Enable feature set for tenant
  fastify.post('/:uuid/enable', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:manage')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        tenantId: Type.Optional(Type.Number({ minimum: 1 })),
        config: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            activation: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userTenantId = request.user!.tenantId;
    const requestedTenantId = request.body.tenantId;

    // Use user's tenant ID if not specified, or validate permission for other tenants
    const tenantId = requestedTenantId || userTenantId;
    
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      // Check if user has permission to manage features for other tenants
      const hasPermission = await fastify.checkPermission(request.user!, 'feature-sets:manage-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_MANAGE_FEATURES_FOR_OTHER_TENANTS',
        });
      }
    }

    // Get feature set by UUID first
    const featureSet = await fastify.prisma.featureSet.findUnique({
      where: { uuid },
    });

    if (!featureSet) {
      return reply.code(404).send({
        success: false,
        error: 'FEATURE_SET_NOT_FOUND',
      });
    }

    try {
      const activation = await featureSetService.enableFeatureSet({
        tenantId,
        featureSetId: featureSet.uuid as UUID,
        config: request.body.config,
      });

      return {
        success: true,
        data: { activation },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Disable feature set for tenant
  fastify.post('/:uuid/disable', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:manage')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        tenantId: Type.Optional(Type.Number({ minimum: 1 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            deactivation: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userTenantId = request.user!.tenantId;
    const requestedTenantId = request.body.tenantId;

    // Use user's tenant ID if not specified, or validate permission for other tenants
    const tenantId = requestedTenantId || userTenantId;
    
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      // Check if user has permission to manage features for other tenants
      const hasPermission = await fastify.checkPermission(request.user!, 'feature-sets:manage-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_MANAGE_FEATURES_FOR_OTHER_TENANTS',
        });
      }
    }

    // Get feature set by UUID first
    const featureSet = await fastify.prisma.featureSet.findUnique({
      where: { uuid },
    });

    if (!featureSet) {
      return reply.code(404).send({
        success: false,
        error: 'FEATURE_SET_NOT_FOUND',
      });
    }

    try {
      const deactivation = await featureSetService.disableFeatureSet(tenantId, featureSet.id);

      return {
        success: true,
        data: { deactivation },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get tenant's enabled features
  fastify.get('/tenant/:tenantId', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        tenantId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            features: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { tenantId } = request.params;
    const userTenantId = request.user!.tenantId;

    // Check if user has permission to view other tenants' features
    if (tenantId !== userTenantId) {
      const hasPermission = await fastify.checkPermission(request.user!, 'feature-sets:read-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_VIEW_OTHER_TENANTS\' features',
        });
      }
    }

    const features = await featureSetService.getTenantFeatures(tenantId);

    return {
      success: true,
      data: { features },
    };
  });

  // Check feature compatibility
  fastify.post('/check-compatibility', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        tenantId: Type.Optional(Type.Number({ minimum: 1 })),
        featureSetIds: Type.Array(Type.Number({ minimum: 1 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            compatible: Type.Boolean(),
            conflicts: Type.Array(Type.Object({
              feature1: Type.String(),
              feature2: Type.String(),
            })),
            missingDependencies: Type.Array(Type.Object({
              feature: Type.String(),
              missingDeps: Type.Array(Type.String()),
            })),
            featureSets: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userTenantId = request.user!.tenantId;
    const requestedTenantId = request.body.tenantId;

    // Use user's tenant ID if not specified
    const tenantId = requestedTenantId || userTenantId;
    
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      // Check if user has permission to check compatibility for other tenants
      const hasPermission = await fastify.checkPermission(request.user!, 'feature-sets:read-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_CHECK_COMPATIBILITY_FOR_OTHER_TENANTS',
        });
      }
    }

    try {
      const result = await featureSetService.checkFeatureCompatibility({
        tenantId,
        featureSetIds: request.body.featureSetIds,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Check if tenant has specific feature
  fastify.get('/tenant/:tenantId/has/:featureSlug', {
    preHandler: [fastify.authenticate, fastify.requirePermission('feature-sets:read')],
    schema: {
      tags: ['platform.feature-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        tenantId: Type.Number({ minimum: 1 }),
        featureSlug: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            hasFeature: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { tenantId, featureSlug } = request.params;
    const userTenantId = request.user!.tenantId;

    // Check if user has permission to check features for other tenants
    if (tenantId !== userTenantId) {
      const hasPermission = await fastify.checkPermission(request.user!, 'feature-sets:read-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_CHECK_FEATURES_FOR_OTHER_TENANTS',
        });
      }
    }

    const hasFeature = await featureSetService.hasTenantFeature(tenantId, featureSlug);

    return {
      success: true,
      data: { hasFeature },
    };
  });
};