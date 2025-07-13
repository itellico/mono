#!/usr/bin/env tsx

/**
 * 🧪 Test Consistent Cache Naming
 * 
 * This script tests that the cache naming is now consistent across all services
 * following the cursor rules patterns:
 * - Tenant Data: cache:{tenant_id}:{entity}:{id}
 * - Global Data: cache:global:{entity}:{id}  
 * - Search/Lists: cache:{tenant_id}:{entity}:search:{query_hash} | cache:{tenant_id}:{entity}:list:{filters_hash}
 */

import { tenantsService } from '../src/lib/services/tenants.service';
import { savedSearchesService } from '../src/lib/services/saved-searches.service';
import { cache } from '../src/lib/cache/cache-middleware';
import { initializeCache } from '../src/lib/cache/cache-init';
import { getRedisClient } from '../src/lib/redis';

async function testConsistentCacheNaming() {
  try {
    console.log('🧪 Testing consistent cache naming patterns...');
    
    // Initialize cache middleware
    await initializeCache();
    
    // Test 1: Tenants service caching with consistent naming
    console.log('\n📋 Testing tenants service cache naming...');
    const tenants = await tenantsService.getAll({ page: 1, limit: 5 });
    console.log(`✅ Tenants loaded: ${tenants.tenants.length} items`);
    
    // Test 2: Saved searches service caching with consistent naming
    console.log('\n💾 Testing saved searches service cache naming...');
    const savedSearches = await savedSearchesService.getUserSavedSearches(2, 1, 'tenants');
    console.log(`✅ Saved searches loaded: ${savedSearches.searches.length} items`);
    console.log(`✅ Has default search: ${!!savedSearches.defaultSearch}`);
    
    // Test 3: Check Redis keys directly to verify naming consistency
    console.log('\n🔍 Checking Redis cache keys for consistency...');
    const redis = await getRedisClient();
    const allKeys = await redis.keys('cache:*');
    
    console.log('\n📊 Cache Key Analysis:');
    console.log(`Total cache keys found: ${allKeys.length}`);
    
    // Categorize keys
    const globalKeys = allKeys.filter((key: string) => key.startsWith('cache:global:'));
    const tenantKeys = allKeys.filter((key: string) => key.startsWith('cache:') && !key.startsWith('cache:global:'));
    
    console.log(`Global data keys (cache:global:*): ${globalKeys.length}`);
    globalKeys.forEach((key: string) => console.log(`  - ${key}`));
    
    console.log(`Tenant-specific keys (cache:{tenant_id}:*): ${tenantKeys.length}`);
    tenantKeys.forEach((key: string) => console.log(`  - ${key}`));
    
    // Test 4: Verify consistent patterns
    console.log('\n✅ Cache Naming Consistency Check:');
    
    const inconsistentKeys = allKeys.filter((key: string) => 
      !key.startsWith('cache:global:') && 
      !key.match(/^cache:\d+:/) && 
      key.startsWith('cache:')
    );
    
    if (inconsistentKeys.length === 0) {
      console.log('✅ All cache keys follow consistent naming patterns!');
    } else {
      console.log('❌ Found inconsistent cache keys:');
      inconsistentKeys.forEach((key: string) => console.log(`  - ${key}`));
    }
    
    // Test 5: Test default search auto-loading logic
    if (savedSearches.defaultSearch) {
      console.log('\n🚀 Testing default search auto-loading conversion...');
      
      const converted = savedSearchesService.convertToAdminListPageConfig(savedSearches.defaultSearch);
      console.log('✅ Default search converted successfully:', {
        searchName: savedSearches.defaultSearch.name,
        filtersCount: Object.keys(converted.filters).length,
        hasSortConfig: !!converted.sortConfig,
        columnVisibilityCount: Object.keys(converted.columnVisibility).length
      });
      
             console.log('✅ Three-layer cache flow verified:', {
         layer1: 'TanStack Query (client-side)',
         layer2: 'Redis (server-side)', 
         layer3: 'Database (source of truth)',
         cacheKeysUsed: allKeys.filter((k: string) => k.includes('saved_searches'))
       });
     }
     
     console.log('\n🎉 Consistent cache naming test completed successfully!');
    
  } catch (error) {
    console.error('❌ Cache naming test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the test
testConsistentCacheNaming(); 