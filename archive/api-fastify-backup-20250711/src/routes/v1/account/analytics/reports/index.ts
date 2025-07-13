import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Analytics Reports Routes
 * Generate and manage analytical reports
 */
export const accountReportsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get available reports
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.read')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Get available reports',
      description: 'Get list of available report types and saved reports',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        type: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            reportTypes: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              description: Type.String(),
              category: Type.String(),
              parameters: Type.Array(Type.Object({
                name: Type.String(),
                type: Type.String(),
                required: Type.Boolean(),
                default: Type.Optional(Type.Any()),
              })),
            })),
            savedReports: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              type: Type.String(),
              schedule: Type.Optional(Type.String()),
              lastRunAt: Type.Optional(Type.String()),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
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
      const { page = 1, limit = 20, type } = request.query;
      const offset = (page - 1) * limit;

      try {
        // Define available report types
        const reportTypes = [
          {
            id: 'user-activity',
            name: 'User Activity Report',
            description: 'Detailed user activity and engagement metrics',
            category: 'users',
            parameters: [
              { name: 'startDate', type: 'date', required: true },
              { name: 'endDate', type: 'date', required: true },
              { name: 'groupBy', type: 'select', required: false, default: 'day' },
            ],
          },
          {
            id: 'content-performance',
            name: 'Content Performance Report',
            description: 'Content views, engagement, and performance metrics',
            category: 'content',
            parameters: [
              { name: 'startDate', type: 'date', required: true },
              { name: 'endDate', type: 'date', required: true },
              { name: 'contentType', type: 'select', required: false },
            ],
          },
          {
            id: 'revenue-analysis',
            name: 'Revenue Analysis Report',
            description: 'Revenue trends, payment methods, and financial metrics',
            category: 'billing',
            parameters: [
              { name: 'startDate', type: 'date', required: true },
              { name: 'endDate', type: 'date', required: true },
              { name: 'breakdown', type: 'select', required: false, default: 'monthly' },
            ],
          },
          {
            id: 'conversion-funnel',
            name: 'Conversion Funnel Report',
            description: 'User journey and conversion analysis',
            category: 'marketing',
            parameters: [
              { name: 'startDate', type: 'date', required: true },
              { name: 'endDate', type: 'date', required: true },
              { name: 'funnelSteps', type: 'array', required: true },
            ],
          },
          {
            id: 'api-usage',
            name: 'API Usage Report',
            description: 'API endpoint usage, performance, and error rates',
            category: 'technical',
            parameters: [
              { name: 'startDate', type: 'date', required: true },
              { name: 'endDate', type: 'date', required: true },
              { name: 'apiKey', type: 'select', required: false },
            ],
          },
        ];

        const where: any = {
          accountId: request.user!.accountId,
        };

        if (type) {
          where.type = type;
        }

        const [savedReports, total] = await Promise.all([
          fastify.prisma.report.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          fastify.prisma.report.count({ where }),
        ]);

        return {
          success: true,
          data: {
            reportTypes: type 
              ? reportTypes.filter(rt => rt.id === type)
              : reportTypes,
            savedReports: savedReports.map(report => ({
              uuid: report.uuid,
              name: report.name,
              type: report.type,
              schedule: report.schedule,
              lastRunAt: report.lastRunAt?.toISOString(),
              createdBy: report.createdBy,
              createdAt: report.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get reports');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_REPORTS',
        });
      }
    },
  });

  // Generate report
  fastify.post('/generate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.create')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Generate report',
      description: 'Generate a new analytics report',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        type: Type.String(),
        name: Type.Optional(Type.String()),
        parameters: Type.Object({}, { additionalProperties: true }),
        save: Type.Optional(Type.Boolean({ default: false })),
        schedule: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            reportId: Type.Optional(Type.String()),
            data: Type.Any(),
            metadata: Type.Object({
              generatedAt: Type.String(),
              executionTime: Type.Number(),
              rowCount: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { type, name, parameters, save, schedule } = request.body;

      try {
        const startTime = Date.now();
        let reportData: any;
        let rowCount = 0;

        // Generate report based on type
        switch (type) {
          case 'user-activity':
            reportData = await generateUserActivityReport(
              fastify,
              request.user!.accountId,
              parameters
            );
            rowCount = reportData.users?.length || 0;
            break;

          case 'content-performance':
            reportData = await generateContentPerformanceReport(
              fastify,
              request.user!.accountId,
              parameters
            );
            rowCount = reportData.content?.length || 0;
            break;

          case 'revenue-analysis':
            reportData = await generateRevenueAnalysisReport(
              fastify,
              request.user!.accountId,
              parameters
            );
            rowCount = reportData.transactions?.length || 0;
            break;

          case 'conversion-funnel':
            reportData = await generateConversionFunnelReport(
              fastify,
              request.user!.accountId,
              parameters
            );
            rowCount = reportData.steps?.length || 0;
            break;

          case 'api-usage':
            reportData = await generateAPIUsageReport(
              fastify,
              request.user!.accountId,
              parameters
            );
            rowCount = reportData.endpoints?.length || 0;
            break;

          default:
            return reply.status(400).send({
              success: false,
              error: 'UNKNOWN_REPORT_TYPE:_${TYPE}',
            });
        }

        const executionTime = Date.now() - startTime;

        // Save report if requested
        let savedReport;
        if (save) {
          savedReport = await fastify.prisma.report.create({
            data: {
              name: name || `${type} Report - ${new Date().toLocaleDateString()}`,
              type,
              parameters,
              schedule,
              data: reportData,
              lastRunAt: new Date(),
              accountId: request.user!.accountId,
              createdById: request.user!.id,
            },
          });
        }

        return {
          success: true,
          data: {
            reportId: savedReport?.uuid,
            data: reportData,
            metadata: {
              generatedAt: new Date().toISOString(),
              executionTime,
              rowCount,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to generate report');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GENERATE_REPORT',
        });
      }
    },
  });

  // Get report details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.read')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Get report details',
      description: 'Get details of a saved report',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            report: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              type: Type.String(),
              parameters: Type.Object({}, { additionalProperties: true }),
              schedule: Type.Optional(Type.String()),
              data: Type.Any(),
              lastRunAt: Type.String(),
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
        const report = await fastify.prisma.report.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'REPORT_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            report: {
              uuid: report.uuid,
              name: report.name,
              type: report.type,
              parameters: report.parameters,
              schedule: report.schedule,
              data: report.data,
              lastRunAt: report.lastRunAt!.toISOString(),
              createdBy: report.createdBy,
              createdAt: report.createdAt.toISOString(),
              updatedAt: report.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get report details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_REPORT_DETAILS',
        });
      }
    },
  });

  // Update report
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.update')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Update report',
      description: 'Update a saved report configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        parameters: Type.Optional(Type.Object({}, { additionalProperties: true })),
        schedule: Type.Optional(Type.Union([Type.String(), Type.Null()])),
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
      const updates = request.body;

      try {
        const report = await fastify.prisma.report.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'REPORT_NOT_FOUND',
          });
        }

        await fastify.prisma.report.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Report updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update report');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_REPORT',
        });
      }
    },
  });

  // Run report
  fastify.post('/:uuid/run', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.execute')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Run report',
      description: 'Run a saved report with current data',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            data: Type.Any(),
            metadata: Type.Object({
              generatedAt: Type.String(),
              executionTime: Type.Number(),
              rowCount: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const report = await fastify.prisma.report.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'REPORT_NOT_FOUND',
          });
        }

        const startTime = Date.now();
        let reportData: any;
        let rowCount = 0;

        // Generate report based on saved configuration
        switch (report.type) {
          case 'user-activity':
            reportData = await generateUserActivityReport(
              fastify,
              request.user!.accountId,
              report.parameters as any
            );
            rowCount = reportData.users?.length || 0;
            break;

          case 'content-performance':
            reportData = await generateContentPerformanceReport(
              fastify,
              request.user!.accountId,
              report.parameters as any
            );
            rowCount = reportData.content?.length || 0;
            break;

          case 'revenue-analysis':
            reportData = await generateRevenueAnalysisReport(
              fastify,
              request.user!.accountId,
              report.parameters as any
            );
            rowCount = reportData.transactions?.length || 0;
            break;

          case 'conversion-funnel':
            reportData = await generateConversionFunnelReport(
              fastify,
              request.user!.accountId,
              report.parameters as any
            );
            rowCount = reportData.steps?.length || 0;
            break;

          case 'api-usage':
            reportData = await generateAPIUsageReport(
              fastify,
              request.user!.accountId,
              report.parameters as any
            );
            rowCount = reportData.endpoints?.length || 0;
            break;

          default:
            throw new Error(`Unknown report type: ${report.type}`);
        }

        const executionTime = Date.now() - startTime;

        // Update last run time
        await fastify.prisma.report.update({
          where: { tenantId: request.user.tenantId },
          data: {
            lastRunAt: new Date(),
            data: reportData,
          },
        });

        return {
          success: true,
          data: {
            data: reportData,
            metadata: {
              generatedAt: new Date().toISOString(),
              executionTime,
              rowCount,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to run report');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_RUN_REPORT',
        });
      }
    },
  });

  // Delete report
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.delete')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Delete report',
      description: 'Delete a saved report',
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
        const report = await fastify.prisma.report.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'REPORT_NOT_FOUND',
          });
        }

        await fastify.prisma.report.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Report deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete report');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_REPORT',
        });
      }
    },
  });

  // Export report
  fastify.get('/:uuid/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.export')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Export report',
      description: 'Export report data in various formats',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        format: Type.Union([
          Type.Literal('csv'),
          Type.Literal('json'),
          Type.Literal('pdf'),
          Type.Literal('excel'),
        ]),
      }),
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { format } = request.query;

      try {
        const report = await fastify.prisma.report.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!report) {
          return reply.status(404).send({
            success: false,
            error: 'REPORT_NOT_FOUND',
          });
        }

        switch (format) {
          case 'json':
            reply.header('Content-Type', 'application/json');
            reply.header('Content-Disposition', `attachment; filename="${report.name}.json"`);
            return report.data;

          case 'csv':
            const csv = generateCSVFromReportData(report.data as any, report.type);
            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename="${report.name}.csv"`);
            return csv;

          case 'pdf':
            // TODO: Implement PDF generation
            return reply.status(501).send({
              success: false,
              error: 'PDF_EXPORT_NOT_YET_IMPLEMENTED',
            });

          case 'excel':
            // TODO: Implement Excel generation
            return reply.status(501).send({
              success: false,
              error: 'EXCEL_EXPORT_NOT_YET_IMPLEMENTED',
            });

          default:
            return reply.status(400).send({
              success: false,
              error: 'INVALID_EXPORT_FORMAT',
            });
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to export report');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXPORT_REPORT',
        });
      }
    },
  });
};

// Report generation functions
async function generateUserActivityReport(fastify: any, accountId: number, parameters: any) {
  const { startDate, endDate, groupBy = 'day' } = parameters;
  
  const users = await fastify.prisma.user.findMany({
    where: { tenantId: request.user.tenantId, accountId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate), },
    },
    include: {
      _count: {
        select: {
          sessions: {
            where: { tenantId: request.user.tenantId, createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate), },
            },
          },
          pageViews: {
            where: { tenantId: request.user.tenantId, createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate), },
            },
          },
        },
      },
    },
  });

  return {
    summary: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u._count.sessions > 0).length,
      averageSessionsPerUser: users.reduce((sum, u) => sum + u._count.sessions, 0) / users.length,
    },
    users: users.map(user => ({
      name: user.name,
      email: user.email,
      signupDate: user.createdAt.toISOString(),
      sessions: user._count.sessions,
      pageViews: user._count.pageViews,
      lastActive: user.lastLoginAt?.toISOString(),
    })),
  };
}

async function generateContentPerformanceReport(fastify: any, accountId: number, parameters: any) {
  const { startDate, endDate, contentType } = parameters;
  
  const where: any = {
    accountId,
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  if (contentType) {
    where.type = contentType;
  }

  const content = await fastify.prisma.content.findMany({
    where,
    include: {
      _count: {
        select: {
          views: true,
          likes: true,
          comments: true,
        },
      },
    },
  });

  return {
    summary: {
      totalContent: content.length,
      totalViews: content.reduce((sum, c) => sum + c._count.views, 0),
      totalEngagement: content.reduce((sum, c) => sum + c._count.likes + c._count.comments, 0),
    },
    content: content.map(c => ({
      title: c.title,
      type: c.type,
      status: c.status,
      publishedAt: c.publishedAt?.toISOString(),
      views: c._count.views,
      likes: c._count.likes,
      comments: c._count.comments,
      engagementRate: c._count.views > 0 
        ? ((c._count.likes + c._count.comments) / c._count.views) * 100 
        : 0,
    })),
  };
}

async function generateRevenueAnalysisReport(fastify: any, accountId: number, parameters: any) {
  const { startDate, endDate, breakdown = 'monthly' } = parameters;
  
  const payments = await fastify.prisma.payment.findMany({
    where: { tenantId: request.user.tenantId, accountId,
      status: 'completed',
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate), },
    },
    include: {
      paymentMethod: {
        select: {
          type: true,
          brand: true,
        },
      },
    },
  });

  return {
    summary: {
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      transactionCount: payments.length,
      averageTransactionValue: payments.length > 0 
        ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
        : 0,
    },
    transactions: payments.map(p => ({
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      paymentMethod: `${p.paymentMethod.type} ${p.paymentMethod.brand || ''}`.trim(),
      date: p.createdAt.toISOString(),
    })),
    byPaymentMethod: Object.entries(
      payments.reduce((acc, p) => {
        const method = p.paymentMethod.type;
        if (!acc[method]) acc[method] = { count: 0, amount: 0 };
        acc[method].count++;
        acc[method].amount += p.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    ).map(([method, data]) => ({ method, ...data })),
  };
}

async function generateConversionFunnelReport(fastify: any, accountId: number, parameters: any) {
  const { startDate, endDate, funnelSteps } = parameters;
  
  // Mock conversion funnel data
  const steps = funnelSteps.map((step: string, index: number) => {
    const users = Math.floor(1000 * Math.pow(0.7, index)); // 30% drop-off per step
    return {
      step,
      users,
      conversionRate: index === 0 ? 100 : (users / (1000 * Math.pow(0.7, index - 1))) * 100,
    };
  });

  return {
    summary: {
      totalEntries: steps[0]?.users || 0,
      totalConversions: steps[steps.length - 1]?.users || 0,
      overallConversionRate: steps[0]?.users > 0 
        ? (steps[steps.length - 1]?.users / steps[0]?.users) * 100 
        : 0,
    },
    steps,
  };
}

async function generateAPIUsageReport(fastify: any, accountId: number, parameters: any) {
  const { startDate, endDate, apiKey } = parameters;
  
  const where: any = {
    apiKey: {
      accountId,
    },
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };

  if (apiKey) {
    where.apiKeyId = apiKey;
  }

  const usage = await fastify.prisma.apiKeyUsage.findMany({
    where,
    include: {
      apiKey: {
        select: {
          name: true,
        },
      },
    },
  });

  const endpointStats = usage.reduce((acc, u) => {
    const key = `${u.method} ${u.endpoint}`;
    if (!acc[key]) {
      acc[key] = {
        endpoint: u.endpoint,
        method: u.method,
        count: 0,
        totalResponseTime: 0,
        errors: 0,
      };
    }
    acc[key].count++;
    acc[key].totalResponseTime += u.responseTime || 0;
    if (u.statusCode >= 400) acc[key].errors++;
    return acc;
  }, {} as Record<string, any>);

  return {
    summary: {
      totalRequests: usage.length,
      uniqueEndpoints: Object.keys(endpointStats).length,
      errorRate: usage.filter(u => u.statusCode >= 400).length / usage.length * 100,
      averageResponseTime: usage.reduce((sum, u) => sum + (u.responseTime || 0), 0) / usage.length,
    },
    endpoints: Object.values(endpointStats).map((stat: any) => ({
      ...stat,
      averageResponseTime: stat.totalResponseTime / stat.count,
      errorRate: (stat.errors / stat.count) * 100,
    })),
  };
}

function generateCSVFromReportData(data: any, reportType: string): string {
  let rows: any[] = [];
  
  switch (reportType) {
    case 'user-activity':
      rows = data.users || [];
      break;
    case 'content-performance':
      rows = data.content || [];
      break;
    case 'revenue-analysis':
      rows = data.transactions || [];
      break;
    case 'conversion-funnel':
      rows = data.steps || [];
      break;
    case 'api-usage':
      rows = data.endpoints || [];
      break;
  }

  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}