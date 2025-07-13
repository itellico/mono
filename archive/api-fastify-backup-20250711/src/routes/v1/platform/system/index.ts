import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { platformTenantsRoutes } from './tenants';

/**
 * Platform System Routes
 * System management and administration for the entire platform
 */
export const systemRoutes: FastifyPluginAsync = async (fastify) => {
  // Register tenant management routes
  await fastify.register(platformTenantsRoutes, { prefix: '/tenants' });
};