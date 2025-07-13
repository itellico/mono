#!/bin/bash

# Redis Permission Caching Setup Script
# This script sets up Redis for permission caching in the itellico platform

set -e

echo "🔧 Setting up Redis Permission Caching..."

# Check if Redis is running
if ! docker ps | grep -q "redis"; then
    echo "❌ Redis container is not running. Please start Redis first:"
    echo "   docker-compose up -d redis"
    exit 1
fi

echo "✅ Redis container is running"

# Install Redis dependencies
echo "📦 Installing Redis dependencies..."
cd apps/api
pnpm add @nestjs-modules/ioredis ioredis
pnpm add -D @types/ioredis

# Create cache module structure
echo "📁 Creating cache module structure..."
mkdir -p src/modules/cache/{services,interfaces,decorators,constants}

# Create Redis configuration
cat > src/modules/cache/redis.config.ts << 'EOF'
import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const redisConfig: RedisModuleOptions = {
  config: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // Performance
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
    
    // Connection
    connectionName: 'permissions',
    lazyConnect: false,
    
    // Timeouts
    connectTimeout: 10000,
    commandTimeout: 5000,
    
    // Retry strategy
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
  },
};

export const redisClusterConfig: RedisModuleOptions = {
  config: {
    clusters: [
      {
        host: process.env.REDIS_MASTER_HOST || 'localhost',
        port: parseInt(process.env.REDIS_MASTER_PORT || '6379'),
      },
    ],
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      readOnly: true,
    },
    enableReadyCheck: true,
    scaleReads: 'slave',
    maxRedirections: 16,
    retryDelayOnFailover: 100,
    retryDelayOnClusterDown: 300,
    slotsRefreshTimeout: 2000,
  },
};
EOF

# Create cache constants
cat > src/modules/cache/constants/cache.constants.ts << 'EOF'
export const CACHE_TTL = {
  // Permission cache TTLs
  USER_PERMISSIONS: 3600,        // 1 hour
  ROLE_PERMISSIONS: 86400,       // 24 hours  
  PERMISSION_DEFINITIONS: 604800, // 7 days
  
  // General cache TTLs
  SHORT: 60,                     // 1 minute
  MEDIUM: 300,                   // 5 minutes
  LONG: 3600,                    // 1 hour
  EXTRA_LONG: 86400,            // 24 hours
};

export const CACHE_KEYS = {
  // Permission patterns
  USER_PERMISSIONS: (userId: number, tenantId: number) => 
    `perm:user:${userId}:tenant:${tenantId}`,
  
  USER_EFFECTIVE_PERMISSIONS: (userId: number, tenantId: number) => 
    `perm:effective:${userId}:tenant:${tenantId}`,
  
  ROLE_PERMISSIONS: (roleId: number) => 
    `perm:role:${roleId}`,
  
  PERMISSION_DEFINITION: (permissionId: number) => 
    `perm:def:${permissionId}`,
  
  PERMISSION_PATTERN: (pattern: string) => 
    `perm:def:pattern:${pattern}`,
  
  USER_ROLES: (userId: number, tenantId: number) => 
    `roles:user:${userId}:tenant:${tenantId}`,
  
  // Metadata
  PERMISSION_METADATA: (userId: number, tenantId: number) => 
    `perm:meta:${userId}:${tenantId}`,
  
  PERMISSION_VERSION: (userId: number) => 
    `perm:meta:${userId}:version`,
  
  // Invalidation patterns
  INVALIDATE_USER: (userId: number) => 
    `perm:user:${userId}:*`,
  
  INVALIDATE_ROLE: (roleId: number) => 
    `perm:role:${roleId}:*`,
  
  INVALIDATE_TENANT: (tenantId: number) => 
    `perm:*:tenant:${tenantId}`,
};

export const CACHE_CONFIG = {
  // Memory cache (L1)
  MEMORY_MAX_KEYS: 10000,
  MEMORY_CHECK_PERIOD: 120,
  MEMORY_USE_CLONES: false,
  
  // Lock configuration
  LOCK_TTL: 5000, // 5 seconds
  LOCK_RETRY_DELAY: 100, // 100ms
  LOCK_MAX_RETRIES: 50,
  
  // Batch operations
  BATCH_SIZE: 100,
  BATCH_DELAY: 10, // 10ms between batches
};
EOF

