import { pgTable, bigserial, uuid, integer, varchar, text, jsonb, boolean, timestamp, bigint, decimal, index, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Import required tables and enums
import { tenants } from './tenants';
import { users } from './auth';
import { mediaTypeEnum, pictureTypeEnum } from './_enums';

// ============================
// MEDIA MANAGEMENT SYSTEM
// ============================

// 1. CORE MEDIA ASSETS (Essential data only)
export const mediaAssets = pgTable('media_assets', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Essential File Info
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),

  // Storage Path removed - CDN URL now computed on-demand from directoryHash + fileHash

  // Media Properties  
  mediaType: mediaTypeEnum('media_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'), // for videos

  // Thumbnail Status (minimal)
  hasThumbnails: boolean('has_thumbnails').default(false),
  thumbnailSizes: varchar('thumbnail_sizes', { length: 20 }), // "150,300,600" - simple comma-separated

  // Processing Status (simplified)
  isProcessed: boolean('is_processed').default(false),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'), // pending, processing, completed, failed

  // Optimization Columns (Added for 2-table architecture)
  isGenerated: boolean('is_generated').default(false), // Whether thumbnails/variants are generated
  isOptimized: boolean('is_optimized').default(false), // Whether original file is optimized
  optimizationStatus: varchar('optimization_status', { length: 20 }).default('pending'), // pending, processing, completed, failed
  thumbnailFormats: jsonb('thumbnail_formats').default('{}'), // Generated thumbnail info: {"small": "jpg", "medium": "webp"}
  approvalStatus: varchar('approval_status', { length: 20 }).default('pending'), // pending, approved, rejected, flagged

  // Security Hashes
  directoryHash: varchar('directory_hash', { length: 17 }).notNull(), // For secure URLs
  fileHash: varchar('file_hash', { length: 64 }).notNull(), // SHA-256 hash

  // Basic Classification
  pictureType: pictureTypeEnum('picture_type'),

  // Technical Metadata (consolidated from removed mediaMetadata table)
  metadata: jsonb('metadata').default('{}'), // EXIF, camera info, etc.

  // Deletion Management (Two-Phase Deletion)
  deletionStatus: varchar('deletion_status', { length: 20 }).default('active'), // active, pending_deletion, deleted
  deletionRequestedAt: timestamp('deletion_requested_at'),
  deletionRequestedBy: bigint('deletion_requested_by', { mode: 'number' }).references(() => users.id),
  deletionCompletedAt: timestamp('deletion_completed_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  userIdx: index('media_user_idx').on(table.userId),
  typeIdx: index('media_type_idx').on(table.mediaType),
  processedIdx: index('media_processed_idx').on(table.isProcessed),
  createdIdx: index('media_created_idx').on(table.createdAt),
  directoryHashIdx: index('media_directory_hash_idx').on(table.directoryHash),
  pictureTypeIdx: index('media_picture_type_idx').on(table.pictureType),
  deletionStatusIdx: index('media_deletion_status_idx').on(table.deletionStatus),
  pendingDeletionIdx: index('media_pending_deletion_idx').on(table.deletionStatus, table.deletionRequestedAt).where(sql`deletion_status = 'pending_deletion'`),
  // NEW OPTIMIZATION INDEXES
  optimizationStatusIdx: index('media_optimization_status_idx').on(table.optimizationStatus),
  isGeneratedIdx: index('media_is_generated_idx').on(table.isGenerated),
  approvalStatusIdx: index('media_approval_status_idx').on(table.approvalStatus),
}));

// 2. PROCESSING & VARIANTS (Separated)
export const mediaProcessing = pgTable('media_processing', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  mediaId: bigint('media_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'cascade' }).notNull(),

  // Processing Details
  processingType: varchar('processing_type', { length: 50 }).notNull(), // thumbnail, compression, watermark
  status: varchar('status', { length: 20 }).notNull(), // pending, processing, completed, failed

  // PG BOSS INTEGRATION COLUMNS
  jobId: varchar('job_id', { length: 50 }), // PG Boss job ID for tracking
  processingParams: jsonb('processing_params').default('{}'), // Job-specific parameters

  // Results (minimal JSONB)
  results: jsonb('results').default('{}'), // Only processing results, not metadata
  errorMessage: text('error_message'),

  // Performance Tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  processingDuration: integer('processing_duration'), // seconds

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  mediaIdIdx: index('media_processing_media_id_idx').on(table.mediaId),
  statusIdx: index('media_processing_status_idx').on(table.status),
  typeIdx: index('media_processing_type_idx').on(table.processingType),
  // PG BOSS INDEXES
  jobIdIdx: index('media_processing_job_id_idx').on(table.jobId),
}));

export const portfolioAlbums = pgTable('portfolio_albums', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Album Details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  coverImageId: bigint('cover_image_id', { mode: 'number' }),

  // Organization
  sortOrder: integer('sort_order').default(0),
  isDefault: boolean('is_default').default(false),
  isPublic: boolean('is_public').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('album_user_idx').on(table.userId),
  publicIdx: index('album_public_idx').on(table.isPublic),
}));

// SIMPLE ACCESS LOGGING (Optional)
export const mediaAccessStats = pgTable('media_access_stats', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  mediaAssetId: bigint('media_asset_id', { mode: 'number' }).references(() => mediaAssets.id, { onDelete: 'cascade' }).notNull(),

  // Basic Access Tracking
  accessDate: varchar('access_date', { length: 10 }).notNull(), // YYYY-MM-DD format
  accessCount: integer('access_count').default(1),
  uniqueIPs: integer('unique_ips').default(1),

  // Geographic and Security
  topCountries: jsonb('top_countries').default('{}'), // {"US": 10, "UK": 5}
  suspiciousRequests: integer('suspicious_requests').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  mediaDateIdx: unique('media_access_stats_media_date_unique').on(table.mediaAssetId, table.accessDate),
  accessDateIdx: index('media_access_stats_access_date_idx').on(table.accessDate),
}));

// ============================
// RELATIONS
// ============================

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [mediaAssets.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [mediaAssets.userId],
    references: [users.id],
    relationName: "mediaAssets_userId_users_id"
  }),
  approvedBy: one(users, {
    fields: [mediaAssets.deletionRequestedBy],
    references: [users.id],
    relationName: "mediaAssets_approvedBy_users_id"
  }),
  processing: many(mediaProcessing)
}));

export const mediaProcessingRelations = relations(mediaProcessing, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [mediaProcessing.mediaId],
    references: [mediaAssets.id]
  })
}));

export const portfolioAlbumsRelations = relations(portfolioAlbums, ({ one }) => ({
  user: one(users, {
    fields: [portfolioAlbums.userId],
    references: [users.id]
  })
}));

export const mediaAccessStatsRelations = relations(mediaAccessStats, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [mediaAccessStats.mediaAssetId],
    references: [mediaAssets.id]
  })
}));

// ============================
// TYPES
// ============================

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

export type MediaProcessing = typeof mediaProcessing.$inferSelect;
export type NewMediaProcessing = typeof mediaProcessing.$inferInsert;

export type PortfolioAlbum = typeof portfolioAlbums.$inferSelect;
export type NewPortfolioAlbum = typeof portfolioAlbums.$inferInsert;

export type MediaAccessStat = typeof mediaAccessStats.$inferSelect;
export type NewMediaAccessStat = typeof mediaAccessStats.$inferInsert; 