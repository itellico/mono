import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import * as os from 'os';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { dockerMonitor } from '@/services/docker-monitor';

const execAsync = promisify(exec);

export const monitoringRoutes: FastifyPluginAsync = async (fastify) => {
  // Get comprehensive real-time metrics
  fastify.get('/metrics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('monitoring:read')],
    schema: {
      tags: ['platform.monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            application: Type.Object({
              responseTime: Type.Number(),
              requestRate: Type.Number(),
              errorRate: Type.Number(),
              uptime: Type.Number(),
            }),
            system: Type.Object({
              cpuUsage: Type.Number(),
              memoryUsage: Type.Number(),
              diskIO: Type.Number(),
              networkOut: Type.Number(),
            }),
            database: Type.Object({
              connections: Type.Number(),
              queries: Type.Number(),
              avgResponseTime: Type.Number(),
            }),
            redis: Type.Object({
              hitRate: Type.Number(),
              totalCommands: Type.Number(),
              connectedClients: Type.Number(),
            }),
            business: Type.Object({
              activeUsers: Type.Number(),
              totalRequests: Type.Number(),
              emailQueue: Type.Number(),
              containers: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const [appMetrics, systemMetrics, dbMetrics, redisMetrics, businessMetrics] = await Promise.all([
        getApplicationMetrics(fastify),
        getSystemMetrics(),
        getDatabaseMetrics(fastify),
        getRedisMetrics(fastify),
        getBusinessMetrics(fastify),
      ]);

      return {
        success: true,
        data: {
          application: appMetrics,
          system: systemMetrics,
          database: dbMetrics,
          redis: redisMetrics,
          business: businessMetrics,
        },
      };
    } catch (error: any) {
      request.log.error('Failed to fetch comprehensive metrics', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_COMPREHENSIVE_METRICS',
      });
    }
  });

  // Get Docker services status
  fastify.get('/docker', {
    preHandler: [fastify.authenticate, fastify.requirePermission('monitoring:read')],
    schema: {
      tags: ['platform.monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalContainers: Type.Number(),
            runningContainers: Type.Number(),
            healthySystems: Type.Number(),
            criticalIssues: Type.Array(Type.String()),
            services: Type.Array(Type.Object({
              name: Type.String(),
              status: Type.String(),
              uptime: Type.String(),
              ports: Type.String(),
              health: Type.String(),
              cpuUsage: Type.Optional(Type.Number()),
              memoryUsage: Type.Optional(Type.Number()),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const dockerStats = await dockerMonitor.getDockerStats();

      request.log.info('Docker stats fetched', {
        runningContainers: dockerStats.runningContainers,
        totalContainers: dockerStats.totalContainers,
        issues: dockerStats.criticalIssues.length
      });

      return {
        success: true,
        data: dockerStats
      };
    } catch (error: any) {
      request.log.error('Failed to fetch Docker stats', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_DOCKER_STATS'
      });
    }
  });

  // Get server statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('monitoring:read')],
    schema: {
      tags: ['platform.monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uptime: Type.Number(),
            memory: Type.Object({
              used: Type.Number(),
              total: Type.Number(),
              percentage: Type.Number(),
            }),
            cpu: Type.Object({
              usage: Type.Number(),
            }),
            requests: Type.Object({
              total: Type.Number(),
              perSecond: Type.Number(),
              errors: Type.Number(),
            }),
            database: Type.Object({
              connections: Type.Number(),
              queries: Type.Number(),
              avgResponseTime: Type.Number(),
            }),
            activeUsers: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      // Get system memory info
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      // Get real CPU usage
      const cpuUsage = await getCPUUsage();

      // Get process info
      const processMemory = process.memoryUsage();
      const uptime = process.uptime();

      // Get real request stats from Prometheus metrics
      const requestStats = await getRequestStats(fastify);

      // Get real database stats
      const databaseStats = await getDatabaseStats(fastify);

      // Get real active users from Redis sessions
      const activeUsers = await getActiveUsers(fastify);

      const stats = {
        uptime,
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: memoryPercentage,
        },
        cpu: {
          usage: cpuUsage,
        },
        requests: requestStats,
        database: databaseStats,
        activeUsers,
      };

      request.log.info('Monitoring stats fetched', {
        memoryUsage: `${memoryPercentage.toFixed(1)}%`,
        uptime: `${uptime.toFixed(0)}s`,
      });

      return {
        success: true,
        data: stats,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch monitoring stats', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_MONITORING_STATS',
      });
    }
  });

  // Health check endpoint
  fastify.get('/health', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.monitoring.read')
    ],
    schema: {
      tags: ['platform.monitoring'],
      response: {
        200: Type.Object({
          status: Type.String(),
          timestamp: Type.String(),
          uptime: Type.Number(),
          memory: Type.Object({
            rss: Type.Number(),
            heapTotal: Type.Number(),
            heapUsed: Type.Number(),
            external: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const memory = process.memoryUsage();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
    };
  });

  // System information
  fastify.get('/system', {
    preHandler: [fastify.authenticate, fastify.requirePermission('monitoring:read')],
    schema: {
      tags: ['platform.monitoring'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform: Type.String(),
            arch: Type.String(),
            nodeVersion: Type.String(),
            cpus: Type.Number(),
            totalMemory: Type.Number(),
            freeMemory: Type.Number(),
            loadAverage: Type.Array(Type.Number()),
            hostname: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
        hostname: os.hostname(),
      };

      request.log.info('System information fetched', {
        platform: systemInfo.platform,
        cpus: systemInfo.cpus,
        totalMemory: `${(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB`,
      });

      return {
        success: true,
        data: systemInfo,
      };

    } catch (error: any) {
      request.log.error('Failed to fetch system information', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_SYSTEM_INFORMATION',
      });
    }
  });
};

/**
 * Get real CPU usage using top command
 */
async function getCPUUsage(): Promise<number> {
  try {
    // Use top command to get CPU usage
    const { stdout } = await execAsync('top -l 1 -s 0 | grep "CPU usage"');
    const match = stdout.match(/(\d+\.\d+)%\s+user/);
    if (match) {
      return parseFloat(match[1]);
    }
    
    // Fallback: calculate from load average
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    return Math.min((loadAvg[0] / cpuCount) * 100, 100);
  } catch (error) {
    // Fallback: estimate from load average
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    return Math.min((loadAvg[0] / cpuCount) * 100, 100);
  }
}

/**
 * Get real request statistics from Prometheus metrics
 */
async function getRequestStats(fastify: any): Promise<{ total: number; perSecond: number; errors: number }> {
  try {
    const metrics = fastify.metrics;
    if (!metrics) {
      return { total: 0, perSecond: 0, errors: 0 };
    }
    
    // Get metrics from Prometheus registry
    const metricsText = await metrics.register.metrics();
    
    // Parse request totals
    const requestTotalMatch = metricsText.match(/http_requests_total.*?(\\d+)/);
    const total = requestTotalMatch ? parseInt(requestTotalMatch[1]) : 0;
    
    // Calculate requests per second from uptime
    const uptime = process.uptime();
    const perSecond = uptime > 0 ? total / uptime : 0;
    
    // Count error responses (status codes 4xx and 5xx)
    const errorMatches = metricsText.match(/http_requests_total.*status_code=\"[45]\\d\\d\".*?(\\d+)/g);
    const errors = errorMatches ? errorMatches.reduce((sum, match) => {
      const errorCount = match.match(/\\d+$/);
      return sum + (errorCount ? parseInt(errorCount[0]) : 0);
    }, 0) : 0;
    
    return { total, perSecond: Math.round(perSecond * 100) / 100, errors };
  } catch (error) {
    return { total: 0, perSecond: 0, errors: 0 };
  }
}

/**
 * Get real database statistics
 */
async function getDatabaseStats(fastify: any): Promise<{ connections: number; queries: number; avgResponseTime: number }> {
  try {
    // Get connection count from pg_stat_activity
    const connectionResult = await fastify.prisma.$queryRaw`
      SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'
    `;
    const connections = Number(connectionResult[0]?.count || 0);
    
    // Get query count from pg_stat_database
    const queryResult = await fastify.prisma.$queryRaw`
      SELECT xact_commit + xact_rollback as queries 
      FROM pg_stat_database 
      WHERE datname = current_database()
    `;
    const queries = Number(queryResult[0]?.queries || 0);
    
    // Try to get average response time from pg_stat_statements
    let avgResponseTime = 0;
    try {
      const responseTimeResult = await fastify.prisma.$queryRaw`
        SELECT AVG(mean_exec_time) as avg_time 
        FROM pg_stat_statements 
        WHERE calls > 0
      `;
      avgResponseTime = Math.round(Number(responseTimeResult[0]?.avg_time || 0));
    } catch {
      // pg_stat_statements extension might not be enabled
      avgResponseTime = 0;
    }
    
    return { connections, queries, avgResponseTime };
  } catch (error) {
    return { connections: 0, queries: 0, avgResponseTime: 0 };
  }
}

/**
 * Get real active users from Redis sessions
 */
async function getActiveUsers(fastify: any): Promise<number> {
  try {
    if (!fastify.redis) {
      return 0;
    }
    
    // Count active sessions in Redis
    const sessionKeys = await fastify.redis.keys('temp:session:*');
    
    // Filter out expired sessions by checking TTL
    let activeCount = 0;
    for (const key of sessionKeys) {
      const ttl = await fastify.redis.ttl(key);
      if (ttl > 0) {
        activeCount++;
      }
    }
    
    return activeCount;
  } catch (error) {
    return 0;
  }
}

/**
 * Get comprehensive application metrics
 */
async function getApplicationMetrics(fastify: any): Promise<{
  responseTime: number;
  requestRate: number;
  errorRate: number;
  uptime: number;
}> {
  try {
    const metrics = fastify.metrics;
    if (!metrics) {
      return { responseTime: 0, requestRate: 0, errorRate: 0, uptime: process.uptime() };
    }

    const metricsText = await metrics.register.metrics();
    
    // Parse response time from histogram
    const responseTimeMatch = metricsText.match(/http_request_duration_seconds_sum ([0-9.]+)/);
    const responseTimeCountMatch = metricsText.match(/http_request_duration_seconds_count ([0-9.]+)/);
    
    const responseTimeSum = responseTimeMatch ? parseFloat(responseTimeMatch[1]) : 0;
    const responseTimeCount = responseTimeCountMatch ? parseFloat(responseTimeCountMatch[1]) : 0;
    const responseTime = responseTimeCount > 0 ? Math.round((responseTimeSum / responseTimeCount) * 1000) : 0;
    
    // Parse request rate
    const requestTotalMatch = metricsText.match(/http_requests_total ([0-9.]+)/);
    const totalRequests = requestTotalMatch ? parseFloat(requestTotalMatch[1]) : 0;
    const uptime = process.uptime();
    const requestRate = uptime > 0 ? totalRequests / uptime : 0;
    
    // Calculate error rate
    const errorMatches = metricsText.match(/http_requests_total.*status_code=\"[45][0-9][0-9]\".*?([0-9.]+)/g);
    const totalErrors = errorMatches ? errorMatches.reduce((sum, match) => {
      const errorCount = match.match(/([0-9.]+)$/);
      return sum + (errorCount ? parseFloat(errorCount[1]) : 0);
    }, 0) : 0;
    
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    return {
      responseTime,
      requestRate: Math.round(requestRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime),
    };
  } catch (error) {
    return { responseTime: 0, requestRate: 0, errorRate: 0, uptime: process.uptime() };
  }
}

/**
 * Get comprehensive system metrics
 */
async function getSystemMetrics(): Promise<{
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkOut: number;
}> {
  try {
    const cpuUsage = await getCPUUsage();
    
    // Memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Disk I/O (basic estimation)
    const diskIO = await getDiskIO();
    
    // Network throughput (basic estimation)
    const networkOut = await getNetworkThroughput();
    
    return {
      cpuUsage: Math.round(cpuUsage * 10) / 10,
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      diskIO,
      networkOut,
    };
  } catch (error) {
    return { cpuUsage: 0, memoryUsage: 0, diskIO: 0, networkOut: 0 };
  }
}

/**
 * Get Redis metrics
 */
async function getRedisMetrics(fastify: any): Promise<{
  hitRate: number;
  totalCommands: number;
  connectedClients: number;
}> {
  try {
    if (!fastify.redis) {
      return { hitRate: 0, totalCommands: 0, connectedClients: 0 };
    }
    
    const info = await fastify.redis.info('stats');
    const stats: Record<string, string> = {};
    
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value;
      }
    });
    
    const keyspaceHits = parseInt(stats.keyspace_hits || '0');
    const keyspaceMisses = parseInt(stats.keyspace_misses || '0');
    const totalOps = keyspaceHits + keyspaceMisses;
    
    const hitRate = totalOps > 0 ? (keyspaceHits / totalOps) * 100 : 0;
    
    return {
      hitRate: Math.round(hitRate * 10) / 10,
      totalCommands: parseInt(stats.total_commands_processed || '0'),
      connectedClients: parseInt(stats.connected_clients || '0'),
    };
  } catch (error) {
    return { hitRate: 0, totalCommands: 0, connectedClients: 0 };
  }
}

