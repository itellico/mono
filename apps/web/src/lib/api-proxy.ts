/**
 * API Proxy Utility
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Proxies Next.js API routes to NestJS
 * This ensures all business logic, permissions, and database access go through NestJS
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

const NESTJS_API_URL = process.env.NESTJS_API_URL || 'http://localhost:3001';

export interface ProxyOptions {
  requireAuth?: boolean;
  nestjsPath?: string; // Override the NestJS path if different from Next.js path
  logDetails?: boolean;
}

/**
 * Generic proxy handler for forwarding requests to NestJS API
 */
export async function proxyToNestJS(
  request: NextRequest,
  method: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const { requireAuth = true, nestjsPath, logDetails = true } = options;

  try {
    // Get authenticated session if required
    let accessToken: string | undefined;
    let userId: string | undefined;

    if (requireAuth) {
      const session = await auth();
      if (!session?.user?.accessToken) {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }
      accessToken = session.user.accessToken;
      userId = session.user.id;
    }

    // Extract path from Next.js URL
    const url = new URL(request.url);
    const nextjsPath = url.pathname;
    
    // Determine NestJS path (use override or convert /api/v1/* to /api/v1/*)
    const targetPath = nestjsPath || nextjsPath;
    
    // Build NestJS URL with query parameters
    const queryString = url.searchParams.toString();
    const nestjsUrl = `${NESTJS_API_URL}${targetPath}${queryString ? `?${queryString}` : ''}`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body or not JSON
      }
    }

    // Make request to NestJS
    const response = await fetch(nestjsUrl, fetchOptions);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log the proxy request if enabled
    if (logDetails) {
      logger.info('Proxied request to NestJS', {
        method,
        nextjsPath,
        nestjsUrl,
        status: response.status,
        userId,
      });
    }

    // Return response with same status
    if (typeof data === 'string') {
      return new NextResponse(data, { 
        status: response.status,
        headers: { 'Content-Type': contentType || 'text/plain' }
      });
    }
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    logger.error('Failed to proxy request to NestJS', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      method,
      path: request.url 
    });
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Proxy handler for GET requests
 */
export async function proxyGET(request: NextRequest, options?: ProxyOptions): Promise<NextResponse> {
  return proxyToNestJS(request, 'GET', options);
}

/**
 * Proxy handler for POST requests
 */
export async function proxyPOST(request: NextRequest, options?: ProxyOptions): Promise<NextResponse> {
  return proxyToNestJS(request, 'POST', options);
}

/**
 * Proxy handler for PUT requests
 */
export async function proxyPUT(request: NextRequest, options?: ProxyOptions): Promise<NextResponse> {
  return proxyToNestJS(request, 'PUT', options);
}

/**
 * Proxy handler for PATCH requests
 */
export async function proxyPATCH(request: NextRequest, options?: ProxyOptions): Promise<NextResponse> {
  return proxyToNestJS(request, 'PATCH', options);
}

/**
 * Proxy handler for DELETE requests
 */
export async function proxyDELETE(request: NextRequest, options?: ProxyOptions): Promise<NextResponse> {
  return proxyToNestJS(request, 'DELETE', options);
}