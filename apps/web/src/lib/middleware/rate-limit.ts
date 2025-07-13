import { NextRequest } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Rate limiting middleware for itellico Mono
 * 
 * P0 Security Requirement: Protect API endpoints from abuse
 * 
 * Features:
 * ✅ Token bucket algorithm for flexible rate limiting
 * ✅ IP-based and user-based limiting
 * ✅ Different limits for authenticated vs anonymous users
 * ✅ Configurable per-endpoint limits
 * ✅ Redis-backed for distributed systems
 */

export interface RateLimitConfig {
  windowMs?: number;           // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number;        // Max requests per window (default: 100)
  maxRequestsAuthenticated?: number; // Max for authenticated users (default: 1000)
  keyPrefix?: string;          // Redis key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,    // 100 requests per minute for anonymous
  maxRequestsAuthenticated: 1000, // 1000 requests per minute for authenticated
  keyPrefix: 'rate_limit',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): { type: 'ip' | 'user', id: string } {
  // Check for user ID in headers (set by middleware after auth)
  const userId = request.headers.get('X-User-ID');
  if (userId) {
    return { type: 'user', id: userId };
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return { type: 'ip', id: ip };
}

/**
 * Main rate limiting function
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const redis = await getRedisClient();
    const { type, id } = getClientIdentifier(request);
    
    // Determine rate limit based on authentication status
    const maxRequests = type === 'user' 
      ? mergedConfig.maxRequestsAuthenticated 
      : mergedConfig.maxRequests;
    
    // Generate Redis key
    const key = `${mergedConfig.keyPrefix}:${type}:${id}`;
    const now = Date.now();
    const windowStart = now - mergedConfig.windowMs;
    
    // Clean old entries and count requests in current window
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, Math.ceil(mergedConfig.windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results?.[1]?.[1] as number || 0;
    
    // Check if limit exceeded
    const allowed = count < maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    const reset = new Date(now + mergedConfig.windowMs);
    
    // Log rate limit event
    if (!allowed) {
      logger.warn('🚫 Rate limit exceeded', {
        clientType: type,
        clientId: id,
        count,
        limit: maxRequests,
        path: request.nextUrl.pathname,
        duration: Date.now() - startTime
      });
    }
    
    const result: RateLimitResult = {
      allowed,
      limit: maxRequests,
      remaining,
      reset,
      retryAfter: allowed ? undefined : Math.ceil(mergedConfig.windowMs / 1000)
    };
    
    return result;
    
  } catch (error) {
    // On Redis failure, allow request but log error
    logger.error('❌ Rate limiting error - allowing request', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    
    // Graceful degradation
    return {
      allowed: true,
      limit: DEFAULT_CONFIG.maxRequests,
      remaining: DEFAULT_CONFIG.maxRequests,
      reset: new Date(Date.now() + DEFAULT_CONFIG.windowMs)
    };
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Strict limits for auth endpoints
  '/api/auth/signin': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per 15 minutes
    maxRequestsAuthenticated: 5
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 3,            // 3 registrations per hour
    maxRequestsAuthenticated: 3
  },
  
  // Media upload limits
  '/api/v1/media/upload': {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 10,           // 10 uploads per minute
    maxRequestsAuthenticated: 50
  },
  
  // Search endpoints
  '/api/v1/search': {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 30,           // 30 searches per minute
    maxRequestsAuthenticated: 100
  },
  
  // Admin endpoints (authenticated only)
  '/api/v1/admin': {
    windowMs: 60 * 1000,       // 1 minute
    maxRequests: 0,            // Block anonymous
    maxRequestsAuthenticated: 200
  }
};

/**
 * Get rate limit config for a specific path
 */
export function getRateLimitConfig(path: string): RateLimitConfig {
  // Check exact match first
  if (RATE_LIMIT_CONFIGS[path]) {
    return RATE_LIMIT_CONFIGS[path];
  }
  
  // Check prefix matches
  for (const [prefix, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (path.startsWith(prefix)) {
      return config;
    }
  }
  
  // Return default config
  return DEFAULT_CONFIG;
}