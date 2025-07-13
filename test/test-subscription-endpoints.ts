import { config } from 'dotenv';
config();

const API_BASE = 'http://localhost:3001/api/v1';

// Test user credentials
const TEST_ADMIN = {
  email: 'admin@monoplatform.com',
  password: 'Admin123!@#',
};

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function login(email: string, password: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error('Login failed:', response.status);
      return null;
    }

    const setCookie = response.headers.get('set-cookie');
    return setCookie || null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

async function testEndpoint(
  method: string,
  endpoint: string,
  cookie: string,
  body?: any
): Promise<void> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Cookie': cookie,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    results.push({
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      error: !response.ok ? data?.error || response.statusText : undefined,
      data: response.ok ? data : undefined,
    });

    console.log(`${method} ${endpoint}: ${response.status} ${response.ok ? '✓' : '✗'}`);
    if (!response.ok && data?.error) {
      console.log(`  Error: ${data.error}`);
    }
  } catch (error) {
    results.push({
      endpoint,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log(`${method} ${endpoint}: ERROR - ${error}`);
  }
}

async function runTests() {
  console.log('🔐 Logging in as admin...');
  const adminCookie = await login(TEST_ADMIN.email, TEST_ADMIN.password);
  
  if (!adminCookie) {
    console.error('❌ Failed to login as admin');
    return;
  }

  console.log('✅ Admin login successful\n');
  console.log('🧪 Testing Subscription Endpoints...\n');

  // Test subscription plan endpoints
  console.log('📋 Testing Subscription Plans:');
  await testEndpoint('GET', '/admin/subscriptions/plans', adminCookie);
  await testEndpoint('GET', '/admin/subscriptions/plans?page=1&limit=5', adminCookie);
  await testEndpoint('GET', '/admin/subscriptions/plans?isActive=true', adminCookie);
  
  // Create a test plan
  const testPlan = {
    name: 'Test Professional Plan',
    description: 'A test subscription plan',
    price: 99.99,
    currency: 'USD',
    billingCycle: 'monthly',
    isPublic: true,
    isActive: true,
  };
  
  await testEndpoint('POST', '/admin/subscriptions/plans', adminCookie, testPlan);
  
  // Get the created plan ID from results
  const createResult = results[results.length - 1];
  const planId = createResult.data?.data?.id;
  
  if (planId) {
    await testEndpoint('GET', `/admin/subscriptions/plans/${planId}`, adminCookie);
    
    // Update the plan
    await testEndpoint('PUT', `/admin/subscriptions/plans/${planId}`, adminCookie, {
      name: 'Updated Professional Plan',
      price: 119.99,
    });
    
    // Test features and limits
    console.log('\n🎯 Testing Features:');
    await testEndpoint('GET', '/admin/subscriptions/features', adminCookie);
    await testEndpoint('POST', '/admin/subscriptions/features', adminCookie, {
      name: 'storage_limit',
      description: 'Storage limit in GB',
      type: 'numeric',
      defaultValue: '10',
      isActive: true,
    });
    
    console.log('\n📊 Testing Limits:');
    await testEndpoint('GET', '/admin/subscriptions/limits', adminCookie);
    
    // Test analytics
    console.log('\n📈 Testing Analytics:');
    await testEndpoint('GET', '/admin/subscriptions/analytics', adminCookie);
    
    // Clean up - delete the test plan
    await testEndpoint('DELETE', `/admin/subscriptions/plans/${planId}`, adminCookie);
  }

  // Test user subscription endpoints
  console.log('\n👤 Testing User Subscription Endpoints:');
  await testEndpoint('GET', '/subscriptions/plans', adminCookie);
  await testEndpoint('GET', '/subscriptions/current', adminCookie);

  // Summary
  console.log('\n📊 Test Summary:');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n❌ Failed endpoints:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ${r.method} ${r.endpoint}: ${r.status} - ${r.error}`);
      });
  }
}

// Run the tests
runTests().catch(console.error);