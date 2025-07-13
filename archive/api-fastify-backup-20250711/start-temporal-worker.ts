#!/usr/bin/env tsx

/**
 * Temporal Worker Development Script
 * 
 * This script starts a Temporal worker for development purposes.
 * It connects to Temporal server and registers workflows and activities.
 */

import { startWorkerProcess } from './src/temporal/worker.js';

console.log('🚀 Starting Temporal Worker for itellico Mono...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Temporal Address:', process.env.TEMPORAL_ADDRESS || 'localhost:7233');
console.log('Task Queue:', process.env.TEMPORAL_TASK_QUEUE || 'marketplace-workflows');
console.log('Namespace:', process.env.TEMPORAL_NAMESPACE || 'default');

// Start the worker process
startWorkerProcess().catch((error) => {
  console.error('❌ Failed to start Temporal worker:', error);
  process.exit(1);
});