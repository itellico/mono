#!/usr/bin/env tsx
import fetch from 'node-fetch';

const API_URL = 'http://192.168.178.94:3001';

async function testMeEndpoint() {
  console.log('🔍 Testing /me endpoint with updated roles...\n');

  // 1. Login first
  console.log('1️⃣ Logging in...');
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
  
  if (!loginData.success || !loginData.data?.token) {
    console.error('❌ Login failed:', loginData);
    return;
  }

  const token = loginData.data.token;
  console.log('✅ Login successful!');
  console.log('User data from login:', JSON.stringify(loginData.data.user, null, 2));

  // 2. Test /me endpoint
  console.log('\n2️⃣ Testing /me endpoint...');
  const meResponse = await fetch(`${API_URL}/api/v2/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const meData = await meResponse.json();
  console.log('Me response status:', meResponse.status);
  console.log('Me response:', JSON.stringify(meData, null, 2));

  // 3. Check token payload
  console.log('\n3️⃣ Checking JWT token payload...');
  const tokenParts = token.split('.');
  if (tokenParts.length === 3) {
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload, null, 2));
  }
}

testMeEndpoint().catch(console.error);