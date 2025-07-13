// GOMODELS MARKETPLACE MEDIA TAGGING SYSTEM
// Two-sided marketplace: Professionals (buyers) ↔ Models (sellers)

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
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// MARKETPLACE ENUMS
export const marketplaceSideEnum = pgEnum('marketplace_side', [
  'professional',  // Buyers: photographers, agencies, bookers, casting directors
  'model'         // Sellers: fashion models, hand models, fitness models, etc.
]);

export const tagScopeLevelEnum = pgEnum('tag_scope_level', [
  'platform',      // mono platform-wide tags
  'tenant',        // Tenant-specific tags (FashionModels.com)  
  'account',       // Account-level tags (shared across all profiles)
  'marketplace',   // Marketplace-side tags (professional vs model)
  'profile'        // Individual profile tags
]);

// MARKETPLACE MEDIA TAGS
export const mediaTags = pgTable('media_tags', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  // Marketplace hierarchy
  tenantId: integer('tenant_id').notNull(),
  accountId: bigint('account_id', { mode: 'number' }),
  profileId: bigint('profile_id', { mode: 'number' }),
  marketplaceSide: marketplaceSideEnum('marketplace_side'),
  profileType: varchar('profile_type', { length: 30 }),
  scopeLevel: tagScopeLevelEnum('scope_level').notNull(),

  // Tag definition
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  category: varchar('category', { length: 50 }).notNull(),
  subcategory: varchar('subcategory', { length: 50 }),

  // Marketplace discovery
  isDiscoverable: boolean('is_discoverable').default(true),
  searchWeight: numeric('search_weight', { precision: 3, scale: 2 }).default('1.00'),
  visibleToOtherSide: boolean('visible_to_other_side').default(false),
  usedForMatching: boolean('used_for_matching').default(true),

  // AI support (no premium restrictions)
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiConfidenceScore: numeric('ai_confidence_score', { precision: 3, scale: 2 }),
  aiModel: varchar('ai_model', { length: 50 }),

  // Analytics
  usageCount: integer('usage_count').default(0),
  searchCount: integer('search_count').default(0),
  matchCount: integer('match_count').default(0),
  lastUsedAt: timestamp('last_used_at'),

  // Profile owner control
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  isSystemTag: boolean('is_system_tag').default(false),

  // I18N
  displayNames: jsonb('display_names').default('{}'),
  descriptions: jsonb('descriptions').default('{}'),

  // Audit
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }),
}, (table) => ({
  profileTagUniqueIdx: uniqueIndex('media_tags_profile_unique_idx')
    .on(table.tenantId, table.profileId, table.name, table.scopeLevel)
    .where(sql`scope_level = 'profile'`),

  marketplaceTagUniqueIdx: uniqueIndex('media_tags_marketplace_unique_idx')
    .on(table.tenantId, table.marketplaceSide, table.name, table.scopeLevel)
    .where(sql`scope_level = 'marketplace'`),

  tenantMarketplaceIdx: index('media_tags_tenant_marketplace_idx').on(table.tenantId, table.marketplaceSide),
  categoryMarketplaceIdx: index('media_tags_category_marketplace_idx').on(table.category, table.marketplaceSide),
  discoverableIdx: index('media_tags_discoverable_idx').on(table.isDiscoverable, table.isActive),
}));

// MEDIA ASSET TAGGING
export const mediaAssetTags = pgTable('media_asset_tags', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  mediaAssetId: bigint('media_asset_id', { mode: 'number' }).notNull(),
  tagId: integer('tag_id').references(() => mediaTags.id, { onDelete: 'cascade' }).notNull(),

  // Marketplace context
  tenantId: integer('tenant_id').notNull(),
  accountId: bigint('account_id', { mode: 'number' }).notNull(),
  profileId: bigint('profile_id', { mode: 'number' }).notNull(),
  marketplaceSide: marketplaceSideEnum('marketplace_side').notNull(),
  profileType: varchar('profile_type', { length: 30 }).notNull(),

  taggedBy: bigint('tagged_by', { mode: 'number' }),
  taggedFromLevel: tagScopeLevelEnum('tagged_from_level').notNull(),
  isAiGenerated: boolean('is_ai_generated').default(false),
  aiConfidence: numeric('ai_confidence', { precision: 3, scale: 2 }),

  // Marketplace optimization
  relevanceScore: numeric('relevance_score', { precision: 3, scale: 2 }),
  isKeyTag: boolean('is_key_tag').default(false),
  searchBoost: numeric('search_boost', { precision: 3, scale: 2 }).default('1.00'),
  isPubliclyVisible: boolean('is_publicly_visible').default(true),

  // Analytics
  searchCount: integer('search_count').default(0),
  clickthroughCount: integer('clickthrough_count').default(0),
  inquiryCount: integer('inquiry_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  mediaTagUniqueIdx: uniqueIndex('media_asset_tags_media_tag_unique_idx').on(table.mediaAssetId, table.tagId),
  profileIdx: index('media_asset_tags_profile_idx').on(table.profileId),
  marketplaceSideIdx: index('media_asset_tags_marketplace_side_idx').on(table.marketplaceSide),
  keyTagIdx: index('media_asset_tags_key_tag_idx').on(table.isKeyTag, table.marketplaceSide),
}));

// TAG COLLECTIONS
export const mediaTagCollections = pgTable('media_tag_collections', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  tenantId: integer('tenant_id').notNull(),
  accountId: bigint('account_id', { mode: 'number' }),
  profileId: bigint('profile_id', { mode: 'number' }),
  marketplaceSide: marketplaceSideEnum('marketplace_side').notNull(),
  scopeLevel: tagScopeLevelEnum('scope_level').notNull(),

  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  collectionType: varchar('collection_type', { length: 30 }).notNull(),
  tagIds: jsonb('tag_ids').notNull(),
  smartRules: jsonb('smart_rules').default('{}'),

  isTemplate: boolean('is_template').default(false),
  isPublic: boolean('is_public').default(false),
  usageCount: integer('usage_count').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }),
}, (table) => ({
  tenantMarketplaceIdx: index('media_tag_collections_tenant_marketplace_idx').on(table.tenantId, table.marketplaceSide),
  profileIdx: index('media_tag_collections_profile_idx').on(table.profileId),
}));

// TYPE EXPORTS
export type MediaTag = typeof mediaTags.$inferSelect;
export type NewMediaTag = typeof mediaTags.$inferInsert;
export type MediaAssetTag = typeof mediaAssetTags.$inferSelect;
export type NewMediaAssetTag = typeof mediaAssetTags.$inferInsert;
export type MediaTagCollection = typeof mediaTagCollections.$inferSelect;
export type NewMediaTagCollection = typeof mediaTagCollections.$inferInsert;
