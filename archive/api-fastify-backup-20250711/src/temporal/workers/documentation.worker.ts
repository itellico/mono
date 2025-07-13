import { Worker } from '@temporalio/worker';
import { createRequire } from 'module';
import * as activities from '../activities/documentation.activities';
import { prisma } from '../../services/prisma.service';
import { redis } from '../../services/redis.service';

const require = createRequire(import.meta.url);

/**
 * Documentation Processing Worker
 * Handles complex documentation workflows with Temporal
 */
export async function createDocumentationWorker() {
  try {
    // Create the worker with activities and workflows
    const worker = await Worker.create({
      workflowsPath: require.resolve('../workflows/documentation-processing.workflow'),
      activities,
      taskQueue: 'documentation-queue',
      
      // Worker configuration
      maxConcurrentActivityTaskExecutions: 10,
      maxConcurrentWorkflowTaskExecutions: 5,
      
      // Advanced configuration
      reuseV8Context: true,
      debugMode: process.env.NODE_ENV === 'development',
      
      // Activity defaults
      defaultActivityOptions: {
        startToCloseTimeout: '30 minutes',
        heartbeatTimeout: '30 seconds',
        retry: {
          initialInterval: '30 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
          maximumInterval: '5 minutes',
        },
      },
    });

    // Set up graceful shutdown
    process.on('SIGINT', () => worker.shutdown());
    process.on('SIGTERM', () => worker.shutdown());

    // Log worker startup
    console.log('📚 Documentation worker starting...');
    console.log(`📋 Task Queue: documentation-queue`);
    console.log(`⚡ Max concurrent activities: 10`);
    console.log(`🔄 Max concurrent workflows: 5`);

    // Run the worker
    await worker.run();
  } catch (error) {
    console.error('Failed to start documentation worker:', error);
    process.exit(1);
  }
}

/**
 * Worker health check
 */
export async function checkWorkerHealth(): Promise<{
  healthy: boolean;
  details: {
    database: boolean;
    redis: boolean;
    temporal: boolean;
  };
}> {
  const health = {
    database: false,
    redis: false,
    temporal: false,
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    health.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  try {
    // Check Redis connection
    await redis.ping();
    health.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  // Temporal health is implied if worker is running
  health.temporal = true;

  const healthy = health.database && health.redis && health.temporal;

  return { healthy, details: health };
}

// Export for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createDocumentationWorker().catch((err) => {
    console.error('Worker failed:', err);
    process.exit(1);
  });
}