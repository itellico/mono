import { pgTable, uuid, text, jsonb, timestamp, boolean, index, unique, integer, bigint, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

// ============================
// 🎨 TEMPLATES TABLE (YAML-BASED)
// ============================
// New YAML-based template system decoupled from model_schemas

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // NULL for global templates
  name: text('name').notNull(),
  displayName: jsonb('display_name').notNull().default('{}'), // { 'en-US': 'Contact Form' }
  description: jsonb('description').default('{}'), // { 'en-US': 'Basic contact form template' }
  category: text('category').notNull(), // 'profile', 'job', 'application', 'form', etc.
  subCategory: text('sub_category'), // 'fitness', 'photographer', 'casting', etc.
  baseLayoutId: uuid('base_layout_id').notNull(), // Reference to template_base_layouts
  yamlDefinition: text('yaml_definition').notNull(), // YAML template definition
  isGlobal: boolean('is_global').default(false), // Global templates available to all tenants
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  metadata: jsonb('metadata').default('{}'), // Additional configuration
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  lastModifiedByName: varchar('last_modified_by_name', { length: 255 }),
  lastChangeSummary: text('last_change_summary'),
}, (table) => ({
  // Indexes
  tenantCategoryIdx: index('templates_tenant_category_idx').on(table.tenantId, table.category),
  categorySubCategoryIdx: index('templates_category_sub_category_idx').on(table.category, table.subCategory),
  globalIdx: index('templates_global_idx').on(table.isGlobal),
  activeIdx: index('templates_active_idx').on(table.isActive),
  baseLayoutIdx: index('templates_base_layout_idx').on(table.baseLayoutId),

  // Unique constraints
  uniqueTenantName: unique('templates_tenant_name_unique').on(table.tenantId, table.name),
}));

// ============================
// 🧩 REUSABLE COMPONENTS TABLE
// ============================
// Stores reusable fields, layouts, and template blocks

export const reusableComponents = pgTable('reusable_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // NULL for global components
  name: text('name').notNull(),
  displayName: jsonb('display_name').notNull().default('{}'), // { 'en-US': 'Contact Info Block' }
  description: jsonb('description').default('{}'),
  type: text('type').notNull(), // 'field', 'layout', 'block', 'template'
  category: text('category'), // 'contact', 'personal', 'professional', etc.
  yamlDefinition: text('yaml_definition').notNull(), // YAML component definition
  previewImage: text('preview_image'), // Optional preview image URL
  isGlobal: boolean('is_global').default(false),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0), // Track how often it's used
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
}, (table) => ({
  // Indexes
  tenantTypeIdx: index('reusable_components_tenant_type_idx').on(table.tenantId, table.type),
  typeCategoryIdx: index('reusable_components_type_category_idx').on(table.type, table.category),
  globalIdx: index('reusable_components_global_idx').on(table.isGlobal),
  activeIdx: index('reusable_components_active_idx').on(table.isActive),
  usageIdx: index('reusable_components_usage_idx').on(table.usageCount),

  // Unique constraints
  uniqueTenantName: unique('reusable_components_tenant_name_unique').on(table.tenantId, table.name),
}));

// ============================
// 🏗️ TEMPLATE BASE LAYOUTS TABLE
// ============================
// Predefined base layouts that templates must start with

export const templateBaseLayouts = pgTable('template_base_layouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: jsonb('display_name').notNull().default('{}'), // { 'en-US': 'Single Column Form' }
  description: jsonb('description').default('{}'),
  category: text('category').notNull(), // 'form', 'profile', 'dashboard', 'search'
  yamlDefinition: text('yaml_definition').notNull(), // Base YAML structure
  previewImage: text('preview_image'), // Preview image URL
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Indexes
  categoryIdx: index('template_base_layouts_category_idx').on(table.category),
  activeIdx: index('template_base_layouts_active_idx').on(table.isActive),
  sortIdx: index('template_base_layouts_sort_idx').on(table.sortOrder),
}));

