import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { adminRoutes } from './admin';
import { auditRoutes } from './audit';
import { aiRoutes } from './ai';
import { systemRoutes } from './system';
import { operationsRoutes } from './operations';
import { documentationRoutes } from './documentation';
import { platformTagsRoutes } from './tags';
import { platformCategoriesRoutes } from './categories';

/**
 * Platform tier routes
 * All routes under this tier require platform-level access
 */
export const platformRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering platform tier routes');
  
  // Admin routes (highest privilege level)
  await fastify.register(adminRoutes, { prefix: '/admin' });
  
  // System audit and monitoring
  await fastify.register(auditRoutes, { prefix: '/audit' });
  
  // AI/LLM services
  await fastify.register(aiRoutes, { prefix: '/ai' });
  
  // System management
  await fastify.register(systemRoutes, { prefix: '/system' });
  
  // Platform operations
  await fastify.register(operationsRoutes, { prefix: '/operations' });
  
  // Documentation management
  await fastify.register(documentationRoutes, { prefix: '/documentation' });
  
  // Platform-level tags management
  await fastify.register(platformTagsRoutes, { prefix: '/tags' });
  
  // Platform-level categories management
  await fastify.register(platformCategoriesRoutes, { prefix: '/categories' });
};

export default platformRoutes;
