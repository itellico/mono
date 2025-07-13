import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { accountSettingsRoutes } from './settings';
import { accountApiKeysRoutes } from './api-keys';
import { accountRolesRoutes } from './roles';

/**
 * Account Configuration Routes
 * Aggregate all configuration-related routes
 */
export const accountConfigurationRoutes: FastifyPluginAsync = async (fastify) => {
  // Register settings routes
  await fastify.register(accountSettingsRoutes, { prefix: '/settings' });

  // Register API keys routes
  await fastify.register(accountApiKeysRoutes, { prefix: '/api-keys' });

  // Register roles routes
  await fastify.register(accountRolesRoutes, { prefix: '/roles' });
};