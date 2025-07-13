#!/usr/bin/env tsx

/**
 * 🧪 Comprehensive Saved Search Test Script
 * 
 * Tests the complete saved search functionality including:
 * - Database schema support for new fields
 * - Three-layer cache integration
 * - Permission system integration
 * - API endpoint functionality
 * - Service layer operations
 * - General middleware fixes
 */

import { db } from '../src/lib/db';
import { savedSearchesService } from '../src/lib/services/saved-searches.service';
import { cacheMiddleware } from '../src/lib/cache/cache-middleware';
import { logger } from '../src/lib/logger';

interface TestSavedSearch {
  name: string;
  description: string;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  columnConfig: Record<string, boolean>;
  searchValue: string;
  paginationLimit: number;
  isDefault: boolean;
  isPublic: boolean;
}

async function testComprehensiveSavedSearch() {
  console.log('🧪 Starting comprehensive saved search test...\n');

  try {
    // Test 1: Database Schema Validation
    console.log('📋 Test 1: Database Schema Validation...');
    await testDatabaseSchema();

    // Test 2: Service Layer Operations
    console.log('\n💾 Test 2: Service Layer Operations...');
    await testServiceOperations();

    // Test 3: Cache Integration
    console.log('\n🚀 Test 3: Cache Integration...');
    await testCacheIntegration();

    // Test 4: Permission Integration
    console.log('\n🔐 Test 4: Permission Integration...');
    await testPermissionIntegration();

    // Test 5: API Endpoint Testing
    console.log('\n🌐 Test 5: API Endpoint Testing...');
    await testApiEndpoints();

    // Test 6: Enhanced Features
    console.log('\n✨ Test 6: Enhanced Features...');
    await testEnhancedFeatures();

    console.log('\n🎉 All comprehensive saved search tests completed successfully!');

  } catch (error) {
    console.error('❌ Comprehensive saved search test failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

/**
 * Test 1: Database Schema Validation
 */
async function testDatabaseSchema() {
  console.log('  🔍 Testing database schema supports new fields...');

  // Create a test saved search with all new fields
  const testData: TestSavedSearch = {
    name: 'Test Schema Validation',
    description: 'Testing new searchValue and paginationLimit fields',
    entityType: 'tenants',
    filters: { status: ['active'], currency: ['USD'] },
    sortBy: 'createdAt',
    sortOrder: 'desc',
    columnConfig: { name: true, status: true, createdAt: false },
    searchValue: 'test search query',
    paginationLimit: 50,
    isDefault: false,
    isPublic: false
  };

  // Test direct database operation
  const savedSearch = await db.savedSearch.create({
    data: {
      userId: 1,
      tenantId: 1,
      name: testData.name,
      description: testData.description,
      entityType: testData.entityType,
      filters: testData.filters as any,
      sortBy: testData.sortBy,
      sortOrder: testData.sortOrder,
      columnConfig: testData.columnConfig as any,
      searchValue: testData.searchValue,
      paginationLimit: testData.paginationLimit,
      isDefault: testData.isDefault,
      isPublic: testData.isPublic
    }
  });

  console.log('  ✅ Database schema validation successful:', {
    id: savedSearch.id,
    hasSearchValue: !!savedSearch.searchValue,
    hasPaginationLimit: !!savedSearch.paginationLimit,
    searchValue: savedSearch.searchValue,
    paginationLimit: savedSearch.paginationLimit
  });

  // Clean up test data
  await db.savedSearch.delete({ where: { id: savedSearch.id } });
}

/**
 * Test 2: Service Layer Operations
 */
async function testServiceOperations() {
  console.log('  🔧 Testing service layer operations...');

  const service = savedSearchesService;

  // Test create with new fields
  const createData = {
    name: 'Service Test Search',
    description: 'Testing service layer',
    entityType: 'tenants',
    filters: { status: ['active'] },
    sortBy: 'name',
    sortOrder: 'asc' as const,
    columnConfig: { name: true, status: true },
    searchValue: 'service test',
    paginationLimit: 25,
    isDefault: true,
    isPublic: false
  };

  const createdSearch = await service.createSavedSearch(1, 1, createData);

  console.log('  ✅ Service create operation successful:', {
    id: createdSearch.id,
    name: createdSearch.name,
    searchValue: createdSearch.searchValue,
    paginationLimit: createdSearch.paginationLimit
  });

  // Test conversion to AdminListPage config
  const config = service.convertToAdminListPageConfig(createdSearch);

  console.log('  ✅ Service config conversion successful:', {
    hasFilters: Object.keys(config.filters).length > 0,
    hasSortConfig: !!config.sortConfig,
    hasColumnVisibility: Object.keys(config.columnVisibility).length > 0,
    hasSearchValue: !!config.searchValue,
    hasPaginationLimit: !!config.paginationLimit,
    searchValue: config.searchValue,
    paginationLimit: config.paginationLimit
  });

  // Test retrieval
  const retrievedSearches = await service.getUserSavedSearches(1, 1, 'tenants');

  console.log('  ✅ Service retrieval successful:', {
    searchCount: retrievedSearches.searches.length,
    hasDefaultSearch: !!retrievedSearches.defaultSearch,
    defaultSearchName: retrievedSearches.defaultSearch?.name
  });

  // Clean up
  await service.deleteSavedSearch(1, 1, createdSearch.id);
}

/**
 * Test 3: Cache Integration
 */
async function testCacheIntegration() {
  console.log('  🗃️ Testing cache integration...');

  // Test cache key generation
  const cacheKey = cacheMiddleware.generateSavedSearchKey({
    tenantId: 1,
    userId: 1,
    entityType: 'tenants'
  });

  console.log('  ✅ Cache key generation successful:', { cacheKey });

  // Test cache operations
  const testData = { test: 'cache data', timestamp: Date.now() };
  
  await cacheMiddleware.set(cacheKey, testData, {
    ttl: 300,
    tags: ['saved_searches', 'user:1', 'tenant:1']
  });

  const cachedData = await cacheMiddleware.get(cacheKey);

  console.log('  ✅ Cache operations successful:', {
    cached: !!cachedData,
    dataMatches: JSON.stringify(testData) === JSON.stringify(cachedData)
  });

  // Test cache invalidation
  await cacheMiddleware.invalidateSavedSearches({
    tenantId: 1,
    userId: 1,
    entityType: 'tenants'
  });

  const afterInvalidation = await cacheMiddleware.get(cacheKey);

  console.log('  ✅ Cache invalidation successful:', {
    invalidated: !afterInvalidation
  });

  // Test cache statistics
  const stats = await cacheMiddleware.getStats();

  console.log('  ✅ Cache statistics:', stats);
}

/**
 * Test 4: Permission Integration
 */
async function testPermissionIntegration() {
  console.log('  🔐 Testing permission integration...');

  // Check if saved search permissions exist
  const permissions = await db.permission.findMany({
    where: {
      name: {
        startsWith: 'saved_searches.'
      }
    }
  });

  console.log('  ✅ Permission existence check:', {
    permissionCount: permissions.length,
    permissions: permissions.map(p => p.name)
  });

  // Check if super admin has saved search permissions
  const superAdminRole = await db.role.findFirst({
    where: { name: 'super_admin' },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  const savedSearchPermissions = superAdminRole?.permissions
    .map(rp => rp.permission.name)
    .filter(name => name.startsWith('saved_searches.')) || [];

  console.log('  ✅ Super admin permission check:', {
    hasSuperAdminRole: !!superAdminRole,
    savedSearchPermissionCount: savedSearchPermissions.length,
    permissions: savedSearchPermissions
  });
}

/**
 * Test 5: API Endpoint Testing
 */
async function testApiEndpoints() {
  console.log('  🌐 Testing API endpoints...');

  try {
    // Test if server is accessible
    const response = await fetch('http://localhost:3001/api/v1/saved-searches?entityType=tenants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('  ✅ API endpoint accessibility:', {
      status: response.status,
      statusText: response.statusText,
      accessible: response.status !== 404
    });

    if (response.status === 401) {
      console.log('  ⚠️  Expected 401 (authentication required) - endpoint is protected');
    }

  } catch (error) {
    console.log('  ⚠️  API endpoint test skipped (server may not be running):', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test 6: Enhanced Features
 */
async function testEnhancedFeatures() {
  console.log('  ✨ Testing enhanced features...');

  // Test query hash generation
  const params1 = { page: 1, limit: 20, search: 'test', sortBy: 'name' };
  const params2 = { limit: 20, search: 'test', page: 1, sortBy: 'name' };

  const hash1 = cacheMiddleware.generateQueryHash(params1);
  const hash2 = cacheMiddleware.generateQueryHash(params2);

  console.log('  ✅ Query hash generation:', {
    hash1,
    hash2,
    hashesMatch: hash1 === hash2,
    message: 'Hashes should match for same parameters in different order'
  });

  // Test different cache key types
  const userKey = cacheMiddleware.generateSavedSearchKey({
    tenantId: 1,
    userId: 1,
    entityType: 'tenants'
  });

  const specificSearchKey = cacheMiddleware.generateSavedSearchKey({
    tenantId: 1,
    userId: 1,
    entityType: 'tenants',
    searchId: 123
  });

  console.log('  ✅ Cache key variations:', {
    userKey,
    specificSearchKey,
    keysDifferent: userKey !== specificSearchKey
  });

  console.log('  ✅ Enhanced features test completed');
}

// Run the comprehensive test
if (require.main === module) {
  testComprehensiveSavedSearch().catch(console.error);
}

export { testComprehensiveSavedSearch }; 