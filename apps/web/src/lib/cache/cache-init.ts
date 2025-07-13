/**
 * 🚀 Cache Initialization Module
 * 
 * Initializes the unified cache middleware following Next.js 15+ best practices
 * This ensures the three-layer caching system is ready for all services
 */

import { cacheMiddleware } from './cache-middleware';
import { logger } from '@/lib/logger';

let isInitialized = false;

/**
 * ✅ Initialize cache middleware singleton
 * Called once during application startup
 */
export async function initializeCache(): Promise<void> {
  if (isInitialized) {
    logger.debug('Cache middleware already initialized');
    return;
  }

  try {
    logger.info('🚀 Initializing unified cache middleware...');
    
    // Initialize the singleton instance
    await cacheMiddleware.initialize();
    
    // Verify health
    const health = await cacheMiddleware.healthCheck();
    
    if (health.healthy) {
      logger.info('✅ Cache middleware initialized successfully', {
        latency: health.latency
      });
    } else {
      logger.warn('⚠️ Cache middleware initialized but Redis unavailable - graceful fallback active');
    }

    isInitialized = true;

  } catch (error) {
    logger.error('❌ Cache middleware initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Don't throw - graceful degradation is built into the middleware
    isInitialized = true; // Mark as initialized to avoid retry loops
  }
}

/**
 * ✅ Graceful cache shutdown
 * Called during application shutdown
 */
export async function shutdownCache(): Promise<void> {
  if (!isInitialized) {
    return;
  }

  try {
    logger.info('🔄 Shutting down cache middleware...');
    await cacheMiddleware.disconnect();
    logger.info('✅ Cache middleware shutdown complete');
    isInitialized = false;
  } catch (error) {
    logger.warn('⚠️ Error during cache shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * ✅ Get cache health status
 */
export async function getCacheHealth(): Promise<{
  initialized: boolean;
  healthy: boolean;
  latency?: number;
  stats?: {
    connected: boolean;
    keyCount?: number;
    memoryUsage?: string;
  };
}> {
  if (!isInitialized) {
    return { initialized: false, healthy: false };
  }

  try {
    const health = await cacheMiddleware.healthCheck();
    const stats = await cacheMiddleware.getStats();

    return {
      initialized: true,
      healthy: health.healthy,
      latency: health.latency,
      stats
    };
  } catch {
    return { initialized: true, healthy: false };
  }
}

/**
 * ✅ Auto-initialization for API routes and server components
 * This ensures cache is ready before any service tries to use it
 */
export async function ensureCacheReady(): Promise<void> {
  if (!isInitialized) {
    await initializeCache();
  }
} 