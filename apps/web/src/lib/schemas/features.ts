import { 
  pgTable, 
  serial, 
  uuid, 
  varchar, 
  text, 
  integer,
  boolean, 
  timestamp, 
  index,
  unique
} from 'drizzle-orm/pg-core';
import { 
  featureTypeEnum,
  limitTypeEnum,
  limitUnitEnum
} from './_enums';

// ============================
// PLATFORM FEATURES SYSTEM
// ============================

// Platform features - defines what features are available
export const platformFeatures = pgTable('platform_features', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  // Feature identification
  featureKey: varchar('feature_key', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Feature categorization
  featureType: featureTypeEnum('feature_type').notNull(),
  category: varchar('category', { length: 100 }),
  icon: varchar('icon', { length: 100 }),

  // Feature configuration
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  defaultEnabled: boolean('default_enabled').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  featureKeyIdx: index('platform_features_feature_key_idx').on(table.featureKey),
  featureTypeIdx: index('platform_features_feature_type_idx').on(table.featureType),
  categoryIdx: index('platform_features_category_idx').on(table.category),
  activeIdx: index('platform_features_active_idx').on(table.isActive),
  sortOrderIdx: index('platform_features_sort_order_idx').on(table.sortOrder),
}));

// Feature limits - defines limits for subscription enforcement
export const featureLimits = pgTable('feature_limits', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),

  // Feature reference
  featureId: integer('feature_id').references(() => platformFeatures.id, { onDelete: 'cascade' }).notNull(),

  // Limit identification
  limitKey: varchar('limit_key', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Limit configuration
  limitType: limitTypeEnum('limit_type').notNull(),
  limitUnit: limitUnitEnum('limit_unit').notNull(),

  // Limit values
  defaultValue: integer('default_value'),
  minValue: integer('min_value'),
  maxValue: integer('max_value'),

  // Limit properties
  isRequired: boolean('is_required').default(false),
  sortOrder: integer('sort_order').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  featureIdx: index('feature_limits_feature_idx').on(table.featureId),
  limitKeyIdx: index('feature_limits_limit_key_idx').on(table.limitKey),
  limitTypeIdx: index('feature_limits_limit_type_idx').on(table.limitType),
  requiredIdx: index('feature_limits_required_idx').on(table.isRequired),
  sortOrderIdx: index('feature_limits_sort_order_idx').on(table.sortOrder),
  // Ensure unique limit keys per feature
  featureLimitKeyIdx: unique('feature_limits_feature_limit_key_unique').on(table.featureId, table.limitKey),
}));

// Export types
export type PlatformFeature = typeof platformFeatures.$inferSelect;
export type NewPlatformFeature = typeof platformFeatures.$inferInsert;
export type FeatureLimit = typeof featureLimits.$inferSelect;
export type NewFeatureLimit = typeof featureLimits.$inferInsert; 