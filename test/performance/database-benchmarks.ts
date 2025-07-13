#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
}

class DatabaseBenchmark {
  private results: BenchmarkResult[] = [];

  async run() {
    console.log('🚀 Starting Database Performance Benchmarks\n');

    await this.warmup();
    
    // Run benchmarks
    await this.benchmarkUuidLookup();
    await this.benchmarkIndexedQueries();
    await this.benchmarkPermissionChecks();
    await this.benchmarkAuditLogging();
    await this.benchmarkCacheOperations();
    await this.benchmarkBulkOperations();
    await this.benchmarkComplexQueries();

    // Generate report
    this.generateReport();
  }

  private async warmup() {
    console.log('Warming up database connections...');
    await prisma.$queryRaw`SELECT 1`;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async benchmarkUuidLookup() {
    console.log('📊 Benchmarking UUID lookups...');
    
    // Create test data
    const testUser = await prisma.user.create({
      data: {
        account: {
          create: {
            tenant: {
              create: {
                name: 'Benchmark Tenant',
                domain: `benchmark-${Date.now()}.com`,
              },
            },
            email: `bench-${Date.now()}@example.com`,
            passwordHash: 'dummy',
          },
        },
        firstName: 'Benchmark',
        lastName: 'User',
        username: `bench_${Date.now()}`,
        userHash: crypto.randomUUID(),
      },
    });

    const times: number[] = [];
    const iterations = 1000;

    // Benchmark UUID lookup
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await prisma.user.findUnique({
        where: { uuid: testUser.uuid },
      });
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('UUID Lookup', times);

    // Compare with ID lookup
    const idTimes: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      const end = performance.now();
      idTimes.push(end - start);
    }

    this.recordResult('ID Lookup (comparison)', idTimes);

    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
  }

