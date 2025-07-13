/**
 * Queue Configuration Utilities
 * 
 * Provides a clean interface to read and manage queue settings from the database.
 * Implements caching and fallback to environment variables/defaults.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';
import { logger } from './logger';

// Cache for settings to avoid repeated database queries
const settingsCache = new Map<string, any>();
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Database connection
const client = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  username: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
});
const db = drizzle(client, { schema });

// Environment variable defaults (fallback when database is unavailable)
const ENV_DEFAULTS = {
  // Global Worker Settings
  worker_max_concurrent_jobs: parseInt(process.env.DEFAULT_MAX_CONCURRENT_JOBS || '10'),
  worker_polling_interval_ms: parseInt(process.env.DEFAULT_POLLING_INTERVAL_MS || '2000'),
  worker_heartbeat_interval_ms: parseInt(process.env.DEFAULT_HEARTBEAT_INTERVAL_MS || '30000'),
  worker_auto_refresh_interval: parseInt(process.env.DEFAULT_AUTO_REFRESH_INTERVAL || '5000'),
  worker_enable_detailed_logging: process.env.DEFAULT_ENABLE_DETAILED_LOGGING === 'true',
  worker_enable_metrics: process.env.DEFAULT_ENABLE_METRICS === 'true',

  // Global Retry Policies
  retry_default_limit: parseInt(process.env.DEFAULT_RETRY_LIMIT || '3'),
  retry_delay_ms: parseInt(process.env.DEFAULT_RETRY_DELAY_MS || '5000'),
  retry_exponential_backoff: process.env.DEFAULT_EXPONENTIAL_BACKOFF !== 'false',
  retry_job_timeout_ms: parseInt(process.env.DEFAULT_JOB_TIMEOUT_MS || '300000'),
  retry_alert_on_failure_threshold: parseInt(process.env.DEFAULT_ALERT_ON_FAILURE_THRESHOLD || '5'),

  // Performance Settings
  performance_batch_size: parseInt(process.env.DEFAULT_BATCH_SIZE || '5'),
  performance_archive_completed_after_hours: parseInt(process.env.DEFAULT_ARCHIVE_COMPLETED_AFTER_HOURS || '24'),
  performance_delete_archived_after_days: parseInt(process.env.DEFAULT_DELETE_ARCHIVED_AFTER_DAYS || '7'),
  performance_cleanup_orphaned_media_interval_hours: parseInt(process.env.DEFAULT_CLEANUP_ORPHANED_MEDIA_INTERVAL_HOURS || '6'),

  // Delete Media Settings
  delete_media_grace_period_hours: parseInt(process.env.DEFAULT_DELETE_GRACE_PERIOD_HOURS || '0'),
  delete_media_retry_limit: parseInt(process.env.DEFAULT_DELETE_RETRY_LIMIT || '3'),
  delete_media_retry_delay_ms: parseInt(process.env.DEFAULT_DELETE_RETRY_DELAY_MS || '60000'),
  delete_media_job_timeout_ms: parseInt(process.env.DEFAULT_DELETE_JOB_TIMEOUT_MS || '120000'),
  delete_media_enable_two_phase_deletion: process.env.DEFAULT_DELETE_ENABLE_TWO_PHASE_DELETION !== 'false',
  delete_media_enable_directory_cleanup: process.env.DEFAULT_DELETE_ENABLE_DIRECTORY_CLEANUP !== 'false',

  // Housekeeping Settings
  housekeeping_interval_hours: parseInt(process.env.DEFAULT_HOUSEKEEPING_INTERVAL_HOURS || '24'),
  housekeeping_archive_cleanup_days: parseInt(process.env.DEFAULT_HOUSEKEEPING_ARCHIVE_CLEANUP_DAYS || '30'),
  housekeeping_log_cleanup_days: parseInt(process.env.DEFAULT_HOUSEKEEPING_LOG_CLEANUP_DAYS || '7'),
  housekeeping_temp_file_cleanup_hours: parseInt(process.env.DEFAULT_HOUSEKEEPING_TEMP_FILE_CLEANUP_HOURS || '2'),
  housekeeping_orphaned_media_cleanup_days: parseInt(process.env.DEFAULT_HOUSEKEEPING_ORPHANED_MEDIA_CLEANUP_DAYS || '3'),
  housekeeping_enable_database_vacuum: process.env.DEFAULT_HOUSEKEEPING_ENABLE_DATABASE_VACUUM !== 'false',
  housekeeping_enable_stat_cleanup: process.env.DEFAULT_HOUSEKEEPING_ENABLE_STAT_CLEANUP !== 'false',

  // Queue-Specific Overrides
  queue_process_image: {
    enabled: true,
    maxRetries: 3,
    timeoutMs: 300000,
    priority: 1,
    batchSize: 5
  },
  queue_process_video: {
    enabled: false,
    maxRetries: 3,
    timeoutMs: 600000,
    priority: 2,
    batchSize: 1
  },
  queue_delete_media: {
    enabled: true,
    maxRetries: 3,
    timeoutMs: 120000,
    priority: 4,
    batchSize: 1,
    gracePeriodHours: 0
  },
  queue_housekeeping: {
    enabled: true,
    maxRetries: 1,
    timeoutMs: 600000,
    priority: 7,
    intervalHours: 24,
    cleanupTypes: ['archive', 'logs', 'temp', 'orphaned_media']
  }
};

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return Date.now() < cacheExpiry;
}

/**
 * Clear the settings cache
 */
