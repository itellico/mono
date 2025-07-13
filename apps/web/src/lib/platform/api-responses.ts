// 🎯 mono PLATFORM: Standardized API Responses
// Mobile-ready, consistent response format for all API endpoints

import { NextResponse } from 'next/server';
import { createApiLogger } from './logging';

const log = createApiLogger('responses');

/**
 * Standard API response interface for mobile compatibility
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId: string;
  version?: string;
}

/**
 * Client-side API call helper
 */
export async function createApiCall<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('API call failed', { endpoint, error: errorMessage });

    return {
      success: false,
      error: errorMessage,
      code: 'API_CALL_FAILED',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      version: 'v1'
    };
  }
}

/**
 * Success response helper with mobile-ready format
 */
export function successResponse<T>(
  data: T, 
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.debug('Success response', { status, hasData: !!data });

  return NextResponse.json(response, { status });
}

/**
 * Error response helper with categorized errors
 */
export function errorResponse(
  error: Error | string, 
  status: number = 400,
  code?: string
): NextResponse<ApiResponse> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = code || (typeof error === 'object' && error.name) || 'UNKNOWN_ERROR';

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.error('Error response', { status, error: errorMessage, code: errorCode });

  return NextResponse.json(response, { status });
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(
  validationErrors: Record<string, string[]>
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    data: { validationErrors },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.warn('Validation error response', { validationErrors });

  return NextResponse.json(response, { status: 422 });
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.warn('Unauthorized response', { message });

  return NextResponse.json(response, { status: 401 });
}

/**
 * Forbidden response helper for permission errors
 */
export function forbiddenResponse(
  action: string, 
  resource: string
): NextResponse<ApiResponse> {
  const message = `Permission denied: ${action} on ${resource}`;

  const response: ApiResponse = {
    success: false,
    error: message,
    code: 'FORBIDDEN',
    data: { action, resource },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.warn('Forbidden response', { action, resource });

  return NextResponse.json(response, { status: 403 });
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(
  config: { requests: number; windowMs: number }
): NextResponse<ApiResponse> {
  const retryAfter = Math.ceil(config.windowMs / 1000);

  const response: ApiResponse = {
    success: false,
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    data: { retryAfter },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.warn('Rate limit response', { config, retryAfter });

  const nextResponse = NextResponse.json(response, { status: 429 });
  nextResponse.headers.set('Retry-After', retryAfter.toString());

  return nextResponse;
}

/**
 * Tenant limit exceeded response helper
 */
export function tenantLimitResponse(
  action: string,
  currentUsage: number,
  limit: number
): NextResponse<ApiResponse> {
  const message = `Tenant limit exceeded for ${action}. Current: ${currentUsage}, Limit: ${limit}`;

  const response: ApiResponse = {
    success: false,
    error: message,
    code: 'TENANT_LIMIT_EXCEEDED',
    data: { action, currentUsage, limit },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    version: 'v1'
  };

  log.warn('Tenant limit response', { action, currentUsage, limit });

  return NextResponse.json(response, { status: 402 }); // Payment Required
}

/**
 * Custom error classes for typed error handling
 */
export class TenantLimitError extends Error {
  constructor(
    public action: string, 
    public currentUsage: number, 
    public limit: number
  ) {
    super(`Tenant limit exceeded for ${action}. Current: ${currentUsage}, Limit: ${limit}`);
    this.name = 'TenantLimitError';
  }
}

export class PermissionError extends Error {
  constructor(public action: string, public resource: string) {
    super(`Permission denied: ${action} on ${resource}`);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends Error {
  constructor(public validationErrors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
} 