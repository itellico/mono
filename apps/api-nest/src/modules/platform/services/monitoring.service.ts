import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import * as os from 'os';

@Injectable()
export class MonitoringService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getSystemHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckResult(checks[0]),
        redis: this.getCheckResult(checks[1]),
        diskSpace: this.getCheckResult(checks[2]),
        memory: this.getCheckResult(checks[3]),
      },
    };

    // Determine overall status
    const hasErrors = Object.values(health.checks).some(check => check.status === 'error');
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
    
    if (hasErrors) {
      health.status = 'unhealthy';
    } else if (hasWarnings) {
      health.status = 'degraded';
    }

    return {
      success: true,
      data: health,
    };
  }

  async getMetrics(query: {
    metric?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // TODO: Implement metrics collection
    return {
      success: true,
      data: {
        metrics: [],
        period: query.period || 'hour',
      },
    };
  }

  async getServicesStatus() {
    const services = [
      { name: 'API', status: 'running', uptime: process.uptime() },
      { name: 'Database', status: await this.checkDatabase() ? 'running' : 'down' },
      { name: 'Redis', status: await this.checkRedis() ? 'running' : 'down' },
      { name: 'Queue', status: 'running' }, // TODO: Check actual queue status
    ];

    return {
      success: true,
      data: services,
    };
  }

  async getResourceUsage() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      success: true,
      data: {
        cpu: {
          count: cpus.length,
          model: cpus[0]?.model,
          usage: this.getCPUUsage(),
        },
        memory: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
          percentage: Math.round((usedMemory / totalMemory) * 100),
        },
        uptime: {
          system: os.uptime(),
          process: process.uptime(),
        },
        loadAverage: os.loadavg(),
      },
    };
  }

  async getErrors(query: {
    severity?: string;
    service?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { level: 'error' };
    
    if (query.severity) {
      where.severity = query.severity;
    }
    
    if (query.service) {
      where.service = query.service;
    }

    // TODO: Implement error logging tables in schema
    const errors = [];
    const total = 0;
    
    // const [errors, total] = await Promise.all([
    //   this.prisma.errorLog.findMany({
    //     where,
    //     skip,
    //     take: limit,
    //     orderBy: { created_at: 'desc' },
    //   }),
    //   this.prisma.errorLog.count({ where }),
    // ]);

    return {
      success: true,
      data: {
        items: errors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getPerformanceMetrics(query: {
    endpoint?: string;
    method?: string;
    percentile?: number;
  }) {
    // TODO: Implement performance metrics collection
    return {
      success: true,
      data: {
        metrics: {
          avgResponseTime: 45,
          p50: 30,
          p95: 150,
          p99: 300,
          requestsPerSecond: 1250,
        },
      },
    };
  }

  async getAlerts(query: {
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }) {
    // TODO: Implement alerts system
    return {
      success: true,
      data: {
        items: [],
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total: 0,
          totalPages: 0,
        },
      },
    };
  }

  async getLogs(query: {
    level?: string;
    service?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (query.level) {
      where.level = query.level;
    }
    
    if (query.service) {
      where.service = query.service;
    }
    
    if (query.search) {
      where.message = { contains: query.search, mode: 'insensitive' };
    }

    // TODO: Implement system logging tables in schema
    const logs = [];
    const total = 0;
    
    // const [logs, total] = await Promise.all([
    //   this.prisma.systemLog.findMany({
    //     where,
    //     skip,
    //     take: limit,
    //     orderBy: { created_at: 'desc' },
    //   }),
    //   this.prisma.systemLog.count({ where }),
    // ]);

    return {
      success: true,
      data: {
        items: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getUptime(query: {
    service?: string;
    period?: string;
  }) {
    const uptime = {
      api: {
        current: process.uptime(),
        percentage: 99.9, // TODO: Calculate from logs
      },
      database: {
        current: 0, // TODO: Get from database
        percentage: 99.95,
      },
      redis: {
        current: 0, // TODO: Get from Redis
        percentage: 99.99,
      },
    };

    return {
      success: true,
      data: query.service ? uptime[query.service] || {} : uptime,
    };
  }

  async getQueueStats() {
    // TODO: Implement queue statistics
    return {
      success: true,
      data: {
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: false,
      },
    };
  }

  async getDatabaseStats() {
    const [tableStats, connectionStats] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      `,
    ]);

    return {
      success: true,
      data: {
        tables: tableStats,
        connections: connectionStats[0] || {},
      },
    };
  }

  async getCacheStats() {
    const info = await this.redis.info();
    const dbSize = await this.redis.dbSize();

    // Parse Redis info
    const stats = this.parseRedisInfo(info);

    return {
      success: true,
      data: {
        keys: dbSize,
        memory: stats.used_memory_human,
        hits: stats.keyspace_hits,
        misses: stats.keyspace_misses,
        hitRate: stats.keyspace_hits 
          ? (stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses) * 100).toFixed(2) + '%'
          : '0%',
        connectedClients: stats.connected_clients,
        uptime: stats.uptime_in_seconds,
      },
    };
  }

  // Helper methods
  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkDiskSpace() {
    // TODO: Implement disk space check
    return { status: 'healthy', usage: 45 };
  }

  private async checkMemory() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    return {
      status: usagePercent > 90 ? 'warning' : 'healthy',
      usage: Math.round(usagePercent),
    };
  }

  private getCheckResult(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { status: 'error', error: result.reason?.message || 'Check failed' };
  }

  private getCPUUsage() {
    // TODO: Implement CPU usage calculation
    return {
      user: 25,
      system: 10,
      idle: 65,
    };
  }

  private parseRedisInfo(info: string): any {
    const result: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }
}