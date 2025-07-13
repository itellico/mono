import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  llmScopeConfigs,
  llmScopes,
  llmProviders,
  llmApiKeys,
  type LlmScopeConfigWithRelations,
  type LlmPromptRequest
} from '@/lib/schemas/llm-integrations';
import { encrypt, decrypt } from '@/lib/utils/encryption';

// ============================
// LLM RESOLVER SERVICE
// ============================

export class LlmResolver {
  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Get cache key for scope config
   */
  private static getCacheKey(tenantId: number | null, scopeKey: string): string {
    if (tenantId) {
      return `tenant:${tenantId}:llm:config:${scopeKey}`;
    }
    return `platform:llm:config:${scopeKey}`;
  }

  /**
   * Resolve LLM configuration for a given scope and tenant with fallback
   * 1. Try tenant-specific config
   * 2. Fallback to global config (tenant_id = null)
   * 3. Cache result for performance
   */
  static async resolveConfig(
    scopeKey: string,
    tenantId?: number
  ): Promise<LlmScopeConfigWithRelations | null> {
    const cacheKey = this.getCacheKey(tenantId || null, scopeKey);

    try {
      // Try cache first
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.debug({ scopeKey, tenantId, cacheKey }, 'LLM config cache hit');
        return JSON.parse(cached) as LlmScopeConfigWithRelations;
      }

      logger.debug({ scopeKey, tenantId }, 'LLM config cache miss, querying database');

      // First, try tenant-specific config
      let config: LlmScopeConfigWithRelations | null = null;

      if (tenantId) {
        config = await this.queryConfigFromDb(scopeKey, tenantId);
      }

      // Fallback to global config if no tenant-specific config found
      if (!config) {
        config = await this.queryConfigFromDb(scopeKey, null);
      }

      if (config) {
        // Decrypt API key before caching (but remove it from cache for security)
        if (config.apiKey.apiKey) {
          config.apiKey.apiKey = await decrypt(config.apiKey.apiKey);
        }

        // Cache without sensitive data
        const cacheData = {
          ...config,
          apiKey: {
            ...config.apiKey,
            apiKey: '[REDACTED]' // Don't cache the actual key
          }
        };

        await redis.set(cacheKey, JSON.stringify(cacheData), 'EX', this.CACHE_TTL);
        logger.info({ scopeKey, tenantId, configId: config.id }, 'LLM config resolved and cached');
      } else {
        logger.warn({ scopeKey, tenantId }, 'No LLM config found for scope');
      }

      return config;

    } catch (error) {
      logger.error({ error: error.message, scopeKey, tenantId }, 'Failed to resolve LLM config');
      throw error;
    }
  }

  /**
   * Query config from database with relations
   */
  private static async queryConfigFromDb(
    scopeKey: string,
    tenantId: number | null
  ): Promise<LlmScopeConfigWithRelations | null> {
    try {
      const result = await db
        .select({
          id: llmScopeConfigs.id,
          uuid: llmScopeConfigs.uuid,
          tenantId: llmScopeConfigs.tenantId,
          scopeId: llmScopeConfigs.scopeId,
          providerId: llmScopeConfigs.providerId,
          apiKeyId: llmScopeConfigs.apiKeyId,
          modelName: llmScopeConfigs.modelName,
          promptTemplate: llmScopeConfigs.promptTemplate,
          temperature: llmScopeConfigs.temperature,
          maxTokens: llmScopeConfigs.maxTokens,
          topP: llmScopeConfigs.topP,
          frequencyPenalty: llmScopeConfigs.frequencyPenalty,
          presencePenalty: llmScopeConfigs.presencePenalty,
          metadata: llmScopeConfigs.metadata,
          isActive: llmScopeConfigs.isActive,
          createdAt: llmScopeConfigs.createdAt,
          updatedAt: llmScopeConfigs.updatedAt,
          createdBy: llmScopeConfigs.createdBy,
          updatedBy: llmScopeConfigs.updatedBy,
          // Scope relation
          scope: {
            id: llmScopes.id,
            uuid: llmScopes.uuid,
            key: llmScopes.key,
            label: llmScopes.label,
            description: llmScopes.description,
            category: llmScopes.category,
            defaultSettings: llmScopes.defaultSettings,
            isActive: llmScopes.isActive,
            createdAt: llmScopes.createdAt,
            updatedAt: llmScopes.updatedAt,
          },
          // Provider relation
          provider: {
            id: llmProviders.id,
            uuid: llmProviders.uuid,
            name: llmProviders.name,
            description: llmProviders.description,
            apiBaseUrl: llmProviders.apiBaseUrl,
            supportedModels: llmProviders.supportedModels,
            metadata: llmProviders.metadata,
            isActive: llmProviders.isActive,
            createdAt: llmProviders.createdAt,
            updatedAt: llmProviders.updatedAt,
          },
          // API Key relation (excluding sensitive data for cache)
          apiKey: {
            id: llmApiKeys.id,
            uuid: llmApiKeys.uuid,
            tenantId: llmApiKeys.tenantId,
            providerId: llmApiKeys.providerId,
            name: llmApiKeys.name,
            apiKey: llmApiKeys.apiKey, // Will be decrypted and handled securely
            metadata: llmApiKeys.metadata,
            isActive: llmApiKeys.isActive,
            expiresAt: llmApiKeys.expiresAt,
            lastUsedAt: llmApiKeys.lastUsedAt,
            createdAt: llmApiKeys.createdAt,
            updatedAt: llmApiKeys.updatedAt,
            createdBy: llmApiKeys.createdBy,
          }
        })
        .from(llmScopeConfigs)
        .innerJoin(llmScopes, eq(llmScopeConfigs.scopeId, llmScopes.id))
        .innerJoin(llmProviders, eq(llmScopeConfigs.providerId, llmProviders.id))
        .innerJoin(llmApiKeys, eq(llmScopeConfigs.apiKeyId, llmApiKeys.id))
        .where(
          and(
            eq(llmScopes.key, scopeKey),
            eq(llmScopes.isActive, true),
            eq(llmScopeConfigs.isActive, true),
            eq(llmProviders.isActive, true),
            eq(llmApiKeys.isActive, true),
            tenantId ? eq(llmScopeConfigs.tenantId, tenantId) : isNull(llmScopeConfigs.tenantId)
          )
        )
        .limit(1);

      return result.length > 0 ? result[0] as LlmScopeConfigWithRelations : null;

    } catch (error) {
      logger.error({ error: error.message, scopeKey, tenantId }, 'Database query failed for LLM config');
      throw error;
    }
  }

  /**
   * Invalidate cache for specific scope and tenant
   */
  static async invalidateCache(scopeKey: string, tenantId?: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getCacheKey(tenantId || null, scopeKey);

      await redis.del(cacheKey);
      logger.info({ scopeKey, tenantId }, 'LLM config cache invalidated');

    } catch (error) {
      logger.error({ error: error.message, scopeKey, tenantId }, 'Failed to invalidate LLM config cache');
    }
  }

  /**
   * Invalidate all LLM config cache for a tenant
   */
  static async invalidateTenantCache(tenantId?: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `llm:config:${tenantId || 'global'}:*`;

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info({ tenantId, keysInvalidated: keys.length }, 'LLM config tenant cache invalidated');
      }

    } catch (error) {
      logger.error({ error: error.message, tenantId }, 'Failed to invalidate tenant LLM config cache');
    }
  }

  /**
   * Get resolved config with decrypted API key (use carefully!)
   */
  static async getConfigWithApiKey(
    scopeKey: string,
    tenantId?: number
  ): Promise<LlmScopeConfigWithRelations | null> {
    const config = await this.resolveConfig(scopeKey, tenantId);

    if (!config) {
      return null;
    }

    // If we got it from cache, we need to fetch the actual API key from database
    if (config.apiKey.apiKey === '[REDACTED]') {
      try {
        const apiKeyResult = await db
          .select({ apiKey: llmApiKeys.apiKey })
          .from(llmApiKeys)
          .where(eq(llmApiKeys.id, config.apiKeyId))
          .limit(1);

        if (apiKeyResult.length > 0) {
          config.apiKey.apiKey = await decrypt(apiKeyResult[0].apiKey);
        }

      } catch (error) {
        logger.error({ error: error.message, apiKeyId: config.apiKeyId }, 'Failed to decrypt API key');
        throw error;
      }
    }

    return config;
  }

  /**
   * Validate prompt request
   */
  static validatePromptRequest(request: LlmPromptRequest): void {
    if (!request.scope) {
      throw new Error('Scope is required');
    }

    if (!request.variables || typeof request.variables !== 'object') {
      throw new Error('Variables must be a valid object');
    }
  }

  /**
   * Process prompt template with variables
   */
  static processPromptTemplate(template: string, variables: Record<string, any>): string {
    let processedTemplate = template;

    // Replace {{variable}} patterns with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedTemplate = processedTemplate.replace(pattern, String(value || ''));
    });

    // Check for unreplaced variables
    const unreplacedVariables = processedTemplate.match(/\{\{\s*[^}]+\s*\}\}/g);
    if (unreplacedVariables) {
      logger.warn({ unreplacedVariables }, 'Prompt template contains unreplaced variables');
    }

    return processedTemplate;
  }
}

// Export for convenience
export { LlmResolver as llmResolver }; 