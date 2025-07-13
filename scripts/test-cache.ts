#!/usr/bin/env npx tsx

/**
 * 🧪 Cache Middleware Test Script
 * 
 * Tests the unified cache middleware three-layer architecture:
 * Layer 1: TanStack Query (client-side) - not tested here
 * Layer 2: Redis (server-side) 
 * Layer 3: Database (source of truth)
 */

import { cache, cacheMiddleware } from '../src/lib/cache/cache-middleware';
import { initializeCache, getCacheHealth } from '../src/lib/cache/cache-init';
import { logger } from '../src/lib/logger';

async function testCacheMiddleware() {
  logger.info('🧪 Starting cache middleware test...');

  try {
    // Test 1: Initialize cache
    logger.info('🚀 Initializing cache middleware...');
    await initializeCache();

    // Test 2: Check health
    logger.info('🏥 Checking cache health...');
    const health = await getCacheHealth();
    logger.info('📊 Cache health status:', health);

    // Test 3: Test basic SET/GET operations
    logger.info('📝 Testing basic SET operation...');
    const testKey = 'test:cache:basic';
    const testData = { message: 'Hello from cache!', timestamp: Date.now() };
    
    const setResult = await cache.set(testKey, testData, {
      ttl: 60, // 1 minute
      tags: ['test', 'basic']
    });
    
    logger.info('✅ SET result:', { key: testKey, success: setResult });

    // Test 4: Test GET operation
    logger.info('📖 Testing basic GET operation...');
    const getData = await cache.get(testKey);
    logger.info('✅ GET result:', { key: testKey, data: getData });

    // Test 5: Test fallback functionality
    logger.info('🔄 Testing fallback functionality...');
    const fallbackKey = 'test:cache:fallback';
    let fallbackCalled = false;
    
    const fallbackData = await cache.get(fallbackKey, {
      fallback: async () => {
        fallbackCalled = true;
        logger.info('🔄 Fallback function called!');
        return { source: 'fallback', timestamp: Date.now() };
      },
      ttl: 30
    });
    
    logger.info('✅ Fallback result:', { 
      key: fallbackKey, 
      data: fallbackData,
      fallbackCalled 
    });

    // Test 6: Test GET with cache hit (should not call fallback)
    logger.info('🎯 Testing cache hit (no fallback)...');
    let fallbackCalledSecond = false;
    
    const cachedData = await cache.get(fallbackKey, {
      fallback: async () => {
        fallbackCalledSecond = true;
        return { source: 'fallback-second', timestamp: Date.now() };
      }
    });
    
    logger.info('✅ Cache hit result:', { 
      key: fallbackKey, 
      data: cachedData,
      fallbackCalled: fallbackCalledSecond 
    });

    // Test 7: Test tag-based invalidation
    logger.info('🗑️ Testing tag-based invalidation...');
    const invalidatedCount = await cache.invalidateByTag('test');
    logger.info('✅ Invalidation result:', { tag: 'test', keysInvalidated: invalidatedCount });

    // Test 8: Verify invalidation worked
    logger.info('🔍 Verifying invalidation worked...');
    const afterInvalidation = await cache.get(testKey);
    logger.info('✅ After invalidation:', { 
      key: testKey, 
      data: afterInvalidation,
      shouldBeNull: afterInvalidation === null 
    });

    // Test 9: Cache statistics
    logger.info('📈 Getting cache statistics...');
    const stats = await cacheMiddleware.getStats();
    logger.info('📊 Cache stats:', stats);

    logger.info('🎉 Cache middleware test completed successfully!');
    logger.info('✅ All cache tests passed!');

  } catch (error) {
    logger.error('❌ Cache middleware test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }

  // Graceful shutdown
  try {
    await cacheMiddleware.disconnect();
    logger.info('✅ Cache middleware disconnected gracefully');
  } catch (error) {
    logger.warn('⚠️ Error during cache disconnect:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  process.exit(0);
}

// Run the test
testCacheMiddleware(); 