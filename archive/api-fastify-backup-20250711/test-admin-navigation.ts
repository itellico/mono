import axios from 'axios';

const API_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test login and navigation
async function testAdminNavigation() {
  console.log('🔍 Testing Admin Navigation...\n');

  try {
    // 1. Test login
    console.log('1️⃣ Testing login with 1@1.com / Admin123!');
    const loginResponse = await axios.post(`${API_URL}/api/v1/public/auth/login`, {
      email: '1@1.com',
      password: 'Admin123!'
    }, {
      validateStatus: () => true // Accept any status code
    });

    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Response:`, loginResponse.data);

    if (loginResponse.status !== 200) {
      console.log('\n❌ Login failed. Cannot proceed with navigation tests.');
      return;
    }

    // Extract token
    const setCookieHeader = loginResponse.headers['set-cookie'];
    const accessToken = setCookieHeader?.find(cookie => cookie.startsWith('accessToken='))?.split(';')[0];
    
    if (!accessToken) {
      console.log('\n❌ No access token received. Cannot proceed.');
      return;
    }

    console.log('\n✅ Login successful! Testing admin routes...\n');

    // List of admin routes to test
    const adminRoutes = [
      { path: '/api/v1/platform/tenants', name: 'Tenants' },
      { path: '/api/v1/platform/users', name: 'Users' },
      { path: '/api/v1/tenant/tags', name: 'Tags' },
      { path: '/api/v1/tenant/categories', name: 'Categories' },
      { path: '/api/v1/platform/permissions', name: 'Permissions' },
      { path: '/api/v1/platform/integrations', name: 'Integrations' },
      { path: '/api/v1/tenant/subscriptions', name: 'Subscriptions' },
      { path: '/api/v1/platform/monitoring/metrics', name: 'Monitoring' },
      { path: '/api/v1/platform/audit/logs', name: 'Audit Logs' },
      { path: '/api/v1/platform/settings', name: 'Settings' }
    ];

    // Test each route
    for (const route of adminRoutes) {
      try {
        const response = await axios.get(`${API_URL}${route.path}`, {
          headers: {
            Cookie: accessToken
          },
          validateStatus: () => true
        });

        if (response.status === 200) {
          const dataCount = response.data.data?.items?.length || 
                           response.data.data?.length || 
                           (response.data.data ? 1 : 0);
          console.log(`✅ ${route.name}: Status ${response.status} - ${dataCount} items`);
        } else {
          console.log(`❌ ${route.name}: Status ${response.status} - ${response.data.error || response.data.message || 'Failed'}`);
        }
      } catch (error) {
        console.log(`❌ ${route.name}: Network error - ${error.message}`);
      }
    }

    // Test if we have data in key areas
    console.log('\n📊 Data Summary:');
    
    // Check for seeded data
    const dataChecks = [
      { path: '/api/v1/platform/users', name: 'Total Users' },
      { path: '/api/v1/tenant/tags', name: 'Total Tags' },
      { path: '/api/v1/tenant/categories', name: 'Total Categories' },
      { path: '/api/v1/platform/permissions', name: 'Total Permissions' }
    ];

    for (const check of dataChecks) {
      try {
        const response = await axios.get(`${API_URL}${check.path}`, {
          headers: {
            Cookie: accessToken
          }
        });

        const count = response.data.data?.items?.length || 
                     response.data.data?.length || 0;
        console.log(`   ${check.name}: ${count}`);
      } catch (error) {
        console.log(`   ${check.name}: Unable to fetch`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminNavigation();