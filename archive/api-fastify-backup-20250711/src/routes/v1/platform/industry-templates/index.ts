import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { IndustryTemplateService } from '@/services/industry-template.service';

export const industryTemplatesRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize industry template service
  const industryTemplateService = new IndustryTemplateService(
    fastify.prisma,
    fastify.redis,
    fastify.log
  );

  // Search industry templates
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        industry: Type.Optional(Type.String()),
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        isActive: Type.Optional(Type.Boolean()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('name'),
          Type.Literal('industry'),
          Type.Literal('popularity'),
          Type.Literal('usageCount'),
          Type.Literal('createdAt'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              industry: Type.String(),
              complexity: Type.String(),
              setupTimeMinutes: Type.Number(),
              popularity: Type.Number(),
              usageCount: Type.Number(),
              isActive: Type.Boolean(),
              isDefault: Type.Boolean(),
              primaryColor: Type.Optional(Type.String()),
              secondaryColor: Type.Optional(Type.String()),
              accentColor: Type.Optional(Type.String()),
              createdAt: Type.String(),
              _count: Type.Object({
                tenants: Type.Number(),
              }),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const result = await industryTemplateService.searchIndustryTemplates(request.query);

    return {
      success: true,
      data: result,
    };
  });

  // Get popular templates
  fastify.get('/popular', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { limit = 10 } = request.query;
    const templates = await industryTemplateService.getPopularTemplates(limit);

    return {
      success: true,
      data: { templates },
    };
  });

  // Get template categories
  fastify.get('/categories', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(Type.Object({
              name: Type.String(),
              count: Type.Number(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const categories = await industryTemplateService.getTemplateCategories();

    return {
      success: true,
      data: { categories },
    };
  });

  // Get template statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalTemplates: Type.Number(),
            activeTemplates: Type.Number(),
            totalApplications: Type.Number(),
            categoryCounts: Type.Record(Type.String(), Type.Number()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const stats = await industryTemplateService.getTemplateStats();

    return {
      success: true,
      data: stats,
    };
  });

  // Create industry template
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:create')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 200 }),
        slug: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String()),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        industry: Type.String({ minLength: 1, maxLength: 100 }),
        isActive: Type.Optional(Type.Boolean()),
        isDefault: Type.Optional(Type.Boolean()),
        
        // Template configuration
        defaultSettings: Type.Optional(Type.Record(Type.String(), Type.Any())),
        defaultCategories: Type.Optional(Type.Array(Type.Any())),
        defaultTags: Type.Optional(Type.Array(Type.Any())),
        defaultRoles: Type.Optional(Type.Array(Type.Any())),
        defaultPermissions: Type.Optional(Type.Array(Type.Any())),
        defaultWorkflows: Type.Optional(Type.Array(Type.Any())),
        requiredFeatures: Type.Optional(Type.Array(Type.String())),
        recommendedFeatures: Type.Optional(Type.Array(Type.String())),
        
        // Branding and theming
        primaryColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        secondaryColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        accentColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        logoUrl: Type.Optional(Type.String({ format: 'uri' })),
        faviconUrl: Type.Optional(Type.String({ format: 'uri' })),
        customCss: Type.Optional(Type.String()),
        emailTemplates: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // Metadata
        targetUserTypes: Type.Optional(Type.Array(Type.String())),
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        setupTimeMinutes: Type.Optional(Type.Number({ minimum: 1 })),
        version: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const template = await industryTemplateService.createIndustryTemplate(request.body);

      return reply.code(201).send({
        success: true,
        data: {
          template: {
            uuid: template.uuid,
            name: template.name,
            slug: template.slug,
            createdAt: template.createdAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get industry template by UUID
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    const template = await industryTemplateService.getIndustryTemplate(uuid);

    if (!template) {
      return reply.code(404).send({
        success: false,
        error: 'INDUSTRY_TEMPLATE_NOT_FOUND',
      });
    }

    return {
      success: true,
      data: { template },
    };
  });

  // Update industry template
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:update')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        slug: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        industry: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        isActive: Type.Optional(Type.Boolean()),
        isDefault: Type.Optional(Type.Boolean()),
        
        // Template configuration
        defaultSettings: Type.Optional(Type.Record(Type.String(), Type.Any())),
        defaultCategories: Type.Optional(Type.Array(Type.Any())),
        defaultTags: Type.Optional(Type.Array(Type.Any())),
        defaultRoles: Type.Optional(Type.Array(Type.Any())),
        defaultPermissions: Type.Optional(Type.Array(Type.Any())),
        defaultWorkflows: Type.Optional(Type.Array(Type.Any())),
        requiredFeatures: Type.Optional(Type.Array(Type.String())),
        recommendedFeatures: Type.Optional(Type.Array(Type.String())),
        
        // Branding and theming
        primaryColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        secondaryColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        accentColor: Type.Optional(Type.String({ pattern: '^#[0-9A-F]{6}$' })),
        logoUrl: Type.Optional(Type.String({ format: 'uri' })),
        faviconUrl: Type.Optional(Type.String({ format: 'uri' })),
        customCss: Type.Optional(Type.String()),
        emailTemplates: Type.Optional(Type.Record(Type.String(), Type.Any())),
        
        // Metadata
        targetUserTypes: Type.Optional(Type.Array(Type.String())),
        complexity: Type.Optional(Type.Union([
          Type.Literal('simple'),
          Type.Literal('medium'),
          Type.Literal('advanced'),
        ])),
        setupTimeMinutes: Type.Optional(Type.Number({ minimum: 1 })),
        version: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Get template by UUID first
    const existingTemplate = await fastify.prisma.industryTemplate.findUnique({
      where: { uuid },
    });

    if (!existingTemplate) {
      return reply.code(404).send({
        success: false,
        error: 'INDUSTRY_TEMPLATE_NOT_FOUND',
      });
    }

    try {
      const template = await industryTemplateService.updateIndustryTemplate(
        existingTemplate.uuid as UUID,
        request.body
      );

      return {
        success: true,
        data: {
          template: {
            uuid: template.uuid,
            name: template.name,
            slug: template.slug,
            updatedAt: template.updatedAt.toISOString(),
          },
        },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Apply template to tenant
  fastify.post('/:uuid/apply', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:apply')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        tenantId: Type.Optional(Type.Number({ minimum: 1 })),
        customizations: Type.Optional(Type.Record(Type.String(), Type.Any())),
        skipExisting: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            application: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userTenantId = request.user!.tenantId;
    const requestedTenantId = request.body.tenantId;

    // Use user's tenant ID if not specified, or validate permission for other tenants
    const tenantId = requestedTenantId || userTenantId;
    
    if (requestedTenantId && requestedTenantId !== userTenantId) {
      // Check if user has permission to apply templates to other tenants
      const hasPermission = await fastify.checkPermission(request.user!, 'industry-templates:apply-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_APPLY_TEMPLATE_TO_OTHER_TENANTS',
        });
      }
    }

    // Get template by UUID first
    const template = await fastify.prisma.industryTemplate.findUnique({
      where: { uuid },
    });

    if (!template) {
      return reply.code(404).send({
        success: false,
        error: 'INDUSTRY_TEMPLATE_NOT_FOUND',
      });
    }

    try {
      const application = await industryTemplateService.applyIndustryTemplate({
        tenantId,
        templateId: template.uuid as UUID,
        customizations: request.body.customizations,
        skipExisting: request.body.skipExisting,
      });

      return {
        success: true,
        data: { application },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get tenant's applied templates
  fastify.get('/tenant/:tenantId', {
    preHandler: [fastify.authenticate, fastify.requirePermission('industry-templates:read')],
    schema: {
      tags: ['platform.industry-templates'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        tenantId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { tenantId } = request.params;
    const userTenantId = request.user!.tenantId;

    // Check if user has permission to view other tenants' templates
    if (tenantId !== userTenantId) {
      const hasPermission = await fastify.checkPermission(request.user!, 'industry-templates:read-any');
      if (!hasPermission) {
        return reply.code(403).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS_TO_VIEW_OTHER_TENANTS\' templates',
        });
      }
    }

    const templates = await industryTemplateService.getTenantTemplates(tenantId);

    return {
      success: true,
      data: { templates },
    };
  });
};