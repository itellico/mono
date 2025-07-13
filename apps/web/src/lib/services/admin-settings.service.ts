/**
 * Admin Settings Service
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Enhanced settings management with caching through API layer
 */

// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { AdminSettingsApiService } from '@/lib/api-clients/admin-settings.api';

interface AdminSetting {
  id: number;
  key: string;
  displayName: string | null;
  description: string | null;
  value: any;
  defaultValue: any;
  category: string;
  level: string;
  governance: string;
  isReadonly: boolean;
  requiresRestart: boolean;
  helpText: string | null;
  tenantId: number | null;
}

// Predefined admin settings for God mode, Developer mode, etc.
const predefinedAdminSettings = [
  {
    key: 'god_mode_enabled',
    displayName: 'God Mode',
    description: 'Allows editing of system-protected entities. Use with extreme caution.',
    value: false,
    defaultValue: false,
    category: 'security' as const,
    level: 'global' as const,
    governance: 'admin_managed' as const,
    isReadonly: false,
    requiresRestart: false,
    helpText: 'When enabled, allows super administrators to edit system-protected tags, categories, and other entities. This setting bypasses normal protection mechanisms and should only be used by experienced administrators.',
    tenantId: null, // Platform-wide setting
  },
  {
    key: 'developer_mode_enabled', 
    displayName: 'Developer Mode',
    description: 'Enables additional debugging features and developer tools.',
    value: false,
    defaultValue: false,
    category: 'general' as const,
    level: 'user' as const,
    governance: 'user_managed' as const,
    isReadonly: false,
    requiresRestart: false,
    helpText: 'Enables developer-specific features like detailed error messages, query debugging, and additional admin tools. Safe to enable for development and testing.',
    tenantId: null,
  },
  {
    key: 'debug_mode_enabled',
    displayName: 'Debug Mode', 
    description: 'Shows detailed error messages and debug information.',
    value: false,
    defaultValue: false,
    category: 'general' as const,
    level: 'global' as const,
    governance: 'admin_managed' as const,
    isReadonly: false,
    requiresRestart: false,
    helpText: 'Enables verbose logging and detailed error messages across the platform. Useful for troubleshooting but may expose sensitive information.',
    tenantId: null,
  },
  {
    key: 'maintenance_mode_enabled',
    displayName: 'Maintenance Mode',
    description: 'Puts the platform in maintenance mode for all users.',
    value: false,
    defaultValue: false,
    category: 'general' as const,
    level: 'global' as const,
    governance: 'admin_managed' as const,
    isReadonly: false,
    requiresRestart: false,
    helpText: 'When enabled, shows a maintenance page to all non-admin users. Admins can still access the platform normally.',
    tenantId: null,
  },
  {
    key: 'max_upload_size_mb',
    displayName: 'Max Upload Size (MB)',
    description: 'Maximum file upload size in megabytes.',
    value: 100,
    defaultValue: 100,
    category: 'media' as const,
    level: 'global' as const,
    governance: 'admin_managed' as const,
    isReadonly: false,
    requiresRestart: false,
    helpText: 'Sets the maximum file size that users can upload. Changes take effect immediately.',
    tenantId: null,
  }
];

export class AdminSettingsService {
  private static readonly CACHE_PREFIX = 'admin:settings';
  private static readonly USER_CACHE_TTL = 15 * 60; // 15 minutes
  private static readonly GLOBAL_CACHE_TTL = 60 * 60; // 1 hour

  /**
   * Get Redis cache key for user settings
   */
  private static getUserCacheKey(userId: number): string {
    return `${this.CACHE_PREFIX}:user:${userId}`;
  }

  /**
   * Get Redis cache key for global settings
   */
  private static getGlobalCacheKey(): string {
    return `${this.CACHE_PREFIX}:global`;
  }

  /**
   * Get Redis cache key for active modes
   */
  private static getActiveModesCacheKey(userId: number): string {
    return `${this.CACHE_PREFIX}:modes:${userId}`;
  }

  /**
   * Initialize predefined settings
   */
  static async initializePredefinedSettings(createdBy: number): Promise<void> {
    try {
      logger.info('Initializing predefined admin settings...');

      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      await AdminSettingsApiService.initializePredefinedSettings(createdBy);

      logger.info('Predefined settings initialization complete');
    } catch (error) {
      logger.error('Failed to initialize predefined settings:', error);
      throw error;
    }
  }

