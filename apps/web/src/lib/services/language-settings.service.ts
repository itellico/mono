/**
 * Language Settings Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All language settings operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Language Settings Interface
 * Manages default source language and other language preferences
 */
export interface LanguageSettings {
  code: string;
  tenantId: string | null;
  sourceLanguageCode: string;
  fallbackLanguageCode: string;
  autoTranslateEnabled: boolean;
  qualityThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Language Settings Service
 * 
 * Manages centralized language configuration following cursor rules:
 * - Redis caching with proper tenant isolation
 * - Service layer pattern with API integration
 * - Proper error handling and logging
 */
class LanguageSettingsService {
  private readonly CACHE_TTL = 30 * 60; // 30 minutes
  private readonly DEFAULT_SOURCE_LANGUAGE = 'en-US';
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Get cache key for language settings
   */
  private getCacheKey(tenantId?: number): string {
    const tenant = tenantId ? tenantId.toString() : 'global';
    return `cache:${tenant}:language-settings`;
  }

  /**
   * Get language settings for tenant or global
   */
  async getLanguageSettings(tenantId?: number): Promise<LanguageSettings> {
    const cacheKey = this.getCacheKey(tenantId);

    try {
      // Try Redis cache first
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.info('Language settings cache hit', { tenantId, cacheKey });
        return JSON.parse(cached);
      }

      // Query API
      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v2/admin/language-settings?tenantId=${tenantId}`
        : `${this.API_BASE_URL}/api/v2/admin/language-settings`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch language settings: ${response.statusText}`);
      }

      const data = await response.json();
      const settings = data.data || data;

      // Cache the result
      try {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(settings));
      } catch (cacheError) {
        logger.warn('Failed to cache language settings', { error: cacheError });
      }

      logger.info('Language settings loaded and cached', { tenantId, sourceLanguage: settings.sourceLanguageCode });

      return settings;

    } catch (error) {
      logger.error('Error getting language settings', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      });

      // Return fallback settings
      return {
        code: this.DEFAULT_SOURCE_LANGUAGE,
        tenantId: tenantId ? tenantId.toString() : null,
        sourceLanguageCode: this.DEFAULT_SOURCE_LANGUAGE,
        fallbackLanguageCode: this.DEFAULT_SOURCE_LANGUAGE,
        autoTranslateEnabled: false,
        qualityThreshold: 0.8,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Update language settings
   */
  async updateLanguageSettings(
    tenantId: number | undefined,
    settings: Partial<LanguageSettings>
  ): Promise<LanguageSettings> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v2/admin/language-settings?tenantId=${tenantId}`
        : `${this.API_BASE_URL}/api/v2/admin/language-settings`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Failed to update language settings: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedSettings = data.data || data;

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Language settings updated', { tenantId, updatedSettings });

      return updatedSettings;

    } catch (error) {
      logger.error('Error updating language settings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        settings
      });
      throw error;
    }
  }

  /**
   * Get source language code
   */
  async getSourceLanguageCode(tenantId?: number): Promise<string> {
    const settings = await this.getLanguageSettings(tenantId);
    return settings.sourceLanguageCode;
  }

  /**
   * Get fallback language code
   */
  async getFallbackLanguageCode(tenantId?: number): Promise<string> {
    const settings = await this.getLanguageSettings(tenantId);
    return settings.fallbackLanguageCode;
  }

  /**
   * Check if auto-translate is enabled
   */
  async isAutoTranslateEnabled(tenantId?: number): Promise<boolean> {
    const settings = await this.getLanguageSettings(tenantId);
    return settings.autoTranslateEnabled;
  }

  /**
   * Get quality threshold
   */
  async getQualityThreshold(tenantId?: number): Promise<number> {
    const settings = await this.getLanguageSettings(tenantId);
    return settings.qualityThreshold;
  }

  /**
   * Get all available languages
   */
  async getAvailableLanguages(): Promise<Array<{ code: string; name: string; nativeName: string }>> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/languages`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available languages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Error getting available languages', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return default languages
      return [
        { code: 'en-US', name: 'English', nativeName: 'English' },
        { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr-FR', name: 'French', nativeName: 'Français' },
        { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
      ];
    }
  }

  /**
   * Set source language
   */
  async setSourceLanguage(tenantId: number | undefined, languageCode: string): Promise<void> {
    await this.updateLanguageSettings(tenantId, { sourceLanguageCode: languageCode });
  }

  /**
   * Set fallback language
   */
  async setFallbackLanguage(tenantId: number | undefined, languageCode: string): Promise<void> {
    await this.updateLanguageSettings(tenantId, { fallbackLanguageCode: languageCode });
  }

  /**
   * Toggle auto-translate
   */
  async setAutoTranslateEnabled(tenantId: number | undefined, enabled: boolean): Promise<void> {
    await this.updateLanguageSettings(tenantId, { autoTranslateEnabled: enabled });
  }

  /**
   * Set quality threshold
   */
  async setQualityThreshold(tenantId: number | undefined, threshold: number): Promise<void> {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Quality threshold must be between 0 and 1');
    }
    await this.updateLanguageSettings(tenantId, { qualityThreshold: threshold });
  }

  /**
   * Invalidate cached language settings
   */
  async invalidateCache(tenantId?: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getCacheKey(tenantId);
      await redis.del(cacheKey);
      
      logger.info('Language settings cache invalidated', { tenantId, cacheKey });
    } catch (error) {
      logger.warn('Failed to invalidate language settings cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
    }
  }

  /**
   * Invalidate all language settings cache
   */
  async invalidateAllCache(): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = 'cache:*:language-settings';
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('All language settings cache invalidated', { keysDeleted: keys.length });
      }
    } catch (error) {
      logger.warn('Failed to invalidate all language settings cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export singleton instance
export const languageSettingsService = new LanguageSettingsService();