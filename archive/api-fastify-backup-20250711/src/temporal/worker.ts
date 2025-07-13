import { Worker, NativeConnection } from '@temporalio/worker';
import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { initializeServices } from './activities';
import { config } from '../config/index';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TemporalWorkerConfig {
  connection: NativeConnection;
  taskQueue: string;
  workflowsPath: string;
  activitiesPath: string;
  namespace?: string;
}

interface WorkerServices {
  prisma: PrismaClient;
  redis: FastifyRedis;
  emailService: EmailService;
  notificationService: NotificationService;
}

export class TemporalWorker {
  private worker?: Worker;
  private connection?: NativeConnection;
  private config: TemporalWorkerConfig;

  constructor(config: TemporalWorkerConfig) {
    this.config = config;
    this.connection = config.connection;
  }

  /**
   * Initialize and start the Temporal worker
   */
  async start(services: WorkerServices): Promise<void> {
    try {
      // Initialize activity services
      initializeServices(services);

      // Create worker with workflows and activities
      this.worker = await Worker.create({
        connection: this.connection,
        namespace: this.config.namespace || 'default',
        taskQueue: this.config.taskQueue,
        
        // Workflow bundle configuration
        workflowsPath: this.config.workflowsPath,
        
        // Activities configuration
        activities: await import(this.config.activitiesPath),
        
        // Worker options
        maxConcurrentActivityTaskExecutions: 10,
        maxConcurrentWorkflowTaskExecutions: 5,
        
        // Logging
        sink: {
          logger: {
            log: (level, message, meta) => {
              const logMethod = services.prisma ? console.log : console.log;
              logMethod(`[Temporal Worker] ${level}: ${message}`, meta);
            },
          },
        },
      });

      console.log('Starting Temporal worker...');
      await this.worker.run();

    } catch (error: any) {
      console.error('Failed to start Temporal worker:', error);
      throw error;
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (this.worker) {
      console.log('Stopping Temporal worker...');
      this.worker.shutdown();
    }
  }

  /**
   * Get worker health status
   */
  getStatus(): { running: boolean; taskQueue: string } {
    return {
      running: !!this.worker,
      taskQueue: this.config.taskQueue,
    };
  }
}

/**
 * Create and configure Temporal worker
 */
export async function createTemporalWorker(services: WorkerServices): Promise<TemporalWorker> {
  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  // Configure worker
  const workerConfig: TemporalWorkerConfig = {
    connection,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'marketplace-workflows',
    workflowsPath: path.join(__dirname, 'workflows.js'),
    activitiesPath: path.join(__dirname, 'activities.js'),
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  };

  return new TemporalWorker(workerConfig);
}

/**
 * Start worker as a standalone process (for development)
 */
export async function startWorkerProcess(): Promise<void> {
  console.log('Starting Temporal worker process...');
  
  try {
    // Initialize services
    const prisma = new PrismaClient();
    
    // Note: In production, you'd need to properly initialize Redis and services
    // For now, we'll create minimal stubs
    const redis = {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      del: async () => 1,
    } as any;

    // Initialize email service (requires config)
    const mailgunConfig = {
      apiKey: config.MAILGUN_API_KEY || '',
      domain: config.MAILGUN_DOMAIN || '',
      host: config.MAILGUN_HOST,
    };

    const emailService = new EmailService(prisma, redis, mailgunConfig);
    const notificationService = new NotificationService(prisma, redis, emailService);

    const services: WorkerServices = {
      prisma,
      redis,
      emailService,
      notificationService,
    };

    // Create and start worker
    const worker = await createTemporalWorker(services);
    await worker.start(services);

  } catch (error: any) {
    console.error('Worker process failed:', error);
    process.exit(1);
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorkerProcess().catch(console.error);
}