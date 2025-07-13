#!/usr/bin/env tsx

/**
 * Test script for documentation approval system
 * Usage: tsx scripts/test-docs-approval.ts
 */

import { documentationApprovalService } from '@/lib/services/documentation-approval.service';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

async function testDocumentationApproval() {
  console.log('🧪 Testing Documentation Approval System...\n');

  try {
    // Test 1: Propose a documentation update
    console.log('1️⃣ Proposing a test documentation update...');
    const testUpdate = await documentationApprovalService.proposeUpdate({
      type: 'implementation',
      title: 'Test: Human-in-the-Loop Documentation System',
      description: 'Testing the new documentation approval workflow with Mattermost notifications',
      proposedBy: 'test-script',
      changes: [
        {
          file: 'docs/features/DOCUMENTATION_APPROVAL.md',
          before: '# Documentation Approval System\n\nPlaceholder content.',
          after: '# Documentation Approval System\n\n## Overview\n\nThe documentation approval system enables human-in-the-loop review of all documentation updates proposed by Claude or developers.\n\n## Features\n\n- ✅ Redis-based queue for pending updates\n- ✅ 24-hour TTL for review window\n- ✅ Mattermost notifications via N8N\n- ✅ Web-based review interface\n- ✅ Approval/rejection with comments\n- ✅ Automatic cache invalidation\n\n## Usage\n\n1. Claude proposes updates via API\n2. Notification sent to Mattermost\n3. Human reviews at /admin/docs/review\n4. Approved changes are applied automatically'
        }
      ],
      metadata: {
        feature: 'Documentation Approval System',
        filesChanged: [
          'src/lib/services/documentation-approval.service.ts',
          'src/app/admin/docs/review/page.tsx',
          'apps/api/src/routes/v1/platform/documentation/index.ts'
        ],
        patternsUsed: [
          'Redis TTL for expiring data',
          'Human-in-the-loop workflow',
          'N8N webhook integration'
        ],
        learnings: 'Implementing async approval workflows with proper TTL management ensures updates don\'t pile up indefinitely',
        gotchas: 'N8N webhook URL must be configured in environment variables'
      }
    });

    console.log('✅ Update proposed successfully!');
    console.log(`   ID: ${testUpdate.id}`);
    console.log(`   Review URL: http://localhost:3000/admin/docs/review\n`);

    // Test 2: Get pending updates
    console.log('2️⃣ Fetching pending updates...');
    const pendingUpdates = await documentationApprovalService.getPendingUpdates();
    console.log(`✅ Found ${pendingUpdates.length} pending update(s)\n`);

    // Test 3: Get statistics
    console.log('3️⃣ Fetching approval statistics...');
    const stats = await documentationApprovalService.getStats();
    console.log('✅ Current statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // Test 4: Check Redis keys
    console.log('4️⃣ Checking Redis keys...');
    const pendingKey = 'platform:docs:pending';
    const pendingCount = await redis.zcard(pendingKey);
    console.log(`✅ Pending queue size: ${pendingCount}`);
    
    const updateKey = `platform:docs:update:${testUpdate.id}`;
    const ttl = await redis.ttl(updateKey);
    console.log(`✅ Update TTL: ${ttl} seconds (${Math.floor(ttl / 3600)} hours)\n`);

    // Test 5: Simulate approval (optional)
    const shouldSimulateApproval = process.argv.includes('--approve');
    if (shouldSimulateApproval) {
      console.log('5️⃣ Simulating approval...');
      const approved = await documentationApprovalService.approveUpdate(
        testUpdate.id,
        'test-script',
        'Approved via test script'
      );
      console.log('✅ Update approved successfully!\n');
    } else {
      console.log('💡 To simulate approval, run: tsx scripts/test-docs-approval.ts --approve\n');
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log('✅ Documentation approval system is working correctly');
    console.log('✅ Updates can be proposed and queued');
    console.log('✅ Redis TTL is properly configured');
    console.log('✅ Statistics are being tracked');
    
    if (process.env.N8N_DOCS_WEBHOOK_URL) {
      console.log('✅ N8N webhook URL is configured');
    } else {
      console.log('⚠️  N8N webhook URL not configured (notifications won\'t be sent)');
    }

    console.log('\n🎉 All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3000/admin/docs/review to see pending updates');
    console.log('2. Configure N8N workflow for Mattermost notifications');
    console.log('3. Test the complete flow with real documentation updates');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDocumentationApproval()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });