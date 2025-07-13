#!/usr/bin/env node

const axios = require('axios');

async function testFrontendAuth() {
  console.log('🌐 Testing frontend authentication flow...\n');

  // Test CORS and API connectivity from frontend perspective
  try {
    console.log('1️⃣ Testing API connectivity...');
    const healthResponse = await axios.get('http://localhost:3001/api/v1/public/health', {
      headers: {
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Frontend Test)'
      }
    });
    console.log('✅ API health check passed');

    console.log('\n2️⃣ Testing login endpoint...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: '1@1.com',
      password: 'admin1@1.com'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Frontend Test)'
      }
    });

    console.log('✅ Login successful!');
    console.log('📄 Response summary:');
    console.log(`   User: ${loginResponse.data.data.user.email}`);
    console.log(`   Roles: ${loginResponse.data.data.user.roles.map(r => r.name).join(', ')}`);
    console.log(`   Token: ${loginResponse.data.data.tokens.accessToken.substring(0, 50)}...`);

    console.log('\n3️⃣ Testing authenticated endpoint...');
    const meResponse = await axios.get('http://localhost:3001/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.data.tokens.accessToken}`,
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Frontend Test)'
      }
    });

    console.log('✅ Authenticated request successful!');
    console.log(`   User ID: ${meResponse.data.data.user.uuid}`);

    console.log('\n🎉 All tests passed! The API is working correctly.');
    console.log('\n💡 If login still fails in the browser:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Check Network tab for failed requests');
    console.log('   3. Ensure no browser extensions are blocking requests');
    console.log('   4. Try opening in an incognito window');

  } catch (error) {
    console.log('❌ Test failed!');
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log('📄 Response:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n💡 401 suggests the credentials are wrong or API changed');
      } else if (error.response.status >= 500) {
        console.log('\n💡 Server error - check API logs');
      }
    } else {
      console.log('⚠️  Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Connection refused - is the API server running?');
      }
    }
  }
}

testFrontendAuth();