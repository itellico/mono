import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';

/**
 * Tenant Industry Templates Management
 * Tier: tenant
 * Allows tenants to browse and select industry templates
 */
export const industry_templatesRoutes: FastifyPluginAsync = async (fastify) => {
  const { prisma } = fastify;
  
  // GET /api/v1/tenant/industry-templates - Get available industry templates
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.industry-templates.read')
    ],
    schema: {
      tags: ['tenant.industry-templates'],
      summary: 'Get available industry templates',
      description: 'Browse all available industry templates for tenant selection',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean())
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              features: Type.Any(),
              defaultConfig: Type.Any(),
              isActive: Type.Boolean(),
              isFeatured: Type.Boolean(),
              version: Type.String(),
              createdAt: Type.String({ format: 'date-time' }),
              updatedAt: Type.String({ format: 'date-time' })
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number()
            })
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20, search, category, featured } = request.query;
      const offset = (page - 1) * limit;
      
      const where: any = {
        isActive: true
      };
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (category) {
        where.category = category;
      }
      
      if (featured !== undefined) {
        where.isFeatured = featured;
      }
      
      const [templates, total] = await Promise.all([
        prisma.industryTemplate.findMany({
          where,
          orderBy: [
            { isFeatured: 'desc' },
            { name: 'asc' }
          ],
          skip: offset,
          take: limit
        }),
        prisma.industryTemplate.count({ where })
      ]);
      
      return {
        success: true,
        data: {
          templates,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching industry templates:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch industry templates'
      });
    }
  });

  // GET /api/v1/tenant/industry-templates/current - Get tenant's current industry template
  fastify.get('/current', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.industry-templates.read')
    ],
    schema: {
      tags: ['tenant.industry-templates'],
      summary: 'Get current industry template',
      description: 'Get the industry template currently selected by the tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Optional(Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              features: Type.Any(),
              defaultConfig: Type.Any(),
              version: Type.String(),
              subscription: Type.Object({
                id: Type.Number(),
                planId: Type.Number(),
                status: Type.String(),
                startDate: Type.String({ format: 'date-time' }),
                endDate: Type.Optional(Type.String({ format: 'date-time' }))
              })
            }))
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.code(403).send({
          success: false,
          error: 'TENANT_ACCESS_REQUIRED',
          message: 'Tenant access required'
        });
      }

      // Get tenant's current subscription with industry template
      const subscription = await prisma.tenantSubscription.findFirst({
        where: {
          tenantId: request.user.tenantId,
          status: 'active'
        },
        include: {
          plan: {
            include: {
              industryTemplate: true
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      const template = subscription?.plan?.industryTemplate || null;
      
      return {
        success: true,
        data: {
          template: template ? {
            ...template,
            subscription: {
              id: subscription.id,
              planId: subscription.planId,
              status: subscription.status,
              startDate: subscription.startDate.toISOString(),
              endDate: subscription.endDate?.toISOString() || null
            }
          } : null
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching current industry template:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch current industry template'
      });
    }
  });

  // GET /api/v1/tenant/industry-templates/:id - Get specific industry template
  fastify.get('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.industry-templates.read')
    ],
    schema: {
      tags: ['tenant.industry-templates'],
      summary: 'Get industry template details',
      description: 'Get detailed information about a specific industry template',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.Number({ minimum: 1 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              id: Type.Number(),
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              features: Type.Any(),
              defaultConfig: Type.Any(),
              isActive: Type.Boolean(),
              isFeatured: Type.Boolean(),
              version: Type.String(),
              createdAt: Type.String({ format: 'date-time' }),
              updatedAt: Type.String({ format: 'date-time' }),
              _count: Type.Object({
                subscriptionPlans: Type.Number()
              })
            })
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const template = await prisma.industryTemplate.findUnique({
        where: {
          id,
          isActive: true
        },
        include: {
          _count: {
            select: {
              subscriptionPlans: true
            }
          }
        }
      });

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
          message: 'Industry template not found'
        });
      }
      
      return {
        success: true,
        data: {
          template
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching industry template:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch industry template'
      });
    }
  });

  // GET /api/v1/tenant/industry-templates/categories - Get template categories
  fastify.get('/categories', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.industry-templates.read')
    ],
    schema: {
      tags: ['tenant.industry-templates'],
      summary: 'Get template categories',
      description: 'Get all available industry template categories',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(Type.Object({
              category: Type.String(),
              count: Type.Number()
            }))
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      const categories = await prisma.industryTemplate.groupBy({
        by: ['category'],
        where: {
          isActive: true
        },
        _count: {
          category: true
        },
        orderBy: {
          category: 'asc'
        }
      });
      
      return {
        success: true,
        data: {
          categories: categories.map(cat => ({
            category: cat.category,
            count: cat._count.category
          }))
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching template categories:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch template categories'
      });
    }
  });
};

export default industry_templatesRoutes;
