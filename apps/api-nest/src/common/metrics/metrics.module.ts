import { Global, Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics-raw', // Use different path to avoid conflict
      defaultLabels: {
        service: 'itellico-api-nest',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'itellico_',
        },
      },
    }),
  ],
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tier'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['method', 'success'],
    }),
    makeCounterProvider({
      name: 'permission_checks_total',
      help: 'Total permission checks performed',
      labelNames: ['permission', 'granted', 'tier'],
    }),
    makeCounterProvider({
      name: 'database_queries_total',
      help: 'Total database queries executed',
      labelNames: ['operation', 'model', 'success'],
    }),
    makeCounterProvider({
      name: 'cache_operations_total',
      help: 'Total cache operations',
      labelNames: ['operation', 'hit'],
    }),
    makeGaugeProvider({
      name: 'active_users',
      help: 'Number of currently active users',
      labelNames: ['tier'],
    }),
    makeCounterProvider({
      name: 'tenant_requests_total',
      help: 'Total requests per tenant',
      labelNames: ['tenant_id', 'endpoint_tier'],
    }),
  ],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}