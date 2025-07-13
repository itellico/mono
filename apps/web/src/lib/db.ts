import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// ============================
// MONO PLATFORM DATABASE CONNECTION
// ============================
// 
// ✅ FOLLOWS MONO BEST PRACTICES:
// - PostgreSQL + Prisma ORM + transactions
// - Proper connection pooling
// - Environment-based configuration
// - Graceful error handling
// - Logging integration
// - Edge Runtime compatibility

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// ✅ EDGE RUNTIME COMPATIBILITY: Graceful Node.js API handling
// Use try-catch with dynamic property access to avoid Edge Runtime parsing issues
try {
  // ✅ SECURITY BEST PRACTICE: Only register process handlers in full Node.js environment
  // This approach completely isolates Node.js APIs from Edge Runtime
  let isShuttingDown = false;

  const gracefulShutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    try {
      logger.info('Gracefully disconnecting from database...');
      await db.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  };

  // ✅ EDGE RUNTIME SAFE: Dynamic property access prevents Edge Runtime parsing
  const processObj = typeof process !== 'undefined' ? process : null;
  if (processObj && typeof processObj['once'] === 'function') {
    processObj['once']('SIGINT', gracefulShutdown);
    processObj['once']('SIGTERM', gracefulShutdown);
    processObj['once']('beforeExit', gracefulShutdown);
    
    logger.debug('✅ Database graceful shutdown handlers registered (Node.js runtime)');
  }
} catch {
  // ✅ GRACEFUL DEGRADATION: Edge Runtime or restricted environment
  // This is expected in Edge Runtime and not an error
  logger.debug('Database shutdown handlers not available (Edge Runtime or restricted environment)');
} 