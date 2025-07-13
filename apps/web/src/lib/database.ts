/**
 * Database utilities and connection management
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export { db };

/**
 * Execute database operation with error handling
 */
export async function executeQuery<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    const result = await operation();
    logger.info(`Database operation successful: ${operationName}`);
    return result;
  } catch (error) {
    logger.error(`Database operation failed: ${operationName}`, { error });
    throw error;
  }
}

/**
 * Check database connection
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check connection
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database connection check failed', { error });
    return false;
  }
}

/**
 * Execute operations within a database transaction
 */
export async function transaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return db.transaction(callback);
}

export default {
  db,
  executeQuery,
  checkDatabaseConnection,
  transaction,
}; 