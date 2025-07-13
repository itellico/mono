#!/usr/bin/env node
import { Worker } from '@temporalio/worker';
import { createDocumentationWorker } from './workers/documentation.worker';
import { NativeConnection } from '@temporalio/worker';
import { Config } from '../config';

/**
 * Start all Temporal workers
 */
async function startWorkers() {
  console.log('🚀 Starting Temporal workers...');
  
  try {
    // Create connection to Temporal server
    const connection = await NativeConnection.connect({
      address: Config.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    console.log('✅ Connected to Temporal server');

    // Start documentation worker
    const documentationWorker = createDocumentationWorker();

    // Add more workers here as needed
    // const otherWorker = createOtherWorker();

    // Wait for all workers
    await Promise.all([
      documentationWorker,
      // otherWorker,
    ]);

  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down workers...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down workers...');
  process.exit(0);
});

// Start workers
startWorkers().catch((err) => {
  console.error('Failed to start workers:', err);
  process.exit(1);
});