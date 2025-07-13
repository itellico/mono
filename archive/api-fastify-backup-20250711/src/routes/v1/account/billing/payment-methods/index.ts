import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Billing Payment Methods Routes
 * Manage payment methods
 */
export const accountPaymentMethodsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get payment methods
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Get payment methods',
      description: 'Get all payment methods for the account',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            paymentMethods: Type.Array(Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
              last4: Type.String(),
              brand: Type.Optional(Type.String()),
              expiryMonth: Type.Optional(Type.Number()),
              expiryYear: Type.Optional(Type.Number()),
              holderName: Type.Optional(Type.String()),
              isDefault: Type.Boolean(),
              isExpired: Type.Boolean(),
              billingAddress: Type.Optional(Type.Object({
                line1: Type.String(),
                line2: Type.Optional(Type.String()),
                city: Type.String(),
                state: Type.Optional(Type.String()),
                postalCode: Type.String(),
                country: Type.String(),
              })),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const paymentMethods = await fastify.prisma.paymentMethod.findMany({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            deletedAt: null, },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        return {
          success: true,
          data: {
            paymentMethods: paymentMethods.map(pm => {
              const isExpired = pm.expiryYear && pm.expiryMonth
                ? pm.expiryYear < currentYear || (pm.expiryYear === currentYear && pm.expiryMonth < currentMonth)
                : false;

              return {
                uuid: pm.uuid,
                type: pm.type,
                last4: pm.last4,
                brand: pm.brand,
                expiryMonth: pm.expiryMonth,
                expiryYear: pm.expiryYear,
                holderName: pm.holderName,
                isDefault: pm.isDefault,
                isExpired,
                billingAddress: pm.billingAddress as any,
                createdAt: pm.createdAt.toISOString(),
                updatedAt: pm.updatedAt.toISOString(),
              };
            }),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get payment methods');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PAYMENT_METHODS',
        });
      }
    },
  });

  // Add payment method
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.create')],
    schema: {
      tags: ['account.billing'],
      summary: 'Add payment method',
      description: 'Add a new payment method',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        type: Type.Union([Type.Literal('card'), Type.Literal('bank_account')]),
        token: Type.String(),
        holderName: Type.Optional(Type.String()),
        billingAddress: Type.Optional(Type.Object({
          line1: Type.String(),
          line2: Type.Optional(Type.String()),
          city: Type.String(),
          state: Type.Optional(Type.String()),
          postalCode: Type.String(),
          country: Type.String(),
        })),
        setAsDefault: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            paymentMethod: Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
              last4: Type.String(),
              brand: Type.Optional(Type.String()),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { type, token, holderName, billingAddress, setAsDefault } = request.body;

      try {
        // TODO: Process token with payment provider (Stripe, etc.)
        // This is mock data - in production, get this from payment provider
        const paymentDetails = {
          last4: '4242',
          brand: type === 'card' ? 'Visa' : undefined,
          expiryMonth: type === 'card' ? 12 : undefined,
          expiryYear: type === 'card' ? 2025 : undefined,
          providerCustomerId: `cus_${Date.now()}`,
          providerPaymentMethodId: `pm_${Date.now()}`,
        };

        // If setting as default, unset current default
        if (setAsDefault) {
          await fastify.prisma.paymentMethod.updateMany({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              isDefault: true, },
            data: {
              isDefault: false,
            },
          });
        }

        // Check if this is the first payment method
        const existingCount = await fastify.prisma.paymentMethod.count({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            deletedAt: null, },
        });

        const paymentMethod = await fastify.prisma.paymentMethod.create({
          data: {
            type,
            last4: paymentDetails.last4,
            brand: paymentDetails.brand,
            expiryMonth: paymentDetails.expiryMonth,
            expiryYear: paymentDetails.expiryYear,
            holderName,
            billingAddress,
            isDefault: setAsDefault || existingCount === 0,
            metadata: {
              providerCustomerId: paymentDetails.providerCustomerId,
              providerPaymentMethodId: paymentDetails.providerPaymentMethodId,
            },
            accountId: request.user!.accountId,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            paymentMethod: {
              uuid: paymentMethod.uuid,
              type: paymentMethod.type,
              last4: paymentMethod.last4,
              brand: paymentMethod.brand,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to add payment method');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_ADD_PAYMENT_METHOD',
        });
      }
    },
  });

  // Update payment method
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Update payment method',
      description: 'Update payment method details',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        holderName: Type.Optional(Type.String()),
        billingAddress: Type.Optional(Type.Object({
          line1: Type.String(),
          line2: Type.Optional(Type.String()),
          city: Type.String(),
          state: Type.Optional(Type.String()),
          postalCode: Type.String(),
          country: Type.String(),
        })),
        expiryMonth: Type.Optional(Type.Number({ minimum: 1, maximum: 12 })),
        expiryYear: Type.Optional(Type.Number({ minimum: new Date().getFullYear() })),
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
        const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            deletedAt: null, },
        });

        if (!paymentMethod) {
          return reply.status(404).send({
            success: false,
            error: 'PAYMENT_METHOD_NOT_FOUND',
          });
        }

        // Only allow updating certain fields
        const allowedUpdates: any = {};
        
        if (updates.holderName !== undefined) {
          allowedUpdates.holderName = updates.holderName;
        }
        
        if (updates.billingAddress !== undefined) {
          allowedUpdates.billingAddress = updates.billingAddress;
        }
        
        // Only allow updating expiry for cards
        if (paymentMethod.type === 'card') {
          if (updates.expiryMonth !== undefined) {
            allowedUpdates.expiryMonth = updates.expiryMonth;
          }
          
          if (updates.expiryYear !== undefined) {
            allowedUpdates.expiryYear = updates.expiryYear;
          }
        }

        await fastify.prisma.paymentMethod.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...allowedUpdates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Payment method updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update payment method');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_PAYMENT_METHOD',
        });
      }
    },
  });

  // Set default payment method
  fastify.put('/:uuid/default', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Set default payment method',
      description: 'Set a payment method as default',
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
        const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            deletedAt: null, },
        });

        if (!paymentMethod) {
          return reply.status(404).send({
            success: false,
            error: 'PAYMENT_METHOD_NOT_FOUND',
          });
        }

        // Unset current default
        await fastify.prisma.paymentMethod.updateMany({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            isDefault: true,
            id: { not: paymentMethod.uuid as UUID },
          },
          data: {
            isDefault: false,
          },
        });

        // Set new default
        await fastify.prisma.paymentMethod.update({
          where: { tenantId: request.user.tenantId },
          data: {
            isDefault: true,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Default payment method updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to set default payment method');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SET_DEFAULT_PAYMENT_METHOD',
        });
      }
    },
  });

  // Delete payment method
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.delete')],
    schema: {
      tags: ['account.billing'],
      summary: 'Delete payment method',
      description: 'Remove a payment method',
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
        const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            deletedAt: null, },
        });

        if (!paymentMethod) {
          return reply.status(404).send({
            success: false,
            error: 'PAYMENT_METHOD_NOT_FOUND',
          });
        }

        // Check if it's being used by active subscription
        const activeSubscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            paymentMethodId: paymentMethod.uuid as UUID,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (activeSubscription) {
          return reply.status(400).send({
            success: false,
            error: 'CANNOT_DELETE_PAYMENT_METHOD_USED_BY_ACTIVE_SUBSCRIPTION',
          });
        }

        // Check if it's the only payment method
        const otherMethods = await fastify.prisma.paymentMethod.count({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            id: { not: paymentMethod.uuid as UUID },
            deletedAt: null,
          },
        });

        if (otherMethods === 0) {
          return reply.status(400).send({
            success: false,
            error: 'CANNOT_DELETE_THE_ONLY_PAYMENT_METHOD',
          });
        }

        // Soft delete
        await fastify.prisma.paymentMethod.update({
          where: { tenantId: request.user.tenantId },
          data: {
            deletedAt: new Date(),
            isDefault: false,
          },
        });

        // If it was default, set another as default
        if (paymentMethod.isDefault) {
          const nextDefault = await fastify.prisma.paymentMethod.findFirst({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              deletedAt: null, },
            orderBy: { createdAt: 'desc' },
          });

          if (nextDefault) {
            await fastify.prisma.paymentMethod.update({
              where: { tenantId: request.user.tenantId },
              data: { isDefault: true },
            });
          }
        }

        // TODO: Delete from payment provider

        return {
          success: true,
          data: {
            message: 'Payment method deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete payment method');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_PAYMENT_METHOD',
        });
      }
    },
  });

  // Verify payment method
  fastify.post('/:uuid/verify', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Verify payment method',
      description: 'Verify a payment method with micro-deposits',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        amounts: Type.Array(Type.Number(), { minItems: 2, maxItems: 2 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            verified: Type.Boolean(),
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { amounts } = request.body;

      try {
        const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            type: 'bank_account',
            deletedAt: null, },
        });

        if (!paymentMethod) {
          return reply.status(404).send({
            success: false,
            error: 'BANK_ACCOUNT_NOT_FOUND',
          });
        }

        // TODO: Verify with payment provider
        // For now, simulate verification
        const isVerified = amounts[0] === 0.32 && amounts[1] === 0.45;

        if (isVerified) {
          await fastify.prisma.paymentMethod.update({
            where: { tenantId: request.user.tenantId },
            data: {
              metadata: {
                ...paymentMethod.metadata,
                verified: true,
                verifiedAt: new Date().toISOString(),
              },
            },
          });
        }

        return {
          success: true,
          data: {
            verified: isVerified,
            message: isVerified ? 'Payment method verified successfully' : 'Verification failed. Please check the amounts.',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to verify payment method');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_VERIFY_PAYMENT_METHOD',
        });
      }
    },
  });
};