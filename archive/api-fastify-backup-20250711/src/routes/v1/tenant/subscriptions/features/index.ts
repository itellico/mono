import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { FeatureSetService } from '../../../../services/feature-set.service';

/**
 * Tenant Subscription Features Management
 * Tier: tenant
 * Manages features included in tenant's subscription
 */
export const subscriptions_featuresRoutes: FastifyPluginAsync = async (fastify) => {
  const { prisma, redis } = fastify;
  const featureSetService = new FeatureSetService(prisma, redis, fastify.log);
  
  // GET /api/v1/tenant/subscriptions/features - Get subscription included features
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.subscriptions.read')
    ],
    schema: {
      tags: ['tenant.subscriptions.features'],
      summary: 'Get subscription features',
      description: 'Get all features included in the current subscription plan',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            subscription: Type.Object({
              id: Type.Number(),
              status: Type.String(),
              tier: Type.String(),
              startDate: Type.String({ format: 'date-time' }),
              endDate: Type.Optional(Type.String({ format: 'date-time' })),
              plan: Type.Object({
                id: Type.Number(),
                name: Type.String(),
                tier: Type.String(),
                industryTemplate: Type.Optional(Type.Object({
                  id: Type.Number(),
                  name: Type.String(),
                  category: Type.String()
                }))
              })
            }),
            includedFeatures: Type.Array(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              complexity: Type.String(),
              resourceUsage: Type.String(),
              isEnabled: Type.Boolean(),
              config: Type.Any()
            })),
            availableFeatures: Type.Array(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              minimumTier: Type.String(),
              canEnable: Type.Boolean()
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

      // Get current active subscription
      const subscription = await prisma.tenantSubscription.findFirst({
        where: {
          tenantId: request.user.tenantId,
          status: 'active'
        },
        include: {
          plan: {
            include: {
              industryTemplate: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      if (!subscription) {
        return reply.code(404).send({
          success: false,
          error: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found'
        });
      }

      // Get enabled features for tenant
      const enabledFeatures = await featureSetService.getTenantFeatures(request.user.tenantId);
      
      // Get all available features for the subscription tier
      const availableFeatures = await featureSetService.searchFeatureSets({
        availableInTier: subscription.plan.tier,
        isActive: true,
        limit: 100
      });

      // Map enabled features with their config
      const includedFeatures = enabledFeatures.map(tf => ({
        id: tf.featureSet.id,
        name: tf.featureSet.name,
        slug: tf.featureSet.slug,
        description: tf.featureSet.description,
        category: tf.featureSet.category,
        complexity: tf.featureSet.complexity,
        resourceUsage: tf.featureSet.resourceUsage,
        isEnabled: tf.isActive,
        config: tf.config
      }));

      // Map available features with upgrade information
      const availableFeaturesWithUpgrade = availableFeatures.featureSets.map(fs => {
        const isEnabled = enabledFeatures.some(ef => ef.featureSetId === fs.id);
        const tierOrder = ['free', 'basic', 'pro', 'enterprise'];
        const currentTierIndex = tierOrder.indexOf(subscription.plan.tier);
        const requiredTierIndex = tierOrder.indexOf(fs.minimumTier);
        
        return {
          id: fs.id,
          name: fs.name,
          slug: fs.slug,
          description: fs.description,
          category: fs.category,
          minimumTier: fs.minimumTier,
          canEnable: currentTierIndex >= requiredTierIndex && !isEnabled
        };
      });
      
      return {
        success: true,
        data: {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            tier: subscription.plan.tier,
            startDate: subscription.startDate.toISOString(),
            endDate: subscription.endDate?.toISOString() || null,
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              tier: subscription.plan.tier,
              industryTemplate: subscription.plan.industryTemplate || null
            }
          },
          includedFeatures,
          availableFeatures: availableFeaturesWithUpgrade
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching subscription features:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch subscription features'
      });
    }
  });

  // GET /api/v1/tenant/subscriptions/features/usage - Get feature usage statistics
  fastify.get('/usage', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.subscriptions.read')
    ],
    schema: {
      tags: ['tenant.subscriptions.features'],
      summary: 'Get feature usage statistics',
      description: 'Get usage statistics for enabled features',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalFeatures: Type.Number(),
            enabledFeatures: Type.Number(),
            utilizationRate: Type.Number(),
            categoryBreakdown: Type.Any(),
            recentActivity: Type.Array(Type.Object({
              featureId: Type.Number(),
              featureName: Type.String(),
              action: Type.String(),
              timestamp: Type.String({ format: 'date-time' })
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

      // Get subscription tier
      const subscription = await prisma.tenantSubscription.findFirst({
        where: {
          tenantId: request.user.tenantId,
          status: 'active'
        },
        include: {
          plan: true
        }
      });

      if (!subscription) {
        return reply.code(404).send({
          success: false,
          error: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found'
        });
      }

      // Get available and enabled features
      const [enabledFeatures, availableFeatures] = await Promise.all([
        featureSetService.getTenantFeatures(request.user.tenantId),
        featureSetService.searchFeatureSets({
          availableInTier: subscription.plan.tier,
          isActive: true,
          limit: 100
        })
      ]);

      // Calculate category breakdown
      const categoryBreakdown = enabledFeatures.reduce((acc, tf) => {
        const category = tf.featureSet.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get recent feature activity (simplified - would normally track in audit log)
      const recentActivity = enabledFeatures.slice(0, 5).map(tf => ({
        featureId: tf.featureSetId,
        featureName: tf.featureSet.name,
        action: 'enabled',
        timestamp: tf.enabledAt.toISOString()
      }));

      const totalFeatures = availableFeatures.total;
      const enabledCount = enabledFeatures.length;
      const utilizationRate = totalFeatures > 0 ? (enabledCount / totalFeatures) * 100 : 0;
      
      return {
        success: true,
        data: {
          totalFeatures,
          enabledFeatures: enabledCount,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          categoryBreakdown,
          recentActivity
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching feature usage:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feature usage'
      });
    }
  });

  // POST /api/v1/tenant/subscriptions/features/configure - Configure feature settings
  fastify.post('/configure', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.subscriptions.features.manage')
    ],
    schema: {
      tags: ['tenant.subscriptions.features'],
      summary: 'Configure subscription features',
      description: 'Configure settings for features included in subscription',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        featureSetId: Type.Number({ minimum: 1 }),
        config: Type.Any()
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.Number(),
            tenantId: Type.Number(),
            featureSetId: Type.Number(),
            config: Type.Any(),
            isActive: Type.Boolean(),
            updatedAt: Type.String({ format: 'date-time' })
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

      // Verify feature is enabled for tenant
      const tenantFeature = await prisma.tenantFeatureSet.findUnique({
        where: {
          tenantId_featureSetId: {
            tenantId: request.user.tenantId,
            featureSetId
          }
        }
      });

      if (!tenantFeature || !tenantFeature.isActive) {
        return reply.code(404).send({
          success: false,
          error: 'FEATURE_NOT_ENABLED',
          message: 'Feature is not enabled for this tenant'
        });
      }

      // Update feature configuration
      const updatedFeature = await prisma.tenantFeatureSet.update({
        where: {
          tenantId_featureSetId: {
            tenantId: request.user.tenantId,
            featureSetId
          }
        },
        data: {
          config,
          updatedAt: new Date()
        }
      });

      // Invalidate cache
      await redis.del(`tenant:${request.user.tenantId}:feature-sets`);
      
      return {
        success: true,
        data: {
          ...updatedFeature,
          updatedAt: updatedFeature.updatedAt.toISOString()
        }
      };
    } catch (error) {
      fastify.log.error('Error configuring feature:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to configure feature'
      });
    }
  });
};

export default subscriptions_featuresRoutes;
