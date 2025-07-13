import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

// Enums for backup system
export const backupTypeEnum = pgEnum('backup_type', [
  'database',
  'media', 
  'configuration',
  'full_system',
  'user_export',
  'account_export', 
  'tenant_export',
  'custom_export'
]);

export const backupStatusEnum = pgEnum('backup_status', [
  'scheduled',
  'running', 
  'completed',
  'failed',
  'cancelled'
]);

export const storageTypeEnum = pgEnum('storage_type', [
  'local',
  's3',
  'gcs',
  'azure'
]);

// Backup Policies - defines scheduled backup rules
export const backupPolicies = pgTable('backup_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  backupType: backupTypeEnum('backup_type').notNull(),
  schedule: varchar('schedule_cron', { length: 100 }), // Cron expression
  retentionDays: integer('retention_days').default(30),
  storageLocation: varchar('storage_location', { length: 255 }),
  encryptionEnabled: boolean('encryption_enabled').default(true),
  compressionEnabled: boolean('compression_enabled').default(true),
  isActive: boolean('is_active').default(true),
  configuration: jsonb('configuration'), // Type-specific settings
  temporalScheduleId: varchar('temporal_schedule_id', { length: 255 }), // Temporal schedule reference
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Backup Executions - tracks individual backup runs
export const backupExecutions = pgTable('backup_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  backupPolicyId: uuid('backup_policy_id').references(() => backupPolicies.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  temporalWorkflowId: varchar('temporal_workflow_id', { length: 255 }).unique(),
  temporalRunId: varchar('temporal_run_id', { length: 255 }),
  backupType: backupTypeEnum('backup_type').notNull(),
  status: backupStatusEnum('status').default('scheduled'),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'), // Size in bytes
  fileName: varchar('file_name', { length: 255 }),
  checksumMd5: varchar('checksum_md5', { length: 32 }),
  encryptionKey: varchar('encryption_key', { length: 255 }), // Encrypted key reference
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'), // Additional execution details
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Storage Configurations - defines backup storage destinations
export const backupStorageConfigs = pgTable('backup_storage_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  storageType: storageTypeEnum('storage_type').notNull(),
  connectionString: varchar('connection_string', { length: 500 }), // Encrypted connection details
  bucketName: varchar('bucket_name', { length: 255 }),
  region: varchar('region', { length: 100 }),
  accessKey: varchar('access_key', { length: 255 }), // Encrypted
  secretKey: varchar('secret_key', { length: 255 }), // Encrypted
  configuration: jsonb('configuration'), // Provider-specific settings
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}); 