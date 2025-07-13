import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

// Minimal Swagger configuration for testing
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'itellico Mono API',
      description: 'API Documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'auth', description: 'Authentication' },
      { name: 'users', description: 'User management' },
    ],
  },
};

export const swaggerUIConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
};