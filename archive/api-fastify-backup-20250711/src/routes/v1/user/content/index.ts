import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { userCategoriesRoutes } from './categories';
import { userTagsRoutes } from './tags';
import { userTemplatesRoutes } from './templates';

/**
 * User Content Routes
 * Aggregate all user content routes
 */
export const userContentRoutes: FastifyPluginAsync = async (fastify) => {
  // Register categories routes
  await fastify.register(userCategoriesRoutes, { prefix: '/categories' });

  // Register tags routes
  await fastify.register(userTagsRoutes, { prefix: '/tags' });

  // Register templates routes
  await fastify.register(userTemplatesRoutes, { prefix: '/templates' });
};