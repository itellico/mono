import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { publicRoutes } from './public';
import { userRoutes } from './user';
import { accountRoutes } from './account';
import { tenantRoutes } from './tenant';
import { platformRoutes } from './platform';

/**
 * API v1 Routes
 * Five-tier API structure (from highest to lowest privilege):
 * Platform → Tenant → Account → User → Public
 */
export const v1Routes: FastifyPluginAsync = async (fastify) => {
  // Platform tier - Platform-wide management (super admin only)
  await fastify.register(platformRoutes, { prefix: '/platform' });

  // Tenant tier - Tenant administration
  await fastify.register(tenantRoutes, { prefix: '/tenant' });

  // Account tier - Account/organization context
  await fastify.register(accountRoutes, { prefix: '/account' });

  // User tier - Individual user context
  await fastify.register(userRoutes, { prefix: '/user' });

  // Public tier - No authentication required
  await fastify.register(publicRoutes, { prefix: '/public' });
};