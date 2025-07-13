import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { FeatureSetService } from '../../../services/feature-set.service';

/**
 * Tenant Features Management
 * Tier: tenant
 * Allows tenants to manage their own feature sets
 */
export const featuresRoutes: FastifyPluginAsync = async (fastify) => {
  const { prisma, redis } = fastify;
  const featureSetService = new FeatureSetService(prisma, redis, fastify.log);
  
  // GET /api/v1/tenant/features - Get tenant's enabled features
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.read')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Get tenant enabled features',
      description: 'Retrieve all features enabled for the current tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            features: Type.Array(Type.Object({
              id: Type.Number(),
              featureSetId: Type.Number(),
              tenantId: Type.Number(),
              config: Type.Any(),
              isActive: Type.Boolean(),
              enabledAt: Type.String({ format: 'date-time' }),
              featureSet: Type.Object({
                id: Type.Number(),
                name: Type.String(),
                slug: Type.String(),
                description: Type.Optional(Type.String()),
                category: Type.String(),
                complexity: Type.String(),
                resourceUsage: Type.String(),
                minimumTier: Type.String(),
                availableInTiers: Type.Array(Type.String()),
                features: Type.Any(),
                permissions: Type.Array(Type.String()),
                version: Type.String()
              })
            }))
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      const features = await featureSetService.getTenantFeatures(request.user.tenantId);
      
      return {
        success: true,
        data: {
          features
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching tenant features:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tenant features'
      });
    }
  });

  // GET /api/v1/tenant/features/available - Get available features for tenant
  fastify.get('/available', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.read')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Get available feature sets',
      description: 'Get all feature sets available for the tenant based on subscription tier',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        complexity: Type.Optional(Type.Enum(['simple', 'medium', 'advanced'])),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featureSets: Type.Array(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              complexity: Type.String(),
              resourceUsage: Type.String(),
              minimumTier: Type.String(),
              availableInTiers: Type.Array(Type.String()),
              isActive: Type.Boolean(),
              version: Type.String(),
              _count: Type.Object({
                tenantFeatures: Type.Number()
              })
            })),
            total: Type.Number(),
            hasMore: Type.Boolean()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      // Get tenant subscription tier (simplified - would normally check subscription)
      const tenant = await prisma.tenant.findUnique({
        where: { id: request.user.tenantId },
        select: { subscriptionTier: true }
      });

      const availableInTier = tenant?.subscriptionTier || 'free';
      
      const result = await featureSetService.searchFeatureSets({
        ...request.query,
        availableInTier,
        isActive: true
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      fastify.log.error('Error fetching available features:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch available features'
      });
    }
  });

  // POST /api/v1/tenant/features/enable - Enable a feature set
  fastify.post('/enable', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.manage')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Enable feature set',
      description: 'Enable a feature set for the tenant',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        featureSetId: Type.Number({ minimum: 1 }),
        config: Type.Optional(Type.Any())
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.Number(),
            tenantId: Type.Number(),
            featureSetId: Type.Number(),
            config: Type.Any(),
            isActive: Type.Boolean(),
            enabledAt: Type.String({ format: 'date-time' })
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      const { featureSetId, config } = request.body;
      
      const result = await featureSetService.enableFeatureSet({
        tenantId: request.user.tenantId,
        featureSetId,
        config
      });
      
      return reply.code(201).send({
        success: true,
        data: result
      });
    } catch (error) {
      fastify.log.error('Error enabling feature set:', error);
      
      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: 'FEATURE_SET_NOT_FOUND',
          message: error.message
        });
      }
      
      if (error.message.includes('dependencies') || error.message.includes('conflicts')) {
        return reply.code(400).send({
          success: false,
          error: 'FEATURE_COMPATIBILITY_ERROR',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to enable feature set'
      });
    }
  });

  // POST /api/v1/tenant/features/disable - Disable a feature set
  fastify.post('/disable', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.manage')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Disable feature set',
      description: 'Disable a feature set for the tenant',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        featureSetId: Type.Number({ minimum: 1 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.Number(),
            tenantId: Type.Number(),
            featureSetId: Type.Number(),
            isActive: Type.Boolean(),
            disabledAt: Type.String({ format: 'date-time' })
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      const { featureSetId } = request.body;
      
      const result = await featureSetService.disableFeatureSet(
        request.user.tenantId,
        featureSetId
      );
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      fastify.log.error('Error disabling feature set:', error);
      
      if (error.message.includes('Required by')) {
        return reply.code(400).send({
          success: false,
          error: 'FEATURE_DEPENDENCY_ERROR',
          message: error.message
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to disable feature set'
      });
    }
  });

  // GET /api/v1/tenant/features/categories - Get feature categories
  fastify.get('/categories', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.read')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Get feature categories',
      description: 'Get all available feature categories',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Any()
        })
      }
    }
  }, async (request, reply) => {
    try {
      const categories = await featureSetService.getFeaturesByCategory();
      
      return {
        success: true,
        data: categories
      };
    } catch (error) {
      fastify.log.error('Error fetching feature categories:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feature categories'
      });
    }
  });

  // POST /api/v1/tenant/features/check-compatibility - Check feature compatibility
  fastify.post('/check-compatibility', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.features.read')
    ],
    schema: {
      tags: ['tenant.features'],
      summary: 'Check feature compatibility',
      description: 'Check if multiple features can be enabled together',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        featureSetIds: Type.Array(Type.Number({ minimum: 1 }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            compatible: Type.Boolean(),
            conflicts: Type.Array(Type.Object({
              feature1: Type.String(),
              feature2: Type.String()
            })),
            missingDependencies: Type.Array(Type.Object({
              feature: Type.String(),
              missingDeps: Type.Array(Type.String())
            })),
            featureSets: Type.Array(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              minimumTier: Type.String(),
              complexity: Type.String(),
              resourceUsage: Type.String()
            }))
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      const { featureSetIds } = request.body;
      
      const result = await featureSetService.checkFeatureCompatibility({
        tenantId: request.user.tenantId,
        featureSetIds
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      fastify.log.error('Error checking feature compatibility:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check feature compatibility'
      });
    }
  });
};

export default featuresRoutes;
