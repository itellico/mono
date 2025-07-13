import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Data Schemas Routes
 * Manage global data schemas for the tenant
 */
export const tenantSchemasRoutes: FastifyPluginAsync = async (fastify) => {
  // Get schemas
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Get tenant schemas',
      description: 'Get all data schemas available in the tenant',
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
            schemas: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              version: Type.Number(),
              isActive: Type.Boolean(),
              isSystem: Type.Boolean(),
              schema: Type.Object({}, { additionalProperties: true }),
              validationRules: Type.Object({}, { additionalProperties: true }),
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

        const [schemas, total, categories] = await Promise.all([
          fastify.prisma.modelSchema.findMany({
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
                  content: true,
                },
              },
            },
          }),
          fastify.prisma.modelSchema.count({ where }),
          fastify.prisma.modelSchema.groupBy({
            by: ['category'],
            where: { tenantId: request.user!.tenantId },
            _count: { category: true },
          }),
        ]);

        return {
          success: true,
          data: {
            schemas: schemas.map(schema => ({
              uuid: schema.uuid,
              name: schema.name,
              description: schema.description,
              category: schema.category,
              version: schema.version,
              isActive: schema.isActive,
              isSystem: schema.isSystem,
              schema: schema.schema,
              validationRules: schema.validationRules,
              usageCount: schema._count.content,
              createdBy: schema.createdBy,
              createdAt: schema.createdAt.toISOString(),
              updatedAt: schema.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get tenant schemas');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_SCHEMAS',
        });
      }
    },
  });

  // Create schema
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Create schema',
      description: 'Create a new data schema',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        category: Type.String(),
        schema: Type.Object({}, { additionalProperties: true }),
        validationRules: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isGlobal: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, category, schema, validationRules, isGlobal } = request.body;

      try {
        const modelSchema = await fastify.prisma.modelSchema.create({
          data: {
            name,
            description,
            category,
            schema,
            validationRules: validationRules || {},
            isActive: true,
            isSystem: false,
            isGlobal: isGlobal !== false,
            version: 1,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            schema: {
              uuid: modelSchema.uuid,
              name: modelSchema.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_SCHEMA',
        });
      }
    },
  });

  // Get schema details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Get schema details',
      description: 'Get detailed information about a specific schema',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              version: Type.Number(),
              isActive: Type.Boolean(),
              isSystem: Type.Boolean(),
              isGlobal: Type.Boolean(),
              schema: Type.Object({}, { additionalProperties: true }),
              validationRules: Type.Object({}, { additionalProperties: true }),
              usage: Type.Object({
                totalUses: Type.Number(),
                recentUses: Type.Array(Type.Object({
                  accountId: Type.Number(),
                  accountName: Type.String(),
                  contentId: Type.Number(),
                  contentTitle: Type.String(),
                  createdAt: Type.String(),
                })),
              }),
              versions: Type.Array(Type.Object({
                version: Type.Number(),
                changes: Type.Array(Type.String()),
                createdBy: Type.String(),
                createdAt: Type.String(),
              })),
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
        const schema = await fastify.prisma.modelSchema.findFirst({
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
            content: {
              include: {
                account: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            versions: {
              include: {
                createdBy: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: { version: 'desc' },
            },
            _count: {
              select: {
                content: true,
              },
            },
          },
        });

        if (!schema) {
          return reply.status(404).send({
            success: false,
            error: 'SCHEMA_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            schema: {
              uuid: schema.uuid,
              name: schema.name,
              description: schema.description,
              category: schema.category,
              version: schema.version,
              isActive: schema.isActive,
              isSystem: schema.isSystem,
              isGlobal: schema.isGlobal,
              schema: schema.schema,
              validationRules: schema.validationRules,
              usage: {
                totalUses: schema._count.content,
                recentUses: schema.content.map(content => ({
                  accountId: content.account.uuid as UUID,
                  accountName: content.account.name,
                  contentId: content.uuid as UUID,
                  contentTitle: content.title,
                  createdAt: content.createdAt.toISOString(),
                })),
              },
              versions: schema.versions.map(version => ({
                version: version.version,
                changes: version.changes,
                createdBy: version.createdBy.name,
                createdAt: version.createdAt.toISOString(),
              })),
              createdBy: schema.createdBy,
              createdAt: schema.createdAt.toISOString(),
              updatedAt: schema.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get schema details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SCHEMA_DETAILS',
        });
      }
    },
  });

  // Update schema
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.update')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Update schema',
      description: 'Update schema definition and validation rules',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        schema: Type.Optional(Type.Object({}, { additionalProperties: true })),
        validationRules: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean()),
        createNewVersion: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            version: Type.Optional(Type.Number()),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { createNewVersion, ...updates } = request.body;

      try {
        const schema = await fastify.prisma.modelSchema.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
        });

        if (!schema) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_SCHEMA_NOT_FOUND',
          });
        }

        let newVersion = schema.version;

        if (createNewVersion && (updates.schema || updates.validationRules)) {
          newVersion = schema.version + 1;
          updates.version = newVersion;

          // Create version history entry
          await fastify.prisma.schemaVersion.create({
            data: {
              schemaId: schema.uuid as UUID,
              version: newVersion,
              schema: updates.schema || schema.schema,
              validationRules: updates.validationRules || schema.validationRules,
              changes: [], // TODO: Calculate diff
              createdById: request.user!.id,
            },
          });
        }

        await fastify.prisma.modelSchema.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Schema updated successfully',
            version: createNewVersion ? newVersion : undefined,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_SCHEMA',
        });
      }
    },
  });

  // Clone schema
  fastify.post('/:uuid/clone', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Clone schema',
      description: 'Create a copy of an existing schema',
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
            schema: Type.Object({
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
        const sourceSchema = await fastify.prisma.modelSchema.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!sourceSchema) {
          return reply.status(404).send({
            success: false,
            error: 'SOURCE_SCHEMA_NOT_FOUND',
          });
        }

        const clonedSchema = await fastify.prisma.modelSchema.create({
          data: {
            name,
            description: description || `Cloned from ${sourceSchema.name}`,
            category: category || sourceSchema.category,
            schema: sourceSchema.schema,
            validationRules: sourceSchema.validationRules,
            isActive: true,
            isSystem: false,
            isGlobal: true,
            version: 1,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            schema: {
              uuid: clonedSchema.uuid,
              name: clonedSchema.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to clone schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CLONE_SCHEMA',
        });
      }
    },
  });

  // Delete schema
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.delete')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Delete schema',
      description: 'Delete a schema (soft delete if in use)',
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
        const schema = await fastify.prisma.modelSchema.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
          include: {
            _count: {
              select: {
                content: true,
              },
            },
          },
        });

        if (!schema) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_SCHEMA_NOT_FOUND',
          });
        }

        if (schema._count.content > 0) {
          // Soft delete if schema is in use
          await fastify.prisma.modelSchema.update({
            where: { tenantId: request.user.tenantId },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          });

          return {
            success: true,
            data: {
              message: 'Schema deactivated successfully (schema is in use)',
            },
          };
        } else {
          // Hard delete if not in use
          await fastify.prisma.modelSchema.delete({
            where: { tenantId: request.user.tenantId },
          });

          return {
            success: true,
            data: {
              message: 'Schema deleted successfully',
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to delete schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_SCHEMA',
        });
      }
    },
  });

  // Validate data against schema
  fastify.post('/:uuid/validate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Validate data',
      description: 'Validate data against a specific schema',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        data: Type.Object({}, { additionalProperties: true }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            valid: Type.Boolean(),
            errors: Type.Array(Type.Object({
              field: Type.String(),
              message: Type.String(),
              value: Type.Any(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { data } = request.body;

      try {
        const schema = await fastify.prisma.modelSchema.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isActive: true,
          },
        });

        if (!schema) {
          return reply.status(404).send({
            success: false,
            error: 'SCHEMA_NOT_FOUND',
          });
        }

        // TODO: Implement actual schema validation
        // This is a placeholder implementation
        const errors = [];
        const valid = errors.length === 0;

        return {
          success: true,
          data: {
            valid,
            errors,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to validate data');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_VALIDATE_DATA',
        });
      }
    },
  });

  // Export schema
  fastify.get('/:uuid/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.read')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Export schema',
      description: 'Export schema as JSON for backup or sharing',
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
          schema: Type.Object({}, { additionalProperties: true }),
          validationRules: Type.Object({}, { additionalProperties: true }),
          version: Type.Number(),
          exportedAt: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const schema = await fastify.prisma.modelSchema.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!schema) {
          return reply.status(404).send({
            success: false,
            error: 'SCHEMA_NOT_FOUND',
          });
        }

        const exportData = {
          uuid: schema.uuid,
          name: schema.name,
          description: schema.description,
          category: schema.category,
          schema: schema.schema,
          validationRules: schema.validationRules,
          version: schema.version,
          exportedAt: new Date().toISOString(),
        };

        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${schema.name}-schema.json"`);
        
        return exportData;
      } catch (error) {
        request.log.error({ error }, 'Failed to export schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXPORT_SCHEMA',
        });
      }
    },
  });

  // Import schema
  fastify.post('/import', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.schemas.create')],
    schema: {
      tags: ['tenant.data'],
      summary: 'Import schema',
      description: 'Import a schema from JSON data',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        schemaData: Type.Object({
          name: Type.String(),
          description: Type.Optional(Type.String()),
          category: Type.String(),
          schema: Type.Object({}, { additionalProperties: true }),
          validationRules: Type.Optional(Type.Object({}, { additionalProperties: true })),
        }),
        overrideName: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { schemaData, overrideName } = request.body;

      try {
        const schema = await fastify.prisma.modelSchema.create({
          data: {
            name: overrideName || schemaData.name,
            description: schemaData.description,
            category: schemaData.category,
            schema: schemaData.schema,
            validationRules: schemaData.validationRules || {},
            isActive: true,
            isSystem: false,
            isGlobal: true,
            version: 1,
            tenantId: request.user!.tenantId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            schema: {
              uuid: schema.uuid,
              name: schema.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to import schema');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_IMPORT_SCHEMA',
        });
      }
    },
  });
};