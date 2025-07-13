import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Type-safe setting definitions
export const SETTING_KEYS = {
  // Localization
  DEFAULT_LOCALE: 'default_locale',
  SUPPORTED_LOCALES: 'supported_locales',
  FORCE_LOCALE_FROM_DOMAIN: 'force_locale_from_domain',

  // Upload
  MAX_FILE_SIZE_MB: 'max_file_size_mb',
  ALLOWED_IMAGE_TYPES: 'allowed_image_types',
  ALLOWED_DOCUMENT_TYPES: 'allowed_document_types',
  MIN_IMAGE_RESOLUTION: 'min_image_resolution',
  AUTO_GENERATE_THUMBNAILS: 'auto_generate_thumbnails',

  // Security
  SESSION_TIMEOUT_MINUTES: 'session_timeout_minutes',
  REQUIRE_EMAIL_VERIFICATION: 'require_email_verification',
  MAX_LOGIN_ATTEMPTS: 'max_login_attempts',

  // Email
  SMTP_FROM_ADDRESS: 'smtp_from_address',
  EMAIL_VERIFICATION_REQUIRED: 'email_verification_required',

  // UI
  DEFAULT_THEME: 'default_theme',
  ENABLE_DARK_MODE: 'enable_dark_mode',
  ITEMS_PER_PAGE: 'items_per_page',

  // Business
  MODEL_APPROVAL_REQUIRED: 'model_approval_required',
  AUTO_APPROVE_PHOTOS_THRESHOLD: 'auto_approve_photos_threshold',
  CURRENCY_OPTIONS: 'currency_options'
} as const;

// Type definitions for settings
export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

export type SettingValue<T extends SettingKey> = 
  T extends 'default_locale' ? string :
  T extends 'supported_locales' ? string[] :
  T extends 'force_locale_from_domain' ? boolean :
  T extends 'max_file_size_mb' ? number :
  T extends 'allowed_image_types' ? string[] :
  T extends 'allowed_document_types' ? string[] :
  T extends 'min_image_resolution' ? { width: number; height: number } :
  T extends 'auto_generate_thumbnails' ? boolean :
  T extends 'session_timeout_minutes' ? number :
  T extends 'require_email_verification' ? boolean :
  T extends 'max_login_attempts' ? number :
  T extends 'smtp_from_address' ? string :
  T extends 'email_verification_required' ? boolean :
  T extends 'default_theme' ? 'light' | 'dark' | 'system' :
  T extends 'enable_dark_mode' ? boolean :
  T extends 'items_per_page' ? number :
  T extends 'model_approval_required' ? boolean :
  T extends 'auto_approve_photos_threshold' ? number :
  T extends 'currency_options' ? string[] :
  any;

// Default values for settings
export const SETTING_DEFAULTS: { [K in SettingKey]: SettingValue<K> } = {
  // Localization
  [SETTING_KEYS.DEFAULT_LOCALE]: 'en-US',
  [SETTING_KEYS.SUPPORTED_LOCALES]: ['en-US', 'de-DE'],
  [SETTING_KEYS.FORCE_LOCALE_FROM_DOMAIN]: false,

  // Upload  
  [SETTING_KEYS.MAX_FILE_SIZE_MB]: 50,
  [SETTING_KEYS.ALLOWED_IMAGE_TYPES]: ['jpg', 'jpeg', 'png', 'webp'],
  [SETTING_KEYS.ALLOWED_DOCUMENT_TYPES]: ['pdf'],
  [SETTING_KEYS.MIN_IMAGE_RESOLUTION]: { width: 800, height: 1000 },
  [SETTING_KEYS.AUTO_GENERATE_THUMBNAILS]: true,

  // Security
  [SETTING_KEYS.SESSION_TIMEOUT_MINUTES]: 60,
  [SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION]: true,
  [SETTING_KEYS.MAX_LOGIN_ATTEMPTS]: 5,

  // Email
  [SETTING_KEYS.SMTP_FROM_ADDRESS]: 'noreply@gocast.com',
  [SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED]: true,

  // UI
  [SETTING_KEYS.DEFAULT_THEME]: 'system',
  [SETTING_KEYS.ENABLE_DARK_MODE]: true,
  [SETTING_KEYS.ITEMS_PER_PAGE]: 20,

  // Business
  [SETTING_KEYS.MODEL_APPROVAL_REQUIRED]: true,
  [SETTING_KEYS.AUTO_APPROVE_PHOTOS_THRESHOLD]: 3,
  [SETTING_KEYS.CURRENCY_OPTIONS]: ['EUR', 'USD', 'GBP']
};

