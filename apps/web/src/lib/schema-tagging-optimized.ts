// ============================
// GOMODELS HIERARCHICAL MEDIA TAGGING SYSTEM - OPTIMIZED
// ============================
// This file contains the enhanced tagging system for mono
// Respects the business hierarchy: Platform → Tenant → Account → Agency → Profile

import { 
  pgTable, 
  serial, 
  bigserial, 
  varchar, 
  text, 
  boolean, 
  integer, 
  bigint, 
  timestamp, 
  uuid, 
  jsonb, 
  numeric, 
  index, 
  uniqueIndex,
  unique,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Import references from main schema (these would be actual imports in production)
declare const tenants: any;
declare const accounts: any;
declare const agencies: any;
declare const users: any;
declare const mediaAssets: any;

// ============================
// TAGGING SCOPE LEVEL ENUM
// ============================
export const tagScopeLevelEnum = pgEnum('tag_scope_level', [
  'platform',    // mono platform-wide tags (managed by super admins)
  'tenant',      // Tenant-specific tags (e.g., FashionModels.com custom tags)
  'account',     // Account-specific tags (e.g., Elite Modeling Agency tags)
  'agency',      // Agency-managed tags (for their talent)
  'profile'      // Individual profile/user tags
]);

// ============================
// ENHANCED HIERARCHICAL TAG MANAGEMENT
// ============================

// Core tag definitions with full hierarchy support
export const mediaTags = pgTable('media_tags', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  // ============================================
  // HIERARCHY MANAGEMENT (mono Structure)
  // ============================================
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  accountId: bigint('account_id', { mode: 'number' }).references(() => accounts.id, { onDelete: 'cascade' }),
  agencyId: bigint('agency_id', { mode: 'number' }).references(() => agencies.id, { onDelete: 'cascade' }),
  profileId: bigint('profile_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }), // Individual profile

  // Scope level determines which hierarchy level owns this tag
  scopeLevel: tagScopeLevelEnum('scope_level').notNull(),

  // ============================================
  // TAG DEFINITION & METADATA
  // ============================================
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(), // URL-friendly version
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color for UI (#FF5733)
  icon: varchar('icon', { length: 50 }), // Icon identifier (heroicons, lucide, etc.)

  // ============================================
  // CATEGORIZATION SYSTEM
  // ============================================
  category: varchar('category', { length: 50 }).notNull(), // Primary classification
  subcategory: varchar('subcategory', { length: 50 }),      // Secondary classification

  // ============================================
  // HIERARCHY & INHERITANCE RULES
  // ============================================
  isInheritable: boolean('is_inheritable').default(true),
  inheritanceDepth: integer('inheritance_depth').default(99), // How many levels down it can be inherited
  parentTagId: integer('parent_tag_id').references(() => mediaTags.id, { onDelete: 'set null' }),

  // ============================================
  // AI & AUTOMATION
  // ============================================
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiConfidenceScore: numeric('ai_confidence_score', { precision: 3, scale: 2 }),
  aiModel: varchar('ai_model', { length: 50 }), // gpt-4-vision, claude-vision, custom-model
  autoSuggestRules: jsonb('auto_suggest_rules').default('{}'),

  // ============================================
  // USAGE ANALYTICS & PERFORMANCE
  // ============================================
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  popularityScore: numeric('popularity_score', { precision: 5, scale: 2 }).default('0.00'), // Calculated metric

  // ============================================
  // VISIBILITY & PERMISSIONS
  // ============================================
  isPublic: boolean('is_public').default(false),        // Visible across tenant boundaries
  isActive: boolean('is_active').default(true),         // Available for use
  isSystemTag: boolean('is_system_tag').default(false), // Platform-managed, cannot be deleted
  isFeatured: boolean('is_featured').default(false),    // Promoted tags for suggestions

  // ============================================
  // INTERNATIONALIZATION (I18N-FIRST)
  // ============================================
  displayNames: jsonb('display_names').default('{}'), // {"en": "Fashion", "fr": "Mode", "es": "Moda", "de": "Mode"}
  descriptions: jsonb('descriptions').default('{}'),   // Translated descriptions

  // ============================================
  // SUBSCRIPTION & BUSINESS RULES
  // ============================================
  requiresSubscriptionTier: varchar('requires_subscription_tier', { length: 30 }), // free, basic, pro, enterprise
  maxUsagePerAccount: integer('max_usage_per_account'), // Limit how many times this tag can be used per account

  // ============================================
  // AUDIT & TIMESTAMPS
  // ============================================
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  // ============================================
  // HIERARCHY CONSTRAINTS & UNIQUENESS
  // ============================================
  // Tags must be unique within their scope level and hierarchy context
  platformTagUniqueIdx: uniqueIndex('media_tags_platform_unique_idx')
    .on(table.name, table.scopeLevel)
    .where(sql`scope_level = 'platform'`),

  tenantTagUniqueIdx: uniqueIndex('media_tags_tenant_unique_idx')
    .on(table.tenantId, table.name, table.scopeLevel)
    .where(sql`scope_level = 'tenant'`),

  accountTagUniqueIdx: uniqueIndex('media_tags_account_unique_idx')
    .on(table.tenantId, table.accountId, table.name, table.scopeLevel)
    .where(sql`scope_level = 'account'`),

  agencyTagUniqueIdx: uniqueIndex('media_tags_agency_unique_idx')
    .on(table.tenantId, table.agencyId, table.name, table.scopeLevel)
    .where(sql`scope_level = 'agency'`),

  profileTagUniqueIdx: uniqueIndex('media_tags_profile_unique_idx')
    .on(table.tenantId, table.profileId, table.name, table.scopeLevel)
    .where(sql`scope_level = 'profile'`),

  // ============================================
  // PERFORMANCE & QUERY INDEXES
  // ============================================
  tenantScopeIdx: index('media_tags_tenant_scope_idx').on(table.tenantId, table.scopeLevel),
  categoryIdx: index('media_tags_category_idx').on(table.category, table.subcategory),
  scopeLevelIdx: index('media_tags_scope_level_idx').on(table.scopeLevel),
  isActiveIdx: index('media_tags_is_active_idx').on(table.isActive),
  parentTagIdx: index('media_tags_parent_tag_idx').on(table.parentTagId),
  usageCountIdx: index('media_tags_usage_count_idx').on(table.usageCount),
  popularityIdx: index('media_tags_popularity_idx').on(table.popularityScore),
  lastUsedIdx: index('media_tags_last_used_idx').on(table.lastUsedAt),
  featuredIdx: index('media_tags_featured_idx').on(table.isFeatured, table.isActive),

  // ============================================
  // AI & AUTOMATION INDEXES
  // ============================================
  aiGeneratedIdx: index('media_tags_ai_generated_idx').on(table.isAiGenerated),
  systemTagIdx: index('media_tags_system_tag_idx').on(table.isSystemTag),
  subscriptionTierIdx: index('media_tags_subscription_tier_idx').on(table.requiresSubscriptionTier),
}));

// ============================
// MEDIA ASSET TAGGING RELATIONSHIPS
// ============================

// Many-to-many relationship between media assets and tags
export const mediaAssetTags = pgTable('media_asset_tags', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  // ============================================
  // CORE RELATIONSHIP
  // ============================================
  mediaAssetId: bigint('media_asset_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => mediaTags.id, { onDelete: 'cascade' }).notNull(),

  // ============================================
  // HIERARCHY CONTEXT (for permissions & filtering)
  // ============================================
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  taggedBy: bigint('tagged_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  taggedFromLevel: tagScopeLevelEnum('tagged_from_level').notNull(), // Which hierarchy level added this tag

  // ============================================
  // AI TAGGING METADATA
  // ============================================
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiConfidence: numeric('ai_confidence', { precision: 3, scale: 2 }),
  aiModel: varchar('ai_model', { length: 50 }),
  aiProcessingTime: integer('ai_processing_time'), // milliseconds

  // ============================================
  // HUMAN VERIFICATION & QUALITY CONTROL
  // ============================================
  isVerified: boolean('is_verified').default(false),
  verifiedBy: bigint('verified_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  verificationNotes: text('verification_notes'),

  // ============================================
  // RELEVANCE & ORGANIZATION
  // ============================================
  relevanceScore: numeric('relevance_score', { precision: 3, scale: 2 }), // 0.00-100.00
  isKeyTag: boolean('is_key_tag').default(false),           // Primary/important tags
  tagPosition: integer('tag_position'),                      // Display order
  confidenceLevel: varchar('confidence_level', { length: 10 }), // low, medium, high

  // ============================================
  // BULK OPERATIONS & WORKFLOW SUPPORT
  // ============================================
  batchId: varchar('batch_id', { length: 36 }),             // UUID for bulk operations
  batchOperation: varchar('batch_operation', { length: 20 }), // add, remove, replace, migrate
  workflowStage: varchar('workflow_stage', { length: 30 }), // upload, review, approval, published

  // ============================================
  // SUBSCRIPTION & USAGE TRACKING
  // ============================================
  usageContext: varchar('usage_context', { length: 50 }),   // manual, ai_batch, import, api
  subscriptionTierAtTime: varchar('subscription_tier_at_time', { length: 30 }), // Track subscription level when tagged

  // ============================================
  // AUDIT & TIMESTAMPS
  // ============================================
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),            // For analytics
}, (table) => ({
  // ============================================
  // PRIMARY CONSTRAINTS
  // ============================================
  mediaTagUniqueIdx: uniqueIndex('media_asset_tags_media_tag_unique_idx').on(table.mediaAssetId, table.tagId),

  // ============================================
  // PERFORMANCE INDEXES
  // ============================================
  mediaAssetIdx: index('media_asset_tags_media_asset_idx').on(table.mediaAssetId),
  tagIdx: index('media_asset_tags_tag_idx').on(table.tagId),
  tenantIdx: index('media_asset_tags_tenant_idx').on(table.tenantId),
  taggedByIdx: index('media_asset_tags_tagged_by_idx').on(table.taggedBy),

  // ============================================
  // QUERY OPTIMIZATION INDEXES
  // ============================================
  aiGeneratedIdx: index('media_asset_tags_ai_generated_idx').on(table.isAiGenerated),
  verifiedIdx: index('media_asset_tags_verified_idx').on(table.isVerified),
  keyTagIdx: index('media_asset_tags_key_tag_idx').on(table.isKeyTag),
  relevanceIdx: index('media_asset_tags_relevance_idx').on(table.relevanceScore),
  confidenceIdx: index('media_asset_tags_confidence_idx').on(table.confidenceLevel),
  workflowIdx: index('media_asset_tags_workflow_idx').on(table.workflowStage),

  // ============================================
  // BULK OPERATIONS & ANALYTICS
  // ============================================
  batchIdx: index('media_asset_tags_batch_idx').on(table.batchId),
  createdAtIdx: index('media_asset_tags_created_at_idx').on(table.createdAt),
  lastAccessedIdx: index('media_asset_tags_last_accessed_idx').on(table.lastAccessedAt),
  usageContextIdx: index('media_asset_tags_usage_context_idx').on(table.usageContext),
}));

// ============================
// TAG COLLECTIONS & TEMPLATES
// ============================

// Predefined collections of tags for common workflows
export const mediaTagCollections = pgTable('media_tag_collections', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  // ============================================
  // HIERARCHY CONTEXT
  // ============================================
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  accountId: bigint('account_id', { mode: 'number' }).references(() => accounts.id, { onDelete: 'cascade' }),
  agencyId: bigint('agency_id', { mode: 'number' }).references(() => agencies.id, { onDelete: 'cascade' }),
  scopeLevel: tagScopeLevelEnum('scope_level').notNull(),

  // ============================================
  // COLLECTION DEFINITION
  // ============================================
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  collectionType: varchar('collection_type', { length: 30 }).notNull(),

  // Collection types:
  // - workflow: Tags for specific workflow stages (upload → review → approve → publish)
  // - template: Reusable tag sets for common scenarios
  // - category: Groupings by content type or purpose
  // - smart: Dynamic collections based on rules
  // - favorites: User's frequently used tags
  // - ai_suggested: AI-recommended tag combinations

  // ============================================
  // TAG MEMBERSHIP
  // ============================================
  tagIds: jsonb('tag_ids').notNull(),           // Static array of tag IDs
  smartRules: jsonb('smart_rules').default('{}'), // Dynamic rules for smart collections

  // Smart rules examples:
  // {"auto_add": {"conditions": {"category": "headshot", "ai_confidence": ">0.8"}, "tags": ["professional", "portfolio"]}}
  // {"exclude": {"conditions": {"workflow_stage": "rejected"}}}

  // ============================================
  // USAGE & WORKFLOW CONTEXT
  // ============================================
  workflowStage: varchar('workflow_stage', { length: 50 }),
  isTemplate: boolean('is_template').default(false),
  isSystemCollection: boolean('is_system_collection').default(false),
  usageCount: integer('usage_count').default(0),

  // ============================================
  // PERMISSIONS & SHARING
  // ============================================
  isPublic: boolean('is_public').default(false),
  sharedWith: jsonb('shared_with').default('[]'), // Array of {type: 'account|agency|user', id: 123}

  // ============================================
  // INTERNATIONALIZATION
  // ============================================
  displayNames: jsonb('display_names').default('{}'),
  descriptions: jsonb('descriptions').default('{}'),

  // ============================================
  // AUDIT & TIMESTAMPS
  // ============================================
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  tenantScopeIdx: index('media_tag_collections_tenant_scope_idx').on(table.tenantId, table.scopeLevel),
  typeIdx: index('media_tag_collections_type_idx').on(table.collectionType),
  workflowIdx: index('media_tag_collections_workflow_idx').on(table.workflowStage),
  templateIdx: index('media_tag_collections_template_idx').on(table.isTemplate),
  systemIdx: index('media_tag_collections_system_idx').on(table.isSystemCollection),
  createdByIdx: index('media_tag_collections_created_by_idx').on(table.createdBy),
  usageCountIdx: index('media_tag_collections_usage_count_idx').on(table.usageCount),
}));

