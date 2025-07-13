import { 
  pgTable, 
  serial,
  text, 
  integer,
  boolean, 
  timestamp, 
  index,
  unique,
  foreignKey,
  jsonb,
  bigint,
  varchar,
  uuid
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './auth';
import { categories } from './categories';
import { relations } from 'drizzle-orm';

// ============================
// REUSABLE DROPDOWN OPTIONS TABLES
// ============================

// Option Sets - reusable dropdown definitions
export const optionSets = pgTable('option_sets', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  label: text('label').notNull(),
  tenantId: integer('tenant_id'), // nullable for platform-wide option sets
  categoryId: uuid('category_id'), // NEW: Link to categories table
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  lastModifiedByName: varchar('last_modified_by_name', { length: 255 }),
  lastChangeSummary: text('last_change_summary'),
}, (table) => ({
  // Unique constraint on slug
  slugUniqueIdx: unique('option_sets_slug_unique').on(table.slug),
  // Index for tenant-based queries
  tenantIdx: index('option_sets_tenant_idx').on(table.tenantId),
  // Index for slug lookups
  slugIdx: index('option_sets_slug_idx').on(table.slug),
  // NEW: Index for category-based queries
  categoryIdx: index('option_sets_category_idx').on(table.categoryId),
  // Foreign key to tenants
  tenantFk: foreignKey({
    columns: [table.tenantId],
    foreignColumns: [tenants.id],
    name: 'option_sets_tenant_id_fk'
  }).onDelete('cascade'),
  // NEW: Foreign key to categories
  categoryFk: foreignKey({
    columns: [table.categoryId],
    foreignColumns: [categories.id],
    name: 'option_sets_category_id_fk'
  }).onDelete('set null'),
}));

// Option Values - individual options within a set
export const optionValues = pgTable('option_values', {
  id: serial('id').primaryKey(),
  optionSetId: integer('option_set_id').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull(),
  order: integer('order').notNull().default(0),
  isDefault: boolean('is_default').default(false),
  canonicalRegion: text('canonical_region').default('GLOBAL'), // The primary region for this value
  regionalMappings: jsonb('regional_mappings').default('{}'), // Mappings to other regions
  metadata: jsonb('metadata').default('{}'), // Additional data like conversions, equivalents
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Composite index on option_set_id and order for efficient sorting
  setOrderIdx: index('option_values_set_order_idx').on(table.optionSetId, table.order),
  // Unique constraint on value within each option set
  setValueUniqueIdx: unique('option_values_set_value_unique').on(table.optionSetId, table.value),
  // Index for option set lookups
  optionSetIdx: index('option_values_option_set_idx').on(table.optionSetId),
  // Index for canonical region queries
  canonicalRegionIdx: index('option_values_canonical_region_idx').on(table.canonicalRegion),
  // Foreign key to option_sets
  optionSetFk: foreignKey({
    columns: [table.optionSetId],
    foreignColumns: [optionSets.id],
    name: 'option_values_option_set_id_fk'
  }).onDelete('cascade'),
}));

export const optionSetsRelations = relations(optionSets, ({ one, many }) => ({
	createdByUser: one(users, {
		fields: [optionSets.createdBy],
		references: [users.id],
	}),
	updatedByUser: one(users, {
		fields: [optionSets.updatedBy],
		references: [users.id],
	}),
  values: many(optionValues),
}));

export const optionValuesRelations = relations(optionValues, ({ one }) => ({
  optionSet: one(optionSets, {
    fields: [optionValues.optionSetId],
    references: [optionSets.id],
  }),
}));

// Export types
export type OptionSet = typeof optionSets.$inferSelect;
export type NewOptionSet = typeof optionSets.$inferInsert;
export type OptionValue = typeof optionValues.$inferSelect;
export type NewOptionValue = typeof optionValues.$inferInsert; 