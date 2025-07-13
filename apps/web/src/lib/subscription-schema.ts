import { z } from 'zod';
import { pgTable, text, numeric, boolean, timestamp, uuid, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  monthlyPrice: z.number(),
  yearlyPrice: z.number(),
  planType: z.enum(['Free', 'Basic', 'Pro', 'Enterprise']),
  trialDays: z.number(),
  isActive: z.boolean(),
  features: z.array(z.string()),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

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

export const insertPlatformFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  defaultValue: z.string().optional(),
  isActive: z.boolean().default(true),
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

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  featureLimits: many(featureLimits),
}));

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
