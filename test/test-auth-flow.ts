#!/usr/bin/env tsx
import fetch from 'node-fetch';

const API_URL = 'http://192.168.178.94:3001';

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...\n');

  // 1. Test login
  console.log('1️⃣ Testing login endpoint...');
  const loginResponse = await fetch(`${API_URL}/api/v2/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: '1@1.com',
      password: '12345678'
    })
  });

  const loginData = await loginResponse.json();
  console.log('Login response status:', loginResponse.status);
  console.log('Login response:', JSON.stringify(loginData, null, 2));

  if (!loginData.success || !loginData.data?.token) {
    console.error('❌ Login failed');
    return;
  }

  const token = loginData.data.token;
  console.log('\n✅ Login successful! Token received.');

  // 2. Test /me endpoint with token
  console.log('\n2️⃣ Testing /me endpoint with token...');
  const meResponse = await fetch(`${API_URL}/api/v2/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const meData = await meResponse.json();
  console.log('Me response status:', meResponse.status);
  console.log('Me response:', JSON.stringify(meData, null, 2));

  // 3. Check what the token contains
  console.log('\n3️⃣ Decoding JWT token...');
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload, null, 2));
  }

  // 4. Test admin endpoint
  console.log('\n4️⃣ Testing admin endpoint access...');
  const adminResponse = await fetch(`${API_URL}/api/v2/platform/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const adminData = await adminResponse.json();
  console.log('Admin response status:', adminResponse.status);
  console.log('Admin response:', JSON.stringify(adminData, null, 2));
}

testAuthFlow().catch(console.error);