export function clearSettingsCache(): void {
  settingsCache.clear();
  cacheExpiry = 0;
  logger.info('Queue settings cache cleared');
}

/**
 * Load all queue settings from database and cache them
 */
async function loadSettings(): Promise<Map<string, any>> {
  try {
    logger.info('Loading queue settings from database');

    const settings = await db.query.siteSettings.findMany({
      where: (siteSettings, { eq }) => eq(siteSettings.category, 'queue')
    });

    // Clear existing cache
    settingsCache.clear();

    // Populate cache with database values
    settings.forEach(setting => {
      settingsCache.set(setting.key, setting.value);
    });

    // Set cache expiry
    cacheExpiry = Date.now() + CACHE_DURATION;

    logger.info(`Loaded ${settings.length} queue settings into cache`);
    return settingsCache;
  } catch (error) {
    logger.error('Failed to load settings from database', { error: error.message });

    // Fallback to environment defaults
    Object.entries(ENV_DEFAULTS).forEach(([key, value]) => {
      settingsCache.set(key, value);
    });

    // Set shorter cache expiry for fallback values
    cacheExpiry = Date.now() + (30 * 1000); // 30 seconds

    logger.warn('Using environment variable defaults for queue settings');
    return settingsCache;
  }
}

/**
 * Get a queue setting value with caching and fallback
 */
export async function getQueueSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
  // Check cache first
  if (isCacheValid() && settingsCache.has(key)) {
    return settingsCache.get(key) as T;
  }

  // Load fresh settings if cache is invalid
  if (!isCacheValid()) {
    await loadSettings();
  }

  // Return cached value or fallback
  if (settingsCache.has(key)) {
    return settingsCache.get(key) as T;
  }

  // Final fallback to provided default or ENV_DEFAULTS
  const fallback = defaultValue !== undefined ? defaultValue : ENV_DEFAULTS[key];

  if (fallback !== undefined) {
    logger.warn(`Using fallback value for queue setting: ${key}`, { fallback });
    return fallback as T;
  }

  logger.error(`No value found for queue setting: ${key}`);
  throw new Error(`Queue setting not found: ${key}`);
}

/**
 * Get multiple queue settings at once
 */
export async function getQueueSettings(keys: string[]): Promise<Record<string, any>> {
  // Load settings if cache is invalid
  if (!isCacheValid()) {
    await loadSettings();
  }

  const result: Record<string, any> = {};

  for (const key of keys) {
    if (settingsCache.has(key)) {
      result[key] = settingsCache.get(key);
    } else if (ENV_DEFAULTS[key] !== undefined) {
      result[key] = ENV_DEFAULTS[key];
      logger.warn(`Using environment default for setting: ${key}`);
    } else {
      logger.error(`No value found for queue setting: ${key}`);
    }
  }

  return result;
}

/**
 * Update a queue setting in the database
 */
