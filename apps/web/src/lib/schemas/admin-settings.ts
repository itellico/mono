/**
 * Super Admin Settings Schema
 * 
 * Enhanced settings system for super admin configuration
 */

import { pgTable, serial, varchar, text, jsonb, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Setting types enum
export const settingTypeEnum = pgEnum('setting_type', [
  'boolean',
  'string', 
  'integer',
  'float',
  'json'
]);

// Access levels enum
export const settingAccessLevelEnum = pgEnum('setting_access_level', [
  'super_admin',
  'admin', 
  'moderator'
]);

// Setting categories enum
export const settingCategoryEnum = pgEnum('setting_category', [
  'security',
  'development',
  'features',
  'maintenance',
  'performance',
  'ui',
  'notifications'
]);

/**
 * Super Admin Settings Table
 * Enhanced settings with proper type support and caching
 */
export const superAdminSettings = pgTable('super_admin_settings', {
  id: serial('id').primaryKey(),
  
  // Setting identification
  key: varchar('key', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Type and validation
  type: settingTypeEnum('type').notNull(),
  value: jsonb('value').notNull(),
  defaultValue: jsonb('default_value').notNull(),
  validationSchema: jsonb('validation_schema'), // JSON schema for validation
  
  // Organization
  category: settingCategoryEnum('category').notNull(),
  sortOrder: integer('sort_order').default(0),
  
  // Access control
  accessLevel: settingAccessLevelEnum('access_level').notNull(),
  isUserSpecific: boolean('is_user_specific').default(true), // User-specific vs global
  isReadOnly: boolean('is_read_only').default(false),
  isActive: boolean('is_active').default(true),
  
  // User association (for user-specific settings)
  userId: integer('user_id'), // null for global settings
  tenantId: integer('tenant_id'), // null for platform-wide
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: integer('created_by').notNull(),
  lastModifiedBy: integer('last_modified_by').notNull(),
  
  // Help and documentation
  helpText: text('help_text'),
  exampleValue: jsonb('example_value'),
  
  // Feature flags
  requiresRestart: boolean('requires_restart').default(false),
  isExperimental: boolean('is_experimental').default(false)
});

/**
 * Setting Value History Table
 * Track changes to settings for audit purposes
 */
export const settingValueHistory = pgTable('setting_value_history', {
  id: serial('id').primaryKey(),
  settingId: integer('setting_id').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value').notNull(),
  changedBy: integer('changed_by').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  reason: text('reason'), // Optional reason for change
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4/IPv6
  userAgent: text('user_agent')
});

/**
 * Predefined Settings Configuration
 * Default settings that should be created on system init
 */
export const predefinedSettings = [
  {
    key: 'god_mode_enabled',
    displayName: 'God Mode',
    description: 'Allows editing of system-protected entities. Use with extreme caution.',
    type: 'boolean' as const,
    defaultValue: false,
    category: 'security' as const,
    accessLevel: 'super_admin' as const,
    isUserSpecific: true,
    isReadOnly: false,
    helpText: 'When enabled, allows super administrators to edit system-protected tags, categories, and other entities. This setting bypasses normal protection mechanisms and should only be used by experienced administrators.',
    exampleValue: true,
    requiresRestart: false,
    sortOrder: 1
  },
  {
    key: 'developer_mode_enabled', 
    displayName: 'Developer Mode',
    description: 'Enables additional debugging features and developer tools.',
    type: 'boolean' as const,
    defaultValue: false,
    category: 'development' as const,
    accessLevel: 'admin' as const,
    isUserSpecific: true,
    isReadOnly: false,
    helpText: 'Enables developer-specific features like detailed error messages, query debugging, and additional admin tools. Safe to enable for development and testing.',
    exampleValue: true,
    requiresRestart: false,
    sortOrder: 2
  },
  {
    key: 'debug_mode_enabled',
    displayName: 'Debug Mode', 
    description: 'Shows detailed error messages and debug information.',
    type: 'boolean' as const,
    defaultValue: false,
    category: 'development' as const,
    accessLevel: 'admin' as const,
    isUserSpecific: false, // Global setting
    isReadOnly: false,
    helpText: 'Enables verbose logging and detailed error messages across the platform. Useful for troubleshooting but may expose sensitive information.',
    exampleValue: true,
    requiresRestart: false,
    sortOrder: 3
  },
  {
    key: 'maintenance_mode_enabled',
    displayName: 'Maintenance Mode',
    description: 'Puts the platform in maintenance mode for all users.',
    type: 'boolean' as const,
    defaultValue: false,
    category: 'maintenance' as const,
    accessLevel: 'super_admin' as const,
    isUserSpecific: false, // Global setting
    isReadOnly: false,
    helpText: 'When enabled, shows a maintenance page to all non-admin users. Admins can still access the platform normally.',
    exampleValue: true,
    requiresRestart: false,
    sortOrder: 10
  },
  {
    key: 'max_upload_size_mb',
    displayName: 'Max Upload Size (MB)',
    description: 'Maximum file upload size in megabytes.',
    type: 'integer' as const,
    defaultValue: 100,
    category: 'performance' as const,
    accessLevel: 'admin' as const,
    isUserSpecific: false,
    isReadOnly: false,
    helpText: 'Sets the maximum file size that users can upload. Changes take effect immediately.',
    exampleValue: 250,
    requiresRestart: false,
    sortOrder: 20,
    validationSchema: {
      type: 'number',
      minimum: 1,
      maximum: 1000
    }
  }
] as const;

// TypeScript interfaces
export interface SuperAdminSetting {
  id: number;
  key: string;
  displayName: string;
  description?: string;
  type: 'boolean' | 'string' | 'integer' | 'float' | 'json';
  value: any;
  defaultValue: any;
  validationSchema?: object;
  category: 'security' | 'development' | 'features' | 'maintenance' | 'performance' | 'ui' | 'notifications';
  sortOrder: number;
  accessLevel: 'super_admin' | 'admin' | 'moderator';
  isUserSpecific: boolean;
  isReadOnly: boolean;
  isActive: boolean;
  userId?: number;
  tenantId?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  lastModifiedBy: number;
  helpText?: string;
  exampleValue?: any;
  requiresRestart: boolean;
  isExperimental: boolean;
}

export interface SettingValueHistoryEntry {
  id: number;
  settingId: number;
  oldValue?: any;
  newValue: any;
  changedBy: number;
  changedAt: Date;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
} 