#!/usr/bin/env tsx

/**
 * Test script for Mattermost notification via N8N webhook
 * This sends a test documentation approval request to verify the integration
 */

async function tryWebhook(url: string, payload: any) {
  try {
    console.log(`\n📤 Trying webhook URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`📨 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    // Check if we got HTML (login page) instead of webhook response
    if (responseText.includes('<!doctype html') || responseText.includes('<html')) {
      console.log('❌ Got HTML response (likely login page) instead of webhook response');
      console.log('🔍 This means the webhook URL is redirecting to Mattermost login');
      return { success: false, error: 'Received HTML login page instead of webhook response' };
    }
    
    if (responseText && responseText !== 'ok') {
      console.log('📄 Response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    } else if (responseText === 'ok') {
      console.log('✅ Webhook responded with "ok"');
    }

    return { success: response.ok, response, responseText };
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error };
  }
}

async function testMattermostNotification() {
  // Use environment variable if set, otherwise try standard URLs
  const envUrl = process.env.N8N_DOCS_WEBHOOK_URL;
  const testUrl = 'http://localhost:5678/webhook-test/docs-approval';
  const prodUrl = 'http://localhost:5678/webhook/docs-approval';
  
  console.log('🚀 Testing Mattermost notification...');
  
  // Load Mattermost webhook URL from environment
  const mattermostWebhookUrl = process.env.MATTERMOST_WEBHOOK_URL || 'https://mm.itellico.com/hooks/tcpsebpfbbdqdyrq4tiancupyc';
  const mattermostChannel = process.env.MATTERMOST_DOCS_CHANNEL || 'mono-docs';
  
  console.log('📍 Mattermost Webhook:', mattermostWebhookUrl);
  console.log('📍 Mattermost Channel:', mattermostChannel);
  
  const testPayload = {
    updateId: 'test-' + Date.now(),
    title: '🧪 Test Documentation Update',
    description: 'This is a test notification from itellico Mono to verify Mattermost integration',
    proposedBy: 'test-script',
    filesCount: 2,
    reviewUrl: 'http://localhost:3000/admin/docs/review/test-123',
    timestamp: new Date().toISOString(),
    metadata: {
      feature: 'Mattermost Integration Test',
      type: 'implementation'
    },
    // Pass Mattermost config in the payload
    mattermostWebhookUrl: mattermostWebhookUrl,
    mattermostChannel: mattermostChannel
  };

  // Try environment URL first if available
  let result;
  if (envUrl) {
    result = await tryWebhook(envUrl, testPayload);
  } else {
    // Try test URL first
    result = await tryWebhook(testUrl, testPayload);
    
    // If test URL fails, try production URL
    if (!result.success) {
      console.log('\n🔄 Test URL failed, trying production URL...');
      result = await tryWebhook(prodUrl, testPayload);
    }
  }

  if (result.success) {
    console.log('\n✅ Success! Check your #mono-docs channel in Mattermost');
    console.log('📱 You should see a formatted notification with:');
    console.log('   - Title: Test Documentation Update');
    console.log('   - Description of the changes');
    console.log('   - Review button/link');
    console.log('   - Timestamp and metadata');
  } else {
    console.error('\n❌ Failed to send notification to both URLs');
    console.error('\n🔍 In N8N:');
    console.error('   1. Open your workflow at http://localhost:5678');
    console.error('   2. Click on the Webhook node');
    console.error('   3. Check the "Webhook URLs" section');
    console.error('   4. Copy the exact URL shown there');
    console.error('\n📝 The webhook URL in N8N might be different than expected.');
    console.error('   Common patterns:');
    console.error('   - /webhook-test/[workflow-id]/docs-approval');
    console.error('   - /webhook/[workflow-id]/docs-approval');
  }
}

// Run the test
testMattermostNotification().catch(console.error);