import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { accountOverviewRoutes } from './overview';
import { accountReportsRoutes } from './reports';

/**
 * Account Analytics Routes
 * Aggregate all analytics-related routes
 */
export const accountAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  // Register overview routes
  await fastify.register(accountOverviewRoutes, { prefix: '/overview' });

  // Register reports routes
  await fastify.register(accountReportsRoutes, { prefix: '/reports' });
};