export async function updateQueueSetting(key: string, value: any, tenantId = 1): Promise<void> {
  try {
    const existing = await db.query.siteSettings.findFirst({
      where: (siteSettings, { and, eq }) => and(
        eq(siteSettings.key, key),
        eq(siteSettings.tenantId, tenantId)
      )
    });

    if (existing) {
      // Update existing setting
      await db.update(schema.siteSettings)
        .set({
          value,
          updatedAt: new Date()
        })
        .where(and(
          eq(schema.siteSettings.key, key),
          eq(schema.siteSettings.tenantId, tenantId)
        ));
    } else {
      // Create new setting - all queue settings use 'queue' category
      await db.insert(schema.siteSettings).values({
        tenantId,
        key,
        value,
        defaultValue: value,
        category: 'queue', // Always use 'queue' category for all queue settings
        level: 'tenant',
        governance: 'tenant_admin',
        description: `Queue setting: ${key}`,
        validationSchema: {},
        isRequired: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Update cache
    settingsCache.set(key, value);

    logger.info(`Updated queue setting: ${key}`, { value });
  } catch (error) {
    logger.error(`Failed to update queue setting: ${key}`, { error: error.message, value });
    throw error;
  }
}

/**
 * Update multiple queue settings at once
 */
export async function updateQueueSettings(settings: Record<string, any>, tenantId = 1): Promise<void> {
  const errors = [];

  for (const [key, value] of Object.entries(settings)) {
    try {
      await updateQueueSetting(key, value, tenantId);
    } catch (error) {
      errors.push({ key, error: error.message });
    }
  }

  if (errors.length > 0) {
    logger.error('Some queue settings failed to update', { errors });
    throw new Error(`Failed to update ${errors.length} settings`);
  }

  logger.info(`Updated ${Object.keys(settings).length} queue settings`);
}

/**
 * Get worker configuration settings
 */
export async function getWorkerConfig() {
  const keys = [
    'worker_max_concurrent_jobs',
    'worker_polling_interval_ms',
    'worker_heartbeat_interval_ms',
    'worker_auto_refresh_interval',
    'worker_enable_detailed_logging',
    'worker_enable_metrics'
  ];

  return await getQueueSettings(keys);
}

/**
 * Get global retry policy settings
 */
export async function getRetryConfig() {
  const keys = [
    'retry_default_limit',
    'retry_delay_ms',
    'retry_exponential_backoff',
    'retry_job_timeout_ms',
    'retry_alert_on_failure_threshold'
  ];

  return await getQueueSettings(keys);
}

/**
 * Get delete media worker settings
 */
export async function getDeleteMediaConfig() {
  const keys = [
    'delete_media_grace_period_hours',
    'delete_media_retry_limit',
    'delete_media_retry_delay_ms',
    'delete_media_job_timeout_ms',
    'delete_media_enable_two_phase_deletion',
    'delete_media_enable_directory_cleanup'
  ];

  return await getQueueSettings(keys);
}

/**
 * Get housekeeping worker settings
 */
export async function getHousekeepingConfig() {
  const keys = [
    'housekeeping_interval_hours',
    'housekeeping_archive_cleanup_days',
    'housekeeping_log_cleanup_days',
    'housekeeping_temp_file_cleanup_hours',
    'housekeeping_orphaned_media_cleanup_days',
    'housekeeping_enable_database_vacuum',
    'housekeeping_enable_stat_cleanup'
  ];

  return await getQueueSettings(keys);
}

/**
 * Get queue-specific override settings
 */
export async function getQueueOverrides() {
  const keys = [
    'queue_process_image',
    'queue_process_video',
    'queue_delete_media',
    'queue_housekeeping'
  ];

  return await getQueueSettings(keys);
}

/**
 * Get configuration for a specific queue
 */
export async function getQueueConfig(queueName: string) {
  const globalConfig = await getRetryConfig();
  const queueOverride = await getQueueSetting(`queue_${queueName}`, {});

  // Merge global config with queue-specific overrides
  return {
    ...globalConfig,
    ...queueOverride
  };
}

/**
 * Export all queue configuration as a single object
 */
export async function getAllQueueConfig() {
  const [
    workerConfig,
    retryConfig,
    deleteMediaConfig,
    housekeepingConfig,
    queueOverrides
  ] = await Promise.all([
    getWorkerConfig(),
    getRetryConfig(),
    getDeleteMediaConfig(),
    getHousekeepingConfig(),
    getQueueOverrides()
  ]);

  return {
    worker: workerConfig,
    retry: retryConfig,
    deleteMedia: deleteMediaConfig,
    housekeeping: housekeepingConfig,
    queues: queueOverrides
  };
} 