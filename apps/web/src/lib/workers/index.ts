import { Pool } from 'pg';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Worker Configuration
export interface WorkerConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
  };
  queues: {
    default: {
      name: string;
      concurrency: number;
    };
    email: {
      name: string;
      concurrency: number;
    };
    media: {
      name: string;
      concurrency: number;
    };
    notifications: {
      name: string;
      concurrency: number;
    };
  };
  workers: {
    maxRetries: number;
    retryDelayMs: number;
    jobTimeout: number;
  };
}

// Default Configuration
export const defaultWorkerConfig: WorkerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mono',
    user: process.env.DB_USER || 'developer',
    password: process.env.DB_PASSWORD || 'developer',
    ssl: false,
  },
  queues: {
    default: {
      name: 'default',
      concurrency: 5,
    },
    email: {
      name: 'email',
      concurrency: 3,
    },
    media: {
      name: 'media',
      concurrency: 2,
    },
    notifications: {
      name: 'notifications',
      concurrency: 5,
    },
  },
  workers: {
    maxRetries: 3,
    retryDelayMs: 5000,
    jobTimeout: 30000,
  },
};

// Connection pools
let dbPool: Pool | null = null;

// Use the centralized Redis client from our Redis module
export async function getWorkerRedisClient() {
  try {
    const client = await getRedisClient();
    if (!client) {
      logger.warn('Redis client not available for workers');
      return null;
    }
    return client;
  } catch (error) {
    logger.error('Failed to get Redis client for workers', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

export function getDbPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      host: defaultWorkerConfig.database.host,
      port: defaultWorkerConfig.database.port,
      database: defaultWorkerConfig.database.database,
      user: defaultWorkerConfig.database.user,
      password: defaultWorkerConfig.database.password,
      ssl: defaultWorkerConfig.database.ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    dbPool.on('error', (error) => {
      logger.error('Database pool error', { error });
    });
  }

  return dbPool;
}

// Cleanup connections
export async function closeConnections(): Promise<void> {
  // Redis cleanup is handled by the centralized Redis module
  // We don't manage Redis connections directly here anymore
  
  if (dbPool) {
    await dbPool.end();
    dbPool = null;
  }
} 