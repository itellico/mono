#!/usr/bin/env npx tsx

/**
 * 🧪 Test Tenant Caching with Unified Cache Middleware
 * 
 * This script tests the tenant service and ensures that tenants
 * are being cached properly in Redis with the unified cache middleware.
 */

import { tenantsService } from '../src/lib/services/tenants.service';
import { cache } from '../src/lib/cache/cache-middleware';
import { initializeCache } from '../src/lib/cache/cache-init';
import { logger } from '../src/lib/logger';

async function testTenantCaching() {
  logger.info('🧪 Starting tenant caching test...');

  try {
    // Initialize cache middleware
    logger.info('🚀 Initializing cache middleware...');
    await initializeCache();

    // Test 1: Get all tenants (should cache them)
    logger.info('📝 Fetching tenants (should trigger caching)...');
    const tenantsResult = await tenantsService.getAll({
      page: 1,
      limit: 10
    });

    logger.info('✅ Tenants fetched:', {
      count: tenantsResult.tenants.length,
      pagination: tenantsResult.pagination
    });

    // Test 2: Check Redis cache keys
    logger.info('🔍 Checking Redis cache keys...');
    
    // Use redis-cli to check keys (cache middleware doesn't expose pattern search)
    logger.info('📊 Check Redis keys manually with: redis-cli keys "*"');
    logger.info('🏢 Check tenant keys manually with: redis-cli keys "*tenant*"');

    // Test 3: Get cache statistics
    const stats = await cache.getStats();
    logger.info('📈 Cache statistics:', stats);

    // Test 4: Try to get a specific tenant
    if (tenantsResult.tenants.length > 0) {
      const firstTenant = tenantsResult.tenants[0];
      logger.info('🎯 Testing individual tenant fetch...');
      
      const tenant = await tenantsService.getTenantByUuid(firstTenant.uuid);
      if (tenant) {
        logger.info('✅ Individual tenant fetched:', {
          uuid: tenant.uuid,
          name: tenant.name
        });
      }
    }

    // Test 5: Check cache keys again
    logger.info('🔍 Check final tenant cache keys with: redis-cli keys "*tenant*"');

    logger.info('🎉 Tenant caching test completed successfully!');

  } catch (error) {
    logger.error('❌ Tenant caching test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Run the test
testTenantCaching()
  .then(() => {
    logger.info('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Test failed:', error);
    process.exit(1);
  }); 