  private async benchmarkIndexedQueries() {
    console.log('📊 Benchmarking indexed queries...');

    const times: number[] = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Query using composite index
      await prisma.user.findMany({
        where: {
          account: {
            tenantId: 1,
            isActive: true,
          },
          isActive: true,
          deletedAt: null,
        },
        take: 10,
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Indexed Query (tenant + active)', times);
  }

  private async benchmarkPermissionChecks() {
    console.log('📊 Benchmarking permission checks...');

    // Create test data
    const role = await prisma.role.create({
      data: {
        name: 'Benchmark Role',
        code: `BENCH_${Date.now()}`,
        tenantId: 1,
        level: 50,
      },
    });

    const permission = await prisma.permission.create({
      data: {
        name: `bench.test.${Date.now()}`,
        domain: 'bench',
        resource: 'test',
        action: 'read',
        displayName: 'Benchmark Permission',
      },
    });

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    const times: number[] = [];
    const iterations = 500;

    // Benchmark permission check query
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      const hasPermission = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE ur.user_id = 1
          AND p.name = ${permission.name}
          AND (ur.valid_until IS NULL OR ur.valid_until > NOW())
        ) as has_permission
      `;
      
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Permission Check Query', times);

    // Cleanup
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.permission.delete({ where: { id: permission.id } });
    await prisma.role.delete({ where: { id: role.id } });
  }

  private async benchmarkAuditLogging() {
    console.log('📊 Benchmarking audit logging...');

    const times: number[] = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      await prisma.auditLog.create({
        data: {
          category: 'DATA_CHANGE',
          eventType: 'benchmark',
          entityType: 'test',
          entityId: crypto.randomUUID(),
          tenantId: 1,
          userId: 1,
          operation: 'benchmark_test',
          status: 'COMPLETED',
        },
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Audit Log Insert', times);

    // Test partitioned query performance
    const queryTimes: number[] = [];
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      
      await prisma.auditLog.findMany({
        where: {
          tenantId: 1,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
      
      const end = performance.now();
      queryTimes.push(end - start);
    }

    this.recordResult('Audit Log Query (partitioned)', queryTimes);
  }

  private async benchmarkCacheOperations() {
    console.log('📊 Benchmarking cache operations...');

    const times: number[] = [];
    const iterations = 500;

    for (let i = 0; i < iterations; i++) {
      const cacheKey = `bench:${i}`;
      const permissions = Array.from({ length: 50 }, (_, j) => `perm.${j}`);
      
      const start = performance.now();
      
      await prisma.permissionCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          userId: 1,
          tenantId: 1,
          context: 'tenant',
          permissions,
          roles: [1, 2, 3],
          computedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          version: 1,
          hash: crypto.randomUUID(),
        },
        update: {
          permissions,
          version: { increment: 1 },
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        },
      });
      
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Cache Upsert', times);

    // Cleanup
    await prisma.permissionCache.deleteMany({
      where: { cacheKey: { startsWith: 'bench:' } },
    });
  }

  private async benchmarkBulkOperations() {
    console.log('📊 Benchmarking bulk operations...');

    // Test bulk insert
    const insertTimes: number[] = [];
    const batchSizes = [10, 50, 100, 500];

    for (const batchSize of batchSizes) {
      const users = Array.from({ length: batchSize }, (_, i) => ({
        tenantId: 1,
        email: `bulk-${Date.now()}-${i}@example.com`,
        passwordHash: 'dummy',
      }));

      const start = performance.now();
      
      await prisma.account.createMany({
        data: users,
      });
      
      const end = performance.now();
      insertTimes.push(end - start);

      console.log(`  Bulk insert ${batchSize} records: ${(end - start).toFixed(2)}ms`);
    }

    // Test bulk update
    const updateStart = performance.now();
    
    await prisma.account.updateMany({
      where: {
        email: { startsWith: `bulk-${Date.now()}` },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    const updateEnd = performance.now();
    console.log(`  Bulk update: ${(updateEnd - updateStart).toFixed(2)}ms`);

    // Cleanup
    await prisma.account.deleteMany({
      where: { email: { contains: 'bulk-' } },
    });
  }

  private async benchmarkComplexQueries() {
    console.log('📊 Benchmarking complex queries...');

    const times: number[] = [];
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Complex query with multiple joins and aggregations
      await prisma.$queryRaw`
        WITH user_permissions AS (
          SELECT 
            u.id,
            u.uuid,
            array_agg(DISTINCT p.name) as permissions
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id
          LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
          LEFT JOIN permissions p ON rp.permission_id = p.id
          WHERE u.deleted_at IS NULL
          AND u.is_active = true
          GROUP BY u.id, u.uuid
        ),
        user_activity AS (
          SELECT 
            user_id,
            COUNT(*) as action_count,
            MAX(created_at) as last_action
          FROM audit_logs
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY user_id
        )
        SELECT 
          up.uuid,
          up.permissions,
          COALESCE(ua.action_count, 0) as recent_actions,
          ua.last_action
        FROM user_permissions up
        LEFT JOIN user_activity ua ON up.id = ua.user_id
        LIMIT 10
      `;
      
      const end = performance.now();
      times.push(end - start);
    }

    this.recordResult('Complex Query (CTEs + Aggregations)', times);
  }

  private recordResult(operation: string, times: number[]) {
    times.sort((a, b) => a - b);
    
    const result: BenchmarkResult = {
      operation,
      iterations: times.length,
      totalTime: times.reduce((a, b) => a + b, 0),
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: times[0],
      maxTime: times[times.length - 1],
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)],
    };

    this.results.push(result);
    
    console.log(`  ✅ ${operation}`);
    console.log(`     Avg: ${result.avgTime.toFixed(2)}ms`);
    console.log(`     P95: ${result.p95.toFixed(2)}ms`);
    console.log(`     P99: ${result.p99.toFixed(2)}ms\n`);
  }

  private generateReport() {
    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('================================\n');

    // Summary table
    console.log('Operation                          | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms)');
    console.log('-----------------------------------|----------|----------|----------|----------');
    
    for (const result of this.results) {
      const name = result.operation.padEnd(34);
      const avg = result.avgTime.toFixed(2).padStart(8);
      const p50 = result.p50.toFixed(2).padStart(8);
      const p95 = result.p95.toFixed(2).padStart(8);
      const p99 = result.p99.toFixed(2).padStart(8);
      
      console.log(`${name} | ${avg} | ${p50} | ${p95} | ${p99}`);
    }

    // Performance analysis
    console.log('\n📈 Performance Analysis:');
    
    const uuidLookup = this.results.find(r => r.operation === 'UUID Lookup');
    const idLookup = this.results.find(r => r.operation === 'ID Lookup (comparison)');
    
    if (uuidLookup && idLookup) {
      const overhead = ((uuidLookup.avgTime / idLookup.avgTime - 1) * 100).toFixed(1);
      console.log(`  - UUID lookup overhead: ${overhead}%`);
    }

    const permCheck = this.results.find(r => r.operation === 'Permission Check Query');
    if (permCheck && permCheck.p95 < 5) {
      console.log('  - ✅ Permission checks meet <5ms P95 target');
    } else {
      console.log('  - ⚠️  Permission checks exceed 5ms P95 target');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, `benchmark-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run benchmarks
async function main() {
  const benchmark = new DatabaseBenchmark();
  
  try {
    await benchmark.run();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();