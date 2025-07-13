// ============================
// MODULAR SCHEMA AGGREGATION
// ============================
// 
// This file aggregates all domain-based schemas into a single export
// for backwards compatibility and centralized schema management.

// Import all enums
export * from './_enums';

// Import all domain schemas
export * from './core';
export * from './auth';
export * from './tenants';
export * from './subscriptions';

export * from './media';
export * from './email';
export * from './marketplace';
export * from './model-schemas';
export * from './options';
export * from './templates';
export * from './modules';
export * from './translations';
export * from './llm-integrations';
export * from './integrations';
export * from './auditing';
export * from './backup';
export * from './workflows';
export * from './categories';
export * from './enhanced-tags';
export * from './industry-templates';
export * from './forms';
export * from './admin-settings';

// TODO: Import remaining domain schemas as they're created
// Note: permissions are already exported from auth.ts, no need for separate export
// export * from './jobs';
// export * from './communications';
// export * from './content';
// export * from './admin';
// export * from './tax';
// export * from './integrations';

// N8N Integration schemas
export * from './n8n-integration';

// Export the database connection config
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
}; 