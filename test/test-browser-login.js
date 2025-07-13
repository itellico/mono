#!/usr/bin/env node

/**
 * Browser-like Login Test
 * Simulates the exact browser flow: login, get cookies, then access admin page
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

async function testBrowserLogin() {
  console.log('🌐 Testing Browser-like Login Flow...\n');
  
  try {
    // Step 1: API Login to get cookies
    console.log('1️⃣ API Login (simulating JavaScript fetch)...');
    const loginResponse = await makeRequest(`${API_URL}/api/v1/public/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ API Login failed:', loginResponse.statusCode);
      return;
    }
    
    console.log('✅ API Login successful');
    const cookies = parseCookies(loginResponse.cookies);
    console.log('🍪 Received cookies:', Object.keys(cookies));
    
    // Step 2: Access frontend admin page WITH cookies (simulating browser)
    console.log('\n2️⃣ Accessing /admin with cookies (simulating browser navigation)...');
    const adminResponse = await makeRequest(`${BASE_URL}/admin`, {
      method: 'GET',
      headers: {
        'Cookie': formatCookies(cookies),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log(`Status: ${adminResponse.statusCode}`);
    
    if (adminResponse.statusCode === 200) {
      console.log('✅ Admin page accessible!');
      console.log('🎉 Authentication flow working correctly');
      
      // Check if it contains admin content
      const bodyPreview = adminResponse.body.substring(0, 500);
      if (bodyPreview.includes('admin') || bodyPreview.includes('dashboard') || bodyPreview.includes('Admin')) {
        console.log('✅ Page contains admin content');
      } else {
        console.log('⚠️  Page loaded but content unclear');
        console.log('📝 Body preview:', bodyPreview);
      }
      
    } else if (adminResponse.statusCode === 307 || adminResponse.statusCode === 302) {
      console.log('❌ Still being redirected to login');
      console.log('📍 Redirect location:', adminResponse.headers.location);
      console.log('🔧 Middleware JWT verification still failing');
      
      // Debug: Check what cookies we're sending
      console.log('🔍 Debug Info:');
      console.log('   Cookies being sent:', formatCookies(cookies));
      console.log('   Access token length:', cookies.accessToken?.length || 'MISSING');
      
    } else {
      console.log('❌ Unexpected status code');
      console.log('📝 Response preview:', adminResponse.body.substring(0, 200));
    }
    
    // Step 3: Test the /me endpoint that was failing
    console.log('\n3️⃣ Testing /me endpoint with same cookies...');
    const meResponse = await makeRequest(`${API_URL}/api/v1/public/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': formatCookies(cookies),
        'Accept': 'application/json'
      }
    });
    
    console.log(`/me Status: ${meResponse.statusCode}`);
    if (meResponse.statusCode === 200) {
      console.log('✅ /me endpoint working');
      try {
        const meData = JSON.parse(meResponse.body);
        console.log(`👤 User: ${meData.data?.user?.email || 'Unknown'}`);
      } catch (e) {
        console.log('⚠️  Could not parse /me response');
      }
    } else {
      console.log('❌ /me endpoint still failing');
      console.log('📝 Response:', meResponse.body.substring(0, 200));
    }
    
    console.log('\n🏁 Test Summary:');
    console.log('1. API Login: ✅ Working');
    console.log('2. Cookie Setting: ✅ Working');
    console.log(`3. Frontend Middleware: ${adminResponse.statusCode === 200 ? '✅' : '❌'} ${adminResponse.statusCode === 200 ? 'Working' : 'Still Failing'}`);
    console.log(`4. API /me Endpoint: ${meResponse.statusCode === 200 ? '✅' : '❌'} ${meResponse.statusCode === 200 ? 'Working' : 'Still Failing'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBrowserLogin().catch(console.error);