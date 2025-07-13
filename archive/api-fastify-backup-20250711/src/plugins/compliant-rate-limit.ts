import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitOptions {
  max?: number;
  timeWindow?: number | string; // in milliseconds or as string like '15 minutes'
  skipOnError?: boolean;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

/**
 * Compliant Rate Limiting Plugin
 * 
 * Creates Redis keys that follow itellico Mono naming conventions:
 * temp:ratelimit:{method}:{route}:{ip}
 */
async function compliantRateLimit(fastify: FastifyInstance) {
  // In-memory fallback store when Redis is unavailable
  const memoryStore = new Map<string, RateLimitState>();

  // Clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of memoryStore.entries()) {
      if (now > state.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Generate compliant Redis key
  function generateKey(request: FastifyRequest): string {
    const method = request.method.toLowerCase();
    const route = (request.routeOptions?.url || request.url)
      .replace(/[^a-zA-Z0-9\/]/g, '')  // Remove special chars
      .replace(/\//g, '-');           // Replace / with -
    const ip = request.ip.replace(/\./g, '-').replace(/:/g, '-'); // Clean IP
    return `temp:ratelimit:${method}:${route}:${ip}`;
  }

  // Check rate limit
  async function checkRateLimit(
    request: FastifyRequest, 
    reply: FastifyReply, 
    options: RateLimitOptions
  ): Promise<boolean> {
    const key = generateKey(request);
    const max = options.max || 100;
    let timeWindow = options.timeWindow || 60000; // 1 minute default
    
    // Parse time window if it's a string (e.g., '15 minutes')
    if (typeof options.timeWindow === 'string') {
      const match = options.timeWindow.match(/^(\d+)\s*(second|minute|hour|day)s?$/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers: Record<string, number> = {
          second: 1000,
          minute: 60 * 1000,
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000
        };
        timeWindow = value * multipliers[unit];
      }
    }
    const now = Date.now();
    const resetTime = now + timeWindow;

    try {
      if (fastify.redis) {
        // Use Redis for rate limiting
        const current = await fastify.redis.incr(key);
        
        if (current === 1) {
          // Set TTL on first increment
          await fastify.redis.pexpire(key, timeWindow);
        }

        const ttl = await fastify.redis.pttl(key);
        
        // Set rate limit headers
        reply.header('X-RateLimit-Limit', max);
        reply.header('X-RateLimit-Remaining', Math.max(0, max - current));
        reply.header('X-RateLimit-Reset', new Date(now + ttl).toISOString());

        if (current > max) {
          const retryAfter = Math.max(1, Math.ceil(ttl / 1000));
          reply.header('Retry-After', String(retryAfter));
          reply.code(429).send({
            success: false,
            error: 'Too Many Requests',
            retryAfter: retryAfter
          });
          return false;
        }
      } else {
        // Use in-memory store as fallback
        const existing = memoryStore.get(key);
        
        if (existing && now < existing.resetTime) {
          existing.count++;
          
          if (existing.count > max) {
            const retryAfter = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
            reply.header('Retry-After', String(retryAfter));
            reply.code(429).send({
              success: false,
              error: 'Too Many Requests',
              retryAfter: retryAfter
            });
            return false;
          }
        } else {
          // Create new or reset expired entry
          memoryStore.set(key, { count: 1, resetTime });
        }

        const state = memoryStore.get(key)!;
        reply.header('X-RateLimit-Limit', max);
        reply.header('X-RateLimit-Remaining', Math.max(0, max - state.count));
        reply.header('X-RateLimit-Reset', new Date(state.resetTime).toISOString());
      }
      
      return true;
    } catch (error) {
      if (!options.skipOnError) {
        throw error;
      }
      // Skip rate limiting on error if configured
      fastify.log.warn('Rate limiting error (skipped):', error);
      return true;
    }
  }

  // Add rate limiting decorator
  fastify.decorate('compliantRateLimit', (options: RateLimitOptions = {}) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const allowed = await checkRateLimit(request, reply, options);
      if (!allowed) {
        // Response already sent by checkRateLimit
        return;
      }
    };
  });

  // Add per-route rate limiting support
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip rate limiting in development and test (unless forced for testing)
    const isTestEnv = process.env.NODE_ENV === 'test';
    const forceRateLimit = process.env.FORCE_RATE_LIMIT === 'true' || request.headers['x-test-rate-limit'] === 'true';
    
    if ((process.env.NODE_ENV === 'development' || isTestEnv) && !forceRateLimit) {
      return;
    }
    
    // Check if route has rate limiting configured
    const routeOptions = request.routeOptions as any;
    if (routeOptions?.config?.rateLimit) {
      const allowed = await checkRateLimit(request, reply, routeOptions.config.rateLimit);
      if (!allowed) {
        // Response already sent
        return;
      }
    }
  });
}

export default fp(compliantRateLimit, {
  name: 'compliant-rate-limit'
  // No dependencies - Redis is optional
});

declare module 'fastify' {
  interface FastifyInstance {
    compliantRateLimit: (options?: RateLimitOptions) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}