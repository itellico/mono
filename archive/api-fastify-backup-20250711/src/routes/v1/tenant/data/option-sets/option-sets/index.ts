import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const optionSetsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all option sets with filtering
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.read')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isGlobal: Type.Optional(Type.Boolean()),
        tenantId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSets: Type.Array(Type.Object({}, { additionalProperties: true })),
            pagination: Type.Object({
              total: Type.Number(),
              page: Type.Number(),
              limit: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20, search, category, isGlobal, tenantId } = request.query;
      const user = request.user;
      const effectiveTenantId = tenantId ?? user.tenantId;

      const skip = (page - 1) * limit;

      const where = {
        OR: [
          { tenantId: effectiveTenantId },
          { isGlobal: true },
        ],
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(isGlobal !== undefined && { isGlobal }),
      };

      const [optionSets, total] = await Promise.all([
        prisma.optionSet.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { isGlobal: 'desc' },
            { name: 'asc' },
          ],
          include: {
            values: {
              orderBy: { orderIndex: 'asc' },
              take: 5, // Just preview values
            },
            _count: {
              select: { values: true },
            },
          },
        }),
        prisma.optionSet.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          optionSets,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_OPTION_SETS',
      });
    }
  });

  // Get single option set
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.read')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const user = request.user;

      const optionSet = await prisma.optionSet.findFirst({
        where: {
          uuid,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
        include: {
          values: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!optionSet) {
        return reply.status(404).send({
          success: false,
          error: 'OPTION_SET_NOT_FOUND',
        });
      }

      return reply.send({
        success: true,
        data: { optionSet },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_OPTION_SET',
      });
    }
  });

  // Create option set
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.create')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 255 }),
        description: Type.Optional(Type.String()),
        category: Type.String({ minLength: 1 }),
        isGlobal: Type.Optional(Type.Boolean({ default: false })),
        allowCustomValues: Type.Optional(Type.Boolean({ default: false })),
        isRequired: Type.Optional(Type.Boolean({ default: false })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        values: Type.Optional(Type.Array(Type.Object({
          value: Type.String(),
          label: Type.String(),
          description: Type.Optional(Type.String()),
          orderIndex: Type.Optional(Type.Number()),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        }))),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { name, description, category, isGlobal = false, allowCustomValues = false, isRequired = false, metadata, values = [] } = request.body;
      const user = request.user;

      // Only super admin can create global option sets
      if (isGlobal && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_CREATE_GLOBAL_OPTION_SETS',
        });
      }

      // Check if option set with this name already exists
      const existingOptionSet = await prisma.optionSet.findFirst({
        where: {
          name,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
      });

      if (existingOptionSet) {
        return reply.status(409).send({
          success: false,
          error: 'AN_OPTION_SET_WITH_THIS_NAME_ALREADY_EXISTS',
        });
      }

      const optionSet = await prisma.optionSet.create({
        data: {
          name,
          description,
          category,
          isGlobal,
          allowCustomValues,
          isRequired,
          metadata,
          tenantId: isGlobal ? null : user.tenantId,
          createdBy: user.uuid as UUID,
          values: {
            create: values.map((value, index) => ({
              value: value.value,
              label: value.label,
              description: value.description,
              orderIndex: value.orderIndex ?? index,
              metadata: value.metadata,
              tenantId: isGlobal ? null : user.tenantId,
              createdBy: user.uuid as UUID,
            })),
          },
        },
        include: {
          values: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      return reply.status(201).send({
        success: true,
        data: { optionSet },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_OPTION_SET',
      });
    }
  });

  // Update option set
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.update')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        allowCustomValues: Type.Optional(Type.Boolean()),
        isRequired: Type.Optional(Type.Boolean()),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const updateData = request.body;
      const user = request.user;

      // Verify ownership
      const existingOptionSet = await prisma.optionSet.findFirst({
        where: {
          uuid,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
      });

      if (!existingOptionSet) {
        return reply.status(404).send({
          success: false,
          error: 'OPTION_SET_NOT_FOUND',
        });
      }

      // Check permissions for global option sets
      if (existingOptionSet.isGlobal && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_MODIFY_GLOBAL_OPTION_SETS',
        });
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== existingOptionSet.name) {
        const nameConflict = await prisma.optionSet.findFirst({
          where: {
            name: updateData.name,
            OR: [
              { tenantId: user.tenantId },
              { isGlobal: true },
            ],
            uuid: { not: uuid },
          },
        });

        if (nameConflict) {
          return reply.status(409).send({
            success: false,
            error: 'AN_OPTION_SET_WITH_THIS_NAME_ALREADY_EXISTS',
          });
        }
      }

      const optionSet = await prisma.optionSet.update({
        where: { tenantId: request.user.tenantId, uuid },
        data: {
          ...updateData,
          updatedBy: user.uuid as UUID,
        },
        include: {
          values: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      return reply.send({
        success: true,
        data: { optionSet },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_OPTION_SET',
      });
    }
  });

  // Delete option set
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.delete')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const user = request.user;

      // Verify ownership and check permissions
      const optionSet = await prisma.optionSet.findFirst({
        where: {
          uuid,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
      });

      if (!optionSet) {
        return reply.status(404).send({
          success: false,
          error: 'OPTION_SET_NOT_FOUND',
        });
      }

      // Check permissions for global option sets
      if (optionSet.isGlobal && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_DELETE_GLOBAL_OPTION_SETS',
        });
      }

      // Delete values first, then option set
      await prisma.optionValue.deleteMany({
        where: { tenantId: request.user.tenantId, optionSetId: optionSet.uuid as UUID },
      });

      await prisma.optionSet.delete({
        where: { tenantId: request.user.tenantId, uuid },
      });

      return reply.send({
        success: true,
        data: { message: 'Option set deleted successfully' },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_OPTION_SET',
      });
    }
  });

  // Get option values for a specific set
  fastify.get('/:uuid/values', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.read')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            values: Type.Array(Type.Object({}, { additionalProperties: true })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const { search } = request.query;
      const user = request.user;

      // First verify the option set exists and user has access
      const optionSet = await prisma.optionSet.findFirst({
        where: {
          uuid,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
      });

      if (!optionSet) {
        return reply.status(404).send({
          success: false,
          error: 'OPTION_SET_NOT_FOUND',
        });
      }

      const where = {
        optionSetId: optionSet.uuid as UUID,
        ...(search && {
          OR: [
            { value: { contains: search, mode: 'insensitive' } },
            { label: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const values = await prisma.optionValue.findMany({
        where,
        orderBy: { orderIndex: 'asc' },
      });

      return reply.send({
        success: true,
        data: { values },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_OPTION_VALUES',
      });
    }
  });

  // Add value to option set
  fastify.post('/:uuid/values', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.update')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        value: Type.String({ minLength: 1 }),
        label: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        orderIndex: Type.Optional(Type.Number()),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            value: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const { value, label, description, orderIndex, metadata } = request.body;
      const user = request.user;

      // Find the option set
      const optionSet = await prisma.optionSet.findFirst({
        where: {
          uuid,
          OR: [
            { tenantId: user.tenantId },
            { isGlobal: true },
          ],
        },
      });

      if (!optionSet) {
        return reply.status(404).send({
          success: false,
          error: 'OPTION_SET_NOT_FOUND',
        });
      }

      // Check permissions for global option sets
      if (optionSet.isGlobal && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_MODIFY_GLOBAL_OPTION_SETS',
        });
      }

      // Check if value already exists
      const existingValue = await prisma.optionValue.findFirst({
        where: { tenantId: request.user.tenantId, optionSetId: optionSet.uuid as UUID,
          value, },
      });

      if (existingValue) {
        return reply.status(409).send({
          success: false,
          error: 'A_VALUE_WITH_THIS_KEY_ALREADY_EXISTS_IN_THE_OPTION_SET',
        });
      }

      // Get the next order index if not provided
      let effectiveOrderIndex = orderIndex;
      if (effectiveOrderIndex === undefined) {
        const maxOrder = await prisma.optionValue.findFirst({
          where: { tenantId: request.user.tenantId, optionSetId: optionSet.uuid as UUID },
          orderBy: { orderIndex: 'desc' },
          select: { orderIndex: true },
        });
        effectiveOrderIndex = (maxOrder?.orderIndex ?? -1) + 1;
      }

      const newValue = await prisma.optionValue.create({
        data: {
          value,
          label,
          description,
          orderIndex: effectiveOrderIndex,
          metadata,
          optionSetId: optionSet.uuid as UUID,
          tenantId: optionSet.isGlobal ? null : user.tenantId,
          createdBy: user.uuid as UUID,
        },
      });

      return reply.status(201).send({
        success: true,
        data: { value: newValue },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_ADD_OPTION_VALUE',
      });
    }
  });

  // Export option sets
  fastify.get('/export/all', {
    preHandler: [fastify.authenticate, fastify.requirePermission('option-sets.export')],
    schema: {
      tags: ['tenant.data.option-sets.option-sets'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Optional(Type.Union([
          Type.Literal('json'),
          Type.Literal('csv')
        ], { default: 'json' })),
        category: Type.Optional(Type.String()),
        includeGlobal: Type.Optional(Type.Boolean({ default: true })),
      }),
    },
  }, async (request, reply) => {
    try {
      const { format = 'json', category, includeGlobal = true } = request.query;
      const user = request.user;

      const where = {
        OR: [
          { tenantId: user.tenantId },
          ...(includeGlobal ? [{ isGlobal: true }] : []),
        ],
        ...(category && { category }),
      };

      const optionSets = await prisma.optionSet.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          values: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      const filename = `option-sets-export-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        // Flatten for CSV export
        const csvData = [];
        optionSets.forEach(set => {
          set.values.forEach(value => {
            csvData.push({
              optionSetName: set.name,
              optionSetCategory: set.category,
              optionSetDescription: set.description,
              value: value.value,
              label: value.label,
              valueDescription: value.description,
              orderIndex: value.orderIndex,
            });
          });
        });

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        
        const header = Object.keys(csvData[0] || {}).join(',');
        const rows = csvData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','));
        return reply.send([header, ...rows].join('\n'));
      } else {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
        return reply.send(JSON.stringify(optionSets, null, 2));
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_EXPORT_OPTION_SETS',
      });
    }
  });
};