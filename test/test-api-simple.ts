#!/usr/bin/env tsx

import fetch from 'node-fetch';

async function testAPI() {
  console.log('Testing API endpoints...');
  
  try {
    // Test health endpoint first
    const healthResponse = await fetch('http://192.168.178.94:3001/api/v2/health');
    console.log('Health endpoint status:', healthResponse.status);
    
    if (healthResponse.status === 404) {
      console.log('❌ Health endpoint not found');
    }
    
    // Test auth/me endpoint (should return 401)
    const meResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/me');
    console.log('Auth/me endpoint status:', meResponse.status);
    const meText = await meResponse.text();
    console.log('Auth/me response:', meText);
    
    // Test signin endpoint
    const signinResponse = await fetch('http://192.168.178.94:3001/api/v2/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '1@1.com',
        password: '12345678'
      })
    });
    
    console.log('Signin status:', signinResponse.status);
    const signinText = await signinResponse.text();
    console.log('Signin response:', signinText);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPI();