#!/usr/bin/env node

const http = require('http');

const postData = JSON.stringify({
  email: '1@1.com',
  password: 'Admin123!'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/public/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔍 Testing login API endpoint...');
console.log('📝 Payload:', postData);

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response Body:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Parsed Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success) {
        console.log('🎉 Login successful!');
        console.log('👤 User:', parsed.data.user.email);
        console.log('🔑 Roles:', parsed.data.user.roles);
        console.log('🛡️  Permissions:', parsed.data.user.permissions.slice(0, 5), '...'); // First 5
      } else {
        console.log('❌ Login failed:', parsed.error, '-', parsed.message);
      }
    } catch (parseError) {
      console.log('⚠️  Could not parse response as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();