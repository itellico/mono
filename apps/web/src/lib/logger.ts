import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Simple development logger that avoids problematic transports
const createDevLogger = () => {
  return pino({
    name: 'itellico',
    level: 'info',
    base: {
      env: process.env.NODE_ENV,
    },
    // Override write method to format console output
    customLevels: {},
    formatters: {
      level: (label) => {
        return { level: label };
      },
      log: (object) => {
        return object;
      }
    }
  });
};

// Level labels available for future use
// const getLevelLabel = (level: number): string => {
//   switch (level) {
//     case 10: return '🔍 TRACE';
//     case 20: return '🐛 DEBUG';
//     case 30: return 'ℹ️  INFO';
//     case 40: return '⚠️  WARN';
//     case 50: return '🚨 ERROR';
//     case 60: return '💀 FATAL';
//     default: return `📝 LEVEL_${level}`;
//   }
// };

// Create the logger with environment-specific configuration
export const logger = isDev 
  ? createDevLogger()
  : pino({
      name: 'itellico',
      level: 'info',
      // Production: Structured JSON with serializers
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
      },
      base: {
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      },
    });

// Test environment: silent
if (isTest) {
  logger.level = 'silent';
}

// Generate correlation ID for request tracking
export const generateCorrelationId = (): string => {
  return uuidv4();
};

// Create child logger with correlation ID
export const createCorrelatedLogger = (correlationId: string, additionalContext?: Record<string, unknown>) => {
  return logger.child({
    correlationId,
    ...additionalContext,
  });
};

// Utility function for measuring operation duration
export const withTiming = async <T>(
  operation: string,
  fn: () => Promise<T>,
  log: pino.Logger = logger
): Promise<T> => {
  const startTime = Date.now();

  log.debug({ operation }, `Starting operation: ${operation}`);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    log.info({ operation, duration }, `Operation completed: ${operation} (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error({ 
      operation, 
      duration, 
      error: error instanceof Error ? error.message : String(error)
    }, `Operation failed: ${operation} (${duration}ms)`);

    throw error;
  }
};

// Database query logging helper
export const logDatabaseQuery = (query: string, params?: unknown[], duration?: number) => {
  if (isDev) {
    logger.debug({
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration,
      type: 'database_query'
    }, 'Database Query');
  }
};

// Security event logging
export const logSecurityEvent = (
  eventType: string,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  logger.warn({
    eventType,
    severity,
    ...details,
    type: 'security_event'
  }, `Security Event: ${eventType}`);
};

// API request/response logging
export const logApiRequest = (method: string, url: string, correlationId: string, additionalData?: Record<string, unknown>) => {
  logger.info({
    method,
    url,
    correlationId,
    type: 'api_request',
    ...additionalData
  }, `API Request: ${method} ${url}`);
};

export const logApiResponse = (
  method: string, 
  url: string, 
  statusCode: number, 
  correlationId: string, 
  duration: number,
  additionalData?: Record<string, unknown>
) => {
  const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';

  logger[logLevel]({
    method,
    url,
    statusCode,
    correlationId,
    duration,
    type: 'api_response',
    ...additionalData
  }, `API Response: ${method} ${url} - ${statusCode} (${duration}ms)`);
};

// Authentication logging
export const logAuthEvent = (
  eventType: 'login' | 'logout' | 'register' | 'password_reset' | 'oauth_connect',
  userId?: string,
  success: boolean = true,
  details?: Record<string, unknown>
) => {
  const logLevel = success ? 'info' : 'warn';

  logger[logLevel]({
    eventType,
    userId,
    success,
    type: 'auth_event',
    ...details
  }, `Auth Event: ${eventType} ${success ? 'successful' : 'failed'}`);
};

// Admin action logging
export const logAdminAction = (
  action: string,
  adminId: string,
  targetEntityType?: string,
  targetEntityId?: string,
  details?: Record<string, unknown>
) => {
  logger.info({
    action,
    adminId,
    targetEntityType,
    targetEntityId,
    type: 'admin_action',
    ...details
  }, `Admin Action: ${action}`);
};

// Business logic logging
export const logBusinessEvent = (
  eventType: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) => {
  logger.info({
    eventType,
    entityType,
    entityId,
    type: 'business_event',
    ...details
  }, `Business Event: ${eventType} for ${entityType}:${entityId}`);
};

// File operation logging
export const logFileOperation = (
  operation: 'upload' | 'download' | 'delete',
  fileName: string,
  fileSize?: number,
  userId?: string,
  success: boolean = true,
  details?: Record<string, unknown>
) => {
  const logLevel = success ? 'info' : 'error';

  logger[logLevel]({
    operation,
    fileName,
    fileSize,
    userId,
    success,
    type: 'file_operation',
    ...details
  }, `File ${operation}: ${fileName} ${success ? 'successful' : 'failed'}`);
};

// Performance metric logging
export const logPerformanceMetric = (
  metricName: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' | '%',
  context?: Record<string, unknown>
) => {
  logger.info({
    metricName,
    value,
    unit,
    type: 'performance_metric',
    ...context
  }, `Performance: ${metricName} = ${value}${unit}`);
};

// Error logging
export const logError = (
  error: Error | string,
  context?: Record<string, unknown>,
  correlationId?: string
) => {
  const errorObj = error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : { message: error };

  logger.error({
    error: errorObj,
    correlationId,
    type: 'error',
    ...context
  }, `Error: ${errorObj.message}`);
};

export default logger; 