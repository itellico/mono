#!/usr/bin/env tsx

import fetch from 'node-fetch';

async function testPermissionSystem() {
  console.log('🔐 Testing Permission System...\n');
  
  try {
    // 1. Login and get token
    console.log('1. Authenticating with super admin credentials...');
    const loginResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '1@1.com', password: '12345678' })
    });
    
    const loginData = await loginResponse.json() as any;
    console.log('   Status:', loginResponse.status);
    console.log('   Success:', loginData.success);
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData);
      return;
    }
    
    console.log('   User:', loginData.data.user.name);
    console.log('   Roles:', loginData.data.user.roles);
    console.log('   Tier:', loginData.data.user.tier);
    
    // Extract token from Set-Cookie header (since we're not sending token in response body anymore)
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    let token = loginData.data.token || null;
    
    if (!token && setCookieHeader) {
      const match = setCookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    
    if (!token) {
      console.log('❌ No token found in response');
      return;
    }
    
    console.log('   Token extracted:', token.substring(0, 20) + '...');

    // 2. Test accessing protected endpoint with token
    console.log('\n2. Testing protected endpoint /auth/me...');
    const meResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/me', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const meData = await meResponse.json() as any;
    console.log('   Status:', meResponse.status);
    console.log('   Success:', meData.success);
    
    if (meData.success) {
      console.log('   User ID:', meData.data.user.id);
      console.log('   Email:', meData.data.user.email);
      console.log('   Roles:', meData.data.user.roles);
    } else {
      console.log('   Error:', meData);
    }
    
    // 3. Test accessing endpoint without token
    console.log('\n3. Testing endpoint without authorization...');
    const noAuthResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/me');
    const noAuthData = await noAuthResponse.json() as any;
    console.log('   Status:', noAuthResponse.status);
    console.log('   Should be 401:', noAuthResponse.status === 401 ? '✅' : '❌');
    
    // 4. Test platform endpoint (requires high privileges)
    console.log('\n4. Testing platform endpoint (high privilege required)...');
    const platformResponse = await fetch('http://192.168.178.94:3001/api/v2/platform/tenants', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Platform endpoint status:', platformResponse.status);
    
    console.log('\n🎉 Permission system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPermissionSystem();