import { pgTable, text, numeric, boolean, timestamp, uuid, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  monthlyPrice: numeric('monthly_price', { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: numeric('yearly_price', { precision: 10, scale: 2 }).notNull(),
  planType: text('plan_type').notNull(),
  trialDays: numeric('trial_days').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const platformFeatures = pgTable('platform_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  type: text('type').notNull(), // e.g., 'boolean', 'limit', 'toggle'
  defaultValue: text('default_value'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const featureLimits = pgTable('feature_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  featureId: uuid('feature_id').notNull().references(() => platformFeatures.id),
  planId: uuid('plan_id').references(() => subscriptionPlans.id),
  limitType: text('limit_type').notNull(), // e.g., 'count', 'storage', 'bandwidth'
  maxValue: integer('max_value').notNull(),
  period: text('period'), // e.g., 'monthly', 'yearly', 'one_time'
  resourceType: text('resource_type'), // e.g., 'users', 'images', 'videos'
  scope: text('scope').notNull(), // e.g., 'global', 'tenant', 'user'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const features = pgTable('features', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const limits = pgTable('limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  featureId: uuid('feature_id').notNull().references(() => features.id),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  limit: numeric('limit').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bundles = pgTable('bundles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bundleFeatures = pgTable('bundle_features', {
  bundleId: uuid('bundle_id').notNull().references(() => bundles.id),
  featureId: uuid('feature_id').notNull().references(() => features.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.bundleId, t.featureId] }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  limits: many(limits),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  limits: many(limits),
  bundleFeatures: many(bundleFeatures),
}));

export const bundlesRelations = relations(bundles, ({ many }) => ({
  bundleFeatures: many(bundleFeatures),
}));

export const bundleFeaturesRelations = relations(bundleFeatures, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleFeatures.bundleId],
    references: [bundles.id],
  }),
  feature: one(features, {
    fields: [bundleFeatures.featureId],
    references: [features.id],
  }),
}));

import { z } from 'zod';

export const insertPlatformFeatureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  defaultValue: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const platformFeaturesRelations = relations(platformFeatures, ({ many }) => ({
  featureLimits: many(featureLimits),
}));

export const featureLimitsRelations = relations(featureLimits, ({ one }) => ({
  platformFeature: one(platformFeatures, {
    fields: [featureLimits.featureId],
    references: [platformFeatures.id],
  }),
  subscriptionPlan: one(subscriptionPlans, {
    fields: [featureLimits.planId],
    references: [subscriptionPlans.id],
  }),
}));
