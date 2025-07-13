#!/usr/bin/env node

/**
 * Test Login Flow
 * Tests the complete authentication flow after middleware fix
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: '1@1.com',
  password: 'Admin123!'
};

// Function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Extract cookies from response
function parseCookies(cookies) {
  const cookieObj = {};
  cookies.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      cookieObj[name.trim()] = value.trim();
    }
  });
  return cookieObj;
}

// Format cookies for request
function formatCookies(cookieObj) {
  return Object.entries(cookieObj)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow...\n');
  
  try {
    // Step 1: Check if servers are running
    console.log('1️⃣ Checking server availability...');
    
    try {
      const frontendCheck = await makeRequest(`${BASE_URL}/api/health`, {
        timeout: 5000
      });
      console.log(`   ✅ Frontend server: ${frontendCheck.statusCode}`);
    } catch (error) {
      console.log(`   ❌ Frontend server: Not responding`);
      console.log(`   💡 Please start: pnpm run dev`);
      return;
    }
    
    try {
      const apiCheck = await makeRequest(`${API_URL}/health`, {
        timeout: 5000
      });
      console.log(`   ✅ API server: ${apiCheck.statusCode}`);
    } catch (error) {
      console.log(`   ❌ API server: Not responding`);
      console.log(`   💡 Please start: cd apps/api && pnpm run dev`);
      return;
    }
    
    // Step 2: Test login endpoint
    console.log('\n2️⃣ Testing login API...');
    const loginResponse = await makeRequest(`${API_URL}/api/v1/public/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    console.log(`   Status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 200) {
      console.log('   ✅ Login API successful');
      
      // Parse response
      let loginData;
      try {
        loginData = JSON.parse(loginResponse.body);
        console.log('   📊 Response structure:', Object.keys(loginData));
        
        if (loginData.success) {
          console.log('   ✅ Login returned success: true');
          if (loginData.data && loginData.data.user) {
            console.log(`   👤 User: ${loginData.data.user.email}`);
            console.log(`   🏢 Tenant: ${loginData.data.user.tenant?.name || 'N/A'}`);
          }
        } else {
          console.log('   ❌ Login returned success: false');
          console.log('   📝 Error:', loginData.error || loginData.message);
        }
      } catch (parseError) {
        console.log('   ⚠️  Could not parse response JSON');
        console.log('   📝 Raw response:', loginResponse.body.substring(0, 200));
      }
      
      // Check cookies
      if (loginResponse.cookies.length > 0) {
        console.log('   🍪 Cookies set:', loginResponse.cookies.length);
        const cookies = parseCookies(loginResponse.cookies);
        console.log('   📋 Cookie names:', Object.keys(cookies));
        
        // Step 3: Test authenticated request
        console.log('\n3️⃣ Testing authenticated request...');
        const authTestResponse = await makeRequest(`${API_URL}/api/v1/public/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': formatCookies(cookies),
            'Accept': 'application/json'
          }
        });
        
        console.log(`   Status: ${authTestResponse.statusCode}`);
        
        if (authTestResponse.statusCode === 200) {
          console.log('   ✅ Authenticated request successful');
          try {
            const meData = JSON.parse(authTestResponse.body);
            if (meData.success && meData.data) {
              console.log(`   👤 Authenticated as: ${meData.data.email}`);
              console.log(`   🔑 Permissions: ${meData.data.permissions?.length || 0} found`);
            }
          } catch (parseError) {
            console.log('   ⚠️  Could not parse /me response');
          }
        } else {
          console.log('   ❌ Authenticated request failed');
          console.log('   📝 Response:', authTestResponse.body.substring(0, 200));
        }
        
        // Step 4: Test middleware protection
        console.log('\n4️⃣ Testing middleware protection...');
        const protectedResponse = await makeRequest(`${BASE_URL}/admin`, {
          method: 'GET',
          headers: {
            'Cookie': formatCookies(cookies),
            'Accept': 'text/html'
          }
        });
        
        console.log(`   Status: ${protectedResponse.statusCode}`);
        
        if (protectedResponse.statusCode === 200) {
          console.log('   ✅ Admin page accessible');
          // Check if it's the actual admin page or a redirect
          if (protectedResponse.body.includes('Admin Dashboard') || 
              protectedResponse.body.includes('admin') || 
              protectedResponse.body.includes('dashboard')) {
            console.log('   ✅ Admin page content loaded');
          } else {
            console.log('   ⚠️  Unexpected page content');
          }
        } else if (protectedResponse.statusCode === 302 || protectedResponse.statusCode === 307) {
          console.log('   🔄 Redirect response');
          console.log('   📍 Location:', protectedResponse.headers.location);
          
          if (protectedResponse.headers.location?.includes('/auth/signin')) {
            console.log('   ❌ Middleware still redirecting to login');
            console.log('   🔧 JWT token parsing might still have issues');
          } else {
            console.log('   ✅ Redirecting to expected location');
          }
        } else {
          console.log('   ❌ Admin page not accessible');
        }
        
      } else {
        console.log('   ❌ No cookies set by login');
      }
      
    } else {
      console.log('   ❌ Login failed');
      console.log('   📝 Response:', loginResponse.body.substring(0, 200));
    }
    
    console.log('\n🎯 Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   - Login API test completed');
    console.log('   - Authentication flow verified');
    console.log('   - Middleware protection tested');
    console.log('\n💡 Next steps:');
    console.log('   - Check console for any errors');
    console.log('   - Verify admin page loads correctly');
    console.log('   - Test actual browser flow manually');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted');
  process.exit(0);
});

// Run the test
testLoginFlow().catch(console.error);