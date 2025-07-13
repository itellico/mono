import { 
  pgTable, 
  serial, 
  uuid, 
  varchar, 
  text, 
  integer,
  boolean, 
  timestamp, 
  jsonb,
  bigint,
  index,
  unique,
  real
} from 'drizzle-orm/pg-core';

// ============================
// LLM INTEGRATIONS SCHEMA
// ============================

// LLM Providers - supported LLM services
export const llmProviders = pgTable('llm_providers', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  apiBaseUrl: varchar('api_base_url', { length: 255 }),
  supportedModels: jsonb('supported_models').$type<string[]>().notNull().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('llm_providers_name_idx').on(table.name),
  activeIdx: index('llm_providers_active_idx').on(table.isActive),
}));

// LLM API Keys - encrypted storage per tenant
export const llmApiKeys = pgTable('llm_api_keys', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id'), // null = global/superadmin
  providerId: integer('provider_id').notNull().references(() => llmProviders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  apiKey: text('api_key').notNull(), // Encrypted at application level
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: bigint('created_by', { mode: 'number' }),
}, (table) => ({
  tenantProviderIdx: index('llm_api_keys_tenant_provider_idx').on(table.tenantId, table.providerId),
  tenantIdx: index('llm_api_keys_tenant_idx').on(table.tenantId),
  providerIdx: index('llm_api_keys_provider_idx').on(table.providerId),
  activeIdx: index('llm_api_keys_active_idx').on(table.isActive),
  expirationIdx: index('llm_api_keys_expiration_idx').on(table.expiresAt),
}));

// LLM Scopes - predefined functional domains
export const llmScopes = pgTable('llm_scopes', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  label: jsonb('label').$type<Record<string, string>>().notNull(), // Multilingual labels
  description: jsonb('description').$type<Record<string, string>>(), // Multilingual descriptions
  category: varchar('category', { length: 50 }), // e.g., 'content', 'communication', 'analysis'
  defaultSettings: jsonb('default_settings').$type<{
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }>().default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyIdx: index('llm_scopes_key_idx').on(table.key),
  categoryIdx: index('llm_scopes_category_idx').on(table.category),
  activeIdx: index('llm_scopes_active_idx').on(table.isActive),
}));

// LLM Scope Configs - per-scope configuration (tenant or global)
export const llmScopeConfigs = pgTable('llm_scope_configs', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id'), // null = global/superadmin
  scopeId: integer('scope_id').notNull().references(() => llmScopes.id, { onDelete: 'cascade' }),
  providerId: integer('provider_id').notNull().references(() => llmProviders.id, { onDelete: 'cascade' }),
  apiKeyId: integer('api_key_id').notNull().references(() => llmApiKeys.id, { onDelete: 'cascade' }),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  promptTemplate: text('prompt_template').notNull(),
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(1000),
  topP: real('top_p').default(1.0),
  frequencyPenalty: real('frequency_penalty').default(0.0),
  presencePenalty: real('presence_penalty').default(0.0),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: bigint('created_by', { mode: 'number' }),
  updatedBy: bigint('updated_by', { mode: 'number' }),
}, (table) => ({
  // Primary lookup index for config resolution
  tenantScopeIdx: index('llm_scope_configs_tenant_scope_idx').on(table.tenantId, table.scopeId),
  scopeIdx: index('llm_scope_configs_scope_idx').on(table.scopeId),
  tenantIdx: index('llm_scope_configs_tenant_idx').on(table.tenantId),
  providerIdx: index('llm_scope_configs_provider_idx').on(table.providerId),
  activeIdx: index('llm_scope_configs_active_idx').on(table.isActive),
  // Unique constraint to prevent duplicate configs per tenant+scope
  uniqueTenantScopeConstraint: unique('llm_scope_configs_unique_tenant_scope').on(table.tenantId, table.scopeId),
}));

// LLM Usage Logs - track usage, costs, and performance
export const llmUsageLogs = pgTable('llm_usage_logs', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id'), // null = global/superadmin
  scopeId: integer('scope_id').notNull().references(() => llmScopes.id),
  configId: integer('config_id').notNull().references(() => llmScopeConfigs.id),
  providerId: integer('provider_id').notNull().references(() => llmProviders.id),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  estimatedCost: real('estimated_cost'), // In USD
  responseTimeMs: integer('response_time_ms'),
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'error', 'timeout'
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: bigint('user_id', { mode: 'number' }),
}, (table) => ({
  tenantIdx: index('llm_usage_logs_tenant_idx').on(table.tenantId),
  scopeIdx: index('llm_usage_logs_scope_idx').on(table.scopeId),
  configIdx: index('llm_usage_logs_config_idx').on(table.configId),
  providerIdx: index('llm_usage_logs_provider_idx').on(table.providerId),
  statusIdx: index('llm_usage_logs_status_idx').on(table.status),
  createdAtIdx: index('llm_usage_logs_created_at_idx').on(table.createdAt),
  // For analytics and cost tracking
  tenantScopeTimeIdx: index('llm_usage_logs_tenant_scope_time_idx').on(table.tenantId, table.scopeId, table.createdAt),
}));

// Export types for TypeScript
export type LlmProvider = typeof llmProviders.$inferSelect;
export type NewLlmProvider = typeof llmProviders.$inferInsert;

export type LlmApiKey = typeof llmApiKeys.$inferSelect;
export type NewLlmApiKey = typeof llmApiKeys.$inferInsert;

export type LlmScope = typeof llmScopes.$inferSelect;
export type NewLlmScope = typeof llmScopes.$inferInsert;

export type LlmScopeConfig = typeof llmScopeConfigs.$inferSelect;
export type NewLlmScopeConfig = typeof llmScopeConfigs.$inferInsert;

export type LlmUsageLog = typeof llmUsageLogs.$inferSelect;
export type NewLlmUsageLog = typeof llmUsageLogs.$inferInsert;

// Common scope configuration interface
export interface LlmScopeConfigWithRelations extends LlmScopeConfig {
  scope: LlmScope;
  provider: LlmProvider;
  apiKey: LlmApiKey; // Include apiKey for internal use, will be redacted in cache
}

// Prompt execution interface
export interface LlmPromptRequest {
  scope: string;
  variables: Record<string, any>;
  tenantId?: number;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface LlmPromptResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  responseTimeMs: number;
  estimatedCost?: number;
} 