#!/usr/bin/env tsx

import fetch from 'node-fetch';

async function debugJWT() {
  console.log('🔍 Debugging JWT Token...\n');
  
  try {
    // 1. Login and get token
    console.log('1. Authenticating...');
    const loginResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '1@1.com', password: '12345678' })
    });
    
    const loginData = await loginResponse.json() as any;
    console.log('Login success:', loginData.success);
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData);
      return;
    }
    
    // Get the Set-Cookie header to extract token
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);
    
    // Extract token from the cookie header
    let cookieToken = null;
    if (setCookieHeader) {
      const match = setCookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        cookieToken = match[1];
      }
    }
    
    console.log('Cookie token:', cookieToken ? cookieToken.substring(0, 20) + '...' : 'Not found');
    
    // 2. Test with Authorization header
    console.log('\n2. Testing with Authorization header...');
    const authHeaderResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/me', {
      headers: { 
        'Authorization': `Bearer ${cookieToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Authorization header status:', authHeaderResponse.status);
    const authHeaderData = await authHeaderResponse.json() as any;
    console.log('Authorization header response:', authHeaderData);
    
    // 3. Test with Cookie header
    console.log('\n3. Testing with Cookie header...');
    const cookieResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/me', {
      headers: { 
        'Cookie': `auth-token=${cookieToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Cookie header status:', cookieResponse.status);
    const cookieData = await cookieResponse.json() as any;
    console.log('Cookie header response:', cookieData);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugJWT();