/**
 * Industry Templates Schema
 * Complete schema for industry template system with build and deployment tracking
 */

import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './auth';
import { modelSchemas } from './model-schemas';
import { modules } from './modules';

// Enums for industry template system
export const industryTypeEnum = pgEnum('industry_type', [
  'modeling',
  'photography', 
  'fitness',
  'entertainment',
  'music',
  'sports',
  'corporate',
  'healthcare',
  'education',
  'real_estate'
]);

export const templateStatusEnum = pgEnum('template_status', [
  'draft',
  'published', 
  'archived',
  'deprecated'
]);

export const componentTypeEnum = pgEnum('component_type', [
  'schema',
  'option_set',
  'module',
  'page',
  'workflow',
  'email_template'
]);

export const deploymentStatusEnum = pgEnum('deployment_status', [
  'pending',
  'building',
  'deploying',
  'completed',
  'failed',
  'cancelled'
]);

export const deploymentTypeEnum = pgEnum('deployment_type', [
  'subscription',
  'manual',
  'preview',
  'update'
]);

// Industry Templates Master Table
export const industryTemplates = pgTable('industry_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  displayName: jsonb('display_name').notNull().default('{}'), // Multi-language support
  description: jsonb('description').default('{}'),
  industryType: industryTypeEnum('industry_type').notNull(),
  version: varchar('version', { length: 50 }).default('1.0.0'),
  isActive: boolean('is_active').default(true),
  isPublished: boolean('is_published').default(false),
  configuration: jsonb('configuration').notNull().default('{}'), // Template settings
  metadata: jsonb('metadata').default('{}'), // Additional data
  buildConfig: jsonb('build_config').default('{}'), // Build optimization settings
  features: jsonb('features').default('{}'), // Enabled features
  subscriptionTiers: jsonb('subscription_tiers').default('["basic"]'), // Required subscription tiers
  estimatedSetupTime: integer('estimated_setup_time').default(30), // Minutes
  popularity: integer('popularity').default(0),
  usageCount: integer('usage_count').default(0),
  rating: integer('rating').default(0), // 1-5 scale * 100 (e.g., 450 = 4.5 stars)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  lastModifiedBy: integer('last_modified_by').references(() => users.id, { onDelete: 'set null' }),
  lastModifiedByName: varchar('last_modified_by_name', { length: 255 }),
  lastChangeSummary: text('last_change_summary'),
}, (table) => ({
  // Indexes for performance
  industryTypeIdx: index('idx_industry_templates_type').on(table.industryType),
  statusIdx: index('idx_industry_templates_status').on(table.isActive, table.isPublished),
  popularityIdx: index('idx_industry_templates_popularity').on(table.popularity),
  createdAtIdx: index('idx_industry_templates_created_at').on(table.createdAt),
  
  // GIN indexes for JSONB fields
  configurationIdx: index('idx_industry_templates_configuration').on(table.configuration),
  metadataIdx: index('idx_industry_templates_metadata').on(table.metadata),
}));

// Template Components Junction Table
export const industryTemplateComponents = pgTable('industry_template_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => industryTemplates.id, { onDelete: 'cascade' }),
  componentType: componentTypeEnum('component_type').notNull(),
  componentId: uuid('component_id').notNull(), // References schema/option_set/module/page ID
  componentName: varchar('component_name', { length: 255 }).notNull(),
  componentOrder: integer('component_order').default(0),
  isRequired: boolean('is_required').default(true),
  isEnabled: boolean('is_enabled').default(true),
  configuration: jsonb('configuration').default('{}'), // Component-specific settings
  dependencies: jsonb('dependencies').default('[]'), // Array of dependent component IDs
  conditions: jsonb('conditions').default('{}'), // Conditional logic
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Unique constraint per template and component
  uniqueTemplateComponent: unique('unique_template_component').on(table.templateId, table.componentType, table.componentId),
  
  // Indexes for performance
  templateIdIdx: index('idx_template_components_template_id').on(table.templateId),
  componentTypeIdx: index('idx_template_components_type').on(table.componentType),
  orderIdx: index('idx_template_components_order').on(table.templateId, table.componentOrder),
}));