// ============================
// TAG ANALYTICS & INSIGHTS
// ============================

// Track tag performance and usage patterns
export const mediaTagAnalytics = pgTable('media_tag_analytics', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  // ============================================
  // CONTEXT & SCOPE
  // ============================================
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => mediaTags.id, { onDelete: 'cascade' }).notNull(),
  accountId: bigint('account_id', { mode: 'number' }).references(() => accounts.id, { onDelete: 'cascade' }),

  // ============================================
  // TIME PERIOD
  // ============================================
  periodType: varchar('period_type', { length: 10 }).notNull(), // day, week, month, quarter, year
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // ============================================
  // USAGE METRICS
  // ============================================
  totalUsageCount: integer('total_usage_count').default(0),
  newTaggingsCount: integer('new_taggings_count').default(0),
  removedTaggingsCount: integer('removed_taggings_count').default(0),
  uniqueUsersCount: integer('unique_users_count').default(0),
  uniqueMediaCount: integer('unique_media_count').default(0),

  // ============================================
  // AI PERFORMANCE METRICS
  // ============================================
  aiUsageCount: integer('ai_usage_count').default(0),
  aiAccuracyRate: numeric('ai_accuracy_rate', { precision: 5, scale: 2 }),   // % correct
  humanVerificationRate: numeric('human_verification_rate', { precision: 5, scale: 2 }), // % verified
  avgAiConfidence: numeric('avg_ai_confidence', { precision: 3, scale: 2 }),

  // ============================================
  // QUALITY METRICS
  // ============================================
  avgRelevanceScore: numeric('avg_relevance_score', { precision: 3, scale: 2 }),
  searchClickthroughRate: numeric('search_clickthrough_rate', { precision: 5, scale: 2 }),
  tagRetentionRate: numeric('tag_retention_rate', { precision: 5, scale: 2 }), // % not removed

  // ============================================
  // BUSINESS METRICS
  // ============================================
  subscriptionTierUsage: jsonb('subscription_tier_usage').default('{}'), // Usage by subscription level
  revenueImpact: numeric('revenue_impact', { precision: 10, scale: 2 }), // Associated revenue

  // ============================================
  // AUDIT & TIMESTAMPS
  // ============================================
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Unique constraint per tag per period
  tagPeriodUniqueIdx: uniqueIndex('media_tag_analytics_tag_period_unique_idx')
    .on(table.tagId, table.periodType, table.periodStart),

  tenantIdx: index('media_tag_analytics_tenant_idx').on(table.tenantId),
  tagIdx: index('media_tag_analytics_tag_idx').on(table.tagId),
  periodIdx: index('media_tag_analytics_period_idx').on(table.periodType, table.periodStart),
  usageCountIdx: index('media_tag_analytics_usage_count_idx').on(table.totalUsageCount),
  accuracyIdx: index('media_tag_analytics_accuracy_idx').on(table.aiAccuracyRate),
}));

// ============================
// TYPE EXPORTS
// ============================

export type MediaTag = typeof mediaTags.$inferSelect;
export type NewMediaTag = typeof mediaTags.$inferInsert;
export type MediaAssetTag = typeof mediaAssetTags.$inferSelect;
export type NewMediaAssetTag = typeof mediaAssetTags.$inferInsert;
export type MediaTagCollection = typeof mediaTagCollections.$inferSelect;
export type NewMediaTagCollection = typeof mediaTagCollections.$inferInsert;
export type MediaTagAnalytics = typeof mediaTagAnalytics.$inferSelect;
export type NewMediaTagAnalytics = typeof mediaTagAnalytics.$inferInsert; 