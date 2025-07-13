/**
 * Settings Service
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Manages site settings including God Mode for system entity editing
 */

// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { AdminSettingsApiService } from '@/lib/api-clients/admin-settings.api';

export class SettingsService {
  /**
   * Check if God Mode is enabled for a specific user
   */
  static async isGodModeEnabled(userId: number, tenantId: number | null = null): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const value = await AdminSettingsApiService.getSettingValue('god_mode_enabled', userId, tenantId);

      if (value === null || value === undefined) {
        return false; // Default to disabled if setting doesn't exist
      }

      // Handle boolean conversion
      return typeof value === 'boolean' ? value : Boolean(value);

    } catch (error) {
      logger.error('Failed to check God Mode setting via API:', error);
      return false; // Fail safe - default to disabled
    }
  }

  /**
   * Enable God Mode for a specific user (Super Admin only)
   */
  static async enableGodMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await AdminSettingsApiService.updateSettingValue(
        'god_mode_enabled',
        true,
        'Enable God Mode',
        tenantId
      );

      if (success) {
        logger.info('God Mode enabled via API', { userId, tenantId });
      }

      return success;

    } catch (error) {
      logger.error('Failed to enable God Mode via API:', error);
      return false;
    }
  }

  /**
   * Disable God Mode for a specific user
   */
  static async disableGodMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await AdminSettingsApiService.updateSettingValue(
        'god_mode_enabled',
        false,
        'Disable God Mode',
        tenantId
      );

      if (success) {
        logger.info('God Mode disabled via API', { userId, tenantId });
      }

      return success;

    } catch (error) {
      logger.error('Failed to disable God Mode via API:', error);
      return false;
    }
  }

  /**
   * Toggle God Mode for a specific user
   */
  static async toggleGodMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of manual toggle
      const success = await AdminSettingsApiService.toggleDeveloperMode(userId);
      
      if (success) {
        const newState = await this.isGodModeEnabled(userId, tenantId);
        logger.info('God Mode toggled via API', { userId, tenantId, newState });
        return newState;
      }

      return false;
    } catch (error) {
      logger.error('Failed to toggle God Mode via API:', error);
      // Fallback to manual toggle
      const isCurrentlyEnabled = await this.isGodModeEnabled(userId, tenantId);
      
      if (isCurrentlyEnabled) {
        await this.disableGodMode(userId, tenantId);
        return false;
      } else {
        await this.enableGodMode(userId, tenantId);
        return true;
      }
    }
  }

  /**
   * Check if user can edit system entities (system tags/categories)
   * This combines God Mode check with super admin permission check
   */
  static async canEditSystemEntities(userId: number, userRole: string, tenantId: number | null = null): Promise<boolean> {
    // Only super admins can use God Mode
    if (userRole !== 'super_admin') {
      return false;
    }

    // Check if God Mode is enabled for this user
    return await this.isGodModeEnabled(userId, tenantId);
  }

  // Legacy methods for backward compatibility
  static async isDeveloperModeEnabled(userId: number, tenantId: number | null = null): Promise<boolean> {
    return await this.isGodModeEnabled(userId, tenantId);
  }

  static async enableDeveloperMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    return await this.enableGodMode(userId, tenantId);
  }

  static async disableDeveloperMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    return await this.disableGodMode(userId, tenantId);
  }

  static async toggleDeveloperMode(userId: number, tenantId: number | null = null): Promise<boolean> {
    return await this.toggleGodMode(userId, tenantId);
  }
} 