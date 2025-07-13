import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

const changesRoutes: FastifyPluginAsync = async (fastify) => {
  // Note: Change service implementation is temporarily mocked

  // Create change set
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      body: Type.Object({
        entityType: Type.String(),
        entityId: Type.String(),
        changes: Type.Object({}, { additionalProperties: true }),
        level: Type.Optional(Type.Union([
          Type.Literal('OPTIMISTIC'),
          Type.Literal('PROCESSING'),
          Type.Literal('COMMITTED')
        ])),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          entityType: Type.String(),
          entityId: Type.String(),
          level: Type.String(),
          status: Type.String(),
          changes: Type.Object({}, { additionalProperties: true }),
          createdAt: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    // Mock response
    return {
      id: `change-${Date.now()}`,
      entityType: request.body.entityType,
      entityId: request.body.entityId,
      level: request.body.level || 'OPTIMISTIC',
      status: 'pending',
      changes: request.body.changes,
      createdAt: new Date().toISOString()
    };
  });

  // Get change sets
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      querystring: Type.Object({
        entityType: Type.Optional(Type.String()),
        entityId: Type.Optional(Type.String()),
        level: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          data: Type.Array(Type.Object({
            id: Type.String(),
            entityType: Type.String(),
            entityId: Type.String(),
            level: Type.String(),
            status: Type.String(),
            changes: Type.Object({}, { additionalProperties: true }),
            createdAt: Type.String(),
          })),
          pagination: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            pages: Type.Number(),
          }),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { user } = request;
    const { page = 1, limit = 20, ...filters } = request.query as any;
    
    // Mock response
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  });

  // Get change set by ID
  fastify.get('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          entityType: Type.String(),
          entityId: Type.String(),
          level: Type.String(),
          status: Type.String(),
          changes: Type.Object({}, { additionalProperties: true }),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
          createdAt: Type.String(),
          userId: Type.String(),
          parentId: Type.Optional(Type.String()),
          version: Type.Number(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { user } = request;
    
    // Mock response
    if (id === 'not-found') {
      return reply.code(404).send({ error: 'CHANGE_SET_NOT_FOUND' });
    }
    
    return {
      id,
      entityType: 'mock-entity',
      entityId: 'mock-123',
      level: 'OPTIMISTIC',
      status: 'pending',
      changes: { mockField: 'mockValue' },
      metadata: {},
      createdAt: new Date().toISOString(),
      userId: user.uuid as UUID,
      version: 1
    };
  });

  // Commit change set
  fastify.post('/:id/commit', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      params: Type.Object({
        id: Type.String(),
      }),
      body: Type.Object({
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          status: Type.String(),
          committedAt: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { metadata } = request.body as any;
    const { user } = request;
    
    // Mock response
    return {
      id,
      status: 'committed',
      committedAt: new Date().toISOString()
    };
  });

  // Rollback change set
  fastify.post('/:id/rollback', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      params: Type.Object({
        id: Type.String(),
      }),
      body: Type.Object({
        reason: Type.String(),
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          status: Type.String(),
          rolledBackAt: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    const { user } = request;
    
    // Mock response
    return {
      id,
      status: 'rolled_back',
      rolledBackAt: new Date().toISOString()
    };
  });

  // Get change history for entity
  fastify.get('/history/:entityType/:entityId', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      params: Type.Object({
        entityType: Type.String(),
        entityId: Type.String(),
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          data: Type.Array(Type.Object({
            id: Type.String(),
            level: Type.String(),
            status: Type.String(),
            changes: Type.Object({}, { additionalProperties: true }),
            createdAt: Type.String(),
            userId: Type.String(),
            version: Type.Number(),
          })),
          pagination: Type.Object({
            total: Type.Number(),
            page: Type.Number(),
            limit: Type.Number(),
            pages: Type.Number(),
          }),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { entityType, entityId } = request.params as any;
    const { page = 1, limit = 20 } = request.query as any;
    const { user } = request;
    
    // Mock response
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  });

  // Merge change sets
  fastify.post('/merge', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      body: Type.Object({
        changeSetIds: Type.Array(Type.String()),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          id: Type.String(),
          entityType: Type.String(),
          entityId: Type.String(),
          level: Type.String(),
          status: Type.String(),
          changes: Type.Object({}, { additionalProperties: true }),
          createdAt: Type.String(),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { changeSetIds, metadata } = request.body as any;
    const { user } = request;
    
    // Mock response
    return {
      id: `merge-${Date.now()}`,
      entityType: 'merged-entity',
      entityId: 'merged-123',
      level: 'OPTIMISTIC',
      status: 'pending',
      changes: { merged: true },
      createdAt: new Date().toISOString()
    };
  });

  // Validate changes
  fastify.post('/validate', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.changes.read')
    ],
    schema: {
      tags: ['account.changes'],
      body: Type.Object({
        entityType: Type.String(),
        entityId: Type.String(),
        changes: Type.Object({}, { additionalProperties: true }),
      }),
      response: {
        200: Type.Object({
          valid: Type.Boolean(),
          errors: Type.Optional(Type.Array(Type.Object({
            field: Type.String(),
            message: Type.String(),
          }))),
          warnings: Type.Optional(Type.Array(Type.Object({
            field: Type.String(),
            message: Type.String(),
          }))),
        }),
      },
    },
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { entityType, entityId, changes } = request.body as any;
    const { user } = request;
    
    // Mock response - always valid for now
    return {
      valid: true,
      errors: undefined,
      warnings: undefined
    };
  });
};

export default changesRoutes;