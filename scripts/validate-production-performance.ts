#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { performance } from 'perf_hooks';
import * as chalk from 'chalk';

const prisma = new PrismaClient();

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  metrics?: Record<string, any>;
}

class ProductionValidator {
  private results: ValidationResult[] = [];
  private apiUrl: string;

  constructor(apiUrl: string = process.env.API_URL || 'http://localhost:3001') {
    this.apiUrl = apiUrl;
  }

  async validate() {
    console.log(chalk.blue.bold('🚀 Production Performance Validation\n'));

    await this.validateDatabaseConnectivity();
    await this.validateUuidImplementation();
    await this.validateQueryPerformance();
    await this.validateCacheSystem();
    await this.validateAuditSystem();
    await this.validateApiEndpoints();
    await this.validatePermissionSystem();

    this.printReport();
  }

  private async validateDatabaseConnectivity() {
    try {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = performance.now() - start;

      this.results.push({
        check: 'Database Connectivity',
        status: duration < 50 ? 'pass' : 'warn',
        message: `Connection established in ${duration.toFixed(2)}ms`,
        metrics: { connectionTime: duration },
      });
    } catch (error) {
      this.results.push({
        check: 'Database Connectivity',
        status: 'fail',
        message: `Failed to connect: ${error.message}`,
      });
    }
  }

  private async validateUuidImplementation() {
    try {
      // Check UUID fields exist
      const tables = ['users', 'accounts', 'tenants', 'roles', 'permissions'];
      let allValid = true;

      for (const table of tables) {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table} 
          AND column_name = 'uuid'
        `;

        if (!result[0] || result[0].data_type !== 'uuid') {
          allValid = false;
          break;
        }
      }

      // Check UUID generation
      const testResult = await prisma.$queryRaw`
        SELECT gen_random_uuid() as uuid
      `;

      this.results.push({
        check: 'UUID Implementation',
        status: allValid && testResult[0]?.uuid ? 'pass' : 'fail',
        message: allValid ? 'All tables have UUID fields' : 'Missing UUID fields',
        metrics: { tablesChecked: tables.length },
      });
    } catch (error) {
      this.results.push({
        check: 'UUID Implementation',
        status: 'fail',
        message: `UUID validation failed: ${error.message}`,
      });
    }
  }

  private async validateQueryPerformance() {
    const performanceTests = [
      {
        name: 'UUID Lookup',
        query: async () => {
          const user = await prisma.user.findFirst();
          if (!user) return 0;

          const start = performance.now();
          await prisma.user.findUnique({ where: { uuid: user.uuid } });
          return performance.now() - start;
        },
        target: 10, // ms
      },
      {
        name: 'Permission Check',
        query: async () => {
          const start = performance.now();
          await prisma.$queryRaw`
            SELECT EXISTS (
              SELECT 1
              FROM user_roles ur
              JOIN role_permissions rp ON ur.role_id = rp.role_id
              WHERE ur.user_id = 1
              AND ur.valid_until > NOW()
            )
          `;
          return performance.now() - start;
        },
        target: 5, // ms
      },
      {
        name: 'Indexed Query',
        query: async () => {
          const start = performance.now();
          await prisma.user.findMany({
            where: {
              isActive: true,
              deletedAt: null,
            },
            take: 10,
          });
          return performance.now() - start;
        },
        target: 20, // ms
      },
    ];

    for (const test of performanceTests) {
      try {
        const times: number[] = [];
        
        // Run multiple iterations
        for (let i = 0; i < 10; i++) {
          const duration = await test.query();
          times.push(duration);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

        this.results.push({
          check: `Query Performance: ${test.name}`,
          status: p95Time < test.target ? 'pass' : avgTime < test.target ? 'warn' : 'fail',
          message: `Avg: ${avgTime.toFixed(2)}ms, P95: ${p95Time.toFixed(2)}ms (Target: <${test.target}ms)`,
          metrics: { avgTime, p95Time, target: test.target },
        });
      } catch (error) {
        this.results.push({
          check: `Query Performance: ${test.name}`,
          status: 'fail',
          message: `Test failed: ${error.message}`,
        });
      }
    }
  }

  private async validateCacheSystem() {
    try {
      // Check cache tables exist
      const cacheTablesExist = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_name IN ('permission_cache', 'cache_invalidation_log', 'cache_metrics')
      `;

      if (cacheTablesExist[0].count < 3) {
        this.results.push({
          check: 'Cache System',
          status: 'fail',
          message: 'Cache tables missing',
        });
        return;
      }

      // Check cache effectiveness
      const cacheStats = await prisma.permissionCache.aggregate({
        _avg: { hitCount: true },
        _count: true,
        where: {
          expiresAt: { gte: new Date() },
        },
      });

      const hitRate = cacheStats._avg.hitCount || 0;

      this.results.push({
        check: 'Cache System',
        status: hitRate > 10 ? 'pass' : cacheStats._count > 0 ? 'warn' : 'fail',
        message: `${cacheStats._count} active entries, avg ${hitRate.toFixed(1)} hits`,
        metrics: {
          activeEntries: cacheStats._count,
          avgHits: hitRate,
        },
      });
    } catch (error) {
      this.results.push({
        check: 'Cache System',
        status: 'fail',
        message: `Cache validation failed: ${error.message}`,
      });
    }
  }

