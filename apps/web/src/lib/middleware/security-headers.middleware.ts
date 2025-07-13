/**
 * Security Headers Middleware
 * 
 * ENTERPRISE SECURITY HARDENING:
 * - HSTS, CSP, XSS protection
 * - Content type sniffing prevention
 * - Clickjacking protection
 * - Referrer policy enforcement
 */

import { NextResponse } from 'next/server';

export class SecurityHeaders {
  static apply(response: NextResponse, isApiRoute = false): NextResponse {
    // Core security headers for all routes
    const coreHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-DNS-Prefetch-Control': 'off',
    };

    // HSTS for HTTPS (production)
    if (process.env.NODE_ENV === 'production') {
      coreHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    // Apply core headers
    Object.entries(coreHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    if (isApiRoute) {
      // API-specific headers
      response.headers.set('X-API-Version', 'v1');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      
      // CORS for API routes (configure as needed)
      response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
      response.headers.set('Access-Control-Max-Age', '86400');
    } else {
      // Web route specific headers
      response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
      
      // CSP for web routes (adjust as needed)
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:",
        "frame-ancestors 'none'"
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);
    }

    return response;
  }

  static addMonitoringHeaders(
    response: NextResponse, 
    requestId: string, 
    duration: number,
    rateLimitRemaining: number
  ): NextResponse {
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Processing-Time', duration.toFixed(2));
    response.headers.set('X-RateLimit-Remaining', rateLimitRemaining.toString());
    response.headers.set('X-Powered-By', 'itellico Mono');
    
    return response;
  }

  static addCacheHeaders(
    response: NextResponse,
    cacheStatus: 'hit' | 'miss' | 'disabled',
    maxAge?: number
  ): NextResponse {
    response.headers.set('X-Cache-Status', cacheStatus);
    
    if (maxAge && cacheStatus === 'hit') {
      response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
    }
    
    return response;
  }
} 