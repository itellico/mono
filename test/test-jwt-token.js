#!/usr/bin/env node

/**
 * Debug JWT Token Content
 * Tests what's actually inside the JWT token returned by login
 */

const https = require('https');
const http = require('http');
const jwt = require('jsonwebtoken');

// Test configuration
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

async function debugJwtToken() {
  console.log('🔍 Debugging JWT Token Content...\n');
  
  try {
    // Step 1: Login and get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await makeRequest(`${API_URL}/api/v1/public/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_CREDENTIALS)
    });
    
    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed:', loginResponse.statusCode);
      console.log('📝 Response:', loginResponse.body);
      return;
    }
    
    const loginData = JSON.parse(loginResponse.body);
    const cookies = parseCookies(loginResponse.cookies);
    
    console.log('✅ Login successful');
    console.log('🍪 Cookies received:', Object.keys(cookies));
    
    // Step 2: Extract and decode access token from cookies
    const accessToken = cookies.accessToken;
    if (!accessToken) {
      console.log('❌ No access token in cookies');
      return;
    }
    
    console.log('\n2️⃣ Analyzing access token from cookies...');
    console.log('🔑 Token (first 50 chars):', accessToken.substring(0, 50) + '...');
    
    try {
      // Decode without verification to see the payload
      const decoded = jwt.decode(accessToken, { complete: true });
      console.log('\n📊 JWT Header:', JSON.stringify(decoded.header, null, 2));
      console.log('\n📋 JWT Payload:', JSON.stringify(decoded.payload, null, 2));
      
      const payload = decoded.payload;
      console.log('\n🔍 Field Analysis:');
      console.log(`   • sub: ${payload.sub}`);
      console.log(`   • userId: ${payload.userId || 'NOT PRESENT'}`);
      console.log(`   • sessionId: ${payload.sessionId}`);
      console.log(`   • type: ${payload.type}`);
      console.log(`   • iat: ${payload.iat} (${new Date(payload.iat * 1000).toISOString()})`);
      console.log(`   • exp: ${payload.exp} (${new Date(payload.exp * 1000).toISOString()})`);
      
      // Check what middleware will see
      console.log('\n🚦 Middleware Check:');
      console.log(`   • token.sub exists: ${!!payload.sub}`);
      console.log(`   • token.userId exists: ${!!payload.userId}`);
      console.log(`   • token.sub value: "${payload.sub}"`);
      
    } catch (decodeError) {
      console.log('❌ Failed to decode JWT:', decodeError.message);
    }
    
    // Step 3: Compare with response body token (if different)
    if (loginData.data.accessToken && loginData.data.accessToken !== accessToken) {
      console.log('\n3️⃣ Analyzing access token from response body...');
      console.log('⚠️  Cookie token differs from response body token');
      
      try {
        const bodyDecoded = jwt.decode(loginData.data.accessToken, { complete: true });
        console.log('\n📋 Response Body JWT Payload:', JSON.stringify(bodyDecoded.payload, null, 2));
      } catch (bodyDecodeError) {
        console.log('❌ Failed to decode response body JWT:', bodyDecodeError.message);
      }
    } else {
      console.log('\n✅ Cookie token matches response body token');
    }
    
    // Step 4: Test token verification with different secrets
    console.log('\n4️⃣ Testing token verification...');
    const possibleSecrets = [
      'your-jwt-secret-key-here', // From .env file
      process.env.JWT_SECRET || 'your-jwt-secret',
      'development-jwt-secret-key-only-for-dev',
      'your-jwt-secret'
    ];
    
    for (const secret of possibleSecrets) {
      try {
        const verified = jwt.verify(accessToken, secret);
        console.log(`✅ Token verified with secret: "${secret}"`);
        console.log('   Verified payload:', JSON.stringify(verified, null, 2));
        break;
      } catch (verifyError) {
        console.log(`❌ Token verification failed with secret: "${secret}"`);
        console.log(`   Error: ${verifyError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

// Run the test
debugJwtToken().catch(console.error);