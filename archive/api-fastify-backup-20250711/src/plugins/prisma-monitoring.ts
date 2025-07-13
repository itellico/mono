import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { databaseQueryDuration, databaseQueriesTotal } from './prometheus';

const prismaMonitoringPlugin: FastifyPluginAsync = async (fastify) => {
  // Extend Prisma with monitoring
  const originalPrisma = fastify.prisma;
  
  if (!originalPrisma) {
    throw new Error('Prisma client not found. Make sure prisma plugin is registered first.');
  }

  // Create a proxy to intercept Prisma operations
  const monitoredPrisma = new Proxy(originalPrisma, {
    get(target: any, prop: string) {
      const originalMethod = target[prop];
      
      // If it's a model (User, Tenant, etc.)
      if (originalMethod && typeof originalMethod === 'object' && originalMethod.findMany) {
        return new Proxy(originalMethod, {
          get(modelTarget: any, operation: string) {
            const originalOperation = modelTarget[operation];
            
            if (typeof originalOperation === 'function') {
              return async function (...args: any[]) {
                const startTime = Date.now();
                const tenantId = getTenantIdFromArgs(args) || 'unknown';
                
                try {
                  const result = await originalOperation.apply(modelTarget, args);
                  
                  // Record successful query
                  const duration = (Date.now() - startTime) / 1000;
                  databaseQueryDuration
                    .labels(operation, prop, tenantId)
                    .observe(duration);
                  
                  databaseQueriesTotal
                    .labels(operation, prop, tenantId)
                    .inc();
                  
                  return result;
                } catch (error) {
                  // Record failed query
                  const duration = (Date.now() - startTime) / 1000;
                  databaseQueryDuration
                    .labels(`${operation}_error`, prop, tenantId)
                    .observe(duration);
                  
                  databaseQueriesTotal
                    .labels(`${operation}_error`, prop, tenantId)
                    .inc();
                  
                  throw error;
                }
              };
            }
            
            return originalOperation;
          }
        });
      }
      
      return originalMethod;
    }
  });

  // Replace the existing Prisma instance with monitored version
  (fastify as any).prisma = monitoredPrisma;
};

// Helper function to extract tenant ID from query args
function getTenantIdFromArgs(args: any[]): string | null {
  try {
    const whereClause = args[0]?.where;
    if (whereClause?.tenantId) {
      return whereClause.tenantId.toString();
    }
    
    // Check for tenant ID in data for create/update operations
    const dataClause = args[0]?.data;
    if (dataClause?.tenantId) {
      return dataClause.tenantId.toString();
    }
    
    return null;
  } catch {
    return null;
  }
}

export default fp(prismaMonitoringPlugin, {
  name: 'prisma-monitoring',
  dependencies: ['prisma', 'prometheus'],
});