  private async validateAuditSystem() {
    try {
      // Check audit tables and partitions
      const partitions = await prisma.$queryRaw`
        SELECT 
          child.relname as partition_name
        FROM pg_inherits
        JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
        JOIN pg_class child ON pg_inherits.inhrelid = child.oid
        WHERE parent.relname = 'audit_logs'
      `;

      // Check recent audit logs
      const recentLogs = await prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      this.results.push({
        check: 'Audit System',
        status: partitions.length > 0 && recentLogs > 0 ? 'pass' : 'warn',
        message: `${partitions.length} partitions, ${recentLogs} logs in last hour`,
        metrics: {
          partitionCount: partitions.length,
          recentLogs,
        },
      });
    } catch (error) {
      this.results.push({
        check: 'Audit System',
        status: 'fail',
        message: `Audit validation failed: ${error.message}`,
      });
    }
  }

  private async validateApiEndpoints() {
    const endpoints = [
      { path: '/health', method: 'GET' },
      { path: '/api/v1/users', method: 'GET' },
      { path: '/metrics', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      try {
        const start = performance.now();
        const response = await axios({
          method: endpoint.method,
          url: `${this.apiUrl}${endpoint.path}`,
          timeout: 5000,
          validateStatus: () => true,
        });
        const duration = performance.now() - start;

        this.results.push({
          check: `API Endpoint: ${endpoint.method} ${endpoint.path}`,
          status: response.status < 400 ? 'pass' : 'fail',
          message: `Status: ${response.status}, Response time: ${duration.toFixed(2)}ms`,
          metrics: {
            statusCode: response.status,
            responseTime: duration,
          },
        });
      } catch (error) {
        this.results.push({
          check: `API Endpoint: ${endpoint.method} ${endpoint.path}`,
          status: 'fail',
          message: `Request failed: ${error.message}`,
        });
      }
    }
  }

  private async validatePermissionSystem() {
    try {
      // Check permission structure
      const permissions = await prisma.permission.count({
        where: { isActive: true },
      });

      const roles = await prisma.role.count({
        where: { isActive: true },
      });

      const assignments = await prisma.userRole.count({
        where: {
          validUntil: { gte: new Date() },
        },
      });

      this.results.push({
        check: 'Permission System',
        status: permissions > 0 && roles > 0 ? 'pass' : 'fail',
        message: `${permissions} permissions, ${roles} roles, ${assignments} active assignments`,
        metrics: {
          permissions,
          roles,
          activeAssignments: assignments,
        },
      });
    } catch (error) {
      this.results.push({
        check: 'Permission System',
        status: 'fail',
        message: `Permission validation failed: ${error.message}`,
      });
    }
  }

  private printReport() {
    console.log(chalk.blue.bold('\n📊 Validation Report\n'));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    // Print results
    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
      const color = result.status === 'pass' ? chalk.green : result.status === 'warn' ? chalk.yellow : chalk.red;
      
      console.log(`${icon} ${color(result.check)}`);
      console.log(`   ${result.message}`);
      
      if (result.metrics) {
        console.log(`   ${chalk.gray(JSON.stringify(result.metrics))}`);
      }
      console.log();
    }

    // Summary
    console.log(chalk.blue.bold('\n📈 Summary\n'));
    console.log(`${chalk.green(`✅ Passed: ${passed}`)}`);
    console.log(`${chalk.yellow(`⚠️  Warnings: ${warnings}`)}`);
    console.log(`${chalk.red(`❌ Failed: ${failed}`)}`);

    // Overall status
    const overallStatus = failed > 0 ? 'FAILED' : warnings > 3 ? 'WARNING' : 'PASSED';
    const statusColor = overallStatus === 'PASSED' ? chalk.green : overallStatus === 'WARNING' ? chalk.yellow : chalk.red;
    
    console.log(`\n${statusColor.bold(`Overall Status: ${overallStatus}`)}`);

    // Exit code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run validation
async function main() {
  const validator = new ProductionValidator();
  
  try {
    await validator.validate();
  } catch (error) {
    console.error(chalk.red('Validation failed:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();