import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Billing Invoices Routes
 * Manage billing invoices
 */
export const accountInvoicesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get invoices
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Get invoices',
      description: 'Get all invoices for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            invoices: Type.Array(Type.Object({
              uuid: uuidSchema,
              invoiceNumber: Type.String(),
              status: Type.String(),
              dueDate: Type.String(),
              subtotal: Type.Number(),
              tax: Type.Number(),
              total: Type.Number(),
              currency: Type.String(),
              lineItems: Type.Array(Type.Object({
                description: Type.String(),
                quantity: Type.Number(),
                unitPrice: Type.Number(),
                amount: Type.Number(),
              })),
              paidAt: Type.Optional(Type.String()),
              paymentMethod: Type.Optional(Type.Object({
                type: Type.String(),
                last4: Type.String(),
                brand: Type.Optional(Type.String()),
              })),
              downloadUrl: Type.String(),
              createdAt: Type.String(),
            })),
            summary: Type.Object({
              totalAmount: Type.Number(),
              totalPatotalDue: Type.Number(),
              currency: Type.String(),
            }),
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
      const { page = 1, limit = 20, status, startDate, endDate } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (status) {
          where.status = status;
        }

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const [invoices, total, summary] = await Promise.all([
          fastify.prisma.invoice.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              paymentMethod: {
                select: {
                  type: true,
                  last4: true,
                  brand: true,
                },
              },
            },
          }),
          fastify.prisma.invoice.count({ where }),
          fastify.prisma.invoice.aggregate({
            where,
            _sum: {
              total: true,
            },
          }),
        ]);

        const paidSummary = await fastify.prisma.invoice.aggregate({
          where: { tenantId: request.user.tenantId, ...where,
            status: 'paid', },
          _sum: {
            total: true,
          },
        });

        const totalAmount = summary._sum.total || 0;
        const totalPaid = paidSummary._sum.total || 0;
        const totalDue = totalAmount - totalPaid;

        return {
          success: true,
          data: {
            invoices: invoices.map(invoice => ({
              uuid: invoice.uuid,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              dueDate: invoice.dueDate.toISOString(),
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              total: invoice.total,
              currency: invoice.currency,
              lineItems: invoice.lineItems as any,
              paidAt: invoice.paidAt?.toISOString(),
              paymentMethod: invoice.paymentMethod,
              downloadUrl: `/api/v1/account/billing/invoices/${invoice.uuid}/download`,
              createdAt: invoice.createdAt.toISOString(),
            })),
            summary: {
              totalAmount,
              totalPaid,
              totalDue,
              currency: invoices[0]?.currency || 'USD',
            },
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get invoices');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_INVOICES',
        });
      }
    },
  });

  // Get invoice details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Get invoice details',
      description: 'Get detailed information about a specific invoice',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            invoice: Type.Object({
              uuid: uuidSchema,
              invoiceNumber: Type.String(),
              status: Type.String(),
              issueDate: Type.String(),
              dueDate: Type.String(),
              billingPeriod: Type.Object({
                start: Type.String(),
                end: Type.String(),
              }),
              billTo: Type.Object({
                name: Type.String(),
                email: Type.String(),
                address: Type.Optional(Type.Object({
                  line1: Type.String(),
                  line2: Type.Optional(Type.String()),
                  city: Type.String(),
                  state: Type.Optional(Type.String()),
                  postalCode: Type.String(),
                  country: Type.String(),
                })),
                taxId: Type.Optional(Type.String()),
              }),
              lineItems: Type.Array(Type.Object({
                description: Type.String(),
                quantity: Type.Number(),
                unitPrice: Type.Number(),
                amount: Type.Number(),
                taxRate: Type.Number(),
                taxAmount: Type.Number(),
              })),
              subtotal: Type.Number(),
              taxBreakdown: Type.Array(Type.Object({
                name: Type.String(),
                rate: Type.Number(),
                amount: Type.Number(),
              })),
              tax: Type.Number(),
              total: Type.Number(),
              currency: Type.String(),
              paymentTerms: Type.String(),
              notes: Type.Optional(Type.String()),
              paidAt: Type.Optional(Type.String()),
              paymentMethod: Type.Optional(Type.Object({
                type: Type.String(),
                last4: Type.String(),
                brand: Type.Optional(Type.String()),
                transactionId: Type.Optional(Type.String()),
              })),
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
        const invoice = await fastify.prisma.invoice.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            account: {
              select: {
                name: true,
                billingEmail: true,
                billingAddress: true,
                taxId: true,
              },
            },
            subscription: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            paymentMethod: {
              select: {
                type: true,
                last4: true,
                brand: true,
              },
            },
          },
        });

        if (!invoice) {
          return reply.status(404).send({
            success: false,
            error: 'INVOICE_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            invoice: {
              uuid: invoice.uuid,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              issueDate: invoice.createdAt.toISOString(),
              dueDate: invoice.dueDate.toISOString(),
              billingPeriod: invoice.billingPeriod as any,
              billTo: {
                name: invoice.account.name,
                email: invoice.account.billingEmail || '',
                address: invoice.account.billingAddress as any,
                taxId: invoice.account.taxId,
              },
              lineItems: invoice.lineItems as any,
              subtotal: invoice.subtotal,
              taxBreakdown: invoice.taxBreakdown as any || [],
              tax: invoice.tax,
              total: invoice.total,
              currency: invoice.currency,
              paymentTerms: invoice.paymentTerms || 'Due on receipt',
              notes: invoice.notes,
              paidAt: invoice.paidAt?.toISOString(),
              paymentMethod: invoice.paymentMethod ? {
                ...invoice.paymentMethod,
                transactionId: invoice.metadata?.transactionId,
              } : undefined,
              createdAt: invoice.createdAt.toISOString(),
              updatedAt: invoice.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get invoice details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_INVOICE_DETAILS',
        });
      }
    },
  });

  // Download invoice
  fastify.get('/:uuid/download', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Download invoice',
      description: 'Download invoice as PDF',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const invoice = await fastify.prisma.invoice.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            account: {
              select: {
                name: true,
                billingEmail: true,
                billingAddress: true,
                taxId: true,
              },
            },
          },
        });

        if (!invoice) {
          return reply.status(404).send({
            success: false,
            error: 'INVOICE_NOT_FOUND',
          });
        }

        // TODO: Generate actual PDF
        // For now, return a simple HTML representation
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
              .invoice-details { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Invoice ${invoice.invoiceNumber}</h1>
              <p>Date: ${invoice.createdAt.toLocaleDateString()}</p>
              <p>Due Date: ${invoice.dueDate.toLocaleDateString()}</p>
              <p>Status: ${invoice.status.toUpperCase()}</p>
            </div>
            
            <div class="invoice-details">
              <h3>Bill To:</h3>
              <p>${invoice.account.name}<br>
              ${invoice.account.billingEmail}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.lineItems as any[]).map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${invoice.currency} ${item.unitPrice.toFixed(2)}</td>
                    <td>${invoice.currency} ${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3">Subtotal</td>
                  <td>${invoice.currency} ${invoice.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3">Tax</td>
                  <td>${invoice.currency} ${invoice.tax.toFixed(2)}</td>
                </tr>
                <tr class="total">
                  <td colspan="3">Total</td>
                  <td>${invoice.currency} ${invoice.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </body>
          </html>
        `;

        reply.header('Content-Type', 'text/html');
        reply.header('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.html"`);
        return html;
      } catch (error) {
        request.log.error({ error }, 'Failed to download invoice');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DOWNLOAD_INVOICE',
        });
      }
    },
  });

  // Pay invoice
  fastify.post('/:uuid/pay', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Pay invoice',
      description: 'Pay an outstanding invoice',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        paymentMethodId: Type.Number(),
        amount: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            transactionId: Type.String(),
            paidAmount: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { paymentMethodId, amount } = request.body;

      try {
        const invoice = await fastify.prisma.invoice.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            status: { in: ['draft', 'sent', 'overdue'] },
          },
        });

        if (!invoice) {
          return reply.status(404).send({
            success: false,
            error: 'PAYABLE_INVOICE_NOT_FOUND',
          });
        }

        const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
          where: { tenantId: request.user.tenantId, id: paymentMethodId,
            accountId: request.user!.accountId, },
        });

        if (!paymentMethod) {
          return reply.status(404).send({
            success: false,
            error: 'PAYMENT_METHOD_NOT_FOUND',
          });
        }

        const payAmount = amount || invoice.total;
        
        if (payAmount > invoice.total) {
          return reply.status(400).send({
            success: false,
            error: 'PAYMENT_AMOUNT_EXCEEDS_INVOICE_TOTAL',
          });
        }

        // TODO: Process actual payment through payment provider
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Update invoice
        await fastify.prisma.invoice.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: payAmount === invoice.total ? 'paid' : 'partial',
            paidAmount: payAmount,
            paidAt: payAmount === invoice.total ? new Date() : undefined,
            paymentMethodId: paymentMethod.uuid as UUID,
            metadata: {
              ...invoice.metadata,
              transactionId,
              paymentDetails: {
                method: paymentMethod.type,
                last4: paymentMethod.last4,
                processedAt: new Date().toISOString(),
              },
            },
          },
        });

        // Create payment record
        await fastify.prisma.payment.create({
          data: {
            accountId: request.user!.accountId,
            invoiceId: invoice.uuid as UUID,
            amount: payAmount,
            currency: invoice.currency,
            status: 'completed',
            paymentMethodId: paymentMethod.uuid as UUID,
            transactionId,
            processedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: payAmount === invoice.total ? 'Invoice paid successfully' : 'Partial payment recorded',
            transactionId,
            paidAmount: payAmount,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to pay invoice');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_PAY_INVOICE',
        });
      }
    },
  });

  // Send invoice reminder
  fastify.post('/:uuid/remind', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Send invoice reminder',
      description: 'Send a payment reminder for an invoice',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        message: Type.Optional(Type.String()),
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
      const { message } = request.body;

      try {
        const invoice = await fastify.prisma.invoice.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            status: { in: ['sent', 'overdue'] },
          },
          include: {
            account: {
              select: {
                billingEmail: true,
                name: true,
              },
            },
          },
        });

        if (!invoice) {
          return reply.status(404).send({
            success: false,
            error: 'INVOICE_NOT_FOUND_OR_ALREADY_PAID',
          });
        }

        // TODO: Send actual email reminder
        request.log.info({
          invoiceId: invoice.uuid as UUID,
          email: invoice.account.billingEmail,
          message,
        }, 'Sending invoice reminder');

        // Update invoice metadata
        await fastify.prisma.invoice.update({
          where: { tenantId: request.user.tenantId },
          data: {
            metadata: {
              ...invoice.metadata,
              lastReminderSent: new Date().toISOString(),
              reminderCount: ((invoice.metadata as any)?.reminderCount || 0) + 1,
            },
          },
        });

        return {
          success: true,
          data: {
            message: 'Invoice reminder sent successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to send invoice reminder');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SEND_INVOICE_REMINDER',
        });
      }
    },
  });
};