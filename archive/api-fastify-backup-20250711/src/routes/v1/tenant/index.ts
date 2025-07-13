import type { FastifyPluginAsync } from 'fastify';
import { tenantAdministrationRoutes as administrationRoutes } from './administration';
import { workflowsRoutes } from './workflows';
import { tenantMonitoringRoutes as monitoringRoutes } from './monitoring';
import { tenantDataRoutes as dataRoutes } from './data';
import { tenantContentRoutes as contentRoutes } from './content';
import { usersRoutes } from './users';
import { permissionsRoutes } from './permissions';
import { tagsRoutes } from './tags';
import { categoriesRoutes } from './categories';
// import { formsRoutes } from './forms'; // Forms feature not implemented yet

/**
 * Tenant tier routes
 * All routes under this tier require tenant-level access
 */
export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.log.info('Registering tenant tier routes');
  
  // Tenant administration routes
  await fastify.register(administrationRoutes, { prefix: '/administration' });
  
  // Workflow management
  await fastify.register(workflowsRoutes, { prefix: '/workflows' });
  
  // Tenant monitoring and health
  await fastify.register(monitoringRoutes, { prefix: '/monitoring' });
  
  // Data management (schemas, option sets)
  await fastify.register(dataRoutes, { prefix: '/data' });
  
  // Content management (categories, tags, templates)
  await fastify.register(contentRoutes, { prefix: '/content' });
  
  // User management within tenant
  await fastify.register(usersRoutes, { prefix: '/users' });
  
  // Permission management
  await fastify.register(permissionsRoutes, { prefix: '/permissions' });
  
  // Tags management
  await fastify.register(tagsRoutes, { prefix: '/tags' });
  
  // Categories management
  await fastify.register(categoriesRoutes, { prefix: '/categories' });
  
  // Forms management - Not implemented yet
  // await fastify.register(formsRoutes, { prefix: '/forms' });
};

export default tenantRoutes;