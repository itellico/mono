/**
 * API Utilities - Common functions for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return createApiResponse(true, data, undefined, message, status);
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: number = 500
): NextResponse {
  return createApiResponse(false, undefined, error, undefined, status);
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: any,
  context: string = 'API Error'
): NextResponse {
  logger.error(context, { error: error.message, stack: error.stack });

  if (error.name === 'ValidationError') {
    return errorResponse(error.message, 400);
  }

  if (error.name === 'UnauthorizedError') {
    return errorResponse('Unauthorized', 401);
  }

  if (error.name === 'ForbiddenError') {
    return errorResponse('Forbidden', 403);
  }

  if (error.name === 'NotFoundError') {
    return errorResponse('Not found', 404);
  }

  return errorResponse('Internal server error', 500);
}

/**
 * Parse request body safely
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Generate unique file name
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');

  return `${sanitizeFileName(baseName)}_${timestamp}_${random}.${extension}`;
}

/**
 * Check if request method is allowed
 */
export function methodNotAllowed(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method || '')) {
    return NextResponse.json(
      { error: `Method ${request.method} not allowed` },
      { status: 405, headers: { Allow: allowedMethods.join(', ') } }
    );
  }
  return null;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }
}

export default {
  createApiResponse,
  successResponse,
  errorResponse,
  handleApiError,
  parseRequestBody,
  validateRequiredFields,
  sanitizeFileName,
  generateUniqueFileName,
  methodNotAllowed,
  RateLimiter,
}; 