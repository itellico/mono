import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';

@Injectable()
export class LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Log informational message
   */
  info(message: string, context?: object | string, extra?: object): void {
    if (typeof context === 'string') {
      this.logger.info({ context, ...extra }, message);
    } else {
      this.logger.info({ ...context, ...extra }, message);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: object | string, extra?: object): void {
    if (typeof context === 'string') {
      this.logger.debug({ context, ...extra }, message);
    } else {
      this.logger.debug({ ...context, ...extra }, message);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: object | string, extra?: object): void {
    if (typeof context === 'string') {
      this.logger.warn({ context, ...extra }, message);
    } else {
      this.logger.warn({ ...context, ...extra }, message);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | object | string, context?: object | string): void {
    let logObject: any = {};
    
    if (error instanceof Error) {
      logObject.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === 'object') {
      logObject = { ...error };
    } else if (typeof error === 'string') {
      logObject.error = error;
    }
    
    if (typeof context === 'string') {
      logObject.context = context;
    } else if (context) {
      logObject = { ...logObject, ...context };
    }
    
    this.logger.error(logObject, message);
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error | object | string, context?: object | string): void {
    let logObject: any = {};
    
    if (error instanceof Error) {
      logObject.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (typeof error === 'object') {
      logObject = { ...error };
    } else if (typeof error === 'string') {
      logObject.error = error;
    }
    
    if (typeof context === 'string') {
      logObject.context = context;
    } else if (context) {
      logObject = { ...logObject, ...context };
    }
    
    this.logger.fatal(logObject, message);
  }

  /**
   * Log trace message (lowest level)
   */
  trace(message: string, context?: object | string, extra?: object): void {
    if (typeof context === 'string') {
      this.logger.trace({ context, ...extra }, message);
    } else {
      this.logger.trace({ ...context, ...extra }, message);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: object): LoggerService {
    // For now, return the same logger instance since PinoLogger API is different
    return this;
  }

  /**
   * Log authentication events
   */
  logAuth(event: string, user_id: string, details?: object): void {
    this.info(`🔐 Auth: ${event}`, {
      user_id,
      event: 'authentication',
      authEvent: event,
      ...details,
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation: string, table: string, details?: object): void {
    this.debug(`🗄️ DB: ${operation} on ${table}`, {
      event: 'database',
      operation,
      table,
      ...details,
    });
  }

  /**
   * Log API performance
   */
  logPerformance(endpoint: string, duration: number, details?: object): void {
    const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
    const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚡' : '🚀';
    
    this[level](`${emoji} Performance: ${endpoint} (${duration}ms)`, {
      event: 'performance',
      endpoint,
      duration,
      ...details,
    });
  }

  /**
   * Log security events
   */
  logSecurity(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: object): void {
    const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '🔍' : '🛡️';
    const logLevel = severity === 'critical' || severity === 'high' ? 'warn' : 'info';
    
    this[logLevel](`${emoji} Security: ${event}`, {
      event: 'security',
      securityEvent: event,
      severity,
      ...details,
    });
  }

  /**
   * Log business events
   */
  logBusiness(event: string, details?: object): void {
    this.info(`💼 Business: ${event}`, {
      event: 'business',
      businessEvent: event,
      ...details,
    });
  }

  /**
   * Log system events
   */
  logSystem(event: string, details?: object): void {
    this.info(`⚙️ System: ${event}`, {
      event: 'system',
      systemEvent: event,
      ...details,
    });
  }
}