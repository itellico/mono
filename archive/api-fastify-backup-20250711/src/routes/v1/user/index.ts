import type { FastifyPluginAsync } from 'fastify';
import { usersRoutes as profileRoutes } from './profile';
import { userSettingsRoutes as settingsRoutes } from './settings';
import { userContentRoutes as contentRoutes } from './content';
import { userMediaRoutes as mediaRoutes } from './media';
import { userMarketplaceRoutes as marketplaceRoutes } from './marketplace';
import { conversationsRoutes as messagingRoutes } from './messaging';
import { userActivityRoutes as activityRoutes } from './activity';
import { userSearchRoutes as searchRoutes } from './search';

/**
 * User tier routes
 * All routes under this tier require user-level access
 */
export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering user tier routes');
  
  // User profile management
  await fastify.register(profileRoutes, { prefix: '/profile' });
  
  // Personal preferences and account settings
  await fastify.register(settingsRoutes, { prefix: '/settings' });
  
  // Create and manage user content
  await fastify.register(contentRoutes, { prefix: '/content' });
  
  // Upload and manage media files
  await fastify.register(mediaRoutes, { prefix: '/media' });
  
  // Browse, buy, and sell in marketplace
  await fastify.register(marketplaceRoutes, { prefix: '/marketplace' });
  
  // Send and receive messages
  await fastify.register(messagingRoutes, { prefix: '/messaging' });
  
  // Track activities and history
  await fastify.register(activityRoutes, { prefix: '/activity' });
  
  // Search across the platform
  await fastify.register(searchRoutes, { prefix: '/search' });
};

export default userRoutes;