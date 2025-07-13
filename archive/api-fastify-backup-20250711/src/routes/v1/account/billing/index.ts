import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import type { FastifyPluginAsync } from 'fastify';
import { accountSubscriptionsRoutes } from './subscriptions';
import { accountInvoicesRoutes } from './invoices';
import { accountPaymentMethodsRoutes } from './payment-methods';

/**
 * Account Billing Routes
 * Aggregate all billing-related routes
 */
export const accountBillingRoutes: FastifyPluginAsync = async (fastify) => {
  // Register subscriptions routes
  await fastify.register(accountSubscriptionsRoutes, { prefix: '/subscriptions' });

  // Register invoices routes
  await fastify.register(accountInvoicesRoutes, { prefix: '/invoices' });

  // Register payment methods routes
  await fastify.register(accountPaymentMethodsRoutes, { prefix: '/payment-methods' });
};