// Template Deployment History
export const industryTemplateDeployments = pgTable('industry_template_deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => industryTemplates.id, { onDelete: 'cascade' }),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  deploymentType: deploymentTypeEnum('deployment_type').default('subscription'),
  status: deploymentStatusEnum('status').default('pending'),
  buildId: varchar('build_id', { length: 255 }), // Reference to build output
  deploymentConfig: jsonb('deployment_config').default('{}'),
  buildArtifacts: jsonb('build_artifacts').default('{}'), // Generated files and assets
  performanceMetrics: jsonb('performance_metrics').default('{}'), // Build and runtime metrics
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details').default('{}'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deployedBy: integer('deployed_by').references(() => users.id, { onDelete: 'set null' }),
  subscriptionId: uuid('subscription_id'), // Link to subscription if applicable
  customizations: jsonb('customizations').default('{}'), // Tenant-specific customizations
}, (table) => ({
  // Indexes for deployment tracking
  templateIdIdx: index('idx_deployments_template_id').on(table.templateId),
  tenantIdIdx: index('idx_deployments_tenant_id').on(table.tenantId),
  statusIdx: index('idx_deployments_status').on(table.status),
  startedAtIdx: index('idx_deployments_started_at').on(table.startedAt),
}));

// Enhanced Pages System
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => industryTemplates.id, { onDelete: 'cascade' }),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // NULL for platform-wide templates
  name: varchar('name', { length: 255 }).notNull(),
  displayName: jsonb('display_name').default('{}'), // Multi-language
  routePath: varchar('route_path', { length: 255 }).notNull(), // '/search', '/profiles', '/dashboard'
  layoutType: varchar('layout_type', { length: 100 }).default('default'), // 'sidebar', 'full-width', 'tabbed'
  modules: jsonb('modules').default('[]'), // Array of module placements
  zones: jsonb('zones').default('{}'), // Zone-based layout configuration
  permissions: jsonb('permissions').default('{}'), // Role-based access
  seoConfig: jsonb('seo_config').default('{}'), // SEO settings
  isActive: boolean('is_active').default(true),
  isHomePage: boolean('is_home_page').default(false),
  parentPageId: uuid('parent_page_id'), // Self-reference handled in relations
  orderInNavigation: integer('order_in_navigation').default(0),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Unique route path per tenant
  uniqueRoutePerTenant: unique('unique_route_per_tenant').on(table.tenantId, table.routePath),
  
  // Indexes for page routing
  templateIdIdx: index('idx_pages_template_id').on(table.templateId),
  tenantIdIdx: index('idx_pages_tenant_id').on(table.tenantId),
  routePathIdx: index('idx_pages_route_path').on(table.routePath),
  activeIdx: index('idx_pages_active').on(table.isActive),
}));

// Template Build Artifacts (for tracking build outputs)
export const templateBuilds = pgTable('template_builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => industryTemplates.id, { onDelete: 'cascade' }),
  buildId: varchar('build_id', { length: 255 }).notNull().unique(),
  version: varchar('version', { length: 50 }).notNull(),
  buildStatus: varchar('build_status', { length: 50 }).default('pending'), // 'pending', 'building', 'completed', 'failed'
  buildConfig: jsonb('build_config').notNull().default('{}'),
  artifacts: jsonb('artifacts').default('{}'), // Generated files, sizes, paths
  performanceMetrics: jsonb('performance_metrics').default('{}'),
  buildLog: text('build_log'),
  errorLog: text('error_log'),
  buildStartedAt: timestamp('build_started_at', { withTimezone: true }).defaultNow(),
  buildCompletedAt: timestamp('build_completed_at', { withTimezone: true }),
  buildDuration: integer('build_duration'), // Seconds
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  templateIdIdx: index('idx_template_builds_template_id').on(table.templateId),
  buildIdIdx: index('idx_template_builds_build_id').on(table.buildId),
  statusIdx: index('idx_template_builds_status').on(table.buildStatus),
  startedAtIdx: index('idx_template_builds_started_at').on(table.buildStartedAt),
}));

