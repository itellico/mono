import { pgTable, serial, varchar, text, boolean, timestamp, integer, jsonb, real, index, unique } from 'drizzle-orm/pg-core';

// NORMAL INTEGRATIONS SCHEMA
// This is separate from LLM integrations - handles general platform integrations like Mattermost, webhooks, etc.

// Main integrations catalog table
export const integrations = pgTable(
  'integrations',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    iconUrl: varchar('icon_url', { length: 500 }),
    settingsSchema: jsonb('settings_schema').notNull(), // JSON Schema for settings form
    defaultSettings: jsonb('default_settings').default('{}').notNull(),
    category: varchar('category', { length: 50 }).notNull(), // communication, payment, automation, etc.
    isTemporalEnabled: boolean('is_temporal_enabled').default(false).notNull(),
    handler: varchar('handler', { length: 100 }), // Handler class/function name
    enabled: boolean('enabled').default(true).notNull(),
    version: varchar('version', { length: 20 }).notNull(),
    author: varchar('author', { length: 100 }),
    supportUrl: varchar('support_url', { length: 500 }),
    documentationUrl: varchar('documentation_url', { length: 500 }),
    webhookUrl: varchar('webhook_url', { length: 500 }),
    requiresAuth: boolean('requires_auth').default(false).notNull(),
    authType: varchar('auth_type', { length: 20 }), // oauth, api_key, basic, custom
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('integrations_slug_idx').on(table.slug),
    categoryIdx: index('integrations_category_idx').on(table.category),
    enabledIdx: index('integrations_enabled_idx').on(table.enabled),
  })
);

// Tenant-specific integration configurations
export const tenantIntegrations = pgTable(
  'tenant_integrations',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull(), // References tenants table
    integrationSlug: varchar('integration_slug', { length: 100 }).notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive, disabled
    settings: jsonb('settings').default('{}').notNull(), // Integration-specific settings
    fieldMappings: jsonb('field_mappings').default('{}').notNull(), // Field mapping configurations
    lastSyncedAt: timestamp('last_synced_at'),
    lastErrorAt: timestamp('last_error_at'),
    lastErrorMessage: text('last_error_message'),
    syncCount: integer('sync_count').default(0).notNull(),
    errorCount: integer('error_count').default(0).notNull(),
    isTestMode: boolean('is_test_mode').default(false).notNull(),
    createdBy: integer('created_by'), // User ID who created this
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('tenant_integrations_tenant_idx').on(table.tenantId),
    slugIdx: index('tenant_integrations_slug_idx').on(table.integrationSlug),
    statusIdx: index('tenant_integrations_status_idx').on(table.status),
    tenantSlugUnique: unique('tenant_integrations_tenant_slug_unique').on(table.tenantId, table.integrationSlug),
  })
);

// Integration execution logs
export const integrationLogs = pgTable(
  'integration_logs',
  {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id').notNull(),
    integrationSlug: varchar('integration_slug', { length: 100 }).notNull(),
    tenantIntegrationId: integer('tenant_integration_id').notNull(),
    status: varchar('status', { length: 20 }).notNull(), // success, error, retrying, pending
    payload: jsonb('payload').notNull(), // Input payload
    response: jsonb('response'), // Response data
    errorMessage: text('error_message'),
    errorCode: varchar('error_code', { length: 50 }),
    duration: integer('duration'), // milliseconds
    workflowId: varchar('workflow_id', { length: 100 }), // Temporal workflow ID
    runId: varchar('run_id', { length: 100 }), // Temporal run ID
    correlationId: varchar('correlation_id', { length: 100 }), // For tracking related operations
    triggeredBy: integer('triggered_by'), // User ID who triggered this
    startedAt: timestamp('started_at').notNull(),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('integration_logs_tenant_idx').on(table.tenantId),
    slugIdx: index('integration_logs_slug_idx').on(table.integrationSlug),
    statusIdx: index('integration_logs_status_idx').on(table.status),
    tenantIntegrationIdx: index('integration_logs_tenant_integration_idx').on(table.tenantIntegrationId),
    correlationIdx: index('integration_logs_correlation_idx').on(table.correlationId),
    createdAtIdx: index('integration_logs_created_at_idx').on(table.createdAt),
    workflowIdx: index('integration_logs_workflow_idx').on(table.workflowId),
  })
);

// Export all integration tables
export const integrationsSchema = {
  integrations,
  tenantIntegrations,
  integrationLogs,
};

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type TenantIntegration = typeof tenantIntegrations.$inferSelect;
export type NewTenantIntegration = typeof tenantIntegrations.$inferInsert;
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type NewIntegrationLog = typeof integrationLogs.$inferInsert; 