// ============================
// 🔗 TEMPLATE USAGE TRACKING
// ============================
// Track which templates use which reusable components

export const templateComponentUsage = pgTable('template_component_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull(),
  componentId: uuid('component_id').notNull(),
  usageContext: jsonb('usage_context').default('{}'), // Where/how it's used in the template
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Indexes
  templateIdx: index('template_component_usage_template_idx').on(table.templateId),
  componentIdx: index('template_component_usage_component_idx').on(table.componentId),

  // Unique constraints
  uniqueUsage: unique('template_component_usage_unique').on(table.templateId, table.componentId),
}));

// ============================
// 🔄 RELATIONS
// ============================

export const templatesRelations = relations(templates, ({ one, many }) => ({
  baseLayout: one(templateBaseLayouts, {
    fields: [templates.baseLayoutId],
    references: [templateBaseLayouts.id],
  }),
  componentUsages: many(templateComponentUsage),
  createdByUser: one(users, {
    fields: [templates.createdBy],
    references: [users.id],
    relationName: 'templates_created_by_user',
  }),
  updatedByUser: one(users, {
    fields: [templates.updatedBy],
    references: [users.id],
    relationName: 'templates_updated_by_user',
  }),
}));

export const reusableComponentsRelations = relations(reusableComponents, ({ many }) => ({
  templateUsages: many(templateComponentUsage),
}));

export const templateBaseLayoutsRelations = relations(templateBaseLayouts, ({ many }) => ({
  templates: many(templates),
}));

export const templateComponentUsageRelations = relations(templateComponentUsage, ({ one }) => ({
  template: one(templates, {
    fields: [templateComponentUsage.templateId],
    references: [templates.id],
  }),
  component: one(reusableComponents, {
    fields: [templateComponentUsage.componentId],
    references: [reusableComponents.id],
  }),
}));

// ============================
// 📝 TYPESCRIPT INTERFACES
// ============================

export interface Template {
  id: string;
  tenantId: string | null;
  name: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  category: string;
  subCategory?: string;
  baseLayoutId: string;
  yamlDefinition: string;
  isGlobal: boolean;
  isActive: boolean;
  version: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ReusableComponent {
  id: string;
  tenantId: string | null;
  name: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  type: 'field' | 'layout' | 'block' | 'template';
  category?: string;
  yamlDefinition: string;
  previewImage?: string;
  isGlobal: boolean;
  isActive: boolean;
  usageCount: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TemplateBaseLayout {
  id: string;
  name: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  category: string;
  yamlDefinition: string;
  previewImage?: string;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================
// 🎯 YAML TEMPLATE STRUCTURE
// ============================

export interface YamlTemplate {
  name: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  baseLayout: string;
  version: string;
  metadata?: Record<string, any>;
  layout: YamlLayoutElement[];
  fields: YamlField[];
  includes?: YamlInclude[];
}

export interface YamlLayoutElement {
  id: string;
  type: 'tab' | 'card' | 'section' | 'step' | 'divider' | 'text';
  name?: string;
  label?: Record<string, string>;
  columns?: number; // 1-4 columns
  collapsible?: boolean;
  children?: YamlLayoutElement[];
  fields?: string[]; // Field IDs
  columnFields?: Record<number, string[]>; // Column-specific field IDs: { 0: ['field1', 'field2'], 1: ['field3'] }
  content?: string; // For text elements
  metadata?: Record<string, any>;
}

export interface YamlField {
  id: string;
  name: string;
  label: Record<string, string>;
  type: string;
  required?: boolean;
  validation?: Record<string, any>;
  defaultValue?: any;
  options?: Array<{ value: string; label: Record<string, string> }>;
  optionSetId?: number;
  allowMultiple?: boolean;
  metadata?: Record<string, any>;
  system?: boolean;
}

export interface YamlInclude {
  type: 'component' | 'template';
  id: string;
  name: string;
  position?: string; // Where to include it
  overrides?: Record<string, any>; // Override properties
} 