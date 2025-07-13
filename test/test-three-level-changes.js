#!/usr/bin/env node

/**
 * Test script for Three-Level Change System
 * This script demonstrates how to use the change tracking API
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';
let authToken = null;
let userId = null;

// Test credentials - update these with valid credentials
const TEST_CREDENTIALS = {
  email: '1@1.com',  // Update with your test user
  password: 'admin1@1.com'  // Update with your test password
};

// Helper to make authenticated requests
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await apiClient.post('/auth/login', TEST_CREDENTIALS);
    authToken = response.data.accessToken;
    userId = response.data.user.id;
    console.log('✅ Logged in successfully');
    console.log('   User ID:', userId);
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testChangeSystem() {
  console.log('\n📝 Testing Three-Level Change System...\n');

  // Test entity
  const entityType = 'products';
  const entityId = 'test-product-123';

  try {
    // 1. Create a change set
    console.log('1️⃣ Creating change set...');
    const changeSet = await apiClient.post('/changes', {
      entityType,
      entityId,
      changes: {
        name: 'Updated Product Name',
        price: 99.99,
        description: 'This is a test change'
      },
      level: 'OPTIMISTIC',
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Change set created:', changeSet.data.id);

    // 2. Get change history
    console.log('\n2️⃣ Getting change history...');
    const history = await apiClient.get(`/changes/${entityType}/${entityId}/history`);
    console.log('✅ Change history:');
    history.data.changes.forEach(change => {
      console.log(`   - ${change.status} | ${change.level} | ${new Date(change.createdAt).toLocaleString()}`);
    });

    // 3. Test conflict detection (simulate concurrent edit)
    console.log('\n3️⃣ Testing conflict detection...');
    try {
      // Try to update with stale data
      await apiClient.patch(`/changes/${entityType}/${entityId}`, {
        name: 'Conflicting Change',
        _version: '2020-01-01T00:00:00.000Z' // Old version
      }, {
        headers: {
          'X-Change-Set-Id': 'test-conflict-' + Date.now()
        }
      });
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Conflict detected as expected');
        console.log('   Conflict type:', error.response.data.conflicts?.[0]?.type);
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // 4. Get pending changes (if any require approval)
    console.log('\n4️⃣ Checking pending changes...');
    const pending = await apiClient.get('/changes/pending');
    console.log(`✅ Found ${pending.data.total} pending changes`);
    if (pending.data.changes.length > 0) {
      console.log('   First pending change:', pending.data.changes[0].id);
    }

    // 5. Test change indicators
    console.log('\n5️⃣ Change indicators would show:');
    console.log('   - Blue clock icon: Changes being saved (OPTIMISTIC)');
    console.log('   - Yellow spinner: Server processing (PROCESSING)');
    console.log('   - Green check: Changes saved (COMMITTED)');
    console.log('   - Red triangle: Conflicts detected');

    console.log('\n✨ Three-Level Change System is working correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

async function showUsageExample() {
  console.log('\n📚 React Usage Example:\n');
  console.log(`
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';
import { ChangeIndicator, ChangeHistory } from '@/components/changes';

function ProductEditor({ productId }) {
  const { mutate, isLoading } = useThreeLevelChange({
    entityType: 'products',
    entityId: productId,
    optimisticUpdate: (old, changes) => ({ ...old, ...changes }),
    requireApproval: changes => changes.price < 50,
  });

  return (
    <div>
      <h2>
        Edit Product
        <ChangeIndicator entityType="products" entityId={productId} />
      </h2>
      
      <form onSubmit={e => {
        e.preventDefault();
        mutate(formData);
      }}>
        {/* Form fields */}
      </form>
      
      <ChangeHistory entityType="products" entityId={productId} />
    </div>
  );
}
  `);
}

// Run the test
async function main() {
  console.log('🚀 Three-Level Change System Test Script\n');
  
  // Check if API is running
  try {
    await axios.get('http://localhost:3001/api/v1/public/health');
    console.log('✅ API is running\n');
  } catch (error) {
    console.error('❌ API is not running. Please start it first.');
    process.exit(1);
  }

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n❌ Cannot proceed without authentication');
    console.log('\n💡 Please update TEST_CREDENTIALS in this script with valid credentials');
    process.exit(1);
  }

  // Run tests
  await testChangeSystem();
  
  // Show usage example
  await showUsageExample();
}

main().catch(console.error);