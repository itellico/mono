#!/usr/bin/env tsx

/**
 * Comprehensive validation script for N8N-Mattermost integration
 * Run this to check if everything is working correctly
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateIntegration() {
  console.log('🔍 Validating N8N-Mattermost Integration...\n');
  
  const results = {
    n8nRunning: false,
    webhookAccessible: false,
    mattermostWebhook: false,
    envVarsSet: false,
    fullWorkflow: false
  };

  // 1. Check if N8N is running
  try {
    const response = await fetch('http://localhost:5678/rest/version');
    results.n8nRunning = response.ok;
    console.log(results.n8nRunning ? '✅' : '❌', 'N8N is running');
  } catch (error) {
    console.log('❌ N8N is not running at http://localhost:5678');
  }

  // 2. Check if webhook is accessible
  try {
    const webhookUrl = process.env.N8N_DOCS_WEBHOOK_URL || 'http://localhost:5678/webhook/docs-approval';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    results.webhookAccessible = response.ok;
    console.log(results.webhookAccessible ? '✅' : '❌', `Webhook accessible at ${webhookUrl}`);
  } catch (error) {
    console.log('❌ Webhook not accessible');
  }

  // 3. Check Mattermost webhook
  try {
    const mattermostUrl = process.env.MATTERMOST_WEBHOOK_URL || 'https://mm.itellico.com/hooks/tcpsebpfbbdqdyrq4tiancupyc';
    const response = await fetch(mattermostUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '✅ Validation: Mattermost webhook is working',
        channel: 'mono-docs',
        username: 'Validation Bot'
      })
    });
    results.mattermostWebhook = response.ok;
    console.log(results.mattermostWebhook ? '✅' : '❌', 'Mattermost webhook is working');
  } catch (error) {
    console.log('❌ Mattermost webhook failed');
  }

  // 4. Check environment variables
  const requiredEnvVars = ['N8N_DOCS_WEBHOOK_URL', 'MATTERMOST_WEBHOOK_URL', 'MATTERMOST_DOCS_CHANNEL'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  results.envVarsSet = missingVars.length === 0;
  
  if (results.envVarsSet) {
    console.log('✅ All environment variables are set');
  } else {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Check .env.local file');
  }

  // 5. Test full workflow
  if (results.webhookAccessible) {
    try {
      const testPayload = {
        updateId: `validate-${Date.now()}`,
        title: '✅ Integration Validation Test',
        description: 'This is an automated test to validate the N8N-Mattermost integration is working correctly.',
        proposedBy: 'validation-script',
        filesCount: 0,
        reviewUrl: 'http://localhost:3000/admin/docs/review/test',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(process.env.N8N_DOCS_WEBHOOK_URL || 'http://localhost:5678/webhook/docs-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      results.fullWorkflow = response.ok;
      console.log(results.fullWorkflow ? '✅' : '❌', 'Full workflow test completed');
      
      if (results.fullWorkflow) {
        console.log('   📱 Check #mono-docs channel for validation message');
      }
    } catch (error) {
      console.log('❌ Full workflow test failed');
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  const allPassed = Object.values(results).every(v => v);
  if (allPassed) {
    console.log('✅ All checks passed! Integration is working correctly.');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    
    console.log('\n🔧 Troubleshooting:');
    if (!results.n8nRunning) {
      console.log('- Start N8N: cd ~/n8n && npm start');
    }
    if (!results.webhookAccessible) {
      console.log('- Check N8N workflow is activated');
      console.log('- Verify webhook URL in .env.local matches N8N');
    }
    if (!results.envVarsSet) {
      console.log('- Add missing variables to .env.local');
    }
  }

  return allPassed;
}

// Run validation
validateIntegration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Validation error:', error);
    process.exit(1);
  });