import { 
  pgTable, 
  serial, 
  bigint,
  uuid, 
  varchar, 
  text, 
  integer,
  boolean, 
  timestamp, 
  decimal,
  jsonb,
  date,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './auth';

// ============================
// N8N INTEGRATION TABLES
// ============================

// Tenant N8N configuration and credentials
export const tenantN8nConfigs = pgTable('tenant_n8n_configs', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  llmProvider: varchar('llm_provider', { length: 50 }).notNull(), // 'openai', 'anthropic', 'mistral'
  encryptedApiKey: text('encrypted_api_key').notNull(), // Encrypted LLM API key
  keyHash: varchar('key_hash', { length: 64 }), // Hash for key validation without decryption
  modelConfig: jsonb('model_config').default('{}').notNull(), // Model-specific settings
  webhookPrefix: varchar('webhook_prefix', { length: 100 }), // Custom webhook prefix for tenant
  notificationSettings: jsonb('notification_settings').default('{}').notNull(), // Mattermost, Slack, etc.
  rateLimits: jsonb('rate_limits').default('{}').notNull(), // Per-tenant rate limiting config
  quotas: jsonb('quotas').default('{}').notNull(), // Usage quotas and limits
  isActive: boolean('is_active').default(true).notNull(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  // Unique constraint: one config per tenant per provider
  uniqueTenantProviderIdx: unique('idx_tenant_n8n_unique').on(table.tenantId, table.llmProvider),
  // Fast tenant lookups
  tenantActiveIdx: index('idx_tenant_n8n_active').on(table.tenantId, table.isActive),
  // Provider-based queries
  providerActiveIdx: index('idx_tenant_n8n_provider').on(table.llmProvider, table.isActive),
  // Last used tracking
  lastUsedIdx: index('idx_tenant_n8n_last_used').on(table.lastUsed),
  // Tenant isolation
  tenantIdx: index('idx_tenant_n8n_tenant').on(table.tenantId),
}));

// Daily usage aggregation per tenant and workflow
export const tenantN8nUsage = pgTable('tenant_n8n_usage', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workflowId: varchar('workflow_id', { length: 100 }).notNull(),
  executionDate: date('execution_date').notNull(),
  llmProvider: varchar('llm_provider', { length: 50 }).notNull(),
  executionCount: integer('execution_count').default(0).notNull(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  totalCost: decimal('total_cost', { precision: 10, scale: 4 }).default('0').notNull(),
  avgExecutionTime: integer('avg_execution_time').default(0).notNull(), // milliseconds
  successCount: integer('success_count').default(0).notNull(),
  errorCount: integer('error_count').default(0).notNull(),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default('0').notNull(), // percentage
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one record per tenant/workflow/date
  uniqueDailyUsageIdx: unique('idx_tenant_n8n_usage_unique').on(table.tenantId, table.workflowId, table.executionDate),
  // Fast tenant usage queries
  tenantDateIdx: index('idx_tenant_usage_date').on(table.tenantId, table.executionDate),
  // Workflow-specific usage
  workflowDateIdx: index('idx_workflow_usage_date').on(table.workflowId, table.executionDate),
  // Provider-based analytics
  providerDateIdx: index('idx_provider_usage_date').on(table.llmProvider, table.executionDate),
  // Cost tracking
  costDateIdx: index('idx_usage_cost_date').on(table.totalCost, table.executionDate),
  // Performance tracking
  executionTimeIdx: index('idx_usage_exec_time').on(table.avgExecutionTime),
}));