  /**
   * Get all admin settings with filtering
   */
  static async getAdminSettings(filters?: {
    category?: string;
    level?: string;
    tenantId?: number;
    userSpecific?: boolean;
  }): Promise<AdminSetting[]> {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${this.CACHE_PREFIX}:list:${JSON.stringify(filters || {})}`;

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('Retrieved admin settings from cache');
        return JSON.parse(cached);
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const adminSettings = await AdminSettingsApiService.getAdminSettings(filters);

      // Cache the results
      await redis.setex(cacheKey, this.GLOBAL_CACHE_TTL, JSON.stringify(adminSettings));

      logger.info('Retrieved admin settings from API', { count: adminSettings.length });
      return adminSettings;

    } catch (error) {
      logger.error('Failed to get admin settings:', error);
      return [];
    }
  }

  /**
   * Get specific setting value with caching
   */
  static async getSettingValue(key: string, userId?: number, tenantId?: number): Promise<any> {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${this.CACHE_PREFIX}:value:${key}:${userId || 'global'}:${tenantId || 'platform'}`;
      
      // Try cache first
      const cachedValue = await redis.get(cacheKey);
      if (cachedValue !== null) {
        return JSON.parse(cachedValue);
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const value = await AdminSettingsApiService.getSettingValue(key, userId, tenantId);

      // Cache the result
      await redis.setex(cacheKey, this.USER_CACHE_TTL, JSON.stringify(value));

      return value;

    } catch (error) {
      logger.error('Failed to get setting value:', error);
      return null;
    }
  }

  /**
   * Update setting value
   */
  static async updateSettingValue(
    key: string, 
    value: any, 
    userId: number, 
    tenantId?: number,
    reason?: string
  ): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await AdminSettingsApiService.updateSettingValue(key, value, reason, tenantId);

      if (success) {
        // Invalidate cache on successful update
        await this.invalidateCache(userId, key, tenantId);
        logger.info('Setting updated successfully via API', { key, userId, reason });
      }

      return success;

    } catch (error) {
      logger.error('Failed to update setting:', error);
      return false;
    }
  }

  /**
   * Get active modes for user (God mode, Developer mode, etc.)
   */
  static async getActiveModes(userId: number): Promise<{
    godMode: boolean;
    developerMode: boolean;
    debugMode: boolean;
    maintenanceMode: boolean;
  }> {
    try {
      const redis = await getRedisClient();
      const cacheKey = this.getActiveModesCacheKey(userId);

      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const modes = await AdminSettingsApiService.getActiveModes(userId);

      // Cache the results
      await redis.setex(cacheKey, this.USER_CACHE_TTL, JSON.stringify(modes));

      return modes;

    } catch (error) {
      logger.error('Failed to get active modes:', error);
      return {
        godMode: false,
        developerMode: false,
        debugMode: false,
        maintenanceMode: false,
      };
    }
  }

  /**
   * Toggle developer mode for user
   */
  static async toggleDeveloperMode(userId: number, changedBy: number): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await AdminSettingsApiService.toggleDeveloperMode(userId);

      if (success) {
        // Invalidate cache on successful toggle
        await this.invalidateCache(userId, 'developer_mode_enabled');
        logger.info('Developer mode toggled via API', { userId });
      }

      return success;

    } catch (error) {
      logger.error('Failed to toggle developer mode:', error);
      return false;
    }
  }

  /**
   * Invalidate cache
   */
  private static async invalidateCache(userId?: number, key?: string, tenantId?: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const patterns = [];

      // Invalidate specific caches
      if (userId) {
        patterns.push(this.getUserCacheKey(userId));
        patterns.push(this.getActiveModesCacheKey(userId));
      }

      if (key) {
        patterns.push(`${this.CACHE_PREFIX}:value:${key}:*`);
      }

      // Always invalidate global and list caches
      patterns.push(this.getGlobalCacheKey());
      patterns.push(`${this.CACHE_PREFIX}:list:*`);

      // Delete cache keys
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } else {
          await redis.del(pattern);
        }
      }

      logger.info('Cache invalidated', { patterns });

    } catch (error) {
      logger.error('Failed to invalidate cache:', error);
    }
  }
} 