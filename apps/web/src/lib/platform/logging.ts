// 🎯 mono PLATFORM: Centralized Logging System
// Replaces all console.log usage with proper logging infrastructure

import { logger } from '@/lib/logger';

/**
 * Browser-safe logging utility for client-side components
 * Usage: const log = useComponentLogger('ComponentName');
 */
export function useComponentLogger(componentName: string) {
  return {
    info: (message: string, data?: any) => {
      if (typeof window !== 'undefined') {
        logger.info(`[${componentName}] ${message}`, data);
      }
    },

    error: (message: string, error?: any) => {
      if (typeof window !== 'undefined') {
        logger.error(`[${componentName}] ${message}`, { error });
      }
    },

    warn: (message: string, data?: any) => {
      if (typeof window !== 'undefined') {
        logger.warn(`[${componentName}] ${message}`, data);
      }
    },

    debug: (message: string, data?: any) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        logger.debug(`[${componentName}] ${message}`, data);
      }
    }
  };
}

/**
 * API route logging utility for server-side operations
 * Usage: const log = createApiLogger('endpoint-name');
 */
export function createApiLogger(endpointName: string) {
  return {
    info: (message: string, data?: any) => {
      logger.info(`[API:${endpointName}] ${message}`, data);
    },

    error: (message: string, error?: any) => {
      logger.error(`[API:${endpointName}] ${message}`, { error });
    },

    warn: (message: string, data?: any) => {
      logger.warn(`[API:${endpointName}] ${message}`, data);
    },

    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[API:${endpointName}] ${message}`, data);
      }
    }
  };
}

/**
 * Tenant-aware logging utility with context
 * Usage: const log = createTenantLogger('operation', tenantId);
 */
export function createTenantLogger(operation: string, tenantId?: number) {
  const context = tenantId ? `[Tenant:${tenantId}]` : '[NoTenant]';

  return {
    info: (message: string, data?: any) => {
      logger.info(`${context}[${operation}] ${message}`, data);
    },

    error: (message: string, error?: any) => {
      logger.error(`${context}[${operation}] ${message}`, { error });
    },

    warn: (message: string, data?: any) => {
      logger.warn(`${context}[${operation}] ${message}`, data);
    },

    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`${context}[${operation}] ${message}`, data);
      }
    }
  };
} 