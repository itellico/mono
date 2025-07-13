#!/usr/bin/env node

const http = require('http');

// Extracted access token from previous login
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5NzU2MmE2YS1mMDZiLTRiMjYtOWU1Yy1kOWQxNGMyODlmZGUiLCJzZXNzaW9uSWQiOiI0ODJkY2RmMi0wODQ5LTQyMzMtYTU1YS02N2E0MWNmMGFlMDMiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUxODY5MzI1LCJleHAiOjE3NTI0NzQxMjV9.C-bRdxBdmgoVcyjx-Guv_eKj5Jc4za8EfufDr0coaQE';

const endpoints = [
  '/api/v1/platform/admin/tenants',
  '/api/v1/tenant/categories', 
  '/api/v1/tenant/tags',
  '/api/v1/tenant/permissions',
  '/api/v1/tenant/users',
  '/api/v1/public/health'
];

async function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': `accessToken=${accessToken}`,
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject({ path, error: e.message });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing Admin API Endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const result = await testEndpoint(endpoint);
      
      console.log(`   Status: ${result.status}`);
      
      if (result.status === 200) {
        try {
          const parsed = JSON.parse(result.body);
          console.log(`   ✅ Success: ${parsed.success}`);
          
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log(`   📊 Items: ${parsed.data.length}`);
          } else if (parsed.data && typeof parsed.data === 'object') {
            console.log(`   📦 Data keys: ${Object.keys(parsed.data).join(', ')}`);
          }
        } catch (parseError) {
          console.log(`   ⚠️  Non-JSON response: ${result.body.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Error: ${result.body.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.error || error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('🏁 Admin API endpoint testing complete');
}

testAllEndpoints().catch(console.error);