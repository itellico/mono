// Test concurrent auth calls to verify deduplication
const fetch = require('node-fetch');

async function testConcurrentAuthCalls() {
  console.log('Testing concurrent auth calls...\n');
  
  // First login to get a valid token
  const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '1@1.com', password: '123' })
  });
  
  const loginData = await loginResponse.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    return;
  }
  
  const accessToken = loginData.data.tokens.accessToken;
  console.log('✓ Login successful\n');
  
  // Track request times
  let requestCount = 0;
  const requestLog = [];
  
  // Create 5 concurrent requests
  console.log('Making 5 concurrent /api/v1/auth/me requests...\n');
  const startTime = Date.now();
  
  const promises = Array(5).fill(null).map((_, index) => {
    const requestId = ++requestCount;
    const requestStart = Date.now();
    
    requestLog.push({
      id: requestId,
      startTime: requestStart - startTime,
      status: 'started'
    });
    
    return fetch('http://localhost:3001/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Request-ID': `req-${requestId}`
      }
    }).then(async response => {
      const endTime = Date.now();
      const data = await response.json();
      
      requestLog.push({
        id: requestId,
        endTime: endTime - startTime,
        duration: endTime - requestStart,
        status: data.success ? 'success' : 'failed',
        cached: response.headers.get('x-cached') === 'true'
      });
      
      return { requestId, data, duration: endTime - requestStart };
    });
  });
  
  // Wait for all requests to complete
  const results = await Promise.all(promises);
  
  // Display results
  console.log('Results:');
  console.log('========\n');
  
  results.forEach(({ requestId, data, duration }) => {
    console.log(`Request #${requestId}:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Success: ${data.success}`);
    console.log(`  User: ${data.data?.user?.email || 'N/A'}`);
    console.log('');
  });
  
  // Analyze timing
  const totalTime = Date.now() - startTime;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log('Analysis:');
  console.log('=========');
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Average request duration: ${avgDuration.toFixed(2)}ms`);
  
  // Check if requests were deduplicated (they should complete very close together)
  const completionTimes = requestLog
    .filter(log => log.endTime)
    .map(log => log.endTime)
    .sort((a, b) => a - b);
  
  if (completionTimes.length > 1) {
    const spread = completionTimes[completionTimes.length - 1] - completionTimes[0];
    console.log(`Completion time spread: ${spread}ms`);
    
    if (spread < 50) {
      console.log('\n✓ Requests appear to be deduplicated (completed within 50ms of each other)');
    } else {
      console.log('\n⚠️  Requests may not be deduplicated (spread > 50ms)');
    }
  }
}

// Run the test
testConcurrentAuthCalls().catch(console.error);