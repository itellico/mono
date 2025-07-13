import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPluginAsync: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient({
    log: fastify.log.level === 'debug' 
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'],
  });

  await prisma.$connect();

  // Make Prisma available through the fastify instance
  fastify.decorate('prisma', prisma);

  // Gracefully shutdown
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export const prismaPlugin = fp(prismaPluginAsync, {
  name: 'prisma',
});