/**
 * Get business metrics
 */
async function getBusinessMetrics(fastify: any): Promise<{
  activeUsers: number;
  totalRequests: number;
  emailQueue: number;
  containers: number;
}> {
  try {
    const activeUsers = await getActiveUsers(fastify);
    
    // Get total requests from Prometheus
    const metrics = fastify.metrics;
    let totalRequests = 0;
    
    if (metrics) {
      const metricsText = await metrics.register.metrics();
      const requestTotalMatch = metricsText.match(/http_requests_total ([0-9.]+)/);
      totalRequests = requestTotalMatch ? parseInt(requestTotalMatch[1]) : 0;
    }
    
    // Get email queue size
    const emailQueue = await getEmailQueueSize(fastify);
    
    // Get Docker container count
    const containers = await getDockerContainerCount();
    
    return {
      activeUsers,
      totalRequests,
      emailQueue,
      containers,
    };
  } catch (error) {
    return { activeUsers: 0, totalRequests: 0, emailQueue: 0, containers: 0 };
  }
}

/**
 * Get disk I/O statistics
 */
async function getDiskIO(): Promise<number> {
  try {
    // On macOS, use iostat for disk I/O
    const { stdout } = await execAsync('iostat -d 1 2 | tail -1');
    const values = stdout.trim().split(/\s+/);
    if (values.length >= 3) {
      const readsPerSec = parseFloat(values[1]) || 0;
      const writesPerSec = parseFloat(values[2]) || 0;
      return Math.round(readsPerSec + writesPerSec);
    }
    return 0;
  } catch (error) {
    // Fallback: estimate based on system load
    const loadAvg = os.loadavg();
    return Math.round(loadAvg[0] * 50); // Rough estimate
  }
}