// Setting Manager using Prisma
export class SettingManager {
  private static instance: SettingManager;

  private constructor() {}

  public static getInstance(): SettingManager {
    if (!SettingManager.instance) {
      SettingManager.instance = new SettingManager();
    }
    return SettingManager.instance;
  }

  /**
   * Get a setting value
   * @param key - Setting key
   * @param tenantId - Tenant ID (null for global settings)
   * @returns Setting value or default
   */
  async get<K extends SettingKey>(
    key: K, 
    tenantId?: number | null
  ): Promise<SettingValue<K>> {
    try {
      const setting = await db.siteSettings.findFirst({
        where: {
          key,
          tenantId: tenantId || null,
          isActive: true
        }
      });

      if (!setting) {
        return SETTING_DEFAULTS[key];
      }

      // Parse the value based on type
      const value = setting.value;
      
      // Try to parse as JSON first (for arrays and objects)
      try {
        return JSON.parse(value as string);
      } catch {
        // If not JSON, check if it's a boolean
        if (value === 'true') return true as SettingValue<K>;
        if (value === 'false') return false as SettingValue<K>;
        
        // Check if it's a number
        const num = Number(value);
        if (!isNaN(num)) return num as SettingValue<K>;
        
        // Otherwise return as string
        return value as SettingValue<K>;
      }
    } catch (error) {
      logger.error('Error getting setting', { key, tenantId, error });
      return SETTING_DEFAULTS[key];
    }
  }