// Individual N8N workflow execution logs
export const n8nExecutionLogs = pgTable('n8n_execution_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  workflowId: varchar('workflow_id', { length: 100 }).notNull(),
  nodeId: varchar('node_id', { length: 100 }), // Specific N8N node that executed
  executionMode: varchar('execution_mode', { length: 20 }).default('sync').notNull(), // 'sync', 'async', 'test'
  llmProvider: varchar('llm_provider', { length: 50 }), // Which LLM provider was used
  model: varchar('model', { length: 100 }), // Specific model used (gpt-4, claude-3, etc.)
  inputData: jsonb('input_data'), // Sanitized input data (no sensitive info)
  outputData: jsonb('output_data'), // Execution results
  executionTime: integer('execution_time'), // milliseconds
  tokensUsed: integer('tokens_used').default(0).notNull(),
  inputTokens: integer('input_tokens').default(0).notNull(),
  outputTokens: integer('output_tokens').default(0).notNull(),
  estimatedCost: decimal('estimated_cost', { precision: 8, scale: 4 }).default('0').notNull(),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),
  webhookPath: varchar('webhook_path', { length: 200 }), // The webhook URL used
  userAgent: varchar('user_agent', { length: 500 }),
  sourceIp: varchar('source_ip', { length: 45 }), // IPv4 or IPv6
  requestId: varchar('request_id', { length: 100 }), // For request tracing
  metadata: jsonb('metadata').default('{}').notNull(), // Additional context
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Fast tenant-based queries
  tenantDateIdx: index('idx_execution_tenant_date').on(table.tenantId, table.createdAt),
  // Workflow-specific logs
  workflowDateIdx: index('idx_execution_workflow').on(table.workflowId, table.createdAt),
  // Success/failure analysis
  successDateIdx: index('idx_execution_success').on(table.success, table.createdAt),
  // User activity tracking
  userDateIdx: index('idx_execution_user').on(table.userId, table.createdAt),
  // Provider analytics
  providerDateIdx: index('idx_execution_provider').on(table.llmProvider, table.createdAt),
  // Cost tracking
  costDateIdx: index('idx_execution_cost').on(table.estimatedCost, table.createdAt),
  // Performance monitoring
  executionTimeIdx: index('idx_execution_time').on(table.executionTime),
  // Request tracing
  requestIdIdx: index('idx_execution_request').on(table.requestId),
  // Error analysis
  errorIdx: index('idx_execution_error').on(table.errorCode, table.createdAt),
}));

// N8N workflow templates and tenant customizations
export const n8nWorkflowTemplates = pgTable('n8n_workflow_templates', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'translation', 'content', 'communication', 'automation'
  description: text('description'),
  workflowDefinition: jsonb('workflow_definition').notNull(), // Complete N8N workflow JSON
  inputSchema: jsonb('input_schema'), // JSON schema for workflow inputs
  outputSchema: jsonb('output_schema'), // JSON schema for expected outputs
  supportedProviders: text('supported_providers').array().notNull(), // ['openai', 'anthropic', 'mistral']
  requiredCredentials: text('required_credentials').array().notNull(), // Required credential types
  estimatedCost: decimal('estimated_cost', { precision: 8, scale: 4 }), // Per execution cost estimate
  estimatedDuration: integer('estimated_duration'), // Estimated execution time in seconds
  isSystemTemplate: boolean('is_system_template').default(false).notNull(), // Platform-provided vs custom
  createdByTenantId: integer('created_by_tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null for system templates
  isPublic: boolean('is_public').default(false).notNull(), // Can be shared across tenants
  version: varchar('version', { length: 20 }).default('1.0.0').notNull(),
  changelog: jsonb('changelog').default('[]').notNull(), // Version change history
  tags: text('tags').array().default('{}').notNull(), // Searchable tags
  popularity: integer('popularity').default(0).notNull(), // Usage counter across platform
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  // Unique slug per tenant (system templates have null tenant)
  uniqueSlugIdx: unique('idx_workflow_template_slug').on(table.createdByTenantId, table.slug),
  // Category-based browsing
  categoryActiveIdx: index('idx_workflow_category').on(table.category, table.isActive),
  // System vs custom templates
  systemTemplateIdx: index('idx_workflow_system').on(table.isSystemTemplate, table.isActive),
  // Public template discovery
  publicTemplateIdx: index('idx_workflow_public').on(table.isPublic, table.isActive),
  // Tenant-specific templates
  tenantTemplateIdx: index('idx_workflow_tenant').on(table.createdByTenantId, table.isActive),
  // Popularity ranking
  popularityIdx: index('idx_workflow_popularity').on(table.popularity, table.isActive),
  // Tag-based search
  tagsIdx: index('idx_workflow_tags').using('gin', table.tags),
  // Provider filtering
  providersIdx: index('idx_workflow_providers').using('gin', table.supportedProviders),
}));

