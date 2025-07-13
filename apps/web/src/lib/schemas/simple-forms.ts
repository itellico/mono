import { 
  pgTable, 
  uuid,
  varchar, 
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';

// Simple forms table that matches the actual database structure
export const forms = pgTable('forms', {
  id: uuid().defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id'),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  slug: varchar({ length: 100 }).notNull(),
  formType: varchar('form_type', { length: 50 }).default('standard'),
  status: varchar({ length: 20 }).default('draft'),
  structure: jsonb().notNull(),
  settings: jsonb().default({}),
  modelSchemaId: uuid('model_schema_id'),
  version: integer().default(1),
  isTemplate: boolean('is_template').default(false),
  isActive: boolean('is_active').default(true),
  allowMultipleSubmissions: boolean('allow_multiple_submissions').default(false),
  requireAuthentication: boolean('require_authentication').default(false),
  theme: jsonb().default({}),
  redirectUrl: varchar('redirect_url', { length: 500 }),
  submissionCount: integer('submission_count').default(0),
  lastSubmissionAt: timestamp('last_submission_at', { mode: 'string' }),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
}, (table) => [
  index('forms_tenant_idx').on(table.tenantId),
  index('forms_status_idx').on(table.status),
  index('forms_type_idx').on(table.formType),
  index('forms_slug_idx').on(table.slug),
  index('forms_active_idx').on(table.isActive),
  index('forms_template_idx').on(table.isTemplate),
  unique('forms_tenant_slug_unique').on(table.tenantId, table.slug),
]);

export type Form = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert; 