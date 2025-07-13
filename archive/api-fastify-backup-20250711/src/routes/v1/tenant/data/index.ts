import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { tenantSchemasRoutes } from './schemas';
import { tenantOptionSetsRoutes } from './option-sets';

/**
 * Tenant Data Configuration Routes
 * Global data configuration for the tenant
 */
export const tenantDataRoutes: FastifyPluginAsync = async (fastify) => {
  // Register schemas management routes
  await fastify.register(tenantSchemasRoutes, { prefix: '/schemas' });

  // Register option sets management routes
  await fastify.register(tenantOptionSetsRoutes, { prefix: '/option-sets' });
};