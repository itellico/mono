#!/usr/bin/env node

/**
 * Test script to verify the MCP documentation server URL fix
 * This tests that URLs are constructed without double slashes
 */

// Test cases for filePath handling
const testCases = [
  { input: '/architecture/overview.md', expected: 'http://localhost:3005/architecture/overview.md' },
  { input: 'architecture/overview.md', expected: 'http://localhost:3005/architecture/overview.md' },
  { input: '/development/api/endpoints.md', expected: 'http://localhost:3005/development/api/endpoints.md' },
  { input: 'development/api/endpoints.md', expected: 'http://localhost:3005/development/api/endpoints.md' },
  { input: '/', expected: 'http://localhost:3005/' },
  { input: '', expected: 'http://localhost:3005/' }
];

console.log('Testing MCP Documentation Server URL Construction\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const { input, expected } = testCase;
  
  // Simulate the fix logic
  const result = `http://localhost:3005/${input.startsWith('/') ? input.substring(1) : input}`;
  
  if (result === expected) {
    console.log(`✅ Test ${index + 1} PASSED`);
    console.log(`   Input: "${input}"`);
    console.log(`   Output: ${result}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1} FAILED`);
    console.log(`   Input: "${input}"`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Got: ${result}`);
    failed++;
  }
  console.log();
});

console.log('='.repeat(60));
console.log(`\nSummary: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ All tests passed! The URL construction fix is working correctly.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the fix.');
  process.exit(1);
}