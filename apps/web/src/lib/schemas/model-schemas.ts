import { pgTable, uuid, text, jsonb, timestamp, boolean, index, unique, bigint, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

// ============================
// 🏗️ MODEL SCHEMAS TABLE
// ============================
// Stores profile model definitions for multi-industry marketplace

export const modelSchemas = pgTable('model_schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // Allow NULL for platform-level models
  type: text('type').notNull(), // 'human_model', 'freelancer', 'business', etc.
  subType: text('sub_type').notNull(), // 'fitness', 'child', 'photographer', etc.
  displayName: jsonb('display_name').notNull().default('{}'), // { 'en-US': 'Fitness Model' }
  description: jsonb('description').default('{}'), // { 'en-US': 'Professional fitness models' }
  schema: jsonb('schema').notNull().default('{}'), // Zod-compatible schema definition
  isTemplate: boolean('is_template').default(false), // true for reusable templates, false for actual schemas
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'), // Additional configuration
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  lastModifiedByName: varchar('last_modified_by_name', { length: 255 }),
  lastChangeSummary: text('last_change_summary'),
}, (table) => ({
  // Indexes
  tenantTypeIdx: index('model_schemas_tenant_type_idx').on(table.tenantId, table.type),
  typeSubTypeIdx: index('model_schemas_type_sub_type_idx').on(table.type, table.subType),
  activeIdx: index('model_schemas_active_idx').on(table.isActive),
  templateIdx: index('model_schemas_template_idx').on(table.isTemplate),

  // Unique constraints
  uniqueTypeSubType: unique('model_schemas_tenant_type_sub_type_unique').on(table.tenantId, table.type, table.subType),
}));

export const modelSchemasRelations = relations(modelSchemas, ({ one }) => ({
	createdByUser: one(users, {
		fields: [modelSchemas.createdBy],
		references: [users.id],
	}),
	updatedByUser: one(users, {
		fields: [modelSchemas.updatedBy],
		references: [users.id],
	}),
}));

// ============================
// 🎯 TYPES FOR MODEL SCHEMAS
// ============================

export interface ModelSchema {
  id: string;
  tenantId: string | null;
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  schema: SchemaDefinition;
  isTemplate: boolean;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  lastModifiedByName?: string;
  lastChangeSummary?: string;
}

export interface SchemaDefinition {
  fields: SchemaField[];
  version: string;
  validationRules?: Record<string, any>;
}

export interface SchemaField {
  id: string;
  name: string;
  label: Record<string, string>; // { 'en-US': 'Height' }
  type: FieldType;
  required: boolean;
  validation?: FieldValidation;
  defaultValue?: any;
  options?: FieldOption[]; // For inline enum/select fields (legacy)
  optionSetId?: number; // Reference to option_sets table for reusable dropdowns
  allowMultiple?: boolean; // For multiselect fields using option sets
  metadata?: Record<string, any>;
  // Template Builder Fields
  tab?: string; // Group fields into tabs
  group?: string; // Group fields within tabs
  order: number; // Sort order within group
  visibleToRoles?: string[]; // Roles that can see this field
  editableByRoles?: string[]; // Roles that can edit this field
  requiredByRoles?: string[]; // Roles for which this field is required
  unit?: string; // Unit for number fields (cm, kg, etc.)
  system?: boolean; // System fields (name, email, etc.)
}

export type FieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'email'
  | 'url'
  | 'phone'
  | 'enum'           // Single select with inline options (legacy)
  | 'multiselect'    // Multi select with inline options (legacy)
  | 'option_set'     // Single select using option set
  | 'text'
  | 'file'
  | 'image';

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string; // Custom validation rule
}

export interface FieldOption {
  value: string;
  label: Record<string, string>; // { 'en-US': 'Male' }
  metadata?: Record<string, any>;
} 