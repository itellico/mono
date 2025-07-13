import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const languagesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get supported languages
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:read')],
    schema: {
      tags: ['platform.translations'],
      querystring: Type.Object({
        activeOnly: Type.Optional(Type.Boolean({ default: true })),
        includeGlobal: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            code: Type.String(),
            name: Type.String(),
            nativeName: Type.String(),
            isDefault: Type.Union([Type.Boolean(), Type.Null()]),
            isActive: Type.Union([Type.Boolean(), Type.Null()]),
            tenantId: Type.Union([Type.String(), Type.Null()]),
            completionPercentage: Type.Union([Type.String(), Type.Null()]),
            isLive: Type.Union([Type.Boolean(), Type.Null()]),
            fallbackLanguageCode: Type.Union([Type.String(), Type.Null()]),
            translationPriority: Type.Union([Type.Number(), Type.Null()]),
            lastTranslationUpdate: Type.Union([Type.String(), Type.Null()]),
            autoTranslateEnabled: Type.Union([Type.Boolean(), Type.Null()]),
            qualityThreshold: Type.Union([Type.String(), Type.Null()]),
            metadata: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.Union([Type.String(), Type.Null()]),
            updatedAt: Type.Union([Type.String(), Type.Null()]),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const tenantId = request.query.includeGlobal 
        ? request.user!.tenantId?.toString() || null
        : request.user!.tenantId?.toString();
      
      const languages = await translationsService.getSupportedLanguages(
        tenantId,
        request.query.activeOnly
      );

      request.log.info('Supported languages fetched', {
        count: languages.length,
        activeOnly: request.query.activeOnly,
        tenantId,
      });

      return {
        success: true,
        data: languages,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch supported languages', {
        error: error.message,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_SUPPORTED_LANGUAGES',
      });
    }
  });

  // Get default language
  fastify.get('/default', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:read')],
    schema: {
      tags: ['platform.translations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
              code: Type.String(),
              name: Type.String(),
              nativeName: Type.String(),
              isDefault: Type.Union([Type.Boolean(), Type.Null()]),
              isActive: Type.Union([Type.Boolean(), Type.Null()]),
            }),
            Type.Null(),
          ]),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const defaultLanguage = await translationsService.getDefaultLanguage();

      request.log.info('Default language fetched', {
        found: !!defaultLanguage,
        code: defaultLanguage?.code,
      });

      return {
        success: true,
        data: defaultLanguage,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch default language', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_DEFAULT_LANGUAGE',
      });
    }
  });

  // Create or update tenant-specific language settings
  fastify.post('/management', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:manage')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        code: Type.String({ minLength: 2, maxLength: 10 }),
        name: Type.String({ minLength: 1 }),
        nativeName: Type.String({ minLength: 1 }),
        isActive: Type.Optional(Type.Boolean({ default: true })),
        isLive: Type.Optional(Type.Boolean({ default: false })),
        fallbackLanguageCode: Type.Optional(Type.String()),
        translationPriority: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        autoTranslateEnabled: Type.Optional(Type.Boolean({ default: false })),
        qualityThreshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1, default: 0.8 })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            code: Type.String(),
            name: Type.String(),
            nativeName: Type.String(),
            isActive: Type.Boolean(),
            tenantId: Type.String(),
            completionPercentage: Type.String(),
            isLive: Type.Boolean(),
            fallbackLanguageCode: Type.Union([Type.String(), Type.Null()]),
            translationPriority: Type.Number(),
            autoTranslateEnabled: Type.Boolean(),
            qualityThreshold: Type.String(),
            metadata: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { db } = await import('@/lib/db');
      const { supportedLanguages } = await import('@/lib@/schemas/translations');
      
      const languageData = {
        code: request.body.code,
        name: request.body.name,
        nativeName: request.body.nativeName,
        isActive: request.body.isActive ?? true,
        tenantId: request.user!.tenantId!.toString(),
        completionPercentage: '0.00',
        isLive: request.body.isLive ?? false,
        fallbackLanguageCode: request.body.fallbackLanguageCode || null,
        translationPriority: request.body.translationPriority ?? 0,
        autoTranslateEnabled: request.body.autoTranslateEnabled ?? false,
        qualityThreshold: request.body.qualityThreshold?.toString() ?? '0.80',
        metadata: request.body.metadata ? JSON.stringify(request.body.metadata) : '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [created] = await db
        .insert(supportedLanguages)
        .values(languageData)
        .onConflictDoUpdate({
          target: [supportedLanguages.tenantId, supportedLanguages.code],
          set: {
            name: languageData.name,
            nativeName: languageData.nativeName,
            isActive: languageData.isActive,
            isLive: languageData.isLive,
            fallbackLanguageCode: languageData.fallbackLanguageCode,
            translationPriority: languageData.translationPriority,
            autoTranslateEnabled: languageData.autoTranslateEnabled,
            qualityThreshold: languageData.qualityThreshold,
            metadata: languageData.metadata,
            updatedAt: languageData.updatedAt,
          },
        })
        .returning();

      request.log.info('Language management settings created/updated', {
        code: created.code,
        tenantId: created.tenantId,
        isActive: created.isActive,
        isLive: created.isLive,
      });

      return reply.code(201).send({
        success: true,
        data: {
          ...created,
          createdAt: created.createdAt!.toISOString(),
          updatedAt: created.updatedAt!.toISOString(),
        },
      });

    } catch (error: any) {
      request.log.error('Failed to create/update language management settings', {
        error: error.message,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE/UPDATE_LANGUAGE_MANAGEMENT_SETTINGS',
      });
    }
  });

  // Update language management settings
  fastify.patch('/management/:code', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:manage')],
    schema: {
      tags: ['platform.translations'],
      params: Type.Object({
        code: Type.String(),
      }),
      body: Type.Object({
        isActive: Type.Optional(Type.Boolean()),
        isLive: Type.Optional(Type.Boolean()),
        fallbackLanguageCode: Type.Optional(Type.String()),
        translationPriority: Type.Optional(Type.Number({ minimum: 0 })),
        autoTranslateEnabled: Type.Optional(Type.Boolean()),
        qualityThreshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            code: Type.String(),
            name: Type.String(),
            nativeName: Type.String(),
            isActive: Type.Boolean(),
            tenantId: Type.String(),
            completionPercentage: Type.String(),
            isLive: Type.Boolean(),
            fallbackLanguageCode: Type.Union([Type.String(), Type.Null()]),
            translationPriority: Type.Number(),
            autoTranslateEnabled: Type.Boolean(),
            qualityThreshold: Type.String(),
            metadata: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { db } = await import('@/lib/db');
      const { supportedLanguages } = await import('@/lib@/schemas/translations');
      const { eq, and } = await import('drizzle-orm');
      
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (request.body.isActive !== undefined) {
        updateData.isActive = request.body.isActive;
      }
      if (request.body.isLive !== undefined) {
        updateData.isLive = request.body.isLive;
      }
      if (request.body.fallbackLanguageCode !== undefined) {
        updateData.fallbackLanguageCode = request.body.fallbackLanguageCode;
      }
      if (request.body.translationPriority !== undefined) {
        updateData.translationPriority = request.body.translationPriority;
      }
      if (request.body.autoTranslateEnabled !== undefined) {
        updateData.autoTranslateEnabled = request.body.autoTranslateEnabled;
      }
      if (request.body.qualityThreshold !== undefined) {
        updateData.qualityThreshold = request.body.qualityThreshold.toString();
      }
      if (request.body.metadata !== undefined) {
        updateData.metadata = JSON.stringify(request.body.metadata);
      }

      const [updated] = await db
        .update(supportedLanguages)
        .set(updateData)
        .where(and(
          eq(supportedLanguages.code, request.params.code),
          eq(supportedLanguages.tenantId, request.user!.tenantId!.toString())
        ))
        .returning();

      if (!updated) {
        return reply.code(404).send({
          success: false,
          error: 'LANGUAGE_MANAGEMENT_SETTINGS_NOT_FOUND_FOR_THIS_TENANT',
        });
      }

      request.log.info('Language management settings updated', {
        code: updated.code,
        tenantId: updated.tenantId,
        changes: Object.keys(request.body),
      });

      return {
        success: true,
        data: {
          ...updated,
          createdAt: updated.createdAt!.toISOString(),
          updatedAt: updated.updatedAt!.toISOString(),
        },
      };

    } catch (error: any) {
      request.log.error('Failed to update language management settings', {
        error: error.message,
        code: request.params.code,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_LANGUAGE_MANAGEMENT_SETTINGS',
      });
    }
  });

  // Calculate and update completion percentages
  fastify.post('/management/calculate-completion', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:manage')],
    schema: {
      tags: ['platform.translations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            updated: Type.Array(Type.Object({
              code: Type.String(),
              oldPercentage: Type.String(),
              newPercentage: Type.String(),
            })),
            totalLanguages: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { db } = await import('@/lib/db');
      const { supportedLanguages, translations } = await import('@/lib@/schemas/translations');
      const { eq, and, isNull } = await import('drizzle-orm');
      
      // Get all tenant languages
      const tenantLanguages = await db
        .select()
        .from(supportedLanguages)
        .where(eq(supportedLanguages.tenantId, request.user!.tenantId!.toString()));

      // Get total unique translation keys for this tenant
      const totalKeysQuery = await db
        .selectDistinct({ 
          key: translations.key, 
          entityType: translations.entityType, 
          entityId: translations.entityId 
        })
        .from(translations)
        .where(eq(translations.tenantId, request.user!.tenantId!));

      const totalKeys = totalKeysQuery.length;

      const updated: Array<{
        code: string;
        oldPercentage: string;
        newPercentage: string;
      }> = [];

      // Calculate completion for each language
      for (const language of tenantLanguages) {
        const existingTranslations = await db
          .select()
          .from(translations)
          .where(and(
            eq(translations.tenantId, request.user!.tenantId!),
            eq(translations.languageCode, language.code)
          ));

        const completionPercentage = totalKeys > 0 
          ? Math.round((existingTranslations.length / totalKeys) * 100) / 100
          : 0;

        const newPercentageStr = completionPercentage.toFixed(2);
        const oldPercentageStr = language.completionPercentage || '0.00';

        if (newPercentageStr !== oldPercentageStr) {
          await db
            .update(supportedLanguages)
            .set({
              completionPercentage: newPercentageStr,
              lastTranslationUpdate: new Date(),
              updatedAt: new Date(),
            })
            .where(and(
              eq(supportedLanguages.code, language.code),
              eq(supportedLanguages.tenantId, request.user!.tenantId!.toString())
            ));

          updated.push({
            code: language.code,
            oldPercentage: oldPercentageStr,
            newPercentage: newPercentageStr,
          });
        }
      }

      request.log.info('Language completion percentages calculated', {
        totalLanguages: tenantLanguages.length,
        updated: updated.length,
        totalKeys,
      });

      return {
        success: true,
        data: {
          updated,
          totalLanguages: tenantLanguages.length,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to calculate completion percentages', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CALCULATE_COMPLETION_PERCENTAGES',
      });
    }
  });

  // Delete tenant-specific language settings
  fastify.delete('/management/:code', {
    preHandler: [fastify.authenticate, fastify.requirePermission('languages:manage')],
    schema: {
      tags: ['platform.translations'],
      params: Type.Object({
        code: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { db } = await import('@/lib/db');
      const { supportedLanguages } = await import('@/lib@/schemas/translations');
      const { eq, and } = await import('drizzle-orm');
      
      const deleted = await db
        .delete(supportedLanguages)
        .where(and(
          eq(supportedLanguages.code, request.params.code),
          eq(supportedLanguages.tenantId, request.user!.tenantId!.toString())
        ))
        .returning();

      if (deleted.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'LANGUAGE_MANAGEMENT_SETTINGS_NOT_FOUND_FOR_THIS_TENANT',
        });
      }

      request.log.info('Language management settings deleted', {
        code: request.params.code,
        tenantId: request.user!.tenantId,
      });

      return {
        success: true,
        message: 'Language management settings deleted successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to delete language management settings', {
        error: error.message,
        code: request.params.code,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_LANGUAGE_MANAGEMENT_SETTINGS',
      });
    }
  });
};