  /**
   * Get all settings for a tenant
   * @param tenantId - Tenant ID (null for global settings)
   * @returns Map of settings
   */
  async getAll(tenantId?: number | null): Promise<Record<string, any>> {
    try {
      const settings = await db.siteSettings.findMany({
        where: {
          tenantId: tenantId || null,
          isActive: true
        }
      });

      const result: Record<string, any> = {};

      // Add defaults first
      for (const [key, defaultValue] of Object.entries(SETTING_DEFAULTS)) {
        result[key] = defaultValue;
      }

      // Override with actual settings
      for (const setting of settings) {
        try {
          result[setting.key] = JSON.parse(setting.value as string);
        } catch {
          // Handle non-JSON values
          const value = setting.value;
          if (value === 'true') result[setting.key] = true;
          else if (value === 'false') result[setting.key] = false;
          else {
            const num = Number(value);
            result[setting.key] = !isNaN(num) ? num : value;
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting all settings', { tenantId, error });
      return SETTING_DEFAULTS;
    }
  }

  /**
   * Set a setting value
   * @param key - Setting key
   * @param value - Setting value
   * @param tenantId - Tenant ID (null for global settings)
   * @param modifiedBy - User who modified the setting
   */
  async set<K extends SettingKey>(
    key: K,
    value: SettingValue<K>,
    tenantId?: number | null,
    modifiedBy?: string
  ): Promise<void> {
    try {
      // Convert value to string for storage
      const stringValue = typeof value === 'object' 
        ? JSON.stringify(value)
        : String(value);

      // Check if setting exists
      const existing = await db.siteSettings.findFirst({
        where: {
          key,
          tenantId: tenantId || null
        }
      });

      if (existing) {
        // Update existing
        await db.siteSettings.update({
          where: {
            id: existing.id
          },
          data: {
            value: stringValue,
            lastModifiedBy: modifiedBy,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new
        await db.siteSettings.create({
          data: {
            tenantId: tenantId || null,
            category: this.getCategoryForKey(key),
            key,
            value: stringValue,
            defaultValue: JSON.stringify(SETTING_DEFAULTS[key]),
            description: this.getDescriptionForKey(key),
            isRequired: true,
            isSecret: this.isSecretKey(key),
            requiresRestart: this.requiresRestart(key),
            level: tenantId ? 'tenant' : 'global',
            governance: 'admin_managed',
            isActive: true,
            lastModifiedBy: modifiedBy,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      logger.info('Setting updated', { key, tenantId, modifiedBy });
    } catch (error) {
      logger.error('Error setting value', { key, value, tenantId, error });
      throw error;
    }
  }

  /**
   * Reset a setting to its default value
   * @param key - Setting key
   * @param tenantId - Tenant ID (null for global settings)
   */
  async reset<K extends SettingKey>(
    key: K,
    tenantId?: number | null
  ): Promise<void> {
    try {
      await db.siteSettings.deleteMany({
        where: {
          key,
          tenantId: tenantId || null
        }
      });

      logger.info('Setting reset to default', { key, tenantId });
    } catch (error) {
      logger.error('Error resetting setting', { key, tenantId, error });
      throw error;
    }
  }

  /**
   * Get the category for a setting key
   */
  private getCategoryForKey(key: SettingKey): string {
    if (key.includes('locale') || key.includes('LOCALE')) return 'localization';
    if (key.includes('file') || key.includes('image') || key.includes('upload')) return 'media';
    if (key.includes('email') || key.includes('smtp')) return 'email';
    if (key.includes('theme') || key.includes('dark')) return 'ui';
    if (key.includes('timeout') || key.includes('verification') || key.includes('login')) return 'security';
    return 'business';
  }

  /**
   * Get the description for a setting key
   */
  private getDescriptionForKey(key: SettingKey): string {
    const descriptions: Record<SettingKey, string> = {
      [SETTING_KEYS.DEFAULT_LOCALE]: 'Default language/locale for the platform',
      [SETTING_KEYS.SUPPORTED_LOCALES]: 'List of supported languages/locales',
      [SETTING_KEYS.FORCE_LOCALE_FROM_DOMAIN]: 'Force locale based on domain',
      [SETTING_KEYS.MAX_FILE_SIZE_MB]: 'Maximum file upload size in MB',
      [SETTING_KEYS.ALLOWED_IMAGE_TYPES]: 'Allowed image file extensions',
      [SETTING_KEYS.ALLOWED_DOCUMENT_TYPES]: 'Allowed document file extensions',
      [SETTING_KEYS.MIN_IMAGE_RESOLUTION]: 'Minimum image resolution requirements',
      [SETTING_KEYS.AUTO_GENERATE_THUMBNAILS]: 'Automatically generate image thumbnails',
      [SETTING_KEYS.SESSION_TIMEOUT_MINUTES]: 'Session timeout duration in minutes',
      [SETTING_KEYS.REQUIRE_EMAIL_VERIFICATION]: 'Require email verification for new users',
      [SETTING_KEYS.MAX_LOGIN_ATTEMPTS]: 'Maximum failed login attempts before lockout',
      [SETTING_KEYS.SMTP_FROM_ADDRESS]: 'Default from address for emails',
      [SETTING_KEYS.EMAIL_VERIFICATION_REQUIRED]: 'Email verification required for accounts',
      [SETTING_KEYS.DEFAULT_THEME]: 'Default UI theme',
      [SETTING_KEYS.ENABLE_DARK_MODE]: 'Enable dark mode option',
      [SETTING_KEYS.ITEMS_PER_PAGE]: 'Default number of items per page',
      [SETTING_KEYS.MODEL_APPROVAL_REQUIRED]: 'Require admin approval for new models',
      [SETTING_KEYS.AUTO_APPROVE_PHOTOS_THRESHOLD]: 'Number of approved photos before auto-approval',
      [SETTING_KEYS.CURRENCY_OPTIONS]: 'Available currency options'
    };
    return descriptions[key] || `Setting for ${key}`;
  }

  /**
   * Check if a key contains sensitive information
   */
  private isSecretKey(key: SettingKey): boolean {
    return key.includes('password') || key.includes('secret') || key.includes('key');
  }

  /**
   * Check if changing a setting requires a restart
   */
  private requiresRestart(key: SettingKey): boolean {
    return key.includes('smtp') || key.includes('timeout');
  }
}

// Export singleton instance
export const settingManager = SettingManager.getInstance();