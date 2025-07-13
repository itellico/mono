import type { FastifyReply } from 'fastify';

/**
 * Standardized response helpers to ensure consistent API responses
 * All API endpoints MUST use these helpers
 */

/**
 * Send a successful response
 * @param reply - Fastify reply object
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 */
export function sendSuccess<T>(reply: FastifyReply, data: T, status = 200) {
  return reply.status(status).send({
    success: true,
    data
  });
}

/**
 * Send an error response
 * @param reply - Fastify reply object
 * @param status - HTTP status code
 * @param error - UPPERCASE_SNAKE_CASE error code
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 */
export function sendError(
  reply: FastifyReply,
  status: number,
  error: string,
  message: string,
  details?: any
) {
  return reply.status(status).send({
    success: false,
    error,
    message,
    ...(details && { details })
  });
}

/**
 * Send a paginated response
 * @param reply - Fastify reply object
 * @param items - Array of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  items: T[],
  page: number,
  limit: number,
  total: number
) {
  return reply.send({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  // 400 Bad Request
  badRequest: (reply: FastifyReply, message = 'Bad request', details?: any) =>
    sendError(reply, 400, 'BAD_REQUEST', message, details),
  
  validationError: (reply: FastifyReply, message = 'Validation failed', details?: any) =>
    sendError(reply, 400, 'VALIDATION_ERROR', message, details),
  
  missingField: (reply: FastifyReply, field: string) =>
    sendError(reply, 400, 'MISSING_FIELD', `Required field '${field}' is missing`),
  
  invalidFormat: (reply: FastifyReply, field: string, expectedFormat: string) =>
    sendError(reply, 400, 'INVALID_FORMAT', `Field '${field}' has invalid format. Expected: ${expectedFormat}`),

  // 401 Unauthorized
  unauthorized: (reply: FastifyReply, message = 'Authentication required') =>
    sendError(reply, 401, 'UNAUTHORIZED', message),
  
  invalidCredentials: (reply: FastifyReply) =>
    sendError(reply, 401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
  
  tokenExpired: (reply: FastifyReply) =>
    sendError(reply, 401, 'TOKEN_EXPIRED', 'Your session has expired. Please login again'),
  
  tokenInvalid: (reply: FastifyReply) =>
    sendError(reply, 401, 'TOKEN_INVALID', 'Invalid authentication token'),

  // 403 Forbidden
  forbidden: (reply: FastifyReply, message = 'Access forbidden') =>
    sendError(reply, 403, 'FORBIDDEN', message),
  
  permissionDenied: (reply: FastifyReply, resource?: string) =>
    sendError(reply, 403, 'PERMISSION_DENIED', 
      resource ? `You don't have permission to access ${resource}` : 'Permission denied'),

  // 404 Not Found
  notFound: (reply: FastifyReply, resource = 'Resource') =>
    sendError(reply, 404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, `${resource} not found`),
  
  userNotFound: (reply: FastifyReply) =>
    sendError(reply, 404, 'USER_NOT_FOUND', 'User not found'),
  
  tenantNotFound: (reply: FastifyReply) =>
    sendError(reply, 404, 'TENANT_NOT_FOUND', 'Tenant not found'),
  
  accountNotFound: (reply: FastifyReply) =>
    sendError(reply, 404, 'ACCOUNT_NOT_FOUND', 'Account not found'),

  // 409 Conflict
  conflict: (reply: FastifyReply, message: string) =>
    sendError(reply, 409, 'CONFLICT', message),
  
  duplicateEntry: (reply: FastifyReply, field: string) =>
    sendError(reply, 409, 'DUPLICATE_ENTRY', `A record with this ${field} already exists`),

  // 422 Unprocessable Entity
  businessRuleViolation: (reply: FastifyReply, message: string) =>
    sendError(reply, 422, 'BUSINESS_RULE_VIOLATION', message),
  
  quotaExceeded: (reply: FastifyReply, resource: string) =>
    sendError(reply, 422, 'QUOTA_EXCEEDED', `You have exceeded your ${resource} quota`),
  
  insufficientBalance: (reply: FastifyReply) =>
    sendError(reply, 422, 'INSUFFICIENT_BALANCE', 'Insufficient balance for this operation'),
  
  invalidState: (reply: FastifyReply, message: string) =>
    sendError(reply, 422, 'INVALID_STATE', message),

  // 429 Too Many Requests
  rateLimitExceeded: (reply: FastifyReply) =>
    sendError(reply, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later'),

  // 500 Internal Server Error
  internalError: (reply: FastifyReply, message = 'An unexpected error occurred') =>
    sendError(reply, 500, 'INTERNAL_ERROR', message),
  
  databaseError: (reply: FastifyReply) =>
    sendError(reply, 500, 'DATABASE_ERROR', 'A database error occurred'),
  
  externalServiceError: (reply: FastifyReply, service: string) =>
    sendError(reply, 500, 'EXTERNAL_SERVICE_ERROR', `Failed to communicate with ${service}`)
};

/**
 * Type definitions for consistent response formats
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}