# Create cache interfaces
cat > src/modules/cache/interfaces/cache.interfaces.ts << 'EOF'
export interface CachedPermissions {
  userId: number;
  tenantId: number;
  permissions: string[];
  permissionTree: PermissionTree;
  roles: CachedRole[];
  computedAt: Date;
  expiresAt: Date;
  version: number;
  hash: string;
  conditions: Record<string, any>;
  scope: PermissionScope;
}

export interface CachedRole {
  id: number;
  code: string;
  level: number;
  permissions: string[];
}

export interface PermissionTree {
  [domain: string]: {
    [resource: string]: {
      [action: string]: {
        allowed: boolean;
        scope?: string;
        conditions?: any;
      }
    }
  }
}

export interface PermissionScope {
  tenantId: number;
  accountId?: number;
  resourceType?: string;
  resourceId?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: string;
  keys: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: number;
  conditions?: Record<string, any>;
}
EOF

# Create cache module
cat > src/modules/cache/cache.module.ts << 'EOF'
import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { redisConfig } from './redis.config';
import { RedisCacheService } from './services/redis-cache.service';
import { MemoryCacheService } from './services/memory-cache.service';
import { MultiLevelCacheService } from './services/multi-level-cache.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { CacheWarmerService } from './services/cache-warmer.service';
import { CacheMonitorService } from './services/cache-monitor.service';
import { CacheInvalidatorService } from './services/cache-invalidator.service';

@Global()
@Module({
  imports: [
    RedisModule.forRoot(redisConfig),
    ScheduleModule.forRoot(),
  ],
  providers: [
    RedisCacheService,
    MemoryCacheService,
    MultiLevelCacheService,
    PermissionCacheService,
    CacheWarmerService,
    CacheMonitorService,
    CacheInvalidatorService,
  ],
  exports: [
    RedisCacheService,
    MultiLevelCacheService,
    PermissionCacheService,
    CacheInvalidatorService,
  ],
})
export class CacheModule {}
EOF

# Update environment variables
echo "📝 Adding Redis environment variables..."
if ! grep -q "REDIS_HOST" ../../.env; then
    cat >> ../../.env << 'EOF'

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Redis Cluster (Production)
REDIS_MASTER_HOST=
REDIS_MASTER_PORT=6379

# Cache Configuration
CACHE_MEMORY_MAX_KEYS=10000
CACHE_MEMORY_TTL=60
CACHE_REDIS_TTL=3600
EOF
fi

# Create Redis health check script
cat > ../../scripts/check-redis-health.ts << 'EOF'
#!/usr/bin/env tsx

import Redis from 'ioredis';

async function checkRedisHealth() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });

  try {
    // Test connection
    const pong = await redis.ping();
    console.log('✅ Redis connection:', pong);

    // Test basic operations
    await redis.set('health:test', 'ok', 'EX', 10);
    const value = await redis.get('health:test');
    console.log('✅ Redis read/write:', value === 'ok' ? 'OK' : 'FAILED');

    // Get info
    const info = await redis.info();
    const lines = info.split('\r\n');
    const version = lines.find(l => l.startsWith('redis_version:'));
    const memory = lines.find(l => l.startsWith('used_memory_human:'));
    const clients = lines.find(l => l.startsWith('connected_clients:'));
    
    console.log('\n📊 Redis Info:');
    console.log('  ', version);
    console.log('  ', memory);
    console.log('  ', clients);

    // Test permission cache patterns
    console.log('\n🔍 Testing permission cache patterns...');
    
    // Set test permission
    const testKey = 'perm:user:999:tenant:999';
    const testPermissions = ['platform.users.read', 'platform.users.create'];
    await redis.setex(testKey, 60, JSON.stringify(testPermissions));
    
    // Get test permission
    const cached = await redis.get(testKey);
    const parsed = JSON.parse(cached || '[]');
    console.log('✅ Permission cache test:', 
      parsed.length === 2 ? 'OK' : 'FAILED'
    );

    // Clean up
    await redis.del(testKey);
    await redis.del('health:test');

    console.log('\n✅ Redis is healthy and ready for permission caching!');
    
    await redis.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis health check failed:', error.message);
    await redis.quit();
    process.exit(1);
  }
}

