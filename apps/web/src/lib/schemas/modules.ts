/**
 * Modules Schema
 * JSON-driven module configurations for dynamic page rendering
 */

import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, bigint, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './auth';
import { modelSchemas } from './model-schemas';
import { moduleTypeEnum, moduleStatusEnum } from './_enums';

// Enums for module types and status
// export const moduleTypeEnum = pgEnum('module_type', [
//   'profile_form',
//   'search_interface',
//   'detail_page',
//   'listing_page',
//   'application_form',
//   'card_component'
// ]);

// export const moduleStatusEnum = pgEnum('module_status', [
//   'draft',
//   'published',
//   'archived'
// ]);

// Modules table
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  moduleType: moduleTypeEnum('module_type').notNull(),
  modelSchemaId: uuid('model_schema_id').references(() => modelSchemas.id, { onDelete: 'set null' }),
  configuration: jsonb('configuration').notNull().default('{}'),
  status: moduleStatusEnum('status').default('draft'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  lastModifiedByName: varchar('last_modified_by_name', { length: 255 }),
  lastChangeSummary: text('last_change_summary'),
}, (table) => ({
  // Unique constraint for module names per tenant
  uniqueModuleNamePerTenant: unique('unique_module_name_per_tenant').on(table.tenantId, table.name),

  // Indexes for performance
  tenantIdIdx: index('idx_modules_tenant_id').on(table.tenantId),
  moduleTypeIdx: index('idx_modules_type').on(table.moduleType),
  statusIdx: index('idx_modules_status').on(table.status),
  modelSchemaIdx: index('idx_modules_model_schema').on(table.modelSchemaId),
  createdAtIdx: index('idx_modules_created_at').on(table.createdAt),

  // GIN index for JSONB configuration (will be added via migration)
  // configurationIdx: index('idx_modules_configuration').on(table.configuration).using('gin'),
}));

// Relations
export const modulesRelations = relations(modules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [modules.tenantId],
    references: [tenants.id],
  }),
  modelSchema: one(modelSchemas, {
    fields: [modules.modelSchemaId],
    references: [modelSchemas.id],
  }),
  createdByUser: one(users, {
    fields: [modules.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [modules.updatedBy],
    references: [users.id],
  }),
}));

// TypeScript types
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type ModuleType = typeof moduleTypeEnum.enumValues[number];
export type ModuleStatus = typeof moduleStatusEnum.enumValues[number];

// Module configuration interfaces
export interface ModuleConfiguration {
  layout: {
    type: string;
    columns?: number;
    spacing?: string;
    sections?: string[];
  };
  fields: ModuleField[];
  actions?: ModuleAction[];
  validation?: {
    showErrors?: boolean;
    validateOnBlur?: boolean;
  };
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
  };
  sorting?: {
    enabled?: boolean;
    defaultSort?: string;
    defaultOrder?: 'asc' | 'desc';
    options?: SortOption[];
  };
  filtering?: {
    enabled?: boolean;
    position?: 'sidebar' | 'top';
  };
  workflow?: {
    enabled?: boolean;
    steps?: string[];
  };
  notifications?: {
    enabled?: boolean;
    events?: string[];
  };
  display?: {
    showImage?: boolean;
    showTitle?: boolean;
    showDescription?: boolean;
    maxLines?: number;
  };
  navigation?: {
    showBreadcrumbs?: boolean;
    showBackButton?: boolean;
  };
}

export interface ModuleField {
  id: string;
  modelField?: string; // References field in model schema
  label: string;
  type: string;
  required?: boolean;
  optionSetId?: string; // References option sets
  validation?: Record<string, any>;
  position?: {
    row?: number;
    col?: number;
    section?: string;
  };
  display?: {
    showLabel?: boolean;
    placeholder?: string;
    helpText?: string;
    width?: string;
    hidden?: boolean;
  };
  conditional?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface ModuleAction {
  type: string;
  label: string;
  variant?: string;
  endpoint?: string;
  method?: string;
  confirmation?: {
    enabled?: boolean;
    title?: string;
    message?: string;
  };
  permissions?: string[];
  conditional?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface SortOption {
  field: string;
  label: string;
  direction?: 'asc' | 'desc';
}

// Helper types for working with modules
export interface ModuleWithRelations extends Module {
  tenant?: typeof tenants.$inferSelect;
  modelSchema?: typeof modelSchemas.$inferSelect;
  createdByUser?: typeof users.$inferSelect;
}

export interface CreateModuleData {
  name: string;
  description?: string;
  moduleType: ModuleType;
  modelSchemaId?: string;
  configuration: ModuleConfiguration;
  status?: ModuleStatus;
} 