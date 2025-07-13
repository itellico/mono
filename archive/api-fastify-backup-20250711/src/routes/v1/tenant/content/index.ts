import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { templateRoutes } from './templates';
import { tenantMediaRoutes } from './media';

/**
 * Tenant Content Routes
 * Global content management for the tenant
 */
export const tenantContentRoutes: FastifyPluginAsync = async (fastify) => {
  // Register templates management routes
  await fastify.register(templateRoutes, { prefix: '/templates' });

  // Register media management routes
  await fastify.register(tenantMediaRoutes, { prefix: '/media' });
};