import type { FastifyRequest, FastifyReply } from 'fastify';

export async function preHandlerHooks(request: FastifyRequest, reply: FastifyReply) {
  // Add tenant context to logs
  if (request.tenantId) {
    request.log = request.log.child({ tenantId: request.tenantId });
  }

  // Add user context to logs
  if (request.user) {
    request.log = request.log.child({ 
      userId: (request.user as any).id,
      userUuid: (request.user as any).uuid,
    });
  }
}