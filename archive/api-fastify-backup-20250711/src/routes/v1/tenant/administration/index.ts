import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { tenantAccountsRoutes } from './accounts';
import { tenantUsersRoutes } from './users';
import { tenantPermissionsRoutes } from './permissions';

/**
 * Tenant Administration Routes
 * Administrative functions for managing tenant resources
 */
export const tenantAdministrationRoutes: FastifyPluginAsync = async (fastify) => {
  // Register accounts management routes
  await fastify.register(tenantAccountsRoutes, { prefix: '/accounts' });

  // Register users management routes
  await fastify.register(tenantUsersRoutes, { prefix: '/users' });

  // Register permissions and roles management routes
  await fastify.register(tenantPermissionsRoutes, { prefix: '/permissions' });
};