// Tenant-specific workflow instances and customizations
export const tenantWorkflowInstances = pgTable('tenant_workflow_instances', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  templateId: integer('template_id').notNull().references(() => n8nWorkflowTemplates.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // Custom name for this instance
  customConfig: jsonb('custom_config').default('{}').notNull(), // Tenant-specific modifications
  n8nWorkflowId: varchar('n8n_workflow_id', { length: 100 }), // Actual N8N workflow ID
  webhookPath: varchar('webhook_path', { length: 200 }), // Generated webhook path
  isActive: boolean('is_active').default(true).notNull(),
  isTest: boolean('is_test').default(false).notNull(), // Test vs production instance
  executionCount: integer('execution_count').default(0).notNull(),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  // Unique instance per tenant per template
  uniqueTenantTemplateIdx: unique('idx_tenant_workflow_unique').on(table.tenantId, table.templateId, table.name),
  // Fast tenant queries
  tenantActiveIdx: index('idx_tenant_workflow_active').on(table.tenantId, table.isActive),
  // Template usage tracking
  templateUsageIdx: index('idx_template_usage').on(table.templateId, table.executionCount),
  // N8N workflow mapping
  n8nWorkflowIdx: index('idx_n8n_workflow_mapping').on(table.n8nWorkflowId),
  // Webhook path lookups
  webhookPathIdx: index('idx_webhook_path').on(table.webhookPath),
  // Test vs production
  testInstanceIdx: index('idx_test_instance').on(table.isTest, table.isActive),
}));

// ============================
// RELATIONS
// ============================

export const tenantN8nConfigsRelations = relations(tenantN8nConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantN8nConfigs.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [tenantN8nConfigs.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [tenantN8nConfigs.updatedBy],
    references: [users.id],
  }),
}));

export const tenantN8nUsageRelations = relations(tenantN8nUsage, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantN8nUsage.tenantId],
    references: [tenants.id],
  }),
}));

export const n8nExecutionLogsRelations = relations(n8nExecutionLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [n8nExecutionLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [n8nExecutionLogs.userId],
    references: [users.id],
  }),
}));

export const n8nWorkflowTemplatesRelations = relations(n8nWorkflowTemplates, ({ one, many }) => ({
  createdByTenant: one(tenants, {
    fields: [n8nWorkflowTemplates.createdByTenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [n8nWorkflowTemplates.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [n8nWorkflowTemplates.updatedBy],
    references: [users.id],
  }),
  instances: many(tenantWorkflowInstances),
}));

export const tenantWorkflowInstancesRelations = relations(tenantWorkflowInstances, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantWorkflowInstances.tenantId],
    references: [tenants.id],
  }),
  template: one(n8nWorkflowTemplates, {
    fields: [tenantWorkflowInstances.templateId],
    references: [n8nWorkflowTemplates.id],
  }),
  createdByUser: one(users, {
    fields: [tenantWorkflowInstances.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [tenantWorkflowInstances.updatedBy],
    references: [users.id],
  }),
}));

// ============================
// TYPE EXPORTS
// ============================

export type TenantN8nConfig = typeof tenantN8nConfigs.$inferSelect;
export type NewTenantN8nConfig = typeof tenantN8nConfigs.$inferInsert;
export type TenantN8nUsage = typeof tenantN8nUsage.$inferSelect;
export type NewTenantN8nUsage = typeof tenantN8nUsage.$inferInsert;
export type N8nExecutionLog = typeof n8nExecutionLogs.$inferSelect;
export type NewN8nExecutionLog = typeof n8nExecutionLogs.$inferInsert;
export type N8nWorkflowTemplate = typeof n8nWorkflowTemplates.$inferSelect;
export type NewN8nWorkflowTemplate = typeof n8nWorkflowTemplates.$inferInsert;
export type TenantWorkflowInstance = typeof tenantWorkflowInstances.$inferSelect;
export type NewTenantWorkflowInstance = typeof tenantWorkflowInstances.$inferInsert; 