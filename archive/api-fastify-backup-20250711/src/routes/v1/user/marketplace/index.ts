import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { userJobsRoutes } from './jobs';
import { userGigsRoutes } from './gigs';

/**
 * User Marketplace Routes
 * Aggregate all marketplace routes
 */
export const userMarketplaceRoutes: FastifyPluginAsync = async (fastify) => {
  // Register jobs routes
  await fastify.register(userJobsRoutes, { prefix: '/jobs' });

  // Register gigs routes
  await fastify.register(userGigsRoutes, { prefix: '/gigs' });
};