checkRedisHealth();
EOF

chmod +x ../../scripts/check-redis-health.ts

# Create cache benchmark script
cat > ../../scripts/benchmark-cache.ts << 'EOF'
#!/usr/bin/env tsx

import Redis from 'ioredis';
import { performance } from 'perf_hooks';

async function benchmarkCache() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  });

  console.log('🚀 Starting cache benchmark...\n');

  // Test data
  const permissions = Array.from({ length: 50 }, (_, i) => 
    `platform.resource${i}.action${i % 5}`
  );
  const permissionData = JSON.stringify(permissions);

  // Benchmark single operations
  console.log('📊 Single Operation Benchmarks:');
  
  // SET benchmark
  const setStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    await redis.set(`bench:perm:${i}`, permissionData, 'EX', 60);
  }
  const setTime = performance.now() - setStart;
  console.log(`  SET: ${(setTime / 1000).toFixed(2)}ms avg`);

  // GET benchmark
  const getStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    await redis.get(`bench:perm:${i}`);
  }
  const getTime = performance.now() - getStart;
  console.log(`  GET: ${(getTime / 1000).toFixed(2)}ms avg`);

  // Pipeline benchmark
  console.log('\n📊 Pipeline Benchmarks:');
  
  const pipelineStart = performance.now();
  const pipeline = redis.pipeline();
  for (let i = 0; i < 1000; i++) {
    pipeline.get(`bench:perm:${i}`);
  }
  await pipeline.exec();
  const pipelineTime = performance.now() - pipelineStart;
  console.log(`  1000 GETs: ${pipelineTime.toFixed(2)}ms total`);
  console.log(`  Average: ${(pipelineTime / 1000).toFixed(2)}ms per operation`);

  // Permission check simulation
  console.log('\n📊 Permission Check Simulation:');
  
  const checkStart = performance.now();
  const checks = 10000;
  for (let i = 0; i < checks; i++) {
    const userId = Math.floor(Math.random() * 100);
    const key = `bench:perm:${userId}`;
    const cached = await redis.get(key);
    if (cached) {
      const perms = JSON.parse(cached);
      const hasPermission = perms.includes('platform.resource1.action1');
    }
  }
  const checkTime = performance.now() - checkStart;
  console.log(`  ${checks} permission checks: ${checkTime.toFixed(2)}ms`);
  console.log(`  Average: ${(checkTime / checks).toFixed(3)}ms per check`);

  // Cleanup
  const keys = await redis.keys('bench:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  console.log('\n✅ Benchmark complete!');
  
  await redis.quit();
}

benchmarkCache();
EOF

chmod +x ../../scripts/benchmark-cache.ts

# Create cache monitoring dashboard config
cat > ../../monitoring/grafana/dashboards/cache-performance.json << 'EOF'
{
  "dashboard": {
    "title": "Permission Cache Performance",
    "panels": [
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) * 100"
          }
        ]
      },
      {
        "title": "Cache Operations/sec",
        "targets": [
          {
            "expr": "rate(cache_operations_total[1m])"
          }
        ]
      },
      {
        "title": "Redis Memory Usage",
        "targets": [
          {
            "expr": "redis_memory_used_bytes"
          }
        ]
      },
      {
        "title": "Permission Check Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, permission_check_duration_seconds_bucket)"
          }
        ]
      }
    ]
  }
}
EOF

echo "✅ Redis caching setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run health check: pnpm tsx scripts/check-redis-health.ts"
echo "2. Run benchmark: pnpm tsx scripts/benchmark-cache.ts"
echo "3. Import cache module in app.module.ts"
echo "4. Update permission service to use caching"
echo "5. Configure monitoring dashboards"