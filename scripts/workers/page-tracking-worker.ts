#!/usr/bin/env tsx

/**
 * Page Tracking Background Worker
 * 
 * Processes page tracking events from Redis queue and saves them to the database
 * in batches for optimal performance. This ensures that page navigation remains
 * fast while maintaining comprehensive audit logs.
 * 
 * Usage:
 * npm run worker:page-tracking
 * or
 * tsx scripts/workers/page-tracking-worker.ts
 */

import { db as prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { AuditService } from '@/lib/services/audit.service';

interface QueuedPageTrackingData {
  tenantId: number;
  userId: number;
  action: 'page_view' | 'page_exit';
  component: string;
  metadata: {
    pathname: string;
    timeOnPreviousPage?: number | null;
    timeOnPage?: number;
    previousPage?: string | null;
    timestamp: number;
    userAgent?: string;
    referrer?: string | null;
    screenResolution?: string;
    viewportSize?: string;
    language?: string;
    timezone?: string;
  };
  queuedAt: number;
  userIp: string;
}

class PageTrackingWorker {
  private readonly QUEUE_KEY = 'audit:page_tracking:queue';
  private readonly BATCH_SIZE = 100;
  private readonly PROCESSING_INTERVAL = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  
  private redis: Awaited<ReturnType<typeof getRedisClient>> | null = null;
  private auditService: AuditService;
  private isRunning = false;
  private processedCount = 0;
  private errorCount = 0;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Initialize the worker
   */
  async initialize() {
    try {
      this.redis = await getRedisClient();
      logger.info('Page tracking worker initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize page tracking worker', { error });
      throw error;
    }
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Page tracking worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting page tracking worker', {
      batchSize: this.BATCH_SIZE,
      processingInterval: this.PROCESSING_INTERVAL
    });

    // Start processing loop
    this.processLoop();

    // Setup graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  /**
   * Stop the worker
   */
  async stop() {
    logger.info('Stopping page tracking worker...');
    this.isRunning = false;

    // Process any remaining items in queue
    await this.processBatch();

    logger.info('Page tracking worker stopped', {
      totalProcessed: this.processedCount,
      totalErrors: this.errorCount
    });

    process.exit(0);
  }

  /**
   * Main processing loop
   */
  private async processLoop() {
    while (this.isRunning) {
      try {
        await this.processBatch();
        await this.sleep(this.PROCESSING_INTERVAL);
      } catch (error) {
        logger.error('Error in page tracking processing loop', { error });
        this.errorCount++;
        
        // Back off on errors to avoid overwhelming the system
        await this.sleep(this.PROCESSING_INTERVAL * 2);
      }
    }
  }

  /**
   * Process a batch of tracking events
   */
  private async processBatch() {
    if (!this.redis) {
      throw new Error('Redis client not initialized');
    }

    try {
      // Get batch of items from queue
      const items = await this.redis.lrange(this.QUEUE_KEY, 0, this.BATCH_SIZE - 1);
      
      if (items.length === 0) {
        logger.debug('No page tracking items in queue');
        return;
      }

      logger.debug(`Processing ${items.length} page tracking items`);

      // Parse and validate items
      const validItems: QueuedPageTrackingData[] = [];
      for (const item of items) {
        try {
          const parsed = JSON.parse(item) as QueuedPageTrackingData;
          validItems.push(parsed);
        } catch (error) {
          logger.warn('Failed to parse page tracking item', { item, error });
          this.errorCount++;
        }
      }

      if (validItems.length === 0) {
        // Remove invalid items from queue
        await this.redis.ltrim(this.QUEUE_KEY, items.length, -1);
        return;
      }

      // Process items in batches
      await this.processValidItems(validItems);

      // Remove processed items from queue
      await this.redis.ltrim(this.QUEUE_KEY, validItems.length, -1);

      this.processedCount += validItems.length;
      
      logger.info('Processed page tracking batch', {
        itemsProcessed: validItems.length,
        totalProcessed: this.processedCount
      });

    } catch (error) {
      logger.error('Failed to process page tracking batch', { error });
      throw error;
    }
  }

  /**
   * Process validated tracking items
   */
  private async processValidItems(items: QueuedPageTrackingData[]) {
    const startTime = Date.now();

    try {
      // Group items by tenant for better database performance
      const itemsByTenant = new Map<number, QueuedPageTrackingData[]>();
      
      for (const item of items) {
        if (!itemsByTenant.has(item.tenantId)) {
          itemsByTenant.set(item.tenantId, []);
        }
        itemsByTenant.get(item.tenantId)!.push(item);
      }

      // Process each tenant's items
      for (const [tenantId, tenantItems] of itemsByTenant) {
        await this.processTenantItems(tenantId, tenantItems);
      }

      const processingTime = Date.now() - startTime;
      logger.debug('Batch processing completed', {
        itemCount: items.length,
        tenantCount: itemsByTenant.size,
        processingTimeMs: processingTime
      });

    } catch (error) {
      logger.error('Failed to process valid tracking items', { 
        error,
        itemCount: items.length 
      });
      throw error;
    }
  }

  /**
   * Process tracking items for a specific tenant
   */
  private async processTenantItems(tenantId: number, items: QueuedPageTrackingData[]) {
    try {
      // Convert to audit service format
      const auditEntries = items.map(item => ({
        tenantId: item.tenantId,
        userId: item.userId,
        action: item.action,
        component: item.component,
        metadata: {
          ...item.metadata,
          userIp: item.userIp,
          queuedAt: item.queuedAt,
          processedAt: Date.now()
        }
      }));

      // Use database transaction for consistency
      await prisma.$transaction(async (tx) => {
        for (const entry of auditEntries) {
          await this.auditService.logUserActivity(entry);
        }
      });

      logger.debug('Processed tenant tracking items', {
        tenantId,
        itemCount: items.length
      });

    } catch (error) {
      logger.error('Failed to process tenant tracking items', {
        error,
        tenantId,
        itemCount: items.length
      });
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      uptime: process.uptime()
    };
  }
}

// Main execution
async function main() {
  const worker = new PageTrackingWorker();
  
  try {
    await worker.initialize();
    await worker.start();
  } catch (error) {
    logger.error('Failed to start page tracking worker', { error });
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Page tracking worker crashed', { error });
    process.exit(1);
  });
}

export { PageTrackingWorker }; 