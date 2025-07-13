import { 
  pgTable,
  bigserial,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { tenants } from './tenants';
import { auditActionEnum, activityActionEnum } from './_enums';

// =======================================
// AUDITING & LOGGING SCHEMAS
// =======================================

/**
 * audit_logs
 * Tracks critical system and entity-level events.
 */
export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  action: auditActionEnum('action').notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: text('entity_id'),
  changes: jsonb('changes'), // For JSON diffs
  context: jsonb('context'), // For metadata (e.g., IP address, user agent)
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('audit_tenant_idx').on(table.tenantId),
  userIdx: index('audit_user_idx').on(table.userId),
  entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
  actionIdx: index('audit_action_idx').on(table.action),
}));

/**
 * version_history
 * Stores snapshots of core entities at different points in time.
 */
export const versionHistory = pgTable('version_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: text('entity_id').notNull(),
  version: integer('version').notNull(),
  note: text('note'), // Optional note for why the version was created
  data: jsonb('data').notNull(), // Full JSONB snapshot of the entity
  createdBy: bigint('created_by', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('version_tenant_idx').on(table.tenantId),
  entityPrimaryIdx: index('version_entity_primary_idx').on(table.tenantId, table.entityType, table.entityId, table.version),
  entityLookupIdx: index('version_entity_lookup_idx').on(table.tenantId, table.entityType, table.entityId),
  createdByIdx: index('version_created_by_idx').on(table.createdBy),
}));

/**
 * user_activity_logs
 * Tracks frontend user interactions for analytics and debugging.
 */
export const userActivityLogs = pgTable('user_activity_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }),
  action: activityActionEnum('action').notNull(),
  component: varchar('component', { length: 255 }), // e.g., 'SearchBar', 'ProfileForm'
  metadata: jsonb('metadata'), // e.g., search query, form values
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('user_activity_tenant_idx').on(table.tenantId),
  userIdx: index('user_activity_user_idx').on(table.userId),
  actionIdx: index('user_activity_action_idx').on(table.action),
}));

/**
 * record_locks
 * Enforces pessimistic locking on entities to prevent concurrent edits.
 * This table serves as the persistent source of truth, synced with Redis.
 */
export const recordLocks = pgTable('record_locks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: text('entity_id').notNull(),
  lockedBy: bigint('locked_by', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }),
  lockedAt: timestamp('locked_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  reason: text('reason'),
}, (table) => ({
  tenantIdx: index('record_lock_tenant_idx').on(table.tenantId),
  entityPrimaryIdx: index('record_lock_entity_primary_idx').on(table.tenantId, table.entityType, table.entityId),
  lockedByIdx: index('record_lock_locked_by_idx').on(table.lockedBy),
  expiresAtIdx: index('record_lock_expires_at_idx').on(table.expiresAt),
}));

// =======================================
// RELATIONS
// =======================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const versionHistoryRelations = relations(versionHistory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [versionHistory.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [versionHistory.createdBy],
    references: [users.id],
  }),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userActivityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userActivityLogs.userId],
    references: [users.id],
  }),
}));

export const recordLocksRelations = relations(recordLocks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [recordLocks.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [recordLocks.lockedBy],
    references: [users.id],
  }),
}));

// =======================================
// TYPES
// =======================================

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type VersionHistory = typeof versionHistory.$inferSelect;
export type NewVersionHistory = typeof versionHistory.$inferInsert;

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type NewUserActivityLog = typeof userActivityLogs.$inferInsert;

export type RecordLock = typeof recordLocks.$inferSelect;
export type NewRecordLock = typeof recordLocks.$inferInsert; 