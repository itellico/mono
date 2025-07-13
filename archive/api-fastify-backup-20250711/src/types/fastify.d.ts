import type { AuthUser } from '../plugins/auth';
import type { Tenant, User, Account } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
  
  interface FastifyInstance {
    generateTokens: (user: User & { account: Account & { tenant: Tenant } }) => Promise<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>;
    requireTenant: (request: FastifyRequest) => Promise<void>;
    verifyTenantAccess: (request: FastifyRequest, tenantId: number) => Promise<void>;
  }
}