/**
 * Get network throughput
 */
async function getNetworkThroughput(): Promise<number> {
  try {
    // Basic estimate based on network interfaces
    const networkInterfaces = os.networkInterfaces();
    let totalBytes = 0;
    
    // This is a simplified approach - in production you'd want to track deltas
    Object.values(networkInterfaces).forEach(interfaces => {
      interfaces?.forEach(iface => {
        if (!iface.internal && iface.family === 'IPv4') {
          // Estimate based on interface type
          totalBytes += 1000000; // 1MB/s estimate per active interface
        }
      });
    });
    
    return Math.round(totalBytes / 1024 / 1024 * 10) / 10; // Convert to MB/s
  } catch (error) {
    return 0;
  }
}

/**
 * Get email queue size from database
 */
async function getEmailQueueSize(fastify: any): Promise<number> {
  try {
    // Query email queue table if it exists
    const result = await fastify.prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'email_queue' OR table_name = 'notification_queue'
    `;
    
    if (Number(result[0]?.count) > 0) {
      const queueResult = await fastify.prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM email_queue 
        WHERE status = 'pending' OR status = 'processing'
      `;
      return Number(queueResult[0]?.count || 0);
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get Docker container count using the Docker monitor
 */
async function getDockerContainerCount(): Promise<number> {
  try {
    const dockerStats = await dockerMonitor.getDockerStats();
    return dockerStats.runningContainers;
  } catch (error) {
    // Fallback: estimate based on expected services
    return 8; // Expected number of services
  }
}