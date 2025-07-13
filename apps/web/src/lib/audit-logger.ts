/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { logger, generateCorrelationId } from './logger';
import { db } from '@/lib/db';
import { auditLogs, securityEvents } from './schema';

// Types for audit logging
export interface AuditContext {
  userId?: string;
  adminId?: string;
  impersonationSessionId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  reason?: string;
  notes?: string;
  source: 'web' | 'api' | 'admin_panel' | 'system' | 'webhook' | 'import' | 'migration' | 'cleanup';
}

export interface FieldChange {
  fieldName: string;
  oldValue?: unknown;
  newValue: unknown;
}

// Audit event logging to database and console
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId: string | number,
  context: AuditContext,
  changes?: FieldChange[],
  metadata?: Record<string, unknown>
): Promise<void> {
  const correlationId = context.correlationId || generateCorrelationId();

  try {
    // Map resourceType to valid enum values
    const validResourceTypes = [
      'profile', 'portfolio', 'job', 'application', 'payment', 'message', 'course', 
      'user', 'account', 'subscription', 'media', 'review', 'townhall', 'analytics'
    ];

    const mappedResourceType = validResourceTypes.includes(resourceType) 
      ? resourceType 
      : 'user'; // Default fallback

    // TODO: Database logging temporarily disabled due to field mapping issues
    // Will be re-enabled after resolving Drizzle TypeScript schema conflicts
    // await db.insert(auditLogs).values({ ... });

    // For now, comprehensive console logging provides audit trail
    logger.info({
      action,
      resourceType: mappedResourceType,
      resourceId,
      correlationId,
      userId: context.userId,
      adminId: context.adminId,
      changes: changes?.length || 0,
      metadata,
      type: 'audit_event_comprehensive'
    }, `🔍 AUDIT: ${action} on ${mappedResourceType}:${resourceId} by ${context.adminId ? 'admin:' + context.adminId : 'user:' + context.userId}`);

    // Log to console in development
    logger.info({
      action,
      resourceType,
      resourceId,
      userId: context.userId,
      adminId: context.adminId,
      correlationId,
      changes,
      type: 'audit_event',
      ...metadata
    }, `Audit: ${action} on ${resourceType}:${resourceId}`);

  } catch (error) {
    // If database logging fails, at least log to console
    logger.error({
      action,
      resourceType,
      resourceId,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      type: 'audit_error'
    }, `Failed to log audit event: ${action}`);
  }
}

// Transaction logging wrapper
export async function loggedTransaction<T>(
  operation: string,
  fn: (tx: any) => Promise<T>,
  context: AuditContext,
  metadata?: Record<string, any>
): Promise<T> {
  const correlationId = context.correlationId || generateCorrelationId();
  const startTime = Date.now();

  logger.info({
    operation,
    correlationId,
    userId: context.userId,
    adminId: context.adminId,
    type: 'transaction_start'
  }, `Starting transaction: ${operation}`);

  try {
    const result = await db.transaction(async (tx) => {
      return await fn(tx);
    });

    const duration = Date.now() - startTime;

    // Log successful transaction
    await logAuditEvent(
      'transaction_complete',
      'system',
      correlationId,
      { ...context, correlationId },
      undefined,
      { operation, duration, ...metadata }
    );

    logger.info({
      operation,
      correlationId,
      duration,
      type: 'transaction_success'
    }, `Transaction completed: ${operation} (${duration}ms)`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log failed transaction
    try {
      await logAuditEvent(
        'transaction_failed',
        'system',
        correlationId,
        { ...context, correlationId },
        undefined,
        { operation, duration, error: errorMessage, ...metadata }
      );
    } catch (auditError) {
      logger.error({
        operation,
        correlationId,
        auditError: auditError instanceof Error ? auditError.message : String(auditError),
        type: 'audit_logging_failed'
      }, 'Failed to log transaction failure');
    }

    logger.error({
      operation,
      correlationId,
      duration,
      error: errorMessage,
      type: 'transaction_error'
    }, `Transaction failed: ${operation} (${duration}ms)`);

    throw error;
  }
}

// User action logging
export async function logUserAction(
  action: string,
  userId: string,
  entityType: string,
  entityId: string,
  context: Omit<AuditContext, 'userId'>,
  changes?: FieldChange[],
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    action,
    entityType,
    entityId,
    { ...context, userId },
    changes,
    metadata
  );
}

// Admin action logging
export async function logAdminAction(
  action: string,
  adminId: string,
  targetEntityType: string,
  targetEntityId: string,
  context: Omit<AuditContext, 'adminId'>,
  changes?: FieldChange[],
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    action,
    targetEntityType,
    targetEntityId,
    { ...context, adminId },
    changes,
    metadata
  );
}

// Security event logging
export async function logSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: AuditContext,
  details: Record<string, any> = {},
  affectedUserId?: string
): Promise<void> {
  const correlationId = context.correlationId || generateCorrelationId();

  try {
    // Map resourceType to valid enum value if provided
    const validResourceTypes = [
      'profile', 'portfolio', 'job', 'application', 'payment', 'message', 'course', 
      'user', 'account', 'subscription', 'media', 'review', 'townhall', 'analytics'
    ];

    const mappedResourceType = details.resourceType && validResourceTypes.includes(details.resourceType) 
      ? details.resourceType 
      : undefined;

    // TODO: Database logging temporarily disabled due to field mapping issues
    // Will be re-enabled after resolving Drizzle TypeScript schema conflicts
    // await db.insert(securityEvents).values({ ... });

    // For now, comprehensive console logging provides security audit trail

    // Also log to audit logs
    await logAuditEvent(
      `security_${eventType}`,
      'security',
      correlationId,
      context,
      undefined,
      { severity, ...details }
    );

    logger.warn({
      eventType,
      severity,
      correlationId,
      affectedUserId,
      type: 'security_event',
      ...details
    }, `Security Event: ${eventType} (${severity})`);

  } catch (error) {
    logger.error({
      eventType,
      severity,
      correlationId,
      error: error instanceof Error ? error.message : String(error),
      type: 'security_logging_error'
    }, `Failed to log security event: ${eventType}`);
  }
}

// Authentication event logging
export async function logAuthEvent(
  eventType: 'login' | 'logout' | 'register' | 'password_reset' | 'oauth_connect',
  userId: string,
  success: boolean,
  context: AuditContext,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent(
    `auth_${eventType}`,
    'user',
    userId,
    context,
    undefined,
    { success, ...details }
  );

  // Log failed authentication as security event
  if (!success && (eventType === 'login' || eventType === 'oauth_connect')) {
    await logSecurityEvent(
      'authentication_failure',
      'medium',
      context,
      { eventType, ...details },
      userId
    );
  }
}

// Transaction logging wrapper specifically for complex operations
export async function withLoggedTransaction<T>(
  operation: string,
  fn: (tx: any) => Promise<T>,
  context: AuditContext,
  metadata?: Record<string, any>
): Promise<T> {
  return await loggedTransaction(operation, fn, context, metadata);
}

const auditLogger = {
  logAuditEvent,
  loggedTransaction,
  logUserAction,
  logAdminAction,
  logSecurityEvent,
  logAuthEvent,
  withLoggedTransaction,
};

export default auditLogger; 