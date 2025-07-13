#!/usr/bin/env tsx

/**
 * Test Mattermost webhook directly without N8N
 */

async function testMattermostDirect() {
  const webhookUrl = 'https://mm.itellico.com/hooks/tcpsebpfbbdqdyrq4tiancupyc';
  
  console.log('🧪 Testing Mattermost webhook directly...');
  console.log(`📍 URL: ${webhookUrl}`);
  
  const payload = {
    text: "📚 **Direct Test from Script**",
    channel: "mono-docs",
    username: "Documentation Bot",
    icon_emoji: ":book:",
    attachments: [
      {
        fallback: "Direct test notification",
        color: "#0066cc",
        pretext: ":bell: Direct test from TypeScript script",
        title: "🧪 Direct Test Notification",
        text: "This is a direct test bypassing N8N to verify Mattermost webhook is working",
        fields: [
          {
            title: "Test Type",
            value: "Direct Script Test",
            short: true
          },
          {
            title: "Bypass",
            value: "N8N bypassed",
            short: true
          }
        ],
        footer: "itellico Mono Test System",
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'itellico-mono-test/1.0'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📨 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (responseText.includes('<!doctype html') || responseText.includes('<html')) {
      console.log('❌ Got HTML response (login page)');
      console.log('🔍 Webhook URL might be incorrect or requires authentication');
      return false;
    }
    
    if (response.ok && responseText === 'ok') {
      console.log('✅ Success! Check #mono-docs channel');
      return true;
    } else {
      console.log('❌ Unexpected response:', responseText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

testMattermostDirect();