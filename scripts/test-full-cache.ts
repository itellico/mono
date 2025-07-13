#!/usr/bin/env npx tsx

/**
 * 🧪 Comprehensive Cache Test
 * 
 * Tests both permissions and tenants caching to verify
 * the consistent cache hierarchy patterns.
 */

import { tenantsService } from '../src/lib/services/tenants.service';
import { permissionsService } from '../src/lib/services/permissions.service';
import { cache } from '../src/lib/cache/cache-middleware';
import { initializeCache } from '../src/lib/cache/cache-init';
import { logger } from '../src/lib/logger';

async function testFullCacheHierarchy() {
  logger.info('🧪 Starting comprehensive cache hierarchy test...');

  try {
    // Initialize cache middleware
    logger.info('🚀 Initializing cache middleware...');
    await initializeCache();

    // Test 1: Test permissions caching
    logger.info('👤 Testing permissions caching...');
    const permissions = await permissionsService.getUserPermissions('3');
    if (permissions) {
      logger.info('✅ Permissions loaded:', {
        userId: permissions.userId,
        permissionsCount: permissions.permissions.length
      });
    }

    // Test 2: Test tenants caching
    logger.info('🏢 Testing tenants caching...');
    const tenants = await tenantsService.getAll({ page: 1, limit: 5 });
    logger.info('✅ Tenants loaded:', {
      count: tenants.tenants.length
    });

    // Test 3: Test individual tenant caching
    if (tenants.tenants.length > 0) {
      logger.info('🎯 Testing individual tenant caching...');
      const tenant = await tenantsService.getTenantByUuid(tenants.tenants[0].uuid);
      if (tenant) {
        logger.info('✅ Individual tenant loaded:', {
          uuid: tenant.uuid,
          name: tenant.name
        });
      }
    }

    // Test 4: Test tenant stats caching
    logger.info('📊 Testing tenant stats caching...');
    const stats = await tenantsService.getTenantStats();
    logger.info('✅ Tenant stats loaded:', stats);

    // Test 5: Get cache statistics
    logger.info('📈 Getting cache statistics...');
    const cacheStats = await cache.getStats();
    logger.info('📊 Cache statistics:', cacheStats);

    logger.info('🎉 Comprehensive cache test completed successfully!');

  } catch (error) {
    logger.error('❌ Comprehensive cache test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Run the test
testFullCacheHierarchy()
  .then(() => {
    logger.info('✅ All cache tests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Cache tests failed:', error);
    process.exit(1);
  }); 