import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Data Option Sets Routes
 * Manage global option sets for the tenant
 */
export const tenantOptionSetsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get option sets
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Get tenant option sets',
      description: 'Get all option sets available in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSets: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              type: Type.Union([
                Type.Literal('single'),
                Type.Literal('multiple'),
                Type.Literal('hierarchical'),
              ]),
              isActive: Type.Boolean(),
              isSystem: Type.Boolean(),
              optionCount: Type.Number(),
              usageCount: Type.Number(),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            categories: Type.Array(Type.Object({
              name: Type.String(),
              count: Type.Number(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, search, category, isActive } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (category) {
          where.category = category;
        }

        if (isActive !== undefined) {
          where.isActive = isActive;
        }

        const [optionSets, total, categories] = await Promise.all([
          fastify.prisma.optionSet.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  options: true,
                  fieldValues: true,
                },
              },
            },
          }),
          fastify.prisma.optionSet.count({ where }),
          fastify.prisma.optionSet.groupBy({
            by: ['category'],
            where: { tenantId: request.user!.tenantId },
            _count: { category: true },
          }),
        ]);

        return {
          success: true,
          data: {
            optionSets: optionSets.map(optionSet => ({
              uuid: optionSet.uuid,
              name: optionSet.name,
              description: optionSet.description,
              category: optionSet.category,
              type: optionSet.type,
              isActive: optionSet.isActive,
              isSystem: optionSet.isSystem,
              optionCount: optionSet._count.options,
              usageCount: optionSet._count.fieldValues,
              createdBy: optionSet.createdBy,
              createdAt: optionSet.createdAt.toISOString(),
              updatedAt: optionSet.updatedAt.toISOString(),
            })),
            categories: categories.map(cat => ({
              name: cat.category,
              count: cat._count.category,
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant option sets');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_OPTION_SETS',
        });
      }
    },
  });

  // Create option set
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Create option set',
      description: 'Create a new option set',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        category: Type.String(),
        type: Type.Union([
          Type.Literal('single'),
          Type.Literal('multiple'),
          Type.Literal('hierarchical'),
        ]),
        options: Type.Array(Type.Object({
          label: Type.String(),
          value: Type.String(),
          description: Type.Optional(Type.String()),
          parentId: Type.Optional(Type.Number()),
          order: Type.Optional(Type.Number()),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        })),
        isGlobal: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, category, type, options, isGlobal } = request.body;

      try {
        const optionSet = await fastify.prisma.optionSet.create({
          data: {
            name,
            description,
            category,
            type,
            isActive: true,
            isSystem: false,
            isGlobal: isGlobal !== false,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
            options: {
              create: options.map((option, index) => ({
                label: option.label,
                value: option.value,
                description: option.description,
                parentId: option.parentId,
                order: option.order || index,
                metadata: option.metadata || {},
                isActive: true,
              })),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            optionSet: {
              uuid: optionSet.uuid,
              name: optionSet.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_OPTION_SET',
        });
      }
    },
  });

  // Get option set details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Get option set details',
      description: 'Get detailed information about a specific option set',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              type: Type.String(),
              isActive: Type.Boolean(),
              isSystem: Type.Boolean(),
              isGlobal: Type.Boolean(),
              options: Type.Array(Type.Object({
                label: Type.String(),
                value: Type.String(),
                description: Type.Optional(Type.String()),
                parentId: Type.Optional(Type.Number()),
                order: Type.Number(),
                metadata: Type.Object({}, { additionalProperties: true }),
                isActive: Type.Boolean(),
                children: Type.Optional(Type.Array(Type.Any())),
              })),
              usage: Type.Object({
                totalUses: Type.Number(),
                recentUses: Type.Array(Type.Object({
                  fieldId: Type.Number(),
                  fieldName: Type.String(),
                  contentId: Type.Number(),
                  contentTitle: Type.String(),
                  accountName: Type.String(),
                  createdAt: Type.String(),
                })),
              }),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const optionSet = await fastify.prisma.optionSet.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            options: {
              orderBy: { order: 'asc' },
            },
            fieldValues: {
              include: {
                field: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                content: {
                  select: {
                    id: true,
                    title: true,
                    account: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                fieldValues: true,
              },
            },
          },
        });

        if (!optionSet) {
          return reply.status(404).send({
            success: false,
            error: 'OPTION_SET_NOT_FOUND',
          });
        }

        // Build hierarchical structure if needed
        let options = optionSet.options;
        if (optionSet.type === 'hierarchical') {
          const optionMap = new Map(options.map(opt => [opt.uuid as UUID, { ...opt, children: [] }]));
          const rootOptions = [];

          for (const option of options) {
            if (option.parentId) {
              const parent = optionMap.get(option.parentId);
              if (parent) {
                parent.children.push(optionMap.get(option.id));
              }
            } else {
              rootOptions.push(optionMap.get(option.id));
            }
          }
          options = rootOptions;
        }

        return {
          success: true,
          data: {
            optionSet: {
              uuid: optionSet.uuid,
              name: optionSet.name,
              description: optionSet.description,
              category: optionSet.category,
              type: optionSet.type,
              isActive: optionSet.isActive,
              isSystem: optionSet.isSystem,
              isGlobal: optionSet.isGlobal,
              options,
              usage: {
                totalUses: optionSet._count.fieldValues,
                recentUses: optionSet.fieldValues.map(fv => ({
                  fieldId: fv.field.uuid as UUID,
                  fieldName: fv.field.name,
                  contentId: fv.content.uuid as UUID,
                  contentTitle: fv.content.title,
                  accountName: fv.content.account.name,
                  createdAt: fv.createdAt.toISOString(),
                })),
              },
              createdBy: optionSet.createdBy,
              createdAt: optionSet.createdAt.toISOString(),
              updatedAt: optionSet.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get option set details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_OPTION_SET_DETAILS',
        });
      }
    },
  });

  // Update option set
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.update')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Update option set',
      description: 'Update option set information and options',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean()),
        options: Type.Optional(Type.Array(Type.Object({
          id: Type.Optional(Type.Number()),
          label: Type.String(),
          value: Type.String(),
          description: Type.Optional(Type.String()),
          parentId: Type.Optional(Type.Number()),
          order: Type.Optional(Type.Number()),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
          isActive: Type.Optional(Type.Boolean({ default: true })),
        }))),
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
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { options, ...updates } = request.body;

      try {
        const optionSet = await fastify.prisma.optionSet.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
        });

        if (!optionSet) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_OPTION_SET_NOT_FOUND',
          });
        }

        // Update basic fields
        if (Object.keys(updates).length > 0) {
          await fastify.prisma.optionSet.update({
            where: { tenantId: request.user.tenantId },
            data: {
              ...updates,
              updatedAt: new Date(),
            },
          });
        }

        // Update options if provided
        if (options) {
          // Delete all existing options
          await fastify.prisma.option.deleteMany({
            where: { tenantId: request.user.tenantId, optionSetId: optionSet.uuid as UUID },
          });

          // Create new options
          await fastify.prisma.option.createMany({
            data: options.map((option, index) => ({
              optionSetId: optionSet.uuid as UUID,
              label: option.label,
              value: option.value,
              description: option.description,
              parentId: option.parentId,
              order: option.order || index,
              metadata: option.metadata || {},
              isActive: option.isActive !== false,
            })),
          });
        }

        return {
          success: true,
          data: {
            message: 'Option set updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_OPTION_SET',
        });
      }
    },
  });

  // Clone option set
  fastify.post('/:uuid/clone', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Clone option set',
      description: 'Create a copy of an existing option set',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { name, description, category } = request.body;

      try {
        const sourceOptionSet = await fastify.prisma.optionSet.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
          include: {
            options: true,
          },
        });

        if (!sourceOptionSet) {
          return reply.status(404).send({
            success: false,
            error: 'SOURCE_OPTION_SET_NOT_FOUND',
          });
        }

        const clonedOptionSet = await fastify.prisma.optionSet.create({
          data: {
            name,
            description: description || `Cloned from ${sourceOptionSet.name}`,
            category: category || sourceOptionSet.category,
            type: sourceOptionSet.type,
            isActive: true,
            isSystem: false,
            isGlobal: true,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
            options: {
              create: sourceOptionSet.options.map(option => ({
                label: option.label,
                value: option.value,
                description: option.description,
                parentId: option.parentId,
                order: option.order,
                metadata: option.metadata,
                isActive: option.isActive,
              })),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            optionSet: {
              uuid: clonedOptionSet.uuid,
              name: clonedOptionSet.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to clone option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CLONE_OPTION_SET',
        });
      }
    },
  });

  // Delete option set
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.delete')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Delete option set',
      description: 'Delete an option set (soft delete if in use)',
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
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const optionSet = await fastify.prisma.optionSet.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
          include: {
            _count: {
              select: {
                fieldValues: true,
              },
            },
          },
        });

        if (!optionSet) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_OPTION_SET_NOT_FOUND',
          });
        }

        if (optionSet._count.fieldValues > 0) {
          // Soft delete if option set is in use
          await fastify.prisma.optionSet.update({
            where: { tenantId: request.user.tenantId },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          });

          return {
            success: true,
            data: {
              message: 'Option set deactivated successfully (option set is in use)',
            },
          };
        } else {
          // Hard delete if not in use
          await fastify.prisma.optionSet.delete({
            where: { tenantId: request.user.tenantId },
          });

          return {
            success: true,
            data: {
              message: 'Option set deleted successfully',
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to delete option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_OPTION_SET',
        });
      }
    },
  });

  // Export option set
  fastify.get('/:uuid/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Export option set',
      description: 'Export option set as JSON for backup or sharing',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          uuid: uuidSchema,
          name: Type.String(),
          description: Type.Optional(Type.String()),
          category: Type.String(),
          type: Type.String(),
          options: Type.Array(Type.Object({
            label: Type.String(),
            value: Type.String(),
            description: Type.Optional(Type.String()),
            parentId: Type.Optional(Type.Number()),
            order: Type.Number(),
            metadata: Type.Object({}, { additionalProperties: true }),
          })),
          exportedAt: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const optionSet = await fastify.prisma.optionSet.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        });

        if (!optionSet) {
          return reply.status(404).send({
            success: false,
            error: 'OPTION_SET_NOT_FOUND',
          });
        }

        const exportData = {
          uuid: optionSet.uuid,
          name: optionSet.name,
          description: optionSet.description,
          category: optionSet.category,
          type: optionSet.type,
          options: optionSet.options.map(option => ({
            label: option.label,
            value: option.value,
            description: option.description,
            parentId: option.parentId,
            order: option.order,
            metadata: option.metadata,
          })),
          exportedAt: new Date().toISOString(),
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${optionSet.name}-option-set.json"`);
        
        return exportData;
      } catch (error) {
        request.log.error({ error }, 'Failed to export option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXPORT_OPTION_SET',
        });
      }
    },
  });

  // Import option set
  fastify.post('/import', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.option-sets.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Import option set',
      description: 'Import an option set from JSON data',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        optionSetData: Type.Object({
          name: Type.String(),
          description: Type.Optional(Type.String()),
          category: Type.String(),
          type: Type.String(),
          options: Type.Array(Type.Object({
            label: Type.String(),
            value: Type.String(),
            description: Type.Optional(Type.String()),
            parentId: Type.Optional(Type.Number()),
            order: Type.Optional(Type.Number()),
            metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
          })),
        }),
        overrideName: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            optionSet: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { optionSetData, overrideName } = request.body;

      try {
        const optionSet = await fastify.prisma.optionSet.create({
          data: {
            name: overrideName || optionSetData.name,
            description: optionSetData.description,
            category: optionSetData.category,
            type: optionSetData.type,
            isActive: true,
            isSystem: false,
            isGlobal: true,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
            options: {
              create: optionSetData.options.map((option, index) => ({
                label: option.label,
                value: option.value,
                description: option.description,
                parentId: option.parentId,
                order: option.order || index,
                metadata: option.metadata || {},
                isActive: true,
              })),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            optionSet: {
              uuid: optionSet.uuid,
              name: optionSet.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to import option set');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_IMPORT_OPTION_SET',
        });
      }
    },
  });
};