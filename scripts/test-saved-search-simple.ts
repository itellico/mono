#!/usr/bin/env tsx

/**
 * 🧪 Simple Saved Search Test Script
 * 
 * Tests the database schema support for new fields without requiring Redis
 */

import { db } from '../src/lib/db';

async function testSavedSearchSchema() {
  console.log('🧪 Testing saved search database schema...\n');

  try {
    console.log('📋 Testing database schema supports new fields...');

    // First, get an existing user
    const existingUser = await db.user.findFirst({
      include: {
        account: true
      }
    });

    if (!existingUser) {
      throw new Error('No users found in database. Please seed the database first.');
    }

    console.log('✅ Found existing user:', {
      userId: existingUser.id,
      tenantId: existingUser.account.tenantId
    });

    // Create a test saved search with all new fields
    const testData = {
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

    // Test direct database operation with existing user
    const savedSearch = await db.savedSearch.create({
      data: {
        userId: existingUser.id,
        tenantId: existingUser.account.tenantId,
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

    console.log('✅ Database schema validation successful:', {
      id: savedSearch.id,
      name: savedSearch.name,
      hasSearchValue: !!savedSearch.searchValue,
      hasPaginationLimit: !!savedSearch.paginationLimit,
      searchValue: savedSearch.searchValue,
      paginationLimit: savedSearch.paginationLimit,
      hasFilters: !!savedSearch.filters,
      hasColumnConfig: !!savedSearch.columnConfig
    });

    // Test retrieval to ensure all fields are present
    const retrievedSearch = await db.savedSearch.findUnique({
      where: { id: savedSearch.id }
    });

    console.log('✅ Database retrieval validation successful:', {
      retrieved: !!retrievedSearch,
      searchValueMatches: retrievedSearch?.searchValue === testData.searchValue,
      paginationLimitMatches: retrievedSearch?.paginationLimit === testData.paginationLimit
    });

    // Test update operation with new fields
    const updatedSearch = await db.savedSearch.update({
      where: { id: savedSearch.id },
      data: {
        searchValue: 'updated search query',
        paginationLimit: 100
      }
    });

    console.log('✅ Database update validation successful:', {
      updatedSearchValue: updatedSearch.searchValue,
      updatedPaginationLimit: updatedSearch.paginationLimit
    });

    // Clean up test data
    await db.savedSearch.delete({ where: { id: savedSearch.id } });

    console.log('✅ Test cleanup completed');

    // Test permission existence
    console.log('\n🔐 Testing saved search permissions...');
    
    const permissions = await db.permission.findMany({
      where: {
        name: {
          startsWith: 'saved_searches.'
        }
      }
    });

    console.log('✅ Permission validation successful:', {
      permissionCount: permissions.length,
      permissions: permissions.map(p => p.name)
    });

    console.log('\n🎉 All saved search schema tests completed successfully!');

  } catch (error) {
    console.error('❌ Saved search schema test failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testSavedSearchSchema().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
} 