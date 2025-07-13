// ============================
// HIERARCHICAL SETTINGS SERVICE
// ============================
// Manages multi-level settings with super admin constraints and tenant admin flexibility

import { eq, and, or, isNull } from 'drizzle-orm';
import * as schema from '@/lib/schema';
import { siteSettings, tenants } from '@/lib/schema';
import { logger } from './logger';
import { db } from './db';

// ============================
// TYPES & INTERFACES
// ============================

export interface SettingConstraints {
  maxValue?: any;
  minValue?: any;
  allowedValues?: any[];
  allowedFormats?: string[];
  requiresApproval?: boolean;
}

export interface EffectiveSettingValue {
  value: any;
  source: 'global' | 'tenant' | 'computed';
  isOverridden: boolean;
  constraints?: SettingConstraints;
  metadata: {
    lastModifiedBy?: number;
    lastModified?: Date;
    approvedBy?: number;
    approvedAt?: Date;
  };
}

export interface SettingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================
// HIERARCHICAL SETTINGS SERVICE
// ============================

export class HierarchicalSettingsService {
  private tenantId?: number;
  private userId?: number;

  constructor(tenantId?: number, userId?: number) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  /**
   * Helper method to parse stored values
   */
  private parseValue(value: string | null): any {
    if (value === null || value === undefined) return null;

    try {
      // Try to parse as JSON first
      return JSON.parse(value);
    } catch {
      // If parsing fails, return as string
      return value;
    }
  }

  // ============================
  // CORE RETRIEVAL METHODS
  // ============================

  /**
   * Get a setting value with proper hierarchy
   * Global → Tenant → User precedence
   */
  async getSetting(key: string, category: string = 'general'): Promise<any> {
    try {
      // Check user-level setting first (highest precedence)
      if (this.userId) {
        const userSetting = await db.query.siteSettings.findFirst({
          where: and(
            eq(siteSettings.key, key),
            eq(siteSettings.category, category as any),
            eq(siteSettings.lastModifiedBy, this.userId!),
            eq(siteSettings.tenantId, this.tenantId!)
          )
        });
        if (userSetting?.value !== null) {
          return this.parseValue(userSetting.value as string);
        }
      }

      // Check tenant-level setting (medium precedence)
      if (this.tenantId) {
        const tenantSetting = await db.query.siteSettings.findFirst({
          where: and(
            eq(siteSettings.key, key),
            eq(siteSettings.category, category as any),
            eq(siteSettings.tenantId, this.tenantId)
          )
        });
        if (tenantSetting?.value !== null) {
          return this.parseValue(tenantSetting.value as string);
        }
      }

      // Check global setting (lowest precedence)
      const globalSetting = await db.query.siteSettings.findFirst({
        where: and(
          eq(siteSettings.key, key),
          eq(siteSettings.category, category as any),
          isNull(siteSettings.tenantId)
        )
      });
      if (globalSetting?.value !== null) {
        return this.parseValue(globalSetting.value as string);
      }

      return null;
    } catch (error) {
      logger.error('Failed to get setting', { key, category, error: error.message });
      return null;
    }
  }

  /**
   * Get effective setting with inheritance (for backward compatibility)
   */
  async getEffectiveSetting(category: string, key: string, tenantId?: number): Promise<any> {
    const oldTenantId = this.tenantId;
    if (tenantId) {
      this.tenantId = tenantId;
    }

    try {
      return await this.getSetting(key, category);
    } finally {
      this.tenantId = oldTenantId;
    }
  }

