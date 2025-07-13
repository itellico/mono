/**
 * Enhanced Multi-Level Tagging System Schema
 * 
 * Provides Platform → Tenant → Account → User scope hierarchy for tagging
 * across multiple entity types with proper tenant isolation and permissions.
 */

import { pgTable, varchar, text, boolean, integer, bigint, timestamp, uuid, pgEnum, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { accounts, users } from './auth';
import { categories } from './categories';

/**
 * Enhanced Tag Scope Levels
 */
export const enhancedTagScopeEnum = pgEnum('enhanced_tag_scope', [
  'platform',     // Available to all tenants
  'tenant',       // Available within a specific tenant
  'account',      // Available within a specific account
  'user',         // Private to a specific user
  'configuration' // Super admin configuration tags only
]);

/**
 * Enhanced Taggable Entity Types
 */
export const enhancedTaggableEntityTypeEnum = pgEnum('enhanced_taggable_entity_type', [
  'user_profile',
  'account',
  'model_schema',
  'option_set',
  'email_template',
  'industry_template',
  'form',
  'zone',
  'module',
  'translation',
  'subscription',
  'workflow',
  'job_posting',
  'application',
  'report',
  'dashboard'
]);

/**
 * Enhanced Tags Table with Multi-Level Scoping and Category Relationships
 */
export const enhancedTags = pgTable('enhanced_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic Properties
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code
  icon: varchar('icon', { length: 50 }), // Icon name
  
  // Category Relationship
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  
  // Scope Configuration
  scopeLevel: enhancedTagScopeEnum('scope_level').notNull(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  accountId: bigint('account_id', { mode: 'number' }).references(() => accounts.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }),
  
  // System Properties
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  
  // Metadata
  metadata: jsonb('metadata').default('{}'),
  
  // Audit Fields
  createdBy: bigint('created_by', { mode: 'number' }).notNull().references(() => users.id),
  updatedBy: bigint('updated_by', { mode: 'number' }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  scopeLevelIdx: index('enhanced_tags_scope_level_idx').on(table.scopeLevel),
  tenantIdIdx: index('enhanced_tags_tenant_id_idx').on(table.tenantId),
  accountIdIdx: index('enhanced_tags_account_id_idx').on(table.accountId),
  userIdIdx: index('enhanced_tags_user_id_idx').on(table.userId),
  categoryIdIdx: index('enhanced_tags_category_id_idx').on(table.categoryId),
  usageCountIdx: index('enhanced_tags_usage_count_idx').on(table.usageCount),
  
  // Composite indexes for efficient scope-based queries
  scopeTenantIdx: index('enhanced_tags_scope_tenant_idx').on(table.scopeLevel, table.tenantId),
  scopeAccountIdx: index('enhanced_tags_scope_account_idx').on(table.scopeLevel, table.accountId),
  categoryTenantIdx: index('enhanced_tags_category_tenant_idx').on(table.categoryId, table.tenantId),
  
  // Unique constraints per scope level
  slugPlatformUnique: unique('enhanced_tags_slug_platform').on(table.slug),
  slugTenantUnique: unique('enhanced_tags_slug_tenant').on(table.slug, table.tenantId)
}));

/**
 * Enhanced Entity Tags Junction Table
 */
export const enhancedEntityTags = pgTable('enhanced_entity_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Tag Reference
  tagId: uuid('tag_id').notNull().references(() => enhancedTags.id, { onDelete: 'cascade' }),
  
  // Polymorphic Entity Reference
  entityType: enhancedTaggableEntityTypeEnum('entity_type').notNull(),
  entityId: varchar('entity_id', { length: 255 }).notNull(), // Flexible for different ID types
  
  // Context for permissions and filtering
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accountId: bigint('account_id', { mode: 'number' }).references(() => accounts.id, { onDelete: 'cascade' }),
  
  // Audit Fields
  createdBy: bigint('created_by', { mode: 'number' }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Indexes for performance
  tagIdIdx: index('enhanced_entity_tags_tag_id_idx').on(table.tagId),
  entityIdx: index('enhanced_entity_tags_entity_idx').on(table.entityType, table.entityId),
  tenantIdIdx: index('enhanced_entity_tags_tenant_id_idx').on(table.tenantId),
  accountIdIdx: index('enhanced_entity_tags_account_id_idx').on(table.accountId),
  
  // Composite indexes for efficient queries
  entityTypeTenantIdx: index('enhanced_entity_tags_entity_type_tenant_idx').on(table.entityType, table.tenantId),
  
  // Ensure unique tag per entity
  uniqueTagEntity: unique('enhanced_entity_tags_unique').on(table.tagId, table.entityType, table.entityId)
}));

/**
 * Relations
 */
export const enhancedTagsRelations = relations(enhancedTags, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [enhancedTags.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [enhancedTags.accountId],
    references: [accounts.id]
  }),
  user: one(users, {
    fields: [enhancedTags.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [enhancedTags.categoryId],
    references: [categories.id]
  }),
  createdByUser: one(users, {
    fields: [enhancedTags.createdBy],
    references: [users.id],
    relationName: 'enhancedTagCreatedBy'
  }),
  updatedByUser: one(users, {
    fields: [enhancedTags.updatedBy],
    references: [users.id],
    relationName: 'enhancedTagUpdatedBy'
  }),
  entityTags: many(enhancedEntityTags)
}));

