import type { FastifyRequest, FastifyReply } from 'fastify';

export async function onResponseHooks(request: FastifyRequest, reply: FastifyReply) {
  // Calculate response time
  const responseTime = Date.now() - (request.startTime || Date.now());
  
  // Add response headers
  reply.header('X-Response-Time', `${responseTime}ms`);
  
  // Log response
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime,
  }, 'Request completed');

  // Audit logging for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && reply.statusCode < 400) {
    // Fire and forget audit log
    setImmediate(async () => {
      try {
        await request.server.prisma.auditLog.create({
          data: {
            tenantId: request.tenantId || 1,
            userId: (request.user as any)?.id,
            action: `${request.method} ${request.url}`,
            entityType: 'api_request',
            entityId: request.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'] || null,
            metadata: {
              method: request.method,
              path: request.url,
              statusCode: reply.statusCode,
              responseTime,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create audit log');
      }
    });
  }
}