  /**
   * Get multiple settings for a tenant with inheritance
   */
  async getTenantSettings(tenantId: number, category?: string): Promise<Record<string, EffectiveSettingValue>> {
    try {
      const result: Record<string, EffectiveSettingValue> = {};

      // Get all tenant settings
      const tenantSettings = await db.query.siteSettings.findMany({
        where: and(
          eq(siteSettings.tenantId, tenantId),
          category ? eq(siteSettings.category, category as any) : undefined,
          eq(siteSettings.isActive, true)
        )
      });

      // Get all global settings for inheritance
      const globalSettings = await db.query.siteSettings.findMany({
        where: and(
          isNull(siteSettings.tenantId),
          category ? eq(siteSettings.category, category as any) : undefined,
          eq(siteSettings.isActive, true)
        )
      });

      // Process tenant overrides
      for (const setting of tenantSettings) {
        const settingKey = `${setting.category}.${setting.key}`;
        const globalSetting = globalSettings.find(
          g => g.category === setting.category && g.key === setting.key
        );

        result[settingKey] = {
          value: setting.value,
          source: 'tenant',
          isOverridden: true,
          constraints: this.extractConstraints(globalSetting),
          metadata: {
            lastModifiedBy: setting.lastModifiedBy || undefined,
            lastModified: setting.updatedAt || undefined,
            approvedBy: setting.approvedBy || undefined,
            approvedAt: setting.approvedAt || undefined
          }
        };
      }

      // Add global settings that aren't overridden
      for (const setting of globalSettings) {
        const settingKey = `${setting.category}.${setting.key}`;
        if (!result[settingKey]) {
          result[settingKey] = {
            value: setting.value,
            source: 'global',
            isOverridden: false,
            constraints: this.extractConstraints(setting),
            metadata: {
              lastModifiedBy: setting.lastModifiedBy || undefined,
              lastModified: setting.updatedAt || undefined,
              approvedBy: setting.approvedBy || undefined,
              approvedAt: setting.approvedAt || undefined
            }
          };
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting tenant settings', {
        tenantId,
        category,
        error: error.message
      });
      throw error;
    }
  }

  // ============================
  // VALIDATION METHODS
  // ============================

