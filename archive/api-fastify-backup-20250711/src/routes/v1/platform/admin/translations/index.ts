import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const translationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all translations with filters and pagination
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:read')],
    schema: {
      tags: ['platform.translations'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        entityType: Type.Optional(Type.String()),
        entityId: Type.Optional(Type.String()),
        languageCode: Type.Optional(Type.String()),
        key: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        needsReview: Type.Optional(Type.Boolean()),
        isAutoTranslated: Type.Optional(Type.Boolean()),
        sortBy: Type.Optional(Type.String({ default: 'updatedAt' })),
        sortOrder: Type.Optional(Type.Union([
          Type.Literal('asc'),
          Type.Literal('desc')
        ], { default: 'desc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            translations: Type.Array(Type.Object({
              id: Type.String(),
              tenantId: Type.Union([Type.Number(), Type.Null()]),
              entityType: Type.String(),
              entityId: Type.String(),
              languageCode: Type.String(),
              key: Type.String(),
              value: Type.String(),
              context: Type.Union([Type.String(), Type.Null()]),
              isAutoTranslated: Type.Union([Type.Boolean(), Type.Null()]),
              needsReview: Type.Union([Type.Boolean(), Type.Null()]),
              createdAt: Type.Union([Type.String(), Type.Null()]),
              updatedAt: Type.Union([Type.String(), Type.Null()]),
              createdBy: Type.Union([Type.Number(), Type.Null()]),
              updatedBy: Type.Union([Type.Number(), Type.Null()]),
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
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const filters = {
        tenantId: request.user!.tenantId,
        entityType: request.query.entityType,
        entityId: request.query.entityId,
        languageCode: request.query.languageCode,
        key: request.query.key,
        search: request.query.search,
        needsReview: request.query.needsReview,
        isAutoTranslated: request.query.isAutoTranslated,
      };

      const pagination = {
        page: request.query.page,
        limit: request.query.limit,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder as 'asc' | 'desc',
      };

      const result = await translationsService.getTranslations(filters, pagination);

      request.log.info('Translations fetched', {
        count: result.data.length,
        page: pagination.page,
        total: result.pagination.total,
      });

      return {
        success: true,
        data: {
          translations: result.data,
          pagination: result.pagination,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to fetch translations', {
        error: error.message,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_TRANSLATIONS',
      });
    }
  });

  // Get translation keys for navigation/structure
  fastify.get('/keys', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:read')],
    schema: {
      tags: ['platform.translations'],
      querystring: Type.Object({
        entityType: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            key: Type.String(),
            entityType: Type.String(),
            entityId: Type.String(),
            translations: Type.Array(Type.Object({
              id: Type.String(),
              languageCode: Type.String(),
              value: Type.String(),
              isAutoTranslated: Type.Boolean(),
              needsReview: Type.Boolean(),
            })),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const keys = await translationsService.getTranslationKeys(
        request.query.entityType,
        request.user!.tenantId
      );

      request.log.info('Translation keys fetched', {
        count: keys.length,
        entityType: request.query.entityType,
      });

      return {
        success: true,
        data: keys,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch translation keys', {
        error: error.message,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_TRANSLATION_KEYS',
      });
    }
  });

  // Get language statistics
  fastify.get('/statistics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:read')],
    schema: {
      tags: ['platform.translations'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            languages: Type.Array(Type.Object({
              code: Type.String(),
              name: Type.String(),
              nativeName: Type.String(),
              isDefault: Type.Boolean(),
              totalTranslations: Type.Number(),
              completedTranslations: Type.Number(),
              pendingReview: Type.Number(),
              autoTranslated: Type.Number(),
              completionPercentage: Type.Number(),
            })),
            totalKeys: Type.Number(),
            entityTypes: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const statistics = await translationsService.getLanguageStatistics(request.user!.tenantId);

      request.log.info('Translation statistics fetched', {
        languageCount: statistics.languages.length,
        totalKeys: statistics.totalKeys,
        entityTypesCount: statistics.entityTypes.length,
      });

      return {
        success: true,
        data: statistics,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch translation statistics', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_TRANSLATION_STATISTICS',
      });
    }
  });

  // Create a new translation
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:create')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        entityType: Type.String({ minLength: 1 }),
        entityId: Type.String({ minLength: 1 }),
        languageCode: Type.String({ minLength: 2, maxLength: 10 }),
        key: Type.String({ minLength: 1 }),
        value: Type.String(),
        context: Type.Optional(Type.String()),
        isAutoTranslated: Type.Optional(Type.Boolean({ default: false })),
        needsReview: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            tenantId: Type.Union([Type.Number(), Type.Null()]),
            entityType: Type.String(),
            entityId: Type.String(),
            languageCode: Type.String(),
            key: Type.String(),
            value: Type.String(),
            context: Type.Union([Type.String(), Type.Null()]),
            isAutoTranslated: Type.Union([Type.Boolean(), Type.Null()]),
            needsReview: Type.Union([Type.Boolean(), Type.Null()]),
            createdAt: Type.Union([Type.String(), Type.Null()]),
            updatedAt: Type.Union([Type.String(), Type.Null()]),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const translationData = {
        tenantId: request.user!.tenantId,
        entityType: request.body.entityType,
        entityId: request.body.entityId,
        languageCode: request.body.languageCode,
        key: request.body.key,
        value: request.body.value,
        isAutoTranslated: request.body.isAutoTranslated,
        needsReview: request.body.needsReview,
      };

      const created = await translationsService.createTranslation(translationData);

      request.log.info('Translation created', {
        entityType: created.entityType,
        entityId: created.entityId,
        languageCode: created.languageCode,
        key: created.key,
      });

      return reply.code(201).send({
        success: true,
        data: created,
      });

    } catch (error: any) {
      request.log.error('Failed to create translation', {
        error: error.message,
        body: request.body,
      });

      if (error.message?.includes('duplicate') || error.code === '23505') {
        return reply.code(409).send({
          success: false,
          error: 'TRANSLATION_ALREADY_EXISTS_FOR_THIS_ENTITY,_LANGUAGE,_AND_KEY',
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_TRANSLATION',
      });
    }
  });

  // Update a translation
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:update')],
    schema: {
      tags: ['platform.translations'],
      params: Type.Object({
        id: Type.String(),
      }),
      body: Type.Object({
        value: Type.Optional(Type.String()),
        context: Type.Optional(Type.String()),
        isAutoTranslated: Type.Optional(Type.Boolean()),
        needsReview: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            tenantId: Type.Union([Type.Number(), Type.Null()]),
            entityType: Type.String(),
            entityId: Type.String(),
            languageCode: Type.String(),
            key: Type.String(),
            value: Type.String(),
            context: Type.Union([Type.String(), Type.Null()]),
            isAutoTranslated: Type.Union([Type.Boolean(), Type.Null()]),
            needsReview: Type.Union([Type.Boolean(), Type.Null()]),
            createdAt: Type.Union([Type.String(), Type.Null()]),
            updatedAt: Type.Union([Type.String(), Type.Null()]),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const updated = await translationsService.updateTranslation(
        request.params.uuid as UUID,
        request.body
      );

      if (!updated) {
        return reply.code(404).send({
          success: false,
          error: 'TRANSLATION_NOT_FOUND',
        });
      }

      request.log.info('Translation updated', {
        entityType: updated.entityType,
        entityId: updated.entityId,
        languageCode: updated.languageCode,
        key: updated.key,
      });

      return {
        success: true,
        data: updated,
      };

    } catch (error: any) {
      request.log.error('Failed to update translation', {
        error: error.message,
        id: request.params.uuid as UUID,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_TRANSLATION',
      });
    }
  });

  // Delete a translation
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:delete')],
    schema: {
      tags: ['platform.translations'],
      params: Type.Object({
        id: Type.String(),
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
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const deleted = await translationsService.deleteTranslation(request.params.id);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: 'TRANSLATION_NOT_FOUND',
        });
      }

      request.log.info('Translation deleted', {
        id: request.params.uuid as UUID,
      });

      return {
        success: true,
        message: 'Translation deleted successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to delete translation', {
        error: error.message,
        id: request.params.uuid as UUID,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_TRANSLATION',
      });
    }
  });

  // Auto-translate text
  fastify.post('/auto-translate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:auto-translate')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        text: Type.String({ minLength: 1 }),
        fromLanguage: Type.String({ minLength: 2, maxLength: 10 }),
        toLanguage: Type.String({ minLength: 2, maxLength: 10 }),
        context: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            originalText: Type.String(),
            translatedText: Type.String(),
            fromLanguage: Type.String(),
            toLanguage: Type.String(),
            context: Type.Union([Type.String(), Type.Null()]),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const translatedText = await translationsService.autoTranslate(
        request.body.text,
        request.body.fromLanguage,
        request.body.toLanguage,
        request.body.context
      );

      request.log.info('Text auto-translated', {
        fromLanguage: request.body.fromLanguage,
        toLanguage: request.body.toLanguage,
        originalLength: request.body.text.length,
        translatedLength: translatedText.length,
      });

      return {
        success: true,
        data: {
          originalText: request.body.text,
          translatedText,
          fromLanguage: request.body.fromLanguage,
          toLanguage: request.body.toLanguage,
          context: request.body.context || null,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to auto-translate text', {
        error: error.message,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_AUTO-TRANSLATE_TEXT',
      });
    }
  });

  // Bulk update translations
  fastify.patch('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:bulk:update')],
    schema: {
      tags: ['platform.translations'],
      body: Type.Object({
        filters: Type.Object({
          entityType: Type.Optional(Type.String()),
          entityId: Type.Optional(Type.String()),
          languageCode: Type.Optional(Type.String()),
          key: Type.Optional(Type.String()),
          needsReview: Type.Optional(Type.Boolean()),
          isAutoTranslated: Type.Optional(Type.Boolean()),
        }),
        updates: Type.Object({
          value: Type.Optional(Type.String()),
          isAutoTranslated: Type.Optional(Type.Boolean()),
          needsReview: Type.Optional(Type.Boolean()),
        }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            updatedCount: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const filters = {
        tenantId: request.user!.tenantId,
        ...request.body.filters,
      };

      const updatedCount = await translationsService.bulkUpdateTranslations(
        filters,
        request.body.updates
      );

      request.log.info('Bulk translations updated', {
        updatedCount,
        filters: request.body.filters,
        updates: request.body.updates,
      });

      return {
        success: true,
        data: {
          updatedCount,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to bulk update translations', {
        error: error.message,
        body: request.body,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_BULK_UPDATE_TRANSLATIONS',
      });
    }
  });

  // Get translation with fallback
  fastify.get('/lookup', {
    preHandler: [fastify.authenticate, fastify.requirePermission('translations:read')],
    schema: {
      tags: ['platform.translations'],
      querystring: Type.Object({
        entityType: Type.String(),
        entityId: Type.String(),
        languageCode: Type.String(),
        key: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Union([
            Type.Object({
              value: Type.String(),
              language: Type.String(),
              isDefault: Type.Boolean(),
            }),
            Type.Null(),
          ]),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { translationsService } = await import('@/lib@/services/translations-service');
      
      const result = await translationsService.getTranslationWithFallback(
        request.query.entityType,
        request.query.entityId,
        request.query.languageCode,
        request.query.key,
        request.user!.tenantId
      );

      request.log.info('Translation lookup completed', {
        entityType: request.query.entityType,
        entityId: request.query.entityId,
        languageCode: request.query.languageCode,
        key: request.query.key,
        found: !!result,
        fallbackUsed: result?.isDefault || false,
      });

      return {
        success: true,
        data: result,
      };

    } catch (error: any) {
      request.log.error('Failed to lookup translation', {
        error: error.message,
        query: request.query,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_LOOKUP_TRANSLATION',
      });
    }
  });
};