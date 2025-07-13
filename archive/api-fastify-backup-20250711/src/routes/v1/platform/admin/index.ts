import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

// Admin-Only Routes
import { tenantsRoutes } from './tenants/index';
import { queueRoutes } from './queue/index';
import { adminSettingsRoutes } from './settings/index';
import { integrationsRoutes } from './integrations/index';
import { adminUsersRoutes } from './users/index';
import { platformUsersRoutes } from './platform-users/index';

// System Management - Permissions & Security
import { permissionsRoutes } from './permissions/index';
import { emergencyRoutes } from './emergency/index';
import { translationsRoutes } from './translations/index';
import { languagesRoutes } from './translations/languages/index';
import { extractStringsRoutes } from './translations/extract-strings/index';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // All admin routes require authentication
  fastify.addHook('onRequest', fastify.verifyAdmin);

  // =============================================================================
  // ADMIN-ONLY ROUTES
  // These routes are exclusively for system administrators
  // =============================================================================

  // System Management
  await fastify.register(tenantsRoutes, { prefix: '/tenants' });
  await fastify.register(adminUsersRoutes, { prefix: '/users' });
  await fastify.register(platformUsersRoutes, { prefix: '/platform-users' });
  await fastify.register(adminSettingsRoutes, { prefix: '/settings' });
  await fastify.register(queueRoutes, { prefix: '/queue' });
  await fastify.register(integrationsRoutes, { prefix: '/integrations' });
  await fastify.register(permissionsRoutes, { prefix: '/permissions' });
  await fastify.register(emergencyRoutes, { prefix: '/emergency' });

  // Legacy Routes (to be evaluated for removal/migration)
  await fastify.register(translationsRoutes, { prefix: '/translations' });
  await fastify.register(languagesRoutes, { prefix: '/translations/languages' });
  await fastify.register(extractStringsRoutes, { prefix: '/translations/extract-strings' });

  // Admin dashboard stats
  fastify.get('/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.admin.read')
    ],
    schema: {
      tags: ['platform.administration'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalUsers: Type.Number(),
            totalTenants: Type.Number(),
            activeSubscriptions: Type.Number(),
            monthlyRecurringRevenue: Type.Number()
          })
        })
      }
    }
  }, async (request, reply) => {
    const [
      totalUsers,
      totalTenants,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.tenant.count({ where: { isActive: true } }),
      fastify.prisma.tenantSubscription.count({ where: { status: 'active' } }),
      fastify.prisma.tenantSubscription.aggregate({
        where: { status: 'active' },
        _sum: { planId: true }, // This would need adjustment for actual revenue
      }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        totalTenants,
        activeSubscriptions,
        monthlyRecurringRevenue: 0, // Calculate based on actual plan prices
      },
    };
  });
};