  /**
   * Validate tenant setting against global constraints
   */
  async validateTenantSetting(
    category: string,
    key: string,
    value: any,
    tenantId: number
  ): Promise<SettingValidationResult> {
    try {
      const result: SettingValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Get global constraints
      const globalSetting = await db.query.siteSettings.findFirst({
        where: and(
          isNull(siteSettings.tenantId),
          eq(siteSettings.category, category as any),
          eq(siteSettings.key, key)
        )
      });

      if (!globalSetting) {
        result.errors.push(`No global setting found for ${category}.${key}`);
        result.isValid = false;
        return result;
      }

      // Check governance permissions
      if (globalSetting.governance === 'super_admin_only') {
        result.errors.push(`Setting ${category}.${key} can only be modified by super admin`);
        result.isValid = false;
        return result;
      }

      // Validate against maxValue
      if (globalSetting.maxValue !== null && typeof value === 'number') {
        const maxValue = globalSetting.maxValue as number;
        if (value > maxValue) {
          result.errors.push(`Value ${value} exceeds maximum allowed value ${maxValue}`);
          result.isValid = false;
        }
      }

      // Validate against minValue
      if (globalSetting.minValue !== null && typeof value === 'number') {
        const minValue = globalSetting.minValue as number;
        if (value < minValue) {
          result.errors.push(`Value ${value} is below minimum allowed value ${minValue}`);
          result.isValid = false;
        }
      }

      // Validate against allowedValues
      if (globalSetting.allowedValues && Array.isArray(globalSetting.allowedValues)) {
        const allowedValues = globalSetting.allowedValues;
        if (Array.isArray(value)) {
          // Check if all values in array are allowed
          const invalidValues = value.filter(v => !allowedValues.includes(v));
          if (invalidValues.length > 0) {
            result.errors.push(`Invalid values: ${invalidValues.join(', ')}. Allowed: ${allowedValues.join(', ')}`);
            result.isValid = false;
          }
        } else {
          // Check single value
          if (!allowedValues.includes(value)) {
            result.errors.push(`Value ${value} not in allowed values: ${allowedValues.join(', ')}`);
            result.isValid = false;
          }
        }
      }

      // Validate against allowedFormats (for file types)
      if (globalSetting.allowedFormats && Array.isArray(globalSetting.allowedFormats) && Array.isArray(value)) {
        const allowedFormats = globalSetting.allowedFormats;
        const invalidFormats = value.filter(v => !allowedFormats.includes(v));
        if (invalidFormats.length > 0) {
          result.errors.push(`Invalid formats: ${invalidFormats.join(', ')}. Allowed: ${allowedFormats.join(', ')}`);
          result.isValid = false;
        }
      }

      // JSON Schema validation
      if (globalSetting.validationSchema) {
        // TODO: Implement JSON schema validation
        // This would require a JSON schema validator library
        result.warnings.push('JSON schema validation not yet implemented');
      }

      // Check if requires approval
      if (globalSetting.requiresApproval) {
        result.warnings.push('This setting change requires super admin approval');
      }

      return result;
    } catch (error) {
      logger.error('Error validating tenant setting', {
        category,
        key,
        value,
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  // ============================
  // UPDATE METHODS
  // ============================

  /**
   * Update tenant setting with proper validation
   */
  async updateTenantSetting(
    category: string,
    key: string,
    value: any,
    tenantId: number,
    modifiedBy: number
  ): Promise<{ success: boolean; requiresApproval: boolean; errors: string[] }> {
    try {
      // Validate the setting
      const validation = await this.validateTenantSetting(category, key, value, tenantId);

      if (!validation.isValid) {
        return {
          success: false,
          requiresApproval: false,
          errors: validation.errors
        };
      }

      // Get global setting for reference
      const globalSetting = await db.query.siteSettings.findFirst({
        where: and(
          isNull(siteSettings.tenantId),
          eq(siteSettings.category, category as any),
          eq(siteSettings.key, key)
        )
      });

      const requiresApproval = globalSetting?.requiresApproval || false;

      // Check if tenant setting already exists
      const existingTenantSetting = await db.query.siteSettings.findFirst({
        where: and(
          eq(siteSettings.tenantId, tenantId),
          eq(siteSettings.category, category as any),
          eq(siteSettings.key, key)
        )
      });

      if (existingTenantSetting) {
        // Update existing setting
        await db.update(siteSettings)
          .set({
            value,
            lastModifiedBy: modifiedBy,
            updatedAt: new Date(),
            // Clear approval if value changed and requires approval
            approvedBy: requiresApproval && value !== existingTenantSetting.value ? null : existingTenantSetting.approvedBy,
            approvedAt: requiresApproval && value !== existingTenantSetting.value ? null : existingTenantSetting.approvedAt
          })
          .where(eq(siteSettings.id, existingTenantSetting.id));
      } else {
        // Create new tenant setting
        await db.insert(siteSettings).values({
          tenantId,
          category: category as any,
          key,
          level: 'tenant',
          governance: 'tenant_admin',
          value,
          parentSettingId: globalSetting?.id,
          overridesGlobal: true,
          description: `Tenant override for ${category}.${key}`,
          displayName: globalSetting?.displayName || key,
          helpText: globalSetting?.helpText,
          validationSchema: globalSetting?.validationSchema,
          requiresApproval,
          lastModifiedBy: modifiedBy,
          isActive: true
        });
      }

      logger.info('Tenant setting updated', {
        category,
        key,
        value,
        tenantId,
        modifiedBy,
        requiresApproval
      });

      return {
        success: true,
        requiresApproval,
        errors: []
      };
    } catch (error) {
      logger.error('Error updating tenant setting', {
        category,
        key,
        value,
        tenantId,
        modifiedBy,
        error: error.message
      });

      return {
        success: false,
        requiresApproval: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Approve pending tenant setting change (super admin only)
   */
  async approveTenantSetting(
    settingId: number,
    approvedBy: number
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      await db.update(siteSettings)
        .set({
          approvedBy,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(siteSettings.id, settingId));

      logger.info('Tenant setting approved', {
        settingId,
        approvedBy
      });

      return { success: true, errors: [] };
    } catch (error) {
      logger.error('Error approving tenant setting', {
        settingId,
        approvedBy,
        error: error.message
      });

      return { success: false, errors: [error.message] };
    }
  }

  // ============================
  // UTILITY METHODS
  // ============================

  private extractConstraints(setting: any): SettingConstraints | undefined {
    if (!setting) return undefined;

    return {
      maxValue: setting.maxValue,
      minValue: setting.minValue,
      allowedValues: setting.allowedValues,
      allowedFormats: setting.allowedFormats,
      requiresApproval: setting.requiresApproval
    };
  }

  /**
   * Get all pending settings that require approval
   */
  async getPendingApprovals(tenantId?: number): Promise<any[]> {
    try {
      return await db.query.siteSettings.findMany({
        where: and(
          tenantId ? eq(siteSettings.tenantId, tenantId) : undefined,
          eq(siteSettings.requiresApproval, true),
          isNull(siteSettings.approvedBy),
          eq(siteSettings.isActive, true)
        )
      });
    } catch (error) {
      logger.error('Error getting pending approvals', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get global/platform constraint settings (super admin only)
   */
  async getGlobalSettings(category?: string): Promise<Record<string, any>> {
    try {
      const globalSettings = await db.query.siteSettings.findMany({
        where: and(
          isNull(siteSettings.tenantId), // Global settings
          category ? eq(siteSettings.category, category as any) : undefined,
          eq(siteSettings.isActive, true)
        )
      });

      const result: Record<string, any> = {};
      globalSettings.forEach(setting => {
        const key = `${setting.category}.${setting.key}`;
        result[key] = setting;
      });

      return result;
    } catch (error) {
      logger.error('Error getting global settings', {
        category,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get tenant constraint usage summary (super admin only)
   */
  async getTenantConstraintSummary(): Promise<any[]> {
    try {
      // This would require more complex queries to count overrides and violations
      // For now, return a simplified version

      // Get all tenants
      const tenants = await db.query.tenants.findMany({
        columns: {
          id: true,
          name: true,
          updatedAt: true
        }
      });

      const summaries = [];

      for (const tenant of tenants) {
        // Count tenant overrides
        const overrides = await db.query.siteSettings.findMany({
          where: and(
            eq(siteSettings.tenantId, tenant.id),
            eq(siteSettings.overridesGlobal, true),
            eq(siteSettings.isActive, true)
          )
        });

        // TODO: Implement constraint violation checking
        const violations = 0; // Placeholder

        summaries.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          overrides: overrides.length,
          violations,
          lastActivity: tenant.updatedAt || new Date().toISOString()
        });
      }

      return summaries;
    } catch (error) {
      logger.error('Error getting tenant constraint summary', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update global platform constraint (super admin only)
   */
  async updateGlobalConstraint(
    category: string,
    key: string,
    field: string, // 'value', 'maxValue', 'minValue', 'allowedValues', etc.
    value: any,
    modifiedBy: number
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      // Find global setting
      const globalSetting = await db.query.siteSettings.findFirst({
        where: and(
          isNull(siteSettings.tenantId),
          eq(siteSettings.category, category as any),
          eq(siteSettings.key, key)
        )
      });

      if (!globalSetting) {
        return {
          success: false,
          errors: [`Global setting ${category}.${key} not found`]
        };
      }

      // Validate field
      const allowedFields = ['value', 'defaultValue', 'maxValue', 'minValue', 'allowedValues', 'allowedFormats'];
      if (!allowedFields.includes(field)) {
        return {
          success: false,
          errors: [`Invalid field: ${field}. Allowed: ${allowedFields.join(', ')}`]
        };
      }

      // Build update object
      const updateData: any = {
        [field]: value,
        lastModifiedBy: modifiedBy,
        updatedAt: new Date()
      };

      // Update global setting
      await db.update(siteSettings)
        .set(updateData)
        .where(eq(siteSettings.id, globalSetting.id));

      logger.info('Global constraint updated', {
        category,
        key,
        field,
        value,
        modifiedBy
      });

      return { success: true, errors: [] };
    } catch (error) {
      logger.error('Error updating global constraint', {
        category,
        key,
        field,
        value,
        modifiedBy,
        error: error.message
      });

      return { success: false, errors: [error.message] };
    }
  }
}

// ============================
// CONVENIENCE FUNCTIONS
// ============================

let settingsService: HierarchicalSettingsService;

export function getSettingsService(): HierarchicalSettingsService {
  if (!settingsService) {
    settingsService = new HierarchicalSettingsService();
  }
  return settingsService;
}

// Convenience functions for common operations
export async function getEffectiveSetting(category: string, key: string, tenantId?: number) {
  return getSettingsService().getEffectiveSetting(category, key, tenantId);
}

export async function getTenantSettings(tenantId: number, category?: string) {
  return getSettingsService().getTenantSettings(tenantId, category);
}

export async function updateTenantSetting(
  category: string,
  key: string,
  value: any,
  tenantId: number,
  modifiedBy: number
) {
  return getSettingsService().updateTenantSetting(category, key, value, tenantId, modifiedBy);
}

export async function validateTenantSetting(
  category: string,
  key: string,
  value: any,
  tenantId: number
) {
  return getSettingsService().validateTenantSetting(category, key, value, tenantId);
} 