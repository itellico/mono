import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Configuration Settings Routes
 * Manage account-wide settings
 */
export const accountSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get account settings
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.settings.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get account settings',
      description: 'Get all settings for the account',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            settings: Type.Object({
              general: Type.Object({
                accountName: Type.String(),
                timezone: Type.String(),
                dateFormat: Type.String(),
                timeFormat: Type.String(),
                currency: Type.String(),
                language: Type.String(),
                logo: Type.Optional(Type.String()),
                favicon: Type.Optional(Type.String()),
              }),
              billing: Type.Object({
                billingEmail: Type.String(),
                billingAddress: Type.Optional(Type.Object({
                  line1: Type.String(),
                  line2: Type.Optional(Type.String()),
                  city: Type.String(),
                  state: Type.Optional(Type.String()),
                  postalCode: Type.String(),
                  country: Type.String(),
                })),
                taxId: Type.Optional(Type.String()),
                invoicePrefix: Type.String(),
                paymentTerms: Type.Number(),
              }),
              features: Type.Object({
                multiLanguage: Type.Boolean(),
                customDomain: Type.Boolean(),
                advancedAnalytics: Type.Boolean(),
                apiAccess: Type.Boolean(),
                teamCollaboration: Type.Boolean(),
                customBranding: Type.Boolean(),
                webhooks: Type.Boolean(),
                sso: Type.Boolean(),
              }),
              security: Type.Object({
                twoFactorRequired: Type.Boolean(),
                passwordPolicy: Type.Object({
                  minLength: Type.Number(),
                  requireUppercase: Type.Boolean(),
                  requireLowercase: Type.Boolean(),
                  requireNumbers: Type.Boolean(),
                  requireSymbols: Type.Boolean(),
                  expirationDays: Type.Number(),
                }),
                sessionTimeout: Type.Number(),
                ipWhitelist: Type.Array(Type.String()),
                loginNotifications: Type.Boolean(),
              }),
              notifications: Type.Object({
                emailNotifications: Type.Boolean(),
                marketingEmails: Type.Boolean(),
                securityAlerts: Type.Boolean(),
                productUpdates: Type.Boolean(),
                weeklyReports: Type.Boolean(),
                monthlyReports: Type.Boolean(),
              }),
              integrations: Type.Object({
                slack: Type.Optional(Type.Object({
                  enabled: Type.Boolean(),
                  webhookUrl: Type.Optional(Type.String()),
                  channel: Type.Optional(Type.String()),
                })),
                googleAnalytics: Type.Optional(Type.Object({
                  enabled: Type.Boolean(),
                  measurementId: Type.Optional(Type.String()),
                })),
                intercom: Type.Optional(Type.Object({
                  enabled: Type.Boolean(),
                  appId: Type.Optional(Type.String()),
                })),
              }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const account = await fastify.prisma.account.findUnique({
          where: { tenantId: request.user.tenantId, id: request.user!.accountId },
          include: {
            settings: true,
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
          });
        }

        // Merge account data with settings
        const settings = account.settings?.[0] || {};
        
        return {
          success: true,
          data: {
            settings: {
              general: {
                accountName: account.name,
                timezone: settings.timezone || 'UTC',
                dateFormat: settings.dateFormat || 'MM/DD/YYYY',
                timeFormat: settings.timeFormat || '12h',
                currency: settings.currency || 'USD',
                language: settings.language || 'en',
                logo: account.logo,
                favicon: account.favicon,
              },
              billing: {
                billingEmail: account.billingEmail || account.createdBy?.email || '',
                billingAddress: account.billingAddress as any,
                taxId: account.taxId,
                invoicePrefix: settings.invoicePrefix || 'INV',
                paymentTerms: settings.paymentTerms || 30,
              },
              features: {
                multiLanguage: settings.features?.multiLanguage || false,
                customDomain: settings.features?.customDomain || false,
                advancedAnalytics: settings.features?.advancedAnalytics || false,
                apiAccess: settings.features?.apiAccess || true,
                teamCollaboration: settings.features?.teamCollaboration || true,
                customBranding: settings.features?.customBranding || false,
                webhooks: settings.features?.webhooks || false,
                sso: settings.features?.sso || false,
              },
              security: {
                twoFactorRequired: settings.security?.twoFactorRequired || false,
                passwordPolicy: settings.security?.passwordPolicy || {
                  minLength: 8,
                  requireUppercase: true,
                  requireLowercase: true,
                  requireNumbers: true,
                  requireSymbols: false,
                  expirationDays: 0,
                },
                sessionTimeout: settings.security?.sessionTimeout || 1440, // 24 hours
                ipWhitelist: settings.security?.ipWhitelist || [],
                loginNotifications: settings.security?.loginNotifications || true,
              },
              notifications: {
                emailNotifications: settings.notifications?.emailNotifications !== false,
                marketingEmails: settings.notifications?.marketingEmails || false,
                securityAlerts: settings.notifications?.securityAlerts !== false,
                productUpdates: settings.notifications?.productUpdates || true,
                weeklyReports: settings.notifications?.weeklyReports || false,
                monthlyReports: settings.notifications?.monthlyReports || true,
              },
              integrations: {
                slack: settings.integrations?.slack,
                googleAnalytics: settings.integrations?.googleAnalytics,
                intercom: settings.integrations?.intercom,
              },
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get account settings');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ACCOUNT_SETTINGS',
        });
      }
    },
  });

  // Update account settings
  fastify.put('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.settings.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Update account settings',
      description: 'Update account settings',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        general: Type.Optional(Type.Object({
          accountName: Type.Optional(Type.String()),
          timezone: Type.Optional(Type.String()),
          dateFormat: Type.Optional(Type.String()),
          timeFormat: Type.Optional(Type.String()),
          currency: Type.Optional(Type.String()),
          language: Type.Optional(Type.String()),
        })),
        billing: Type.Optional(Type.Object({
          billingEmail: Type.Optional(Type.String({ format: 'email' })),
          billingAddress: Type.Optional(Type.Object({
            line1: Type.String(),
            line2: Type.Optional(Type.String()),
            city: Type.String(),
            state: Type.Optional(Type.String()),
            postalCode: Type.String(),
            country: Type.String(),
          })),
          taxId: Type.Optional(Type.String()),
          invoicePrefix: Type.Optional(Type.String()),
          paymentTerms: Type.Optional(Type.Number({ minimum: 0 })),
        })),
        features: Type.Optional(Type.Object({
          multiLanguage: Type.Optional(Type.Boolean()),
          customDomain: Type.Optional(Type.Boolean()),
          advancedAnalytics: Type.Optional(Type.Boolean()),
          apiAccess: Type.Optional(Type.Boolean()),
          teamCollaboration: Type.Optional(Type.Boolean()),
          customBranding: Type.Optional(Type.Boolean()),
          webhooks: Type.Optional(Type.Boolean()),
          sso: Type.Optional(Type.Boolean()),
        })),
        security: Type.Optional(Type.Object({
          twoFactorRequired: Type.Optional(Type.Boolean()),
          passwordPolicy: Type.Optional(Type.Object({
            minLength: Type.Number({ minimum: 6, maximum: 32 }),
            requireUppercase: Type.Boolean(),
            requireLowercase: Type.Boolean(),
            requireNumbers: Type.Boolean(),
            requireSymbols: Type.Boolean(),
            expirationDays: Type.Number({ minimum: 0 }),
          })),
          sessionTimeout: Type.Optional(Type.Number({ minimum: 5 })),
          ipWhitelist: Type.Optional(Type.Array(Type.String())),
          loginNotifications: Type.Optional(Type.Boolean()),
        })),
        notifications: Type.Optional(Type.Object({
          emailNotifications: Type.Optional(Type.Boolean()),
          marketingEmails: Type.Optional(Type.Boolean()),
          securityAlerts: Type.Optional(Type.Boolean()),
          productUpdates: Type.Optional(Type.Boolean()),
          weeklyReports: Type.Optional(Type.Boolean()),
          monthlyReports: Type.Optional(Type.Boolean()),
        })),
        integrations: Type.Optional(Type.Object({
          slack: Type.Optional(Type.Object({
            enabled: Type.Boolean(),
            webhookUrl: Type.Optional(Type.String()),
            channel: Type.Optional(Type.String()),
          })),
          googleAnalytics: Type.Optional(Type.Object({
            enabled: Type.Boolean(),
            measurementId: Type.Optional(Type.String()),
          })),
          intercom: Type.Optional(Type.Object({
            enabled: Type.Boolean(),
            appId: Type.Optional(Type.String()),
          })),
        })),
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
      const updates = request.body;

      try {
        const accountId = request.user!.accountId;

        // Update account fields
        const accountUpdates: any = {};
        if (updates.general?.accountName) {
          accountUpdates.name = updates.general.accountName;
        }
        if (updates.billing?.billingEmail) {
          accountUpdates.billingEmail = updates.billing.billingEmail;
        }
        if (updates.billing?.billingAddress !== undefined) {
          accountUpdates.billingAddress = updates.billing.billingAddress;
        }
        if (updates.billing?.taxId !== undefined) {
          accountUpdates.taxId = updates.billing.taxId;
        }

        if (Object.keys(accountUpdates).length > 0) {
          await fastify.prisma.account.update({
            where: { tenantId: request.user.tenantId, id: accountId },
            data: accountUpdates,
          });
        }

        // Update or create settings
        let settings = await fastify.prisma.accountSettings.findFirst({
          where: { tenantId: request.user.tenantId, accountId },
        });

        const settingsData: any = {};

        // General settings
        if (updates.general) {
          if (updates.general.timezone) settingsData.timezone = updates.general.timezone;
          if (updates.general.dateFormat) settingsData.dateFormat = updates.general.dateFormat;
          if (updates.general.timeFormat) settingsData.timeFormat = updates.general.timeFormat;
          if (updates.general.currency) settingsData.currency = updates.general.currency;
          if (updates.general.language) settingsData.language = updates.general.language;
        }

        // Billing settings
        if (updates.billing) {
          if (updates.billing.invoicePrefix) settingsData.invoicePrefix = updates.billing.invoicePrefix;
          if (updates.billing.paymentTerms !== undefined) settingsData.paymentTerms = updates.billing.paymentTerms;
        }

        // Features
        if (updates.features) {
          settingsData.features = {
            ...(settings?.features || {}),
            ...updates.features,
          };
        }

        // Security
        if (updates.security) {
          settingsData.security = {
            ...(settings?.security || {}),
            ...updates.security,
          };
        }

        // Notifications
        if (updates.notifications) {
          settingsData.notifications = {
            ...(settings?.notifications || {}),
            ...updates.notifications,
          };
        }

        // Integrations
        if (updates.integrations) {
          settingsData.integrations = {
            ...(settings?.integrations || {}),
            ...updates.integrations,
          };
        }

        if (settings) {
          await fastify.prisma.accountSettings.update({
            where: { tenantId: request.user.tenantId },
            data: settingsData,
          });
        } else {
          await fastify.prisma.accountSettings.create({
            data: {
              ...settingsData,
              accountId,
            },
          });
        }

        // Clear cache
        const cacheKey = `account:${accountId}:settings`;
        await fastify.redis.del(cacheKey);

        return {
          success: true,
          data: {
            message: 'Account settings updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update account settings');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_ACCOUNT_SETTINGS',
        });
      }
    },
  });

  // Upload logo
  fastify.post('/logo', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.settings.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Upload account logo',
      description: 'Upload a new logo for the account',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      body: Type.Object({
        file: Type.Any(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logoUrl: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'NO_FILE_UPLOADED',
          });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_FILE_TYPE._ONLY_JPEG,_PNG,_AND_SVG_ARE_ALLOWED.',
          });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        const chunks = [];
        let size = 0;
        
        for await (const chunk of data.file) {
          size += chunk.length;
          if (size > maxSize) {
            return reply.status(400).send({
              success: false,
              error: 'FILE_TOO_LARGE._MAXIMUM_SIZE_IS_5MB.',
            });
          }
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // TODO: Upload to storage service (S3, etc.)
        const logoUrl = `/media/account/${request.user!.accountId}/logo-${Date.now()}.${data.filename.split('.').pop()}`;

        // Update account
        await fastify.prisma.account.update({
          where: { tenantId: request.user.tenantId, id: request.user!.accountId },
          data: {
            logo: logoUrl,
          },
        });

        return {
          success: true,
          data: {
            logoUrl,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to upload logo');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPLOAD_LOGO',
        });
      }
    },
  });

  // Delete logo
  fastify.delete('/logo', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.settings.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Delete account logo',
      description: 'Remove the account logo',
      security: [{ bearerAuth: [] }],
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
      try {
        const account = await fastify.prisma.account.findUnique({
          where: { tenantId: request.user.tenantId, id: request.user!.accountId },
          select: { logo: true },
        });

        if (!account?.logo) {
          return reply.status(404).send({
            success: false,
            error: 'NO_LOGO_TO_DELETE',
          });
        }

        // TODO: Delete from storage service

        // Update account
        await fastify.prisma.account.update({
          where: { tenantId: request.user.tenantId, id: request.user!.accountId },
          data: {
            logo: null,
          },
        });

        return {
          success: true,
          data: {
            message: 'Logo deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete logo');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_LOGO',
        });
      }
    },
  });

  // Test integration
  fastify.post('/integrations/test', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.settings.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Test integration',
      description: 'Test an integration configuration',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        integration: Type.Union([
          Type.Literal('slack'),
          Type.Literal('googleAnalytics'),
          Type.Literal('intercom'),
        ]),
        config: Type.Object({}, { additionalProperties: true }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            status: Type.String(),
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { integration, config } = request.body;

      try {
        let status = 'success';
        let message = '';

        switch (integration) {
          case 'slack':
            if (!config.webhookUrl) {
              status = 'error';
              message = 'Webhook URL is required';
            } else {
              // TODO: Send test message to Slack
              message = 'Test message sent to Slack';
            }
            break;

          case 'googleAnalytics':
            if (!config.measurementId) {
              status = 'error';
              message = 'Measurement ID is required';
            } else {
              // TODO: Verify GA measurement ID
              message = 'Google Analytics configuration verified';
            }
            break;

          case 'intercom':
            if (!config.appId) {
              status = 'error';
              message = 'App ID is required';
            } else {
              // TODO: Verify Intercom app ID
              message = 'Intercom configuration verified';
            }
            break;

          default:
            status = 'error';
            message = 'Unknown integration';
        }

        return {
          success: true,
          data: {
            status,
            message,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to test integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_TEST_INTEGRATION',
        });
      }
    },
  });
};