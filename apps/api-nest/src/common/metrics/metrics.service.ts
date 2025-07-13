import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    
    @InjectMetric('auth_attempts_total')
    private readonly authAttemptsTotal: Counter<string>,
    
    @InjectMetric('permission_checks_total')
    private readonly permissionChecksTotal: Counter<string>,
    
    @InjectMetric('database_queries_total')
    private readonly databaseQueriesTotal: Counter<string>,
    
    @InjectMetric('cache_operations_total')
    private readonly cacheOperationsTotal: Counter<string>,
    
    @InjectMetric('active_users')
    private readonly activeUsers: Gauge<string>,
    
    @InjectMetric('tenant_requests_total')
    private readonly tenantRequestsTotal: Counter<string>,
  ) {
    // Register custom metrics
    this.registerCustomMetrics();
  }

  private registerCustomMetrics() {
    // HTTP Request Counter
    if (!register.getSingleMetric('http_requests_total')) {
      new Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'tier'],
        registers: [register],
      });
    }

    // HTTP Request Duration Histogram
    if (!register.getSingleMetric('http_request_duration_seconds')) {
      new Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
        registers: [register],
      });
    }

    // Authentication Attempts
    if (!register.getSingleMetric('auth_attempts_total')) {
      new Counter({
        name: 'auth_attempts_total',
        help: 'Total authentication attempts',
        labelNames: ['method', 'success'],
        registers: [register],
      });
    }

    // Permission Checks
    if (!register.getSingleMetric('permission_checks_total')) {
      new Counter({
        name: 'permission_checks_total',
        help: 'Total permission checks performed',
        labelNames: ['permission', 'granted', 'tier'],
        registers: [register],
      });
    }

    // Database Queries
    if (!register.getSingleMetric('database_queries_total')) {
      new Counter({
        name: 'database_queries_total',
        help: 'Total database queries executed',
        labelNames: ['operation', 'model', 'success'],
        registers: [register],
      });
    }

    // Cache Operations
    if (!register.getSingleMetric('cache_operations_total')) {
      new Counter({
        name: 'cache_operations_total',
        help: 'Total cache operations',
        labelNames: ['operation', 'hit'],
        registers: [register],
      });
    }

    // Active Users Gauge
    if (!register.getSingleMetric('active_users')) {
      new Gauge({
        name: 'active_users',
        help: 'Number of currently active users',
        labelNames: ['tier'],
        registers: [register],
      });
    }

    // Tenant-specific requests
    if (!register.getSingleMetric('tenant_requests_total')) {
      new Counter({
        name: 'tenant_requests_total',
        help: 'Total requests per tenant',
        labelNames: ['tenant_id', 'endpoint_tier'],
        registers: [register],
      });
    }
  }

  // HTTP Metrics
  incrementHttpRequests(method: string, route: string, statusCode: number, tier: string) {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      tier,
    });
  }

  observeHttpDuration(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode.toString(),
      },
      duration,
    );
  }

  // Authentication Metrics
  incrementAuthAttempts(method: string, success: boolean) {
    this.authAttemptsTotal.inc({
      method,
      success: success.toString(),
    });
  }

  // Permission Metrics
  incrementPermissionChecks(permission: string, granted: boolean, tier: string) {
    this.permissionChecksTotal.inc({
      permission,
      granted: granted.toString(),
      tier,
    });
  }

  // Database Metrics
  incrementDatabaseQueries(operation: string, model: string, success: boolean) {
    this.databaseQueriesTotal.inc({
      operation,
      model,
      success: success.toString(),
    });
  }

  // Cache Metrics
  incrementCacheOperations(operation: 'get' | 'set' | 'del', hit: boolean) {
    this.cacheOperationsTotal.inc({
      operation,
      hit: hit.toString(),
    });
  }

  // User Activity Metrics
  setActiveUsers(tier: string, count: number) {
    this.activeUsers.set({ tier }, count);
  }

  // Tenant Metrics
  incrementTenantRequests(tenant_id: string, endpointTier: string) {
    this.tenantRequestsTotal.inc({
      tenant_id: tenant_id,
      endpoint_tier: endpointTier,
    });
  }

  // Business Metrics
  async getMetricsSummary() {
    const registry = register;
    const metrics = await registry.getMetricsAsJSON();
    
    return {
      totalMetrics: metrics.length,
      httpRequests: metrics.find(m => m.name === 'http_requests_total'),
      authAttempts: metrics.find(m => m.name === 'auth_attempts_total'),
      permissionChecks: metrics.find(m => m.name === 'permission_checks_total'),
      databaseQueries: metrics.find(m => m.name === 'database_queries_total'),
      cacheOperations: metrics.find(m => m.name === 'cache_operations_total'),
      activeUsers: metrics.find(m => m.name === 'active_users'),
    };
  }
}