export const enhancedEntityTagsRelations = relations(enhancedEntityTags, ({ one }) => ({
  tag: one(enhancedTags, {
    fields: [enhancedEntityTags.tagId],
    references: [enhancedTags.id]
  }),
  tenant: one(tenants, {
    fields: [enhancedEntityTags.tenantId],
    references: [tenants.id]
  }),
  account: one(accounts, {
    fields: [enhancedEntityTags.accountId],
    references: [accounts.id]
  }),
  createdByUser: one(users, {
    fields: [enhancedEntityTags.createdBy],
    references: [users.id],
    relationName: 'enhancedEntityTagCreatedBy'
  })
}));

// Export types
export type EnhancedTag = typeof enhancedTags.$inferSelect;
export type NewEnhancedTag = typeof enhancedTags.$inferInsert;
export type EnhancedEntityTag = typeof enhancedEntityTags.$inferSelect;
export type NewEnhancedEntityTag = typeof enhancedEntityTags.$inferInsert;
export type EnhancedTagScope = 'platform' | 'tenant' | 'account' | 'user' | 'configuration';
export type EnhancedTaggableEntityType = 
  | 'user_profile'
  | 'account'
  | 'model_schema'
  | 'option_set'
  | 'email_template'
  | 'industry_template'
  | 'form'
  | 'zone'
  | 'module'
  | 'translation'
  | 'subscription'
  | 'workflow'
  | 'job_posting'
  | 'application'
  | 'report'
  | 'dashboard';

// Entity type registry with allowed scope levels
export const ENTITY_TYPE_REGISTRY: Record<EnhancedTaggableEntityType, {
  name: string;
  description: string;
  allowedScopes: EnhancedTagScope[];
  requiresAccount?: boolean;
}> = {
  user_profile: {
    name: 'User Profile',
    description: 'User profile information and settings',
    allowedScopes: ['platform', 'tenant', 'account', 'user'],
    requiresAccount: true
  },
  account: {
    name: 'Account',
    description: 'Business accounts and organizations',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  model_schema: {
    name: 'Model Schema',
    description: 'Dynamic form and data model schemas',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  option_set: {
    name: 'Option Set',
    description: 'Dropdown and selection option sets',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  email_template: {
    name: 'Email Template',
    description: 'Email templates and messaging',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  industry_template: {
    name: 'Industry Template',
    description: 'Industry-specific templates and configurations',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  form: {
    name: 'Form',
    description: 'Dynamic forms and data collection',
    allowedScopes: ['platform', 'tenant', 'account'],
    requiresAccount: true
  },
  zone: {
    name: 'Zone',
    description: 'Geographic zones and regions',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  module: {
    name: 'Module',
    description: 'System modules and components',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  translation: {
    name: 'Translation',
    description: 'Translation keys and content',
    allowedScopes: ['platform', 'tenant'],
    requiresAccount: false
  },
  subscription: {
    name: 'Subscription',
    description: 'Subscription plans and billing',
    allowedScopes: ['platform', 'tenant', 'account'],
    requiresAccount: true
  },
  workflow: {
    name: 'Workflow',
    description: 'Business workflows and automation',
    allowedScopes: ['platform', 'tenant', 'account'],
    requiresAccount: true
  },
  job_posting: {
    name: 'Job Posting',
    description: 'Job listings and opportunities',
    allowedScopes: ['platform', 'tenant', 'account'],
    requiresAccount: true
  },
  application: {
    name: 'Application',
    description: 'Job applications and submissions',
    allowedScopes: ['platform', 'tenant', 'account', 'user'],
    requiresAccount: true
  },
  report: {
    name: 'Report',
    description: 'Analytics and reporting data',
    allowedScopes: ['platform', 'tenant', 'account'],
    requiresAccount: true
  },
  dashboard: {
    name: 'Dashboard',
    description: 'Dashboard configurations and layouts',
    allowedScopes: ['platform', 'tenant', 'account', 'user'],
    requiresAccount: true
  }
};

// Permission matrix for tag operations
export const TAG_PERMISSION_MATRIX = {
  platform: {
    create: ['super_admin'],
    read: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner', 'user'],
    update: ['super_admin'],
    delete: ['super_admin'],
    assign: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner']
  },
  tenant: {
    create: ['super_admin', 'tenant_admin'],
    read: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner', 'user'],
    update: ['super_admin', 'tenant_admin'],
    delete: ['super_admin', 'tenant_admin'],
    assign: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner']
  },
  account: {
    create: ['super_admin', 'tenant_admin', 'account_owner'],
    read: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner', 'user'],
    update: ['super_admin', 'tenant_admin', 'account_owner'],
    delete: ['super_admin', 'tenant_admin', 'account_owner'],
    assign: ['super_admin', 'tenant_admin', 'account_owner']
  },
  user: {
    create: ['super_admin', 'tenant_admin', 'account_owner', 'user'],
    read: ['super_admin', 'tenant_admin', 'content_moderator', 'account_owner', 'user'],
    update: ['super_admin', 'tenant_admin', 'account_owner', 'user'],
    delete: ['super_admin', 'tenant_admin', 'account_owner', 'user'],
    assign: ['super_admin', 'tenant_admin', 'account_owner', 'user']
  }
} as const; 