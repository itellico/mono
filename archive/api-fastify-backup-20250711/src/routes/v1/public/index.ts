import type { FastifyPluginAsync } from 'fastify';
import { publicAuthRoutes as authRoutes } from './auth';
import { publicHealthRoutes as healthRoutes } from './health';

/**
 * Public tier routes
 * All routes under this tier require no authentication
 */
export const publicRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering public tier routes');
  
  // Authentication and authorization
  await fastify.register(authRoutes, { prefix: '/auth' });
  
  // System health and status monitoring
  await fastify.register(healthRoutes, { prefix: '/health' });
};

export default publicRoutes;