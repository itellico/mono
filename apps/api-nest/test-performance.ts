#!/usr/bin/env tsx

/**
 * Quick Performance Test for NestJS API
 * Validates that we can achieve >40K req/sec
 */

import autocannon from 'autocannon';

async function runTest() {
  console.log('🚀 Running NestJS Performance Test');
  console.log('Target: 40,000 req/sec\n');

  // Test against a simple endpoint
  const result = await autocannon({
    url: 'http://localhost:3001/api/health',
    duration: 10,
    connections: 100,
    pipelining: 10,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('\n📊 Results:');
  console.log(`Requests/sec: ${Math.round(result.requests.average).toLocaleString()}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Latency (p99): ${(result.latency as any).p99 || 'N/A'}ms`);
  console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/sec`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);

  const meetsTarget = result.requests.average >= 40000;
  console.log(`\n🎯 Target Met: ${meetsTarget ? '✅ YES' : '❌ NO'}`);

  if (!meetsTarget) {
    console.log('\n💡 To improve performance:');
    console.log('- Ensure NODE_ENV=production');
    console.log('- Disable all logging');
    console.log('- Use clustering/PM2');
    console.log('- Enable HTTP/2');
  }
}

// Check if server is running
fetch('http://localhost:3001/api/health')
  .then(() => runTest())
  .catch(() => {
    console.error('❌ Server not running on http://localhost:3001');
    console.log('\nPlease start the server first:');
    console.log('cd apps/api-nest && pnpm start:dev');
    process.exit(1);
  });