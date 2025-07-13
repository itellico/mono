#!/usr/bin/env node

/**
 * Test JWT Environment Variables
 * Check what environment variables the processes are actually using
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables from different sources
console.log('🔍 Testing JWT Environment Variables...\n');

// Test 1: Current process.env
console.log('1️⃣ Current process.env:');
console.log(`   JWT_SECRET: "${process.env.JWT_SECRET || 'UNDEFINED'}"`);
console.log(`   NODE_ENV: "${process.env.NODE_ENV || 'UNDEFINED'}"`);

// Test 2: Load from .env
console.log('\n2️⃣ Loading from .env:');
const envResult = dotenv.config({ path: '.env' });
if (envResult.error) {
  console.log('   ❌ Error loading .env:', envResult.error.message);
} else {
  console.log(`   JWT_SECRET: "${envResult.parsed?.JWT_SECRET || 'NOT FOUND'}"`);
}

// Test 3: Load from .env.local
console.log('\n3️⃣ Loading from .env.local:');
const envLocalResult = dotenv.config({ path: '.env.local' });
if (envLocalResult.error) {
  console.log('   ❌ Error loading .env.local:', envLocalResult.error.message);
} else {
  console.log(`   JWT_SECRET: "${envLocalResult.parsed?.JWT_SECRET || 'NOT FOUND'}"`);
}

// Test 4: Test a sample token
console.log('\n4️⃣ Testing token verification with both secrets:');

const samplePayload = {
  sub: "test-user-id",
  sessionId: "test-session",
  type: "access",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

const secrets = [
  'your-jwt-secret-key-here',
  'development-jwt-secret-key-only-for-dev',
  'your-jwt-secret',
  process.env.JWT_SECRET || 'fallback'
];

secrets.forEach((secret, index) => {
  try {
    const token = jwt.sign(samplePayload, secret);
    const verified = jwt.verify(token, secret);
    console.log(`   Secret ${index + 1} ("${secret}"): ✅ Works`);
  } catch (error) {
    console.log(`   Secret ${index + 1} ("${secret}"): ❌ ${error.message}`);
  }
});

// Test 5: Check actual running processes env
console.log('\n5️⃣ Checking what the running Node processes might be using:');
console.log('   NOTE: We cannot directly inspect other process environments,');
console.log('   but we can infer from the fact that API login works but middleware fails.');
console.log('   This suggests API server and Next.js middleware use different secrets.');

console.log('\n💡 Solution:');
console.log('   The middleware uses process.env.JWT_SECRET from Next.js runtime');
console.log('   while the API server uses its own .env file.');
console.log('   Both need to use the same secret for token verification to work.');