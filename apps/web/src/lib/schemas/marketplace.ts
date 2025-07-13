import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, varchar, unique, foreignKey, index, bigserial, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './auth';
import { accounts } from './auth';
import { mediaAssets } from './media';
import { 
  marketplaceSideEnum 
} from './_enums';

// All EAV-related tables have been removed.
// The file is now empty of the previous marketplace schema.

// ============================
// COMPCARD SYSTEM
// ============================

// Compcard completion status enum
const compcardCompletionStatusEnum = text('compcard_completion_status', {
  enum: ['incomplete', 'partial', 'complete'],
});

export const compcardSets = pgTable('compcard_sets', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // COMPCARD Media References (6 slots)
  portraitMediaId: bigint('portrait_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),
  fullBodyMediaId: bigint('full_body_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),
  halfBodyMediaId: bigint('half_body_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),
  commercialMediaId: bigint('commercial_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),
  nudeMediaId: bigint('nude_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),
  freeMediaId: bigint('free_media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'set null' }),

  // COMPCARD Configuration
  templateId: varchar('template_id', { length: 50 }).default('classic'), // classic, modern, elegant
  layoutConfig: jsonb('layout_config').default('{}'), // Custom layout settings

  // Status and Completion
  completionStatus: compcardCompletionStatusEnum.default('incomplete'),
  isPublic: boolean('is_public').default(false), // Whether COMPCARD is publicly viewable

  // Export History
  lastExportedAt: timestamp('last_exported_at'),
  exportCount: integer('export_count').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: unique('compcard_set_user_unique').on(table.userId),
  completionStatusIdx: index('compcard_completion_status_idx').on(table.completionStatus),
  isPublicIdx: index('compcard_is_public_idx').on(table.isPublic),
}));

// ============================
// RELATIONS
// ============================

export const compcardSetsRelations = relations(compcardSets, ({ one }) => ({
  user: one(users, {
    fields: [compcardSets.userId],
    references: [users.id]
  }),
  portraitMedia: one(mediaAssets, {
    fields: [compcardSets.portraitMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_portraitMediaId_mediaAssets_id"
  }),
  fullBodyMedia: one(mediaAssets, {
    fields: [compcardSets.fullBodyMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_fullBodyMediaId_mediaAssets_id"
  }),
  halfBodyMedia: one(mediaAssets, {
    fields: [compcardSets.halfBodyMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_halfBodyMediaId_mediaAssets_id"
  }),
  commercialMedia: one(mediaAssets, {
    fields: [compcardSets.commercialMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_commercialMediaId_mediaAssets_id"
  }),
  nudeMedia: one(mediaAssets, {
    fields: [compcardSets.nudeMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_nudeMediaId_mediaAssets_id"
  }),
  freeMedia: one(mediaAssets, {
    fields: [compcardSets.freeMediaId],
    references: [mediaAssets.id],
    relationName: "compcardSets_freeMediaId_mediaAssets_id"
  })
}));

// ============================
// TYPES
// ============================

export type CompcardSet = typeof compcardSets.$inferSelect;
export type NewCompcardSet = typeof compcardSets.$inferInsert;
