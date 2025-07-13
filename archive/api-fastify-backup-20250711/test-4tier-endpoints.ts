import axios from 'axios';
import { config } from 'dotenv';

config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!@#';

interface TestResult {
  tier: string;
  endpoint: string;
  method: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  statusCode?: number;
  error?: string;
}

const results: TestResult[] = [];
let authToken: string | null = null;

async function testEndpoint(
  tier: string,
  method: string,
  endpoint: string,
  data?: any,
  requiresAuth = true
): Promise<void> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const config: any = {
      method,
      url,
      headers: {},
    };

    if (requiresAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    
    results.push({
      tier,
      endpoint,
      method,
      status: 'SUCCESS',
      statusCode: response.status,
    });
  } catch (error: any) {
    results.push({
      tier,
      endpoint,
      method,
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data?.error || error.message,
    });
  }
}

async function runTests() {
  console.log('🧪 Testing 4-Tier API Endpoints\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  // Test Public Tier
  console.log('🌐 Testing Public Tier...');
  
  await testEndpoint('Public', 'GET', '/api/v1/public/health', null, false);
  
  // Try to authenticate
  const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/public/auth/login`, {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }).catch(err => {
    console.log('⚠️  Login failed - some tests will be skipped');
    return null;
  });

  if (loginResponse?.data?.data?.accessToken) {
    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Authentication successful\n');
  }

  // Test User Tier
  console.log('👤 Testing User Tier...');
  
  if (authToken) {
    await testEndpoint('User', 'GET', '/api/v1/user/profile');
    await testEndpoint('User', 'GET', '/api/v1/user/settings');
    await testEndpoint('User', 'GET', '/api/v1/user/content');
    await testEndpoint('User', 'GET', '/api/v1/user/media');
    await testEndpoint('User', 'GET', '/api/v1/user/marketplace/gigs');
    await testEndpoint('User', 'GET', '/api/v1/user/marketplace/jobs');
    await testEndpoint('User', 'GET', '/api/v1/user/messaging/conversations');
    await testEndpoint('User', 'GET', '/api/v1/user/activity/recent');
    await testEndpoint('User', 'POST', '/api/v1/user/search', { query: 'test' });
  } else {
    console.log('⏭️  Skipping authenticated tests\n');
  }

  // Test Account Tier
  console.log('🏪 Testing Account Tier...');
  
  if (authToken) {
    await testEndpoint('Account', 'GET', '/api/v1/account/users');
    await testEndpoint('Account', 'GET', '/api/v1/account/business/workflows');
    await testEndpoint('Account', 'GET', '/api/v1/account/business/forms');
    await testEndpoint('Account', 'GET', '/api/v1/account/billing/subscription');
    await testEndpoint('Account', 'GET', '/api/v1/account/configuration/settings');
    await testEndpoint('Account', 'GET', '/api/v1/account/analytics/overview');
  }

  // Test Tenant Tier
  console.log('🏢 Testing Tenant Tier...');
  
  if (authToken) {
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/administration/accounts');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/administration/users');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/administration/permissions');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/content/templates');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/content/media');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/data/schemas');
    await testEndpoint('Tenant', 'GET', '/api/v1/tenant/monitoring/health');
  }

  // Test Platform Tier
  console.log('🌍 Testing Platform Tier...');
  
  if (authToken) {
    await testEndpoint('Platform', 'GET', '/api/v1/platform/system/tenants');
    await testEndpoint('Platform', 'GET', '/api/v1/platform/operations/health');
    await testEndpoint('Platform', 'GET', '/api/v1/platform/operations/metrics');
  }

  // Print Results
  console.log('\n📊 Test Results Summary\n');
  
  const tiers = ['Public', 'User', 'Account', 'Tenant', 'Platform'];
  
  for (const tier of tiers) {
    const tierResults = results.filter(r => r.tier === tier);
    const successCount = tierResults.filter(r => r.status === 'SUCCESS').length;
    const failedCount = tierResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`${tier} Tier: ${successCount} passed, ${failedCount} failed`);
    
    // Show failed endpoints
    tierResults
      .filter(r => r.status === 'FAILED')
      .forEach(r => {
        console.log(`  ❌ ${r.method} ${r.endpoint} - ${r.statusCode || 'ERROR'}: ${r.error}`);
      });
  }

  // Overall summary
  const totalSuccess = results.filter(r => r.status === 'SUCCESS').length;
  const totalFailed = results.filter(r => r.status === 'FAILED').length;
  const totalTests = results.length;
  
  console.log(`\n✅ Total: ${totalSuccess}/${totalTests} tests passed`);
  
  if (totalFailed > 0) {
    console.log(`❌ ${totalFailed} tests failed`);
  }
}

// Run the tests
runTests().catch(console.error);