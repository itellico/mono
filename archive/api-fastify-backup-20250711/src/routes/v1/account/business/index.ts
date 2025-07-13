import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { accountFormsRoutes } from './forms';
import { accountWorkflowsRoutes } from './workflows';
import { accountIntegrationsRoutes } from './integrations';
import { accountWebhooksRoutes } from './webhooks';
import { accountAIRoutes } from './ai';

/**
 * Account Business Routes
 * Aggregate all business-related routes
 */
export const accountBusinessRoutes: FastifyPluginAsync = async (fastify) => {
  // Register forms routes
  await fastify.register(accountFormsRoutes, { prefix: '/forms' });

  // Register workflows routes
  await fastify.register(accountWorkflowsRoutes, { prefix: '/workflows' });

  // Register integrations routes
  await fastify.register(accountIntegrationsRoutes, { prefix: '/integrations' });

  // Register webhooks routes
  await fastify.register(accountWebhooksRoutes, { prefix: '/webhooks' });

  // Register AI routes
  await fastify.register(accountAIRoutes, { prefix: '/ai' });
};