// Relations
export const industryTemplatesRelations = relations(industryTemplates, ({ many, one }) => ({
  components: many(industryTemplateComponents),
  deployments: many(industryTemplateDeployments),
  pages: many(pages),
  builds: many(templateBuilds),
  createdByUser: one(users, {
    fields: [industryTemplates.createdBy],
    references: [users.id],
  }),
  lastModifiedByUser: one(users, {
    fields: [industryTemplates.lastModifiedBy],
    references: [users.id],
  }),
}));

export const industryTemplateComponentsRelations = relations(industryTemplateComponents, ({ one }) => ({
  template: one(industryTemplates, {
    fields: [industryTemplateComponents.templateId],
    references: [industryTemplates.id],
  }),
}));

export const industryTemplateDeploymentsRelations = relations(industryTemplateDeployments, ({ one }) => ({
  template: one(industryTemplates, {
    fields: [industryTemplateDeployments.templateId],
    references: [industryTemplates.id],
  }),
  tenant: one(tenants, {
    fields: [industryTemplateDeployments.tenantId],
    references: [tenants.id],
  }),
  deployedByUser: one(users, {
    fields: [industryTemplateDeployments.deployedBy],
    references: [users.id],
  }),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  template: one(industryTemplates, {
    fields: [pages.templateId],
    references: [industryTemplates.id],
  }),
  tenant: one(tenants, {
    fields: [pages.tenantId],
    references: [tenants.id],
  }),
  parentPage: one(pages, {
    fields: [pages.parentPageId],
    references: [pages.id],
    relationName: 'parentChild',
  }),
  childPages: many(pages, {
    relationName: 'parentChild',
  }),
}));

export const templateBuildsRelations = relations(templateBuilds, ({ one }) => ({
  template: one(industryTemplates, {
    fields: [templateBuilds.templateId],
    references: [industryTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [templateBuilds.createdBy],
    references: [users.id],
  }),
}));

// TypeScript types
export type IndustryTemplate = typeof industryTemplates.$inferSelect;
export type NewIndustryTemplate = typeof industryTemplates.$inferInsert;
export type IndustryTemplateComponent = typeof industryTemplateComponents.$inferSelect;
export type NewIndustryTemplateComponent = typeof industryTemplateComponents.$inferInsert;
export type IndustryTemplateDeployment = typeof industryTemplateDeployments.$inferSelect;
export type NewIndustryTemplateDeployment = typeof industryTemplateDeployments.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type TemplateBuild = typeof templateBuilds.$inferSelect;
export type NewTemplateBuild = typeof templateBuilds.$inferInsert;

// Export enum values for use in TypeScript
export type IndustryType = typeof industryTypeEnum.enumValues[number];
export type TemplateStatus = typeof templateStatusEnum.enumValues[number];
export type ComponentType = typeof componentTypeEnum.enumValues[number];
export type DeploymentStatus = typeof deploymentStatusEnum.enumValues[number];
export type DeploymentType = typeof deploymentTypeEnum.enumValues[number];

// Template configuration interfaces
export interface IndustryTemplateConfiguration {
  theme: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    customCss?: string;
  };
  features: {
    enableSearch?: boolean;
    enableMessaging?: boolean;
    enableBooking?: boolean;
    enablePayments?: boolean;
    enableAnalytics?: boolean;
  };
  layout: {
    navigation?: 'top' | 'sidebar' | 'both';
    footer?: boolean;
    breadcrumbs?: boolean;
  };
  seo: {
    enableSitemap?: boolean;
    enableRobots?: boolean;
    enableStructuredData?: boolean;
  };
  performance: {
    enableCaching?: boolean;
    enableCdn?: boolean;
    enableCompression?: boolean;
  };
}

// Helper types for working with industry templates
export interface IndustryTemplateWithRelations extends IndustryTemplate {
  components?: IndustryTemplateComponent[];
  deployments?: IndustryTemplateDeployment[];
  pages?: Page[];
  builds?: TemplateBuild[];
  createdByUser?: typeof users.$inferSelect;
  lastModifiedByUser?: typeof users.$inferSelect;
}

export interface CreateIndustryTemplateData {
  name: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  industryType: IndustryType;
  version?: string;
  configuration: IndustryTemplateConfiguration;
  buildConfig?: Record<string, any>;
  features?: Record<string, any>;
  subscriptionTiers?: string[];
} 