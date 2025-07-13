#!/usr/bin/env tsx

/**
 * Fix the N8N workflow to properly send Mattermost notifications
 */

async function fixN8NWorkflow() {
  const workflowId = 'Nvey548UYePZczvc';
  const n8nUrl = 'http://localhost:5678';
  
  console.log('🔧 Fixing N8N workflow for Mattermost notifications...');
  
  // First, get the current workflow
  try {
    const getResponse = await fetch(`${n8nUrl}/rest/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get workflow: ${getResponse.status} ${getResponse.statusText}`);
    }

    const workflow = await getResponse.json();
    console.log('✅ Retrieved workflow:', workflow.data.name);

    // Create fixed workflow with proper HTTP Request node
    const fixedWorkflow = {
      name: workflow.data.name,
      nodes: [
        {
          "parameters": {
            "httpMethod": "POST",
            "path": "docs-approval",
            "responseMode": "lastNode",
            "options": {}
          },
          "id": "webhook-node",
          "name": "Webhook",
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 1,
          "position": [250, 300],
          "webhookId": "docs-approval"
        },
        {
          "parameters": {
            "method": "POST",
            "url": "={{$env[\"MATTERMOST_WEBHOOK_URL\"]}}",
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "{\n  \"text\": \"📚 **New Documentation Update Proposed**\",\n  \"channel\": \"{{$env['MATTERMOST_DOCS_CHANNEL']}}\",\n  \"username\": \"Documentation Bot\",\n  \"icon_emoji\": \":book:\",\n  \"attachments\": [\n    {\n      \"fallback\": \"New documentation update: {{$json['title']}}\",\n      \"color\": \"#0066cc\",\n      \"pretext\": \":bell: Documentation update requires review\",\n      \"title\": \"{{$json['title']}}\",\n      \"title_link\": \"{{$json['reviewUrl']}}\",\n      \"text\": \"{{$json['description']}}\",\n      \"fields\": [\n        {\n          \"title\": \"Proposed By\",\n          \"value\": \"{{$json['proposedBy'] === 'claude' ? '🤖 Claude AI' : $json['proposedBy']}}\",\n          \"short\": true\n        },\n        {\n          \"title\": \"Files Affected\",\n          \"value\": \"{{$json['filesCount']}} file(s)\",\n          \"short\": true\n        },\n        {\n          \"title\": \"Update ID\",\n          \"value\": \"{{$json['updateId']}}\",\n          \"short\": true\n        },\n        {\n          \"title\": \"Status\",\n          \"value\": \"⏳ Pending Review\",\n          \"short\": true\n        }\n      ],\n      \"actions\": [\n        {\n          \"type\": \"button\",\n          \"text\": \"Review Update\",\n          \"url\": \"{{$json['reviewUrl']}}\",\n          \"style\": \"primary\"\n        }\n      ],\n      \"footer\": \"itellico Mono Documentation System\",\n      \"ts\": {{Date.now() / 1000 | 0}}\n    }\n  ]\n}",
            "options": {
              "timeout": 10000
            }
          },
          "id": "http-request",
          "name": "Send to Mattermost",
          "type": "n8n-nodes-base.httpRequest",
          "typeVersion": 3,
          "position": [450, 300]
        }
      ],
      connections: {
        "Webhook": {
          "main": [
            [
              {
                "node": "Send to Mattermost",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      active: workflow.data.active,
      settings: workflow.data.settings || {},
      staticData: workflow.data.staticData || null
    };

    // Update the workflow
    const updateResponse = await fetch(`${n8nUrl}/rest/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(fixedWorkflow)
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update workflow: ${updateResponse.status} - ${error}`);
    }

    console.log('✅ Workflow updated successfully!');
    console.log('\n📝 Changes made:');
    console.log('- Fixed HTTP Request node configuration');
    console.log('- Proper JSON body formatting for Mattermost');
    console.log('- Added emoji and formatting');
    console.log('\n🧪 Test the workflow again with:');
    console.log('pnpm tsx scripts/test-mattermost-notification.ts');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Alternative: Manually fix in N8N:');
    console.log('1. Open workflow at http://n8n.mono:5678/workflow/Nvey548UYePZczvc');
    console.log('2. Delete the current "Send to Mattermost" node');
    console.log('3. Add a new "HTTP Request" node');
    console.log('4. Configure it with:');
    console.log('   - Method: POST');
    console.log('   - URL: {{$env["MATTERMOST_WEBHOOK_URL"]}}');
    console.log('   - Body Content Type: JSON');
    console.log('5. Copy the JSON body from the script above');
  }
}

fixN8NWorkflow();