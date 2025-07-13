import { db } from '@/lib/db';
import { translations, supportedLanguages } from '@/lib/schemas/translations';
import { eq, and, or, like, desc, asc, isNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';

export interface Translation {
  id: string;
  tenantId: number | null;
  entityType: string;
  entityId: string;
  languageCode: string;
  key: string;
  value: string;
  context: string | null;
  isAutoTranslated: boolean | null;
  needsReview: boolean | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean | null;
  isActive: boolean | null;
  // Language Management Fields
  tenantId: string | null;
  completionPercentage: string | null; // Stored as decimal string
  isLive: boolean | null;
  fallbackLanguageCode: string | null;
  translationPriority: number | null;
  lastTranslationUpdate: Date | null;
  autoTranslateEnabled: boolean | null;
  qualityThreshold: string | null; // Stored as decimal string
  metadata: string | null; // Stored as JSON string
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateTranslationData {
  tenantId?: number;
  entityType: string;
  entityId: string;
  languageCode: string;
  key: string;
  value: string;
  isAutoTranslated?: boolean;
  needsReview?: boolean;
}

export interface UpdateTranslationData {
  value?: string;
  isAutoTranslated?: boolean;
  needsReview?: boolean;
}

export interface TranslationFilters {
  tenantId?: number;
  entityType?: string;
  entityId?: string;
  languageCode?: string;
  key?: string;
  needsReview?: boolean;
  isAutoTranslated?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class TranslationsService {
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Generate cache key following mandatory pattern: cache:{tenant_id}:{entity}:{id}
   */
  private getCacheKey(type: 'single' | 'list' | 'search', tenantId?: number, ...parts: string[]): string {
    const tenant = tenantId ? tenantId.toString() : 'global';
    const entity = 'translations';

    switch (type) {
      case 'single':
        // cache:{tenant_id}:translations:{entityType}:{entityId}:{languageCode}:{key}
        return `cache:${tenant}:${entity}:${parts.join(':')}`;
      case 'list':
        // cache:{tenant_id}:translations:list:{filters_hash}
        const filtersHash = parts.join(':');
        return `cache:${tenant}:${entity}:list:${filtersHash}`;
      case 'search':
        // cache:{tenant_id}:translations:search:{query_hash}
        const queryHash = parts.join(':');
        return `cache:${tenant}:${entity}:search:${queryHash}`;
      default:
        return `cache:${tenant}:${entity}:${parts.join(':')}`;
    }
  }

  /**
   * Get a single translation by criteria
   */
  async getTranslation(
    entityType: string,
    entityId: string,
    languageCode: string,
    key: string,
    tenantId?: number
  ): Promise<Translation | null> {
    try {
      logger.info('Getting translation', { entityType, entityId, languageCode, key, tenantId });

      // Create cache key
      const cacheKey = this.getCacheKey('single', tenantId, entityType, entityId, languageCode, key);

      try {
        // Try cache first
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('Translation found in cache', { entityType, entityId, languageCode, key, tenantId });
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn('Cache error, proceeding without cache', { error: cacheError.message });
      }

      // Build query conditions
      const conditions = [
        eq(translations.entityType, entityType),
        eq(translations.entityId, entityId),
        eq(translations.languageCode, languageCode),
        eq(translations.key, key)
      ];

      if (tenantId !== undefined) {
        conditions.push(eq(translations.tenantId, tenantId));
      } else {
        conditions.push(isNull(translations.tenantId));
      }

      const result = await db
        .select()
        .from(translations)
        .where(and(...conditions))
        .limit(1);

      const translation = result[0] || null;

      // Cache the result
      if (translation) {
        try {
          const redis = await getRedisClient();
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(translation));
        } catch (cacheError) {
          logger.warn('Failed to cache translation', { error: cacheError.message });
        }
      }

      logger.info('Translation retrieved', { found: !!translation, entityType, entityId, languageCode, key, tenantId });
      return translation;
    } catch (error) {
      logger.error('Error getting translation', { error: error.message, entityType, entityId, languageCode, key, tenantId });
      throw error;
    }
  }

  /**
   * Get translations with filters and pagination
   */
  async getTranslations(
    filters: TranslationFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<Translation>> {
    try {
      logger.info('Getting translations with filters', { filters, pagination });

      const {
        tenantId,
        entityType,
        entityId,
        languageCode,
        key,
        needsReview,
        isAutoTranslated,
        search
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = 'updatedAt',
        sortOrder = 'desc'
      } = pagination;

      // Build where conditions
      const conditions = [];

      if (tenantId !== undefined) {
        conditions.push(eq(translations.tenantId, tenantId));
      }

      if (entityType) {
        conditions.push(eq(translations.entityType, entityType));
      }

      if (entityId) {
        conditions.push(eq(translations.entityId, entityId));
      }

      if (languageCode) {
        conditions.push(eq(translations.languageCode, languageCode));
      }

      if (key) {
        conditions.push(eq(translations.key, key));
      }

      if (needsReview !== undefined) {
        conditions.push(eq(translations.needsReview, needsReview));
      }

      if (isAutoTranslated !== undefined) {
        conditions.push(eq(translations.isAutoTranslated, isAutoTranslated));
      }

      if (search) {
        conditions.push(
          or(
            like(translations.key, `%${search}%`),
            like(translations.value, `%${search}%`),
            like(translations.entityType, `%${search}%`),
            like(translations.entityId, `%${search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: translations.id })
        .from(translations)
        .where(whereClause);

      const total = totalResult.length;

      // Get paginated results
      const offset = (page - 1) * limit;

      // Fix the orderBy to use the correct column reference
      let orderByColumn;
      if (sortBy === 'updatedAt') {
        orderByColumn = translations.updatedAt;
      } else if (sortBy === 'createdAt') {
        orderByColumn = translations.createdAt;
      } else if (sortBy === 'key') {
        orderByColumn = translations.key;
      } else if (sortBy === 'value') {
        orderByColumn = translations.value;
      } else {
        orderByColumn = translations.updatedAt; // default
      }

      const orderBy = sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn);

      const results = await db
        .select()
        .from(translations)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      logger.info('Translations retrieved', { 
        total, 
        page, 
        limit, 
        totalPages,
        resultsCount: results.length 
      });

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error getting translations', { error: error.message, filters, pagination });
      throw error;
    }
  }

  /**
   * Get supported languages (from supportedLanguages table)
   */
  async getSupportedLanguages(tenantId?: string | null, activeOnly: boolean = true): Promise<SupportedLanguage[]> {
    try {
      logger.info('Getting supported languages', { tenantId, activeOnly });

      const cacheKey = this.getCacheKey('list', tenantId ? parseInt(tenantId) : undefined, 'supported-languages', activeOnly ? 'active' : 'all');

      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn('Cache error, proceeding without cache', { error: cacheError.message });
      }

      const conditions = [];

      // Tenant isolation: if tenantId provided, get tenant-specific + global (null tenant_id)
      if (tenantId !== undefined) {
        if (tenantId === null) {
          conditions.push(isNull(supportedLanguages.tenantId));
        } else {
          conditions.push(
            or(
              eq(supportedLanguages.tenantId, tenantId),
              isNull(supportedLanguages.tenantId)
            )
          );
        }
      }

      if (activeOnly) {
        conditions.push(eq(supportedLanguages.isActive, true));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select()
        .from(supportedLanguages)
        .where(whereClause)
        .orderBy(asc(supportedLanguages.translationPriority), asc(supportedLanguages.name));

      // Cache for 30 minutes
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, 1800, JSON.stringify(result));
      } catch (cacheError) {
        logger.warn('Failed to cache supported languages', { error: cacheError.message });
      }

      logger.info('Supported languages retrieved', { count: result.length, tenantId, activeOnly });
      return result;
    } catch (error) {
      logger.error('Error getting supported languages', { error: error.message, tenantId, activeOnly });
      throw error;
    }
  }

  /**
   * Get default language
   */
  async getDefaultLanguage(): Promise<SupportedLanguage | null> {
    try {
      const cacheKey = this.getCacheKey('list', undefined, 'default-language');

      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.warn('Cache error, proceeding without cache', { error: cacheError.message });
      }

      const defaultLang = await db
        .select()
        .from(languages)
        .where(eq(languages.isActive, true))
        .limit(1);

      const result = defaultLang[0] || null;

      if (result) {
        try {
          const redis = await getRedisClient();
          await redis.setex(cacheKey, 86400, JSON.stringify(result));
        } catch (cacheError) {
          logger.warn('Failed to cache default language', { error: cacheError.message });
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting default language', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new translation
   */
  async createTranslation(data: CreateTranslationData): Promise<Translation> {
    try {
      logger.info('Creating translation', { data });

      const translationData = {
        id: crypto.randomUUID(),
        tenantId: data.tenantId || null,
        entityType: data.entityType,
        entityId: data.entityId,
        languageCode: data.languageCode,
        key: data.key,
        value: data.value,
        isAutoTranslated: data.isAutoTranslated || false,
        needsReview: data.needsReview || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [created] = await db
        .insert(translations)
        .values(translationData)
        .returning();

      // Clear cache for this translation
      await this.clearTranslationCache(
        data.entityType,
        data.entityId,
        data.languageCode,
        data.key,
        data.tenantId
      );

      logger.info('Translation created', { id: created.id, data });
      return created;
    } catch (error) {
      logger.error('Error creating translation', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Update a translation
   */
  async updateTranslation(id: string, data: UpdateTranslationData): Promise<Translation | null> {
    try {
      logger.info('Updating translation', { id, data });

      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const [updated] = await db
        .update(translations)
        .set(updateData)
        .where(eq(translations.id, id))
        .returning();

      if (updated) {
        // Clear cache for this translation
        await this.clearTranslationCache(
          updated.entityType,
          updated.entityId,
          updated.languageCode,
          updated.key,
          updated.tenantId
        );
      }

      logger.info('Translation updated', { id, found: !!updated });
      return updated || null;
    } catch (error) {
      logger.error('Error updating translation', { error: error.message, id, data });
      throw error;
    }
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(id: string): Promise<boolean> {
    try {
      logger.info('Deleting translation', { id });

      // Get the translation first to clear cache
      const existingResult = await db
        .select()
        .from(translations)
        .where(eq(translations.id, id))
        .limit(1);

      const existing = existingResult[0];

      const deleted = await db
        .delete(translations)
        .where(eq(translations.id, id))
        .returning();

      if (deleted.length > 0 && existing) {
        // Clear cache for this translation
        await this.clearTranslationCache(
          existing.entityType,
          existing.entityId,
          existing.languageCode,
          existing.key,
          existing.tenantId
        );
      }

      logger.info('Translation deleted', { id, found: deleted.length > 0 });
      return deleted.length > 0;
    } catch (error) {
      logger.error('Error deleting translation', { error: error.message, id });
      throw error;
    }
  }

  /**
   * Bulk update translations (e.g., mark as reviewed)
   */
  async bulkUpdateTranslations(
    filters: TranslationFilters,
    updates: UpdateTranslationData
  ): Promise<number> {
    try {
      logger.info('Bulk updating translations', { filters, updates });

      const {
        tenantId,
        entityType,
        entityId,
        languageCode,
        key,
        needsReview,
        isAutoTranslated
      } = filters;

      // Build where conditions
      const conditions = [];

      if (tenantId !== undefined) {
        conditions.push(eq(translations.tenantId, tenantId));
      }

      if (entityType) {
        conditions.push(eq(translations.entityType, entityType));
      }

      if (entityId) {
        conditions.push(eq(translations.entityId, entityId));
      }

      if (languageCode) {
        conditions.push(eq(translations.languageCode, languageCode));
      }

      if (key) {
        conditions.push(eq(translations.key, key));
      }

      if (needsReview !== undefined) {
        conditions.push(eq(translations.needsReview, needsReview));
      }

      if (isAutoTranslated !== undefined) {
        conditions.push(eq(translations.isAutoTranslated, isAutoTranslated));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      const updated = await db
        .update(translations)
        .set(updateData)
        .where(whereClause)
        .returning();

      // Clear all translation cache since we don't know which specific ones were updated
      await this.clearAllTranslationCache();

      logger.info('Bulk update completed', { updatedCount: updated.length, filters, updates });
      return updated.length;
    } catch (error) {
      logger.error('Error bulk updating translations', { error: error.message, filters, updates });
      throw error;
    }
  }

  /**
   * Auto-translate text using GPT
   */
  async autoTranslate(
    text: string,
    fromLanguage: string,
    toLanguage: string,
    context?: string
  ): Promise<string> {
    try {
      logger.info('Auto-translating text', { fromLanguage, toLanguage, textLength: text.length, context });

      // Use LLM service for translation
      const { llmService } = await import('./llm-service');

      if (!llmService.isAvailable()) {
        logger.warn('LLM service not available, using fallback translation');
        return text; // Return clean text instead of ugly prefix
      }

      const translationResponse = await llmService.translateText({
        text,
        fromLanguage,
        toLanguage,
        context,
        entityType: 'general'
      });

      logger.info('Auto-translation completed', { 
        fromLanguage, 
        toLanguage, 
        originalLength: text.length,
        translatedLength: translationResponse.translatedText.length,
        confidence: translationResponse.confidence,
        model: translationResponse.model,
        usage: translationResponse.usage
      });

      return translationResponse.translatedText;
    } catch (error) {
      logger.error('Error auto-translating text', { error: error.message, fromLanguage, toLanguage });

      // Fallback to original text if LLM fails
      logger.warn('Falling back to original text');
      return text;
    }
  }

  /**
   * Get translation with fallback strategy
   */
  async getTranslationWithFallback(
    entityType: string,
    entityId: string,
    languageCode: string,
    key: string,
    tenantId?: number
  ): Promise<{ value: string; language: string; isDefault: boolean } | null> {
    try {
      // Try requested language first
      let translation = await this.getTranslation(entityType, entityId, languageCode, key, tenantId);

      if (translation) {
        return {
          value: translation.value,
          language: languageCode,
          isDefault: false
        };
      }

      // Fallback to default language
      const defaultLang = await this.getDefaultLanguage();
      if (defaultLang && defaultLang.code !== languageCode) {
        translation = await this.getTranslation(entityType, entityId, defaultLang.code, key, tenantId);

        if (translation) {
          return {
            value: translation.value,
            language: defaultLang.code,
            isDefault: true
          };
        }
      }

      // Fallback to global (no tenant)
      if (tenantId) {
        translation = await this.getTranslation(entityType, entityId, languageCode, key);

        if (translation) {
          return {
            value: translation.value,
            language: languageCode,
            isDefault: false
          };
        }

        // Fallback to global default language
        if (defaultLang && defaultLang.code !== languageCode) {
          translation = await this.getTranslation(entityType, entityId, defaultLang.code, key);

          if (translation) {
            return {
              value: translation.value,
              language: defaultLang.code,
              isDefault: true
            };
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting translation with fallback', { 
        error: error.message, 
        entityType, 
        entityId, 
        languageCode, 
        key, 
        tenantId 
      });
      throw error;
    }
  }

  /**
   * Get translation statistics by language
   */
  async getLanguageStatistics(tenantId?: number): Promise<{
    languages: Array<{
      code: string;
      name: string;
      nativeName: string;
      isDefault: boolean;
      totalTranslations: number;
      completedTranslations: number;
      pendingReview: number;
      autoTranslated: number;
      completionPercentage: number;
    }>;
    totalKeys: number;
    entityTypes: string[];
  }> {
    try {
      logger.info('Getting language statistics', { tenantId });

      // Get all supported languages
      const languages = await this.getSupportedLanguages();

      // Get total unique keys for this tenant
      const totalKeysQuery = await db
        .selectDistinct({ key: translations.key, entityType: translations.entityType, entityId: translations.entityId })
        .from(translations)
        .where(tenantId !== undefined ? eq(translations.tenantId, tenantId) : isNull(translations.tenantId));

      const totalKeys = totalKeysQuery.length;

      // Get entity types
      const entityTypesQuery = await db
        .selectDistinct({ entityType: translations.entityType })
        .from(translations)
        .where(tenantId !== undefined ? eq(translations.tenantId, tenantId) : isNull(translations.tenantId));

      const entityTypes = entityTypesQuery.map(row => row.entityType);

      // Get statistics for each language
      const languageStats = await Promise.all(
        languages.map(async (language) => {
          const conditions = [eq(translations.languageCode, language.code)];
          if (tenantId !== undefined) {
            conditions.push(eq(translations.tenantId, tenantId));
          } else {
            conditions.push(isNull(translations.tenantId));
          }

          // Total translations for this language
          const totalTranslations = await db
            .select()
            .from(translations)
            .where(and(...conditions));

          // Pending review count
          const pendingReview = await db
            .select()
            .from(translations)
            .where(and(...conditions, eq(translations.needsReview, true)));

          // Auto-translated count
          const autoTranslated = await db
            .select()
            .from(translations)
            .where(and(...conditions, eq(translations.isAutoTranslated, true)));

          const completedTranslations = totalTranslations.length;
          const completionPercentage = totalKeys > 0 ? Math.round((completedTranslations / totalKeys) * 100) : 0;

          return {
            code: language.code,
            name: language.name,
            nativeName: language.nativeName,
            isDefault: language.isDefault,
            totalTranslations: completedTranslations,
            completedTranslations,
            pendingReview: pendingReview.length,
            autoTranslated: autoTranslated.length,
            completionPercentage
          };
        })
      );

      logger.info('Language statistics retrieved', { 
        languageCount: languageStats.length, 
        totalKeys, 
        entityTypesCount: entityTypes.length 
      });

      return {
        languages: languageStats,
        totalKeys,
        entityTypes
      };
    } catch (error) {
      logger.error('Error getting language statistics', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Get translation keys for navigation
   */
  async getTranslationKeys(
    entityType?: string,
    tenantId?: number
  ): Promise<Array<{
    key: string;
    entityType: string;
    entityId: string;
    translations: Array<{
      id: string;
      languageCode: string;
      value: string;
      isAutoTranslated: boolean;
      needsReview: boolean;
    }>;
  }>> {
    try {
      logger.info('Getting translation keys for navigation', { entityType, tenantId });

      const conditions = [];
      if (tenantId !== undefined) {
        conditions.push(eq(translations.tenantId, tenantId));
      } else {
        conditions.push(isNull(translations.tenantId));
      }

      if (entityType) {
        conditions.push(eq(translations.entityType, entityType));
      }

      // Get all translations
      const allTranslations = await db
        .select()
        .from(translations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(translations.entityType), asc(translations.entityId), asc(translations.key));

      // Group by key, entityType, entityId
      const groupedTranslations = new Map<string, {
        key: string;
        entityType: string;
        entityId: string;
        translations: Array<{
          id: string;
          languageCode: string;
          value: string;
          isAutoTranslated: boolean;
          needsReview: boolean;
        }>;
      }>();

      allTranslations.forEach(translation => {
        const groupKey = `${translation.entityType}:${translation.entityId}:${translation.key}`;

        if (!groupedTranslations.has(groupKey)) {
          groupedTranslations.set(groupKey, {
            key: translation.key,
            entityType: translation.entityType,
            entityId: translation.entityId,
            translations: []
          });
        }

        groupedTranslations.get(groupKey)!.translations.push({
          id: translation.id,
          languageCode: translation.languageCode,
          value: translation.value,
          isAutoTranslated: translation.isAutoTranslated,
          needsReview: translation.needsReview
        });
      });

      const result = Array.from(groupedTranslations.values());

      logger.info('Translation keys retrieved for navigation', { 
        keysCount: result.length,
        entityType,
        tenantId 
      });

      return result;
    } catch (error) {
      logger.error('Error getting translation keys for navigation', { 
        error: error.message, 
        entityType, 
        tenantId 
      });
      throw error;
    }
  }

  /**
   * Clear cache for a specific translation
   */
  private async clearTranslationCache(
    entityType: string,
    entityId: string,
    languageCode: string,
    key: string,
    tenantId?: number
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey('single', tenantId, entityType, entityId, languageCode, key);
      const redis = await getRedisClient();
      await redis.del(cacheKey);
      logger.info('Translation cache cleared', { cacheKey });
    } catch (error) {
      logger.warn('Failed to clear translation cache', { error: error.message });
    }
  }

  /**
   * Clear all translation cache
   */
  private async clearAllTranslationCache(): Promise<void> {
    try {
      const pattern = `cache:*:translations:*`;
      const redis = await getRedisClient();
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('All translation cache cleared', { keysCleared: keys.length });
      }
    } catch (error) {
      logger.warn('Failed to clear all translation cache', { error: error.message });
    }
  }
}

export const translationsService = new TranslationsService(); 