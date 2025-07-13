import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import promClient from 'prom-client';

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mono-platform-api',
  version: process.env.npm_package_version || '1.0.0',
});

// Enable the collection of default metrics with enhanced configuration
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'mono_platform_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 5,
});

// Custom metrics for itellico Mono
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  registers: [register],
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model', 'tenant_id'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

const databaseQueriesTotal = new promClient.Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'tenant_id'],
  registers: [register],
});

const activeSessionsGauge = new promClient.Gauge({
  name: 'active_sessions_total',
  help: 'Number of active user sessions',
  labelNames: ['tenant_id'],
  registers: [register],
});

// System resource metrics
const systemMetrics = {
  cpuUsage: new promClient.Gauge({
    name: 'mono_system_cpu_usage_percent',
    help: 'Current CPU usage percentage',
    registers: [register],
  }),
  memoryUsage: new promClient.Gauge({
    name: 'mono_system_memory_usage_percent',
    help: 'Current memory usage percentage',
    registers: [register],
  }),
  diskIO: new promClient.Gauge({
    name: 'mono_system_disk_io_ops_per_second',
    help: 'Disk I/O operations per second',
    registers: [register],
  }),
  networkThroughput: new promClient.Gauge({
    name: 'mono_system_network_throughput_mbps',
    help: 'Network throughput in MB/s',
    registers: [register],
  }),
};

const businessMetrics = {
  usersTotal: new promClient.Gauge({
    name: 'mono_users_total',
    help: 'Total number of users',
    labelNames: ['tenant_id', 'status'],
    registers: [register],
  }),
  tenantsTotal: new promClient.Gauge({
    name: 'mono_tenants_total',
    help: 'Total number of tenants',
    labelNames: ['status'],
    registers: [register],
  }),
  subscriptionsTotal: new promClient.Gauge({
    name: 'mono_subscriptions_total',
    help: 'Total number of active subscriptions',
    labelNames: ['plan_type', 'tenant_id'],
    registers: [register],
  }),
  dockerContainers: new promClient.Gauge({
    name: 'mono_docker_containers_running',
    help: 'Number of running Docker containers',
    registers: [register],
  }),
};

const prometheusPlugin: FastifyPluginAsync = async (fastify) => {
  // Add metrics to fastify instance
  fastify.decorate('metrics', {
    register,
    httpRequestDuration,
    httpRequestsTotal,
    databaseQueryDuration,
    databaseQueriesTotal,
    activeSessionsGauge,
    systemMetrics,
    businessMetrics,
  });

  // Add request tracking hook
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
  });

  // Add response tracking hook
  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime;
    
    // Skip metrics if startTime is not set or invalid
    if (!startTime || isNaN(startTime)) {
      return;
    }
    
    const duration = (Date.now() - startTime) / 1000;
    
    // Validate duration is a valid number
    if (isNaN(duration) || duration < 0) {
      return;
    }
    
    const route = request.routeOptions?.url || request.url;
    const method = request.method;
    const statusCode = reply.statusCode.toString();
    const tenantId = (request as any).user?.tenantId?.toString() || 'unknown';

    try {
      // Update metrics with error handling
      httpRequestDuration
        .labels(method, route, statusCode, tenantId)
        .observe(duration);

      httpRequestsTotal
        .labels(method, route, statusCode, tenantId)
        .inc();
    } catch (error) {
      fastify.log.error('Prometheus metrics error:', error);
    }
  });

  // Metrics endpoint
  fastify.get('/metrics', {
    schema: {
      tags: ['Monitoring'],
      description: 'Prometheus metrics endpoint',
    },
  }, async (request, reply) => {
    const metrics = await register.metrics();
    reply.type('text/plain').send(metrics);
  });

  // Health check removed - use /api/v1/public/health instead
};

export default fp(prometheusPlugin, {
  name: 'prometheus',
});

export {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  databaseQueryDuration,
  databaseQueriesTotal,
  activeSessionsGauge,
  systemMetrics,
  businessMetrics,
};