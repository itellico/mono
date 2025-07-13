import { Worker, NativeConnection } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import path from 'path';
import { logger } from '@/lib/logger';

export interface WorkerConfig {
  namespace: string;
  taskQueue: string;
  workflowsPath?: string;
  activitiesPath?: string;
}

export class TemporalWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private connection?: NativeConnection;

  async initialize() {
    try {
      // Create native connection
      this.connection = await NativeConnection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      });

      logger.info('✅ Temporal connection established');
      return true;
    } catch (error) {
      logger.error({ err: error }, '❌ Failed to connect to Temporal');
      return false;
    }
  }

  async createWorker(config: WorkerConfig): Promise<Worker | null> {
    const { namespace, taskQueue } = config;
    try {
      if (!this.connection) {
        throw new Error('Connection not initialized. Call initialize() first.');
      }

      const worker = await Worker.create({
        connection: this.connection,
        namespace: config.namespace,
        taskQueue: config.taskQueue,
        workflowsPath: config.workflowsPath || path.resolve(__dirname, './workflows'),
        activities: {}, // Activities will be loaded from the activities path
        // Add error handling
        interceptors: {
          workflowModules: [],
          activity: []
        }
      });

      this.workers.set(`${namespace}-${taskQueue}`, worker);
      logger.info({ namespace, taskQueue }, `✅ Worker created for ${namespace}/${taskQueue}`);

      return worker;
    } catch (error) {
      logger.error({ err: error, namespace, taskQueue }, `❌ Failed to create worker for ${namespace}`);
      return null;
    }
  }

  async startWorker(namespace: string, taskQueue: string): Promise<boolean> {
    const key = `${namespace}-${taskQueue}`;
    const worker = this.workers.get(key);

    if (!worker) {
      logger.error({ key }, `❌ Worker not found`);
      return false;
    }

    try {
      // Start worker in background
      worker.run().catch(error => {
        logger.error({ err: error, key }, `❌ Worker ${key} failed`);
      });

      logger.info({ key }, `✅ Worker ${key} started`);
      return true;
    } catch (error) {
      logger.error({ err: error, key }, `❌ Failed to start worker ${key}`);
      return false;
    }
  }

  async shutdown() {
    logger.info('🔄 Shutting down workers...');

    for (const [key, worker] of this.workers) {
      try {
        worker.shutdown();
        logger.info({ key }, `✅ Worker ${key} shutdown`);
      } catch (error) {
        logger.error({ err: error, key }, `❌ Error shutting down worker ${key}`);
      }
    }

    this.workers.clear();

    if (this.connection) {
      await this.connection.close();
      logger.info('✅ Temporal connection closed');
    }
  }

  // Test method to verify worker functionality
  async testWorkerCreation(): Promise<boolean> {
    try {
      await this.initialize();

      // Test creating a simple worker
      const worker = await this.createWorker({
        namespace: 'mono-tenant-go-models',
        taskQueue: 'test-task-queue'
      });

      if (worker) {
        logger.info('✅ Worker creation test passed');
        worker.shutdown();
        return true;
      }

      return false;
    } catch (error) {
      logger.error({ err: error }, '❌ Worker creation test failed');
      return false;
    }
  }
}

// Export singleton instance
export const workerManager = new TemporalWorkerManager(); 