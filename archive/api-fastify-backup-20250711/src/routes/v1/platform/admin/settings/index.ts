function getRBACConfigFromEnv() {
  return {
    enableWildcards: process.env.RBAC_ENABLE_WILDCARDS !== 'false',
    enableCaching: process.env.RBAC_ENABLE_CACHING !== 'false',
    cacheExpirationMinutes: parseInt(process.env.RBAC_CACHE_EXPIRATION_MINUTES || '15'),
    enableAuditLog: process.env.RBAC_ENABLE_AUDIT !== 'false',
    auditRetentionDays: parseInt(process.env.RBAC_AUDIT_RETENTION_DAYS || '90'),
  };
}

import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const adminSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all admin settings
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.read')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        isGlobal: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            settings: Type.Array(Type.Object({}, { additionalProperties: true })),
            categories: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { category, search, isGlobal } = request.query;
      const user = request.user;

      const where: any = {};

      // Tenant isolation: Super admin can see global settings, tenant admin sees tenant settings
      if (user.roles.includes('super_admin')) {
        if (isGlobal !== undefined) {
          where.tenantId = isGlobal ? null : { not: null };
        }
      } else {
        where.tenantId = user.tenantId;
      }

      if (category) where.category = category;
      if (search) {
        where.OR = [
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { value: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [settings, allSettings] = await Promise.all([
        fastify.prisma.adminSetting.findMany({
          where,
          orderBy: [
            { category: 'asc' },
            { key: 'asc' },
          ],
        }),
        fastify.prisma.adminSetting.findMany({
          where: user.roles.includes('super_admin') 
            ? {} 
            : { tenantId: user.tenantId },
          distinct: ['category'],
          select: { category: true },
        }),
      ]);

      const categories = allSettings.map(s => s.category).filter(Boolean).sort();

      return reply.send({
        success: true,
        data: {
          settings,
          categories,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_ADMIN_SETTINGS',
      });
    }
  });

  // Get single setting
  fastify.get('/:key', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.read')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        key: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            setting: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      const user = request.user;

      const where: any = { key };

      // Tenant isolation
      if (!user.roles.includes('super_admin')) {
        where.tenantId = user.tenantId;
      }

      const setting = await fastify.fastify.prisma.adminSetting.findFirst({
        where,
      });

      if (!setting) {
        return reply.status(404).send({
          success: false,
          error: 'SETTING_NOT_FOUND',
        });
      }

      return reply.send({
        success: true,
        data: { setting },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_SETTING',
      });
    }
  });

  // Create or update setting
  fastify.put('/:key', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.write')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        key: Type.String(),
      }),
      body: Type.Object({
        value: Type.Object({}, { additionalProperties: true }),
        category: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        type: Type.Optional(Type.Union([
          Type.Literal('string'),
          Type.Literal('number'),
          Type.Literal('boolean'),
          Type.Literal('json'),
          Type.Literal('array')
        ])),
        isPublic: Type.Optional(Type.Boolean({ default: false })),
        isGlobal: Type.Optional(Type.Boolean({ default: false })),
        validation: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            setting: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { key } = request.params;
      const { value, category, description, type = 'string', isPublic = false, isGlobal = false, validation } = request.body;
      const user = request.user;

      // Only super admin can create global settings
      if (isGlobal && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_CREATE_GLOBAL_SETTINGS',
        });
      }

      // Validate value based on type
      let processedValue = value;
      if (type === 'number' && typeof value !== 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_NUMBER_VALUE',
          });
        }
        processedValue = num;
      }

      if (type === 'boolean' && typeof value !== 'boolean') {
        processedValue = Boolean(value);
      }

      if (type === 'json' && typeof value === 'string') {
        try {
          processedValue = JSON.parse(value);
        } catch {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_JSON_VALUE',
          });
        }
      }

      const tenantId = isGlobal ? null : user.tenantId;

      const setting = await fastify.prisma.adminSetting.upsert({
        where: {
          key_tenantId: {
            key,
            tenantId,
          },
        },
        create: {
          key,
          value: processedValue,
          category,
          description,
          type,
          isPublic,
          tenantId,
          validation,
          createdBy: user.uuid as UUID,
        },
        update: {
          value: processedValue,
          category,
          description,
          type,
          isPublic,
          validation,
          updatedBy: user.uuid as UUID,
        },
      });

      return reply.send({
        success: true,
        data: { setting },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_SAVE_SETTING',
      });
    }
  });

  // Delete setting
  fastify.delete('/:key', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.delete')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        key: Type.String(),
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
      const { key } = request.params;
      const user = request.user;

      const where: any = { key };

      // Tenant isolation
      if (!user.roles.includes('super_admin')) {
        where.tenantId = user.tenantId;
      }

      const setting = await fastify.prisma.adminSetting.findFirst({ where });

      if (!setting) {
        return reply.status(404).send({
          success: false,
          error: 'SETTING_NOT_FOUND',
        });
      }

      // Check if user can delete this setting
      if (setting.tenantId === null && !user.roles.includes('super_admin')) {
        return reply.status(403).send({
          success: false,
          error: 'ONLY_SUPER_ADMINISTRATORS_CAN_DELETE_GLOBAL_SETTINGS',
        });
      }

      await fastify.prisma.adminSetting.delete({
        where: { },
      });

      return reply.send({
        success: true,
        data: { message: 'Setting deleted successfully' },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_SETTING',
      });
    }
  });

  // Get system information
  fastify.get('/system/info', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.system.read')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            system: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const user = request.user;

      // Get various system statistics
      const [
        tenantsCount,
        usersCount,
        activeUsersCount,
        globalSettingsCount,
        rbacConfig,
      ] = await Promise.all([
        user.roles.includes('super_admin') 
          ? fastify.prisma.tenant.count() 
          : 1, // Current tenant only
        user.roles.includes('super_admin')
          ? fastify.prisma.user.count()
          : fastify.prisma.user.count({ where: { account: { tenantId: user.tenantId } } }),
        user.roles.includes('super_admin')
          ? fastify.prisma.user.count({ where: { isActive: true } })
          : fastify.prisma.user.count({ 
              where: { 
                isActive: true, 
                account: { tenantId: user.tenantId } 
              } 
            }),
        user.roles.includes('super_admin')
          ? fastify.prisma.adminSetting.count({ where: { tenantId: null } })
          : 0,
        fastify.prisma.rBACConfig.findUnique({ where: { id: 1 } }),
      ]);

      const systemInfo = {
        overview: {
          tenants: tenantsCount,
          users: usersCount,
          activeUsers: activeUsersCount,
          globalSettings: globalSettingsCount,
        },
        rbac: rbacConfig,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          type: 'PostgreSQL',
          connected: true, // TODO: Add actual health check
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
        },
      };

      return reply.send({
        success: true,
        data: { system: systemInfo },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_SYSTEM_INFORMATION',
      });
    }
  });

  // Update RBAC configuration (super admin only)
  fastify.put('/rbac/config', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.rbac.configure')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        enableWildcards: Type.Optional(Type.Boolean()),
        enableInheritance: Type.Optional(Type.Boolean()),
        enableCaching: Type.Optional(Type.Boolean()),
        cacheExpirationMinutes: Type.Optional(Type.Number({ minimum: 1, maximum: 1440 })),
        maxPermissionsPerUser: Type.Optional(Type.Number({ minimum: 100, maximum: 10000 })),
        enableAuditLog: Type.Optional(Type.Boolean()),
        auditRetentionDays: Type.Optional(Type.Number({ minimum: 1, maximum: 365 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            config: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const updateData = request.body;

      const config = await fastify.prisma.rBACConfig.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          ...updateData,
        },
        update: updateData,
      });

      // If caching was disabled, clear all permission caches
      if (updateData.enableCaching === false) {
        await fastify.prisma.userPermissionCache.deleteMany({});
      }

      return reply.send({
        success: true,
        data: { config },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_RBAC_CONFIGURATION',
      });
    }
  });

  // Bulk import/export settings
  fastify.post('/import', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.import')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        settings: Type.Array(Type.Object({
          key: Type.String(),
          value: Type.Object({}, { additionalProperties: true }),
          category: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
          type: Type.Optional(Type.String()),
          isPublic: Type.Optional(Type.Boolean()),
        })),
        overwriteExisting: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            imported: Type.Number(),
            skipped: Type.Number(),
            errors: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { settings, overwriteExisting = false } = request.body;
      const user = request.user;

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const settingData of settings) {
        try {
          const existingSetting = await fastify.prisma.adminSetting.findFirst({
            where: {
              key: settingData.key,
              tenantId: user.tenantId,
            },
          });

          if (existingSetting && !overwriteExisting) {
            skipped++;
            continue;
          }

          await fastify.prisma.adminSetting.upsert({
            where: {
              key_tenantId: {
                key: settingData.key,
                tenantId: user.tenantId,
              },
            },
            create: {
              ...settingData,
              tenantId: user.tenantId,
              createdBy: user.uuid as UUID,
            },
            update: {
              ...settingData,
              updatedBy: user.uuid as UUID,
            },
          });

          imported++;
        } catch (error) {
          errors.push(`Failed to import setting ${settingData.key}: ${error.message}`);
        }
      }

      return reply.send({
        success: true,
        data: {
          imported,
          skipped,
          errors,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_IMPORT_SETTINGS',
      });
    }
  });

  // Export settings
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('admin.settings.export')],
    schema: {
      tags: ['platform.settings'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        includeGlobal: Type.Optional(Type.Boolean({ default: false })),
        format: Type.Optional(Type.Union([
          Type.Literal('json'),
          Type.Literal('csv')
        ], { default: 'json' })),
      }),
    },
  }, async (request, reply) => {
    try {
      const { category, includeGlobal = false, format = 'json' } = request.query;
      const user = request.user;

      const where: any = {};

      if (user.roles.includes('super_admin') && includeGlobal) {
        // Include both tenant and global settings
        where.OR = [
          { tenantId: user.tenantId },
          { tenantId: null },
        ];
      } else {
        where.tenantId = user.tenantId;
      }

      if (category) where.category = category;

      const settings = await fastify.prisma.adminSetting.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' },
        ],
        select: {
          key: true,
          value: true,
          category: true,
          description: true,
          type: true,
          isPublic: true,
        },
      });

      const filename = `settings-export-${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
        
        const header = 'key,value,category,description,type,isPublic';
        const rows = settings.map(setting => 
          `"${setting.key}","${JSON.stringify(setting.value)}","${setting.category || ''}","${setting.description || ''}","${setting.type}","${setting.isPublic}"`
        );
        
        return reply.send([header, ...rows].join('\n'));
      } else {
        reply.header('Content-Type', 'application/json');
        reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
        return reply.send(JSON.stringify(settings, null, 2));
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_EXPORT_SETTINGS',
      });
    }
  });
};