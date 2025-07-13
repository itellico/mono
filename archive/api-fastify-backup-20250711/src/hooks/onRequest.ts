import type { FastifyRequest, FastifyReply } from 'fastify';

export async function onRequestHooks(request: FastifyRequest, reply: FastifyReply) {
  // Add request ID to all responses
  if (request.id) {
    reply.header('X-Request-Id', request.id);
  }

  // Add timing header
  request.startTime = Date.now();

  // Log incoming request
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  }, 'Incoming request');
}