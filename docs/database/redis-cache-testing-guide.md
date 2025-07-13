# Redis Permission Cache Testing Guide

## Overview

This guide provides comprehensive testing strategies for the Redis-based permission caching system, including unit tests, integration tests, performance tests, and monitoring.

## Test Environment Setup

### Docker Compose for Testing

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis-test-data:/data
    command: >
      redis-server 
      --appendonly yes 
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis-cluster-test:
    image: grokzen/redis-cluster:7.0.0
    ports:
      - "7000-7005:7000-7005"
    environment:
      - REDIS_CLUSTER_NODES=6
      - REDIS_CLUSTER_REPLICAS=1

volumes:
  redis-test-data:
```

### Test Configuration

```typescript
// test/setup/cache-test.config.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export const createTestRedisModule = () => {
  return RedisModule.forRoot({
    config: {
      host: 'localhost',
      port: 6380, // Test Redis port
      db: 15,     // Separate test database
      connectionName: 'test',
    },
  });
};

export const cleanupRedis = async (redis: Redis) => {
  const keys = await redis.keys('*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
```

## Unit Tests

### Redis Cache Service Tests

```typescript
// redis-cache.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import Redis from 'ioredis';
import { getRedisToken } from '@nestjs-modules/ioredis';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [createTestRedisModule()],
      providers: [RedisCacheService],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    redis = module.get<Redis>(getRedisToken());
  });

  afterEach(async () => {
    await cleanupRedis(redis);
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      await service.set('test:key', { value: 'test' }, 10);
      const result = await service.get('test:key');
      
      expect(result).toEqual({ value: 'test' });
    });

    it('should handle TTL correctly', async () => {
      await service.set('test:ttl', 'value', 1);
      
      // Should exist immediately
      let result = await service.get('test:ttl');
      expect(result).toBe('value');
      
      // Should expire after TTL
      await new Promise(resolve => setTimeout(resolve, 1100));
      result = await service.get('test:ttl');
      expect(result).toBeNull();
    });

    it('should delete keys by pattern', async () => {
      await service.set('test:1', 'value1');
      await service.set('test:2', 'value2');
      await service.set('other:1', 'value3');
      
      const deleted = await service.delete('test:*');
      
      expect(deleted).toBe(2);
      expect(await service.get('other:1')).toBe('value3');
    });
  });

  describe('distributed locking', () => {
    it('should acquire and release locks', async () => {
      const lockId = 'test-lock-id';
      
      // Acquire lock
      const acquired = await service.acquireLock('resource', lockId, 5);
      expect(acquired).toBe(true);
      
      // Second attempt should fail
      const secondAttempt = await service.acquireLock('resource', 'other-id', 5);
      expect(secondAttempt).toBe(false);
      
      // Release lock
      const released = await service.releaseLock('resource', lockId);
      expect(released).toBe(true);
      
      // Now another process can acquire
      const thirdAttempt = await service.acquireLock('resource', 'other-id', 5);
      expect(thirdAttempt).toBe(true);
    });

    it('should not release lock with wrong identifier', async () => {
      await service.acquireLock('resource', 'lock-1', 5);
      
      const released = await service.releaseLock('resource', 'wrong-id');
      expect(released).toBe(false);
    });
  });

  describe('set operations', () => {
    it('should handle set operations correctly', async () => {
      const key = 'permissions:user:1';
      
      // Add members
      await service.sadd(key, 'perm1', 'perm2', 'perm3');
      
      // Get all members
      const members = await service.smembers(key);
      expect(members).toHaveLength(3);
      expect(members).toContain('perm1');
      
      // Check membership
      const isMember = await service.sismember(key, 'perm2');
      expect(isMember).toBe(true);
      
      const isNotMember = await service.sismember(key, 'perm4');
      expect(isNotMember).toBe(false);
    });
  });

  describe('pipeline operations', () => {
    it('should execute pipeline operations', async () => {
      const operations = [
        { command: 'set', args: ['key1', 'value1'] },
        { command: 'set', args: ['key2', 'value2'] },
        { command: 'get', args: ['key1'] },
      ];
      
      const results = await service.pipeline(operations);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('OK');
      expect(results[1]).toBe('OK');
      expect(results[2]).toBe('value1');
    });
  });
});
```

### Permission Cache Service Tests

```typescript
// permission-cache.service.spec.ts
describe('PermissionCacheService', () => {
  let service: PermissionCacheService;
  let cache: RedisCacheService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionCacheService,
        {
          provide: RedisCacheService,
          useValue: createMock<RedisCacheService>(),
        },
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<PermissionCacheService>(PermissionCacheService);
    cache = module.get<RedisCacheService>(RedisCacheService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getUserPermissions', () => {
    const userId = 1;
    const tenantId = 1;
    const cacheKey = `perm:user:${userId}:tenant:${tenantId}`;

    it('should return cached permissions when available', async () => {
      const cachedPermissions = ['platform.users.read', 'platform.users.create'];
      cache.get.mockResolvedValueOnce(cachedPermissions);

      const result = await service.getUserPermissions(userId, tenantId);

      expect(result).toEqual(cachedPermissions);
      expect(cache.get).toHaveBeenCalledWith(cacheKey);
      expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    });

    it('should compute permissions on cache miss', async () => {
      cache.get.mockResolvedValueOnce(null);
      cache.acquireLock.mockResolvedValueOnce(true);
      cache.releaseLock.mockResolvedValueOnce(true);

      // Mock database responses
      prisma.userRole.findMany.mockResolvedValueOnce([
        {
          role: {
            permissions: [
              {
                permission: {
                  domain: 'platform',
                  resource: 'users',
                  action: 'read',
                  scope: null,
                },
              },
            ],
          },
        },
      ]);

      prisma.userPermission.findMany.mockResolvedValueOnce([]);

      const result = await service.getUserPermissions(userId, tenantId);

      expect(result).toContain('platform.users.read');
      expect(cache.set).toHaveBeenCalled();
      expect(cache.releaseLock).toHaveBeenCalled();
    });

    it('should handle cache stampede protection', async () => {
      cache.get.mockResolvedValueOnce(null);
      cache.acquireLock.mockResolvedValueOnce(false);

      // Simulate another process computing
      setTimeout(() => {
        cache.get.mockResolvedValueOnce(['platform.users.read']);
      }, 50);

      const result = await service.getUserPermissions(userId, tenantId);

      expect(result).toEqual(['platform.users.read']);
    });
  });

  describe('permission expansion', () => {
    it('should expand hierarchical permissions', () => {
      const permissions = ['platform.users.create'];
      const expanded = service['expandPermissions'](permissions);

      expect(expanded).toContain('platform.users.create');
      expect(expanded).toContain('platform.users.*');
      expect(expanded).toContain('platform.*');
    });

    it('should handle scoped permissions', () => {
      const permissions = ['tenant.accounts.read.own'];
      const expanded = service['expandPermissions'](permissions);

      expect(expanded).toContain('tenant.accounts.read.own');
      expect(expanded).toContain('tenant.accounts.read.*');
      expect(expanded).toContain('tenant.accounts.*');
      expect(expanded).toContain('tenant.*');
    });
  });

  describe('checkPermission', () => {
    it('should check direct permission match', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValueOnce([
        'platform.users.read',
        'platform.users.create',
      ]);

      const result = await service.checkPermission(1, 1, 'platform.users.read');
      expect(result).toBe(true);
    });

    it('should check wildcard permission match', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValueOnce([
        'platform.users.*',
      ]);

      const result = await service.checkPermission(1, 1, 'platform.users.delete');
      expect(result).toBe(true);
    });

    it('should return false for missing permission', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValueOnce([
        'platform.users.read',
      ]);

      const result = await service.checkPermission(1, 1, 'platform.users.delete');
      expect(result).toBe(false);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate user permissions', async () => {
      await service.invalidateUserPermissions(1, 1);

      expect(cache.delete).toHaveBeenCalledWith('perm:user:1:tenant:1');
      expect(cache.delete).toHaveBeenCalledWith('perm:meta:1:1');
      expect(prisma.permissionCache.updateMany).toHaveBeenCalled();
    });

    it('should invalidate all tenant contexts for user', async () => {
      await service.invalidateUserPermissions(1);

      expect(cache.delete).toHaveBeenCalledWith('perm:user:1:*');
      expect(cache.delete).toHaveBeenCalledWith('perm:meta:1:*');
    });

    it('should invalidate role permissions', async () => {
      prisma.userRole.findMany.mockResolvedValueOnce([
        { userId: 1, tenantId: 1 },
        { userId: 2, tenantId: 1 },
      ]);

      await service.invalidateRolePermissions(1);

      expect(cache.delete).toHaveBeenCalledWith('perm:role:1');
      expect(service.invalidateUserPermissions).toHaveBeenCalledTimes(2);
    });
  });
});
```

## Integration Tests

### Full Stack Cache Test

```typescript
// cache-integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';

describe('Permission Cache Integration', () => {
  let app: INestApplication;
  let cacheService: PermissionCacheService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cacheService = app.get<PermissionCacheService>(PermissionCacheService);

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cache permissions after first request', async () => {
    // Clear cache
    await cacheService.invalidateUserPermissions(1);

    // First request - cache miss
    const start1 = Date.now();
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const duration1 = Date.now() - start1;

    // Second request - cache hit
    const start2 = Date.now();
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    const duration2 = Date.now() - start2;

    // Cache hit should be significantly faster
    expect(duration2).toBeLessThan(duration1 / 2);
  });

  it('should invalidate cache on permission change', async () => {
    // Make a request to populate cache
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Change user permissions
    await request(app.getHttpServer())
      .post('/api/v1/admin/users/1/permissions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ permissions: ['platform.users.delete'] })
      .expect(200);

    // Cache should be invalidated
    const stats = await cacheService.getCacheStats();
    expect(stats.patterns['perm:user:*']).toBe(0);
  });
});
```

## Performance Tests

### Load Testing Script

```typescript
// test/performance/cache-load-test.ts
import { performance } from 'perf_hooks';
import * as autocannon from 'autocannon';

async function loadTestCache() {
  console.log('🚀 Starting cache load test...\n');

  // Test configuration
  const scenarios = [
    {
      name: 'Permission Check - Cold Cache',
      url: 'http://localhost:3000/api/v1/users',
      connections: 10,
      duration: 30,
      clearCache: true,
    },
    {
      name: 'Permission Check - Warm Cache',
      url: 'http://localhost:3000/api/v1/users',
      connections: 100,
      duration: 30,
      clearCache: false,
    },
    {
      name: 'Concurrent Permission Updates',
      url: 'http://localhost:3000/api/v1/admin/permissions',
      method: 'POST',
      connections: 50,
      duration: 30,
      clearCache: false,
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n📊 Running: ${scenario.name}`);
    
    if (scenario.clearCache) {
      // Clear cache before test
      await fetch('http://localhost:3000/api/v1/admin/cache/clear', {
        method: 'POST',
      });
    }

    const result = await autocannon({
      url: scenario.url,
      method: scenario.method || 'GET',
      connections: scenario.connections,
      duration: scenario.duration,
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    console.log(`  Requests/sec: ${result.requests.average}`);
    console.log(`  Latency (p50): ${result.latency.p50}ms`);
    console.log(`  Latency (p95): ${result.latency.p95}ms`);
    console.log(`  Latency (p99): ${result.latency.p99}ms`);
  }
}

loadTestCache();
```

### Cache Benchmark Suite

```typescript
// test/performance/cache-benchmark.ts
import { Suite } from 'benchmark';
import { PermissionCacheService } from '@/modules/cache/services/permission-cache.service';

async function benchmarkPermissionCache() {
  const suite = new Suite();
  const cacheService = new PermissionCacheService(/* dependencies */);

  // Test data
  const permissions = Array.from({ length: 100 }, (_, i) => 
    `platform.resource${i}.action${i % 5}`
  );

  suite
    .add('Direct Permission Check', {
      defer: true,
      fn: async (deferred) => {
        await cacheService.checkPermission(1, 1, 'platform.users.read');
        deferred.resolve();
      },
    })
    .add('Wildcard Permission Check', {
      defer: true,
      fn: async (deferred) => {
        await cacheService.checkPermission(1, 1, 'platform.users.custom');
        deferred.resolve();
      },
    })
    .add('Batch Permission Check (10)', {
      defer: true,
      fn: async (deferred) => {
        const perms = permissions.slice(0, 10);
        await cacheService.checkPermissions(1, 1, perms);
        deferred.resolve();
      },
    })
    .add('Cache Invalidation', {
      defer: true,
      fn: async (deferred) => {
        await cacheService.invalidateUserPermissions(
          Math.floor(Math.random() * 100)
        );
        deferred.resolve();
      },
    })
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function() {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({ async: true });
}

benchmarkPermissionCache();
```

## Monitoring and Observability

### Prometheus Metrics

```typescript
// cache-metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class CacheMetricsService {
  private readonly cacheHits: Counter;
  private readonly cacheMisses: Counter;
  private readonly cacheLatency: Histogram;
  private readonly cacheSize: Gauge;
  private readonly cacheEvictions: Counter;

  constructor() {
    this.cacheHits = new Counter({
      name: 'permission_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_level', 'operation'],
    });

    this.cacheMisses = new Counter({
      name: 'permission_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_level', 'operation'],
    });

    this.cacheLatency = new Histogram({
      name: 'permission_cache_operation_duration_seconds',
      help: 'Cache operation latency',
      labelNames: ['operation', 'cache_level'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    });

    this.cacheSize = new Gauge({
      name: 'permission_cache_size_bytes',
      help: 'Current cache size in bytes',
      labelNames: ['cache_level'],
    });

    this.cacheEvictions = new Counter({
      name: 'permission_cache_evictions_total',
      help: 'Total number of cache evictions',
      labelNames: ['cache_level', 'reason'],
    });

    // Register metrics
    register.registerMetric(this.cacheHits);
    register.registerMetric(this.cacheMisses);
    register.registerMetric(this.cacheLatency);
    register.registerMetric(this.cacheSize);
    register.registerMetric(this.cacheEvictions);
  }

  recordCacheHit(level: string, operation: string) {
    this.cacheHits.inc({ cache_level: level, operation });
  }

  recordCacheMiss(level: string, operation: string) {
    this.cacheMisses.inc({ cache_level: level, operation });
  }

  recordLatency(operation: string, level: string, duration: number) {
    this.cacheLatency.observe(
      { operation, cache_level: level },
      duration / 1000 // Convert to seconds
    );
  }

  updateCacheSize(level: string, bytes: number) {
    this.cacheSize.set({ cache_level: level }, bytes);
  }

  recordEviction(level: string, reason: string) {
    this.cacheEvictions.inc({ cache_level: level, reason });
  }
}
```

### Health Checks

```typescript
// cache-health.indicator.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisCacheService } from './redis-cache.service';
import { MemoryCacheService } from './memory-cache.service';

@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  constructor(
    private readonly redisCache: RedisCacheService,
    private readonly memoryCache: MemoryCacheService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const errors: string[] = [];
    const details: any = {};

    // Check Redis
    try {
      const redisStart = Date.now();
      await this.redisCache.set('health:check', 'ok', 10);
      const value = await this.redisCache.get('health:check');
      const redisLatency = Date.now() - redisStart;

      if (value === 'ok') {
        details.redis = {
          status: 'up',
          latency: `${redisLatency}ms`,
        };
      } else {
        errors.push('Redis read/write failed');
      }
    } catch (error) {
      errors.push(`Redis error: ${error.message}`);
      details.redis = { status: 'down', error: error.message };
    }

    // Check Memory Cache
    try {
      const memStart = Date.now();
      this.memoryCache.set('health:check', 'ok', 10);
      const value = this.memoryCache.get('health:check');
      const memLatency = Date.now() - memStart;

      if (value === 'ok') {
        details.memory = {
          status: 'up',
          latency: `${memLatency}ms`,
          stats: this.memoryCache.getStats(),
        };
      } else {
        errors.push('Memory cache read/write failed');
      }
    } catch (error) {
      errors.push(`Memory cache error: ${error.message}`);
      details.memory = { status: 'down', error: error.message };
    }

    const isHealthy = errors.length === 0;

    return this.getStatus(key, isHealthy, {
      ...details,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **Cache Stampede**
   - Symptom: Multiple processes computing same cache key
   - Solution: Implement distributed locking with retry logic

2. **Memory Bloat**
   - Symptom: Memory cache consuming too much RAM
   - Solution: Set max keys limit and implement LRU eviction

3. **Stale Data**
   - Symptom: Permissions not updating after changes
   - Solution: Ensure proper invalidation on all mutation paths

4. **Connection Failures**
   - Symptom: Redis connection timeouts
   - Solution: Implement connection pooling and retry strategy

### Debug Utilities

```typescript
// cache-debug.service.ts
@Injectable()
export class CacheDebugService {
  async inspectCache(userId: number, tenantId: number) {
    const report = {
      timestamp: new Date(),
      user: { userId, tenantId },
      cache: {
        l1: {},
        l2: {},
        l3: {},
      },
      permissions: [],
      metadata: {},
    };

    // Check L1
    const l1Key = `perm:user:${userId}:tenant:${tenantId}`;
    report.cache.l1 = {
      exists: this.memoryCache.has(l1Key),
      value: this.memoryCache.get(l1Key),
    };

    // Check L2
    const l2Value = await this.redisCache.get(l1Key);
    report.cache.l2 = {
      exists: l2Value !== null,
      value: l2Value,
      ttl: await this.redisCache.ttl(l1Key),
    };

    // Check L3
    const l3Record = await this.prisma.permissionCache.findUnique({
      where: { cacheKey: l1Key },
    });
    report.cache.l3 = {
      exists: !!l3Record,
      record: l3Record,
    };

    return report;
  }

  async validateCacheConsistency(sampleSize: number = 100) {
    const inconsistencies = [];
    
    // Sample random users
    const users = await this.prisma.user.findMany({
      take: sampleSize,
      select: { id: true, accountId: true },
    });

    for (const user of users) {
      const computed = await this.computeUserPermissions(user.id);
      const cached = await this.cacheService.getUserPermissions(user.id);
      
      if (!this.arraysEqual(computed, cached)) {
        inconsistencies.push({
          userId: user.id,
          computed: computed.length,
          cached: cached.length,
          diff: this.arrayDiff(computed, cached),
        });
      }
    }

    return {
      sampleSize,
      inconsistencies: inconsistencies.length,
      details: inconsistencies,
    };
  }
}
```

## Next Steps

1. Run unit tests: `pnpm test cache`
2. Run integration tests: `pnpm test:e2e cache`
3. Run performance benchmarks: `pnpm benchmark`
4. Set up monitoring dashboards
5. Configure alerts for cache health
6. Document cache tuning parameters