import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { userChangesRoutes } from './changes';
import { userAuditRoutes } from './audit';

/**
 * User Activity Routes
 * Aggregate all activity routes
 */
export const userActivityRoutes: FastifyPluginAsync = async (fastify) => {
  // Register changes routes
  await fastify.register(userChangesRoutes, { prefix: '/changes' });

  // Register audit routes
  await fastify.register(userAuditRoutes, { prefix: '/audit' });
};