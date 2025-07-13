import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const modelSchemasRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all model schemas with filtering
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.read')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        tenantId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schemas: Type.Array(Type.Object({}, { additionalProperties: true })),
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
      const { page = 1, limit = 20, search, category, status, tenantId } = request.query;
      const user = request.user;
      const effectiveTenantId = tenantId ?? user.tenantId;

      const skip = (page - 1) * limit;

      const where = {
        tenantId: effectiveTenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(status && { status }),
      };

      const [schemas, total] = await Promise.all([
        prisma.modelSchema.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: { forms: true },
            },
          },
        }),
        prisma.modelSchema.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          schemas,
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
        error: 'FAILED_TO_FETCH_MODEL_SCHEMAS',
      });
    }
  });

  // Get single model schema
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.read')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const user = request.user;

      const schema = await prisma.modelSchema.findFirst({
        where: {
          uuid,
          tenantId: user.tenantId,
        },
        include: {
          forms: {
            select: {
              id: true,
              uuid: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!schema) {
        return reply.status(404).send({
          success: false,
          error: 'MODEL_SCHEMA_NOT_FOUND',
        });
      }

      return reply.send({
        success: true,
        data: { schema },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_MODEL_SCHEMA',
      });
    }
  });

  // Create model schema
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.create')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 255 }),
        description: Type.Optional(Type.String()),
        category: Type.String({ minLength: 1 }),
        status: Type.Optional(Type.Union([
          Type.Literal('draft'),
          Type.Literal('active'),
          Type.Literal('archived')
        ], { default: 'draft' })),
        fields: Type.Object({}, { additionalProperties: true }),
        validation: Type.Optional(Type.Object({}, { additionalProperties: true })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { name, description, category, status = 'draft', fields, validation, metadata } = request.body;
      const user = request.user;

      // Check if schema with this name already exists for the tenant
      const existingSchema = await prisma.modelSchema.findFirst({
        where: {
          name,
          tenantId: user.tenantId,
        },
      });

      if (existingSchema) {
        return reply.status(409).send({
          success: false,
          error: 'A_MODEL_SCHEMA_WITH_THIS_NAME_ALREADY_EXISTS',
        });
      }

      const schema = await prisma.modelSchema.create({
        data: {
          name,
          description,
          category,
          status,
          fields,
          validation,
          metadata,
          tenantId: user.tenantId,
          createdBy: user.uuid as UUID,
        },
      });

      return reply.status(201).send({
        success: true,
        data: { schema },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_MODEL_SCHEMA',
      });
    }
  });

  // Update model schema
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.update')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('draft'),
          Type.Literal('active'),
          Type.Literal('archived')
        ])),
        fields: Type.Optional(Type.Object({}, { additionalProperties: true })),
        validation: Type.Optional(Type.Object({}, { additionalProperties: true })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({}, { additionalProperties: true }),
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
      const existingSchema = await prisma.modelSchema.findFirst({
        where: {
          uuid,
          tenantId: user.tenantId,
        },
      });

      if (!existingSchema) {
        return reply.status(404).send({
          success: false,
          error: 'MODEL_SCHEMA_NOT_FOUND',
        });
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== existingSchema.name) {
        const nameConflict = await prisma.modelSchema.findFirst({
          where: {
            name: updateData.name,
            tenantId: user.tenantId,
            uuid: { not: uuid },
          },
        });

        if (nameConflict) {
          return reply.status(409).send({
            success: false,
            error: 'A_MODEL_SCHEMA_WITH_THIS_NAME_ALREADY_EXISTS',
          });
        }
      }

      const schema = await prisma.modelSchema.update({
        where: { tenantId: request.user.tenantId, uuid },
        data: {
          ...updateData,
          updatedBy: user.uuid as UUID,
        },
      });

      return reply.send({
        success: true,
        data: { schema },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_MODEL_SCHEMA',
      });
    }
  });

  // Delete model schema
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.delete')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
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

      // Verify ownership and check for dependencies
      const schema = await prisma.modelSchema.findFirst({
        where: {
          uuid,
          tenantId: user.tenantId,
        },
        include: {
          _count: {
            select: { forms: true },
          },
        },
      });

      if (!schema) {
        return reply.status(404).send({
          success: false,
          error: 'MODEL_SCHEMA_NOT_FOUND',
        });
      }

      // Check if schema is in use
      if (schema._count.forms > 0) {
        return reply.status(409).send({
          success: false,
          error: 'CANNOT_DELETE_SCHEMA_THAT_IS_BEING_USED_BY_FORMS',
        });
      }

      await prisma.modelSchema.delete({
        where: { tenantId: request.user.tenantId, uuid },
      });

      return reply.send({
        success: true,
        data: { message: 'Model schema deleted successfully' },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_MODEL_SCHEMA',
      });
    }
  });

  // Duplicate model schema
  fastify.post('/:uuid/duplicate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.create')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 255 }),
        description: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            schema: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      const { name, description } = request.body;
      const user = request.user;

      // Find source schema
      const sourceSchema = await prisma.modelSchema.findFirst({
        where: {
          uuid,
          tenantId: user.tenantId,
        },
      });

      if (!sourceSchema) {
        return reply.status(404).send({
          success: false,
          error: 'SOURCE_MODEL_SCHEMA_NOT_FOUND',
        });
      }

      // Check if new name already exists
      const existingSchema = await prisma.modelSchema.findFirst({
        where: {
          name,
          tenantId: user.tenantId,
        },
      });

      if (existingSchema) {
        return reply.status(409).send({
          success: false,
          error: 'A_MODEL_SCHEMA_WITH_THIS_NAME_ALREADY_EXISTS',
        });
      }

      const newSchema = await prisma.modelSchema.create({
        data: {
          name,
          description: description || `Copy of ${sourceSchema.name}`,
          category: sourceSchema.category,
          status: 'draft',
          fields: sourceSchema.fields,
          validation: sourceSchema.validation,
          metadata: sourceSchema.metadata,
          tenantId: user.tenantId,
          createdBy: user.uuid as UUID,
        },
      });

      return reply.status(201).send({
        success: true,
        data: { schema: newSchema },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DUPLICATE_MODEL_SCHEMA',
      });
    }
  });

  // Export model schemas
  fastify.get('/export/all', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.export')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Optional(Type.Union([
          Type.Literal('json'),
          Type.Literal('yaml')
        ], { default: 'json' })),
        category: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
    },
  }, async (request, reply) => {
    try {
      const { format = 'json', category, status } = request.query;
      const user = request.user;

      const where = {
        tenantId: user.tenantId,
        ...(category && { category }),
        ...(status && { status }),
      };

      const schemas = await prisma.modelSchema.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          uuid: true,
          name: true,
          description: true,
          category: true,
          status: true,
          fields: true,
          validation: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const filename = `model-schemas-export-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'yaml') {
        const yaml = require('yaml');
        reply.header('Content-Type', 'application/x-yaml');
        reply.header('Content-Disposition', `attachment; filename="${filename}.yaml"`);
        return reply.send(yaml.stringify(schemas));
      } else {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
        return reply.send(JSON.stringify(schemas, null, 2));
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_EXPORT_MODEL_SCHEMAS',
      });
    }
  });

  // Import model schemas
  fastify.post('/import', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas.import')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        schemas: Type.Array(Type.Object({
          name: Type.String(),
          description: Type.Optional(Type.String()),
          category: Type.String(),
          status: Type.Optional(Type.String()),
          fields: Type.Object({}, { additionalProperties: true }),
          validation: Type.Optional(Type.Object({}, { additionalProperties: true })),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        })),
        conflictResolution: Type.Optional(Type.Union([
          Type.Literal('skip'),
          Type.Literal('overwrite'),
          Type.Literal('rename')
        ], { default: 'skip' })),
      }),
    },
  }, async (request, reply) => {
    try {
      const { schemas, conflictResolution = 'skip' } = request.body;
      const user = request.user;

      const results = {
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: [],
      };

      for (const schemaData of schemas) {
        try {
          const existingSchema = await prisma.modelSchema.findFirst({
            where: {
              name: schemaData.name,
              tenantId: user.tenantId,
            },
          });

          if (existingSchema) {
            if (conflictResolution === 'skip') {
              results.skipped++;
              continue;
            } else if (conflictResolution === 'overwrite') {
              await prisma.modelSchema.update({
                where: { tenantId: request.user.tenantId },
                data: {
                  ...schemaData,
                  updatedBy: user.uuid as UUID,
                },
              });
              results.updated++;
            } else if (conflictResolution === 'rename') {
              let newName = `${schemaData.name} (imported)`;
              let counter = 1;
              
              while (await prisma.modelSchema.findFirst({
                where: { name: newName, tenantId: user.tenantId },
              })) {
                newName = `${schemaData.name} (imported ${counter})`;
                counter++;
              }

              await prisma.modelSchema.create({
                data: {
                  ...schemaData,
                  name: newName,
                  status: 'draft',
                  tenantId: user.tenantId,
                  createdBy: user.uuid as UUID,
                },
              });
              results.imported++;
            }
          } else {
            await prisma.modelSchema.create({
              data: {
                ...schemaData,
                status: schemaData.status || 'draft',
                tenantId: user.tenantId,
                createdBy: user.uuid as UUID,
              },
            });
            results.imported++;
          }
        } catch (error) {
          results.errors.push({
            schema: schemaData.name,
            error: error.message,
          });
        }
      }

      return reply.send({
        success: true,
        data: results,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_IMPORT_MODEL_SCHEMAS',
      });
    }
  });

  // Bulk operations - Admin only
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('model-schemas:admin')],
    schema: {
      tags: ['tenant.data.schemas.model-schemas'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        operation: Type.Union([
          Type.Literal('create'),
          Type.Literal('update'),
          Type.Literal('delete'),
          Type.Literal('activate'),
          Type.Literal('deactivate'),
        ]),
        schemas: Type.Array(Type.Object({
          // For create/update
          name: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
          category: Type.Optional(Type.String()),
          version: Type.Optional(Type.String()),
          schema: Type.Optional(Type.Object({}, { additionalProperties: true })),
          isPublic: Type.Optional(Type.Boolean()),
          tags: Type.Optional(Type.Array(Type.String())),
          metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
          // For update/delete/activate/deactivate
          id: Type.Optional(Type.Number()),
          uuid: Type.Optional(Type.String()),
        })),
        skipDuplicates: Type.Optional(Type.Boolean({ default: true })),
        updateOnConflict: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            operation: Type.String(),
            processed: Type.Number(),
            failed: Type.Number(),
            errors: Type.Array(Type.Object({
              index: Type.Number(),
              error: Type.String(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { operation, schemas, skipDuplicates = true, updateOnConflict = false } = request.body;
    const errors: Array<{ index: number; error: string }> = [];
    let processed = 0;
    const isAdmin = fastify.hasPermission(request.user!, 'model-schemas:admin');

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      try {
        switch (operation) {
          case 'create':
            if (!schema.name || !schema.category || !schema.schema) {
              throw new Error('Name, category, and schema are required for create operation');
            }

            // Check for existing
            const existing = await fastify.prisma.modelSchema.findFirst({
              where: {
                name: schema.name,
                tenantId: isAdmin ? schema.tenantId || request.user!.tenantId : request.user!.tenantId,
              },
            });

            if (existing && skipDuplicates && !updateOnConflict) {
              continue; // Skip duplicate
            }

            await fastify.prisma.modelSchema.create({
              data: {
                tenantId: isAdmin ? schema.tenantId || request.user!.tenantId : request.user!.tenantId,
                name: schema.name,
                description: schema.description,
                category: schema.category,
                version: schema.version || '1.0.0',
                schema: schema.schema,
                isPublic: schema.isPublic ?? false,
                tags: schema.tags || [],
                metadata: schema.metadata,
                createdBy: request.user!.id,
              },
            });
            break;

          case 'update':
            const updateWhere = schema.id ? { } : { uuid: schema.uuid! };
            await fastify.prisma.modelSchema.update({
              where: updateWhere,
              data: {
                name: schema.name,
                description: schema.description,
                category: schema.category,
                version: schema.version,
                schema: schema.schema,
                isPublic: schema.isPublic,
                tags: schema.tags,
                metadata: schema.metadata,
              },
            });
            break;

          case 'delete':
            const deleteWhere = schema.id ? { } : { uuid: schema.uuid! };
            await fastify.prisma.modelSchema.delete({ where: deleteWhere });
            break;

          case 'activate':
          case 'deactivate':
            const statusWhere = schema.id ? { } : { uuid: schema.uuid! };
            await fastify.prisma.modelSchema.update({
              where: statusWhere,
              data: { status: operation === 'activate' ? 'active' : 'inactive' },
            });
            break;
        }
        processed++;
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }

    return {
      success: true,
      data: {
        operation,
        processed,
        failed: errors.length,
        errors,
      },
    };
  });
};