#!/usr/bin/env tsx

/**
 * Simple test to verify N8N webhook is accessible
 */

async function testSimpleWebhook() {
  const url = 'http://localhost:5678/webhook/docs-approval';
  
  console.log('🧪 Testing N8N webhook directly...');
  console.log(`📍 URL: ${url}`);
  
  // Try a simple POST with minimal data
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    });

    console.log(`\n📨 Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`\nResponse body:`, text);
    
    if (response.ok) {
      console.log('\n✅ Webhook is reachable!');
      console.log('Check N8N execution history for details.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testSimpleWebhook();