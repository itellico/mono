import type { FastifyPluginAsync } from 'fastify';
import { accountUsersRoutes as usersRoutes } from './users';
import { accountBusinessRoutes as businessRoutes } from './business';
import { accountBillingRoutes as billingRoutes } from './billing';
import { accountConfigurationRoutes as configurationRoutes } from './configuration';
import { accountAnalyticsRoutes as analyticsRoutes } from './analytics';
import { accountTagsRoutes as tagsRoutes } from './tags';

/**
 * Account tier routes
 * All routes under this tier require account-level access
 */
export const accountRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering account tier routes');
  
  // Manage users in the account
  await fastify.register(usersRoutes, { prefix: '/users' });
  
  // Configure business settings and features
  await fastify.register(businessRoutes, { prefix: '/business' });
  
  // Manage payments and subscription plans
  await fastify.register(billingRoutes, { prefix: '/billing' });
  
  // Configure account-wide settings
  await fastify.register(configurationRoutes, { prefix: '/configuration' });
  
  // View account metrics and insights
  await fastify.register(analyticsRoutes, { prefix: '/analytics' });
  
  // Manage account-level tags
  await fastify.register(tagsRoutes, { prefix: '/tags' });
};

export default accountRoutes;