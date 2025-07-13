#!/usr/bin/env tsx

/**
 * Debug what N8N is doing - send minimal payload to see execution
 */

async function debugN8NWorkflow() {
  console.log('🔍 Debugging N8N workflow...');
  
  // Send minimal test data
  const payload = {
    title: "Debug Test",
    description: "Minimal test to debug N8N",
    proposedBy: "debug",
    filesCount: 1,
    reviewUrl: "http://test.com",
    updateId: "debug-123"
  };

  try {
    console.log('📤 Sending minimal payload to N8N...');
    
    const response = await fetch('http://localhost:5678/webhook/docs-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`📨 N8N Response: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response body: "${responseText}"`);

    if (response.ok) {
      console.log('\n✅ N8N received the request successfully');
      console.log('\n🔍 Now check N8N Executions:');
      console.log('   1. Go to http://localhost:5678/executions');
      console.log('   2. Click on the latest execution');
      console.log('   3. Check each node for errors:');
      console.log('      - Webhook node: Should show incoming data');
      console.log('      - HTTP Request node: Check for errors');
      console.log('\n📝 Common issues:');
      console.log('   - HTTP Request URL not set correctly');
      console.log('   - JSON body malformed');
      console.log('   - Missing required headers');
    } else {
      console.log('❌ N8N rejected the request');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugN8NWorkflow();