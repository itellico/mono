import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: number;
    tenantUuid?: string;
  }
}

const tenantPluginAsync: FastifyPluginAsync = async (fastify) => {
  // Extract tenant from various sources
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // 1. From authenticated user
    const user = (request as any).user;
    if (user?.tenantId) {
      request.tenantId = user.tenantId;
      return;
    }

    // 2. From header (for API keys)
    const tenantHeader = request.headers['x-tenant-id'];
    if (tenantHeader && typeof tenantHeader === 'string') {
      const tenant = await fastify.prisma.tenant.findFirst({
        where: {
          OR: [
            { uuid: tenantHeader },
            { id: parseInt(tenantHeader, 10) || 0 },
          ],
          is_active: true,
        },
      });

      if (tenant) {
        request.tenantId = tenant.id;
        request.tenantUuid = tenant.uuid;
      }
    }

    // 3. From subdomain
    const host = request.headers.host;
    if (host && !request.tenantId) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: {
            OR: [
              { slug: subdomain },
              { domain: host },
            ],
            is_active: true,
          },
        });

        if (tenant) {
          request.tenantId = tenant.id;
          request.tenantUuid = tenant.uuid;
        }
      }
    }
  });

  // Tenant isolation decorator
  fastify.decorate('requireTenant', async (request: FastifyRequest) => {
    if (!request.tenantId) {
      throw fastify.httpErrors.badRequest('Tenant context required');
    }
  });

  // Verify tenant access
  fastify.decorate('verifyTenantAccess', async (request: FastifyRequest, tenantId: number) => {
    const user = (request as any).user;
    if (!user) {
      throw fastify.httpErrors.unauthorized('Authentication required');
    }

    // Super admins can access any tenant
    if (user.roles && user.roles.includes('super_admin')) {
      return;
    }

    // Otherwise, must match user's tenant
    if (user.tenantId !== tenantId) {
      throw fastify.httpErrors.forbidden('Access denied to this tenant');
    }
  });
};

export const tenantPlugin = fp(tenantPluginAsync, {
  name: 'tenant',
  dependencies: ['prisma'],
});