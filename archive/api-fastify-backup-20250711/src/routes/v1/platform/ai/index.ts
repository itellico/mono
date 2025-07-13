import type { FastifyPluginAsync } from 'fastify';
import { llmRoutes } from './llm';

/**
 * AI Platform Routes
 * Routes for managing AI/LLM services at platform level
 */
export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering AI platform routes');
  
  // LLM management routes
  await fastify.register(llmRoutes, { prefix: '/llm' });
};

export default aiRoutes;