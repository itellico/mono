import { logger } from '@/lib/logger';

interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value: [number, string];
    }>;
  };
}

interface PrometheusRangeResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      values: Array<[number, string]>;
    }>;
  };
}

export class PrometheusClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.PROMETHEUS_URL || 'http://localhost:9090') {
    this.baseUrl = baseUrl;
  }

  /**
   * Execute an instant query
   */
  async query(query: string): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
        { 
          headers: { 'Accept': 'application/json' },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        logger.warn('Prometheus query failed', { query, status: response.status });
        return null;
      }

      const data: PrometheusQueryResult = await response.json();
      
      if (data.status === 'success' && data.data.result.length > 0) {
        // Return the first result's value
        return parseFloat(data.data.result[0].value[1]);
      }

      return null;
    } catch (error) {
      logger.warn('Failed to query Prometheus', { 
        query, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Execute a range query
   */
  async queryRange(query: string, start: Date, end: Date, step: string = '15s'): Promise<Array<[number, number]> | null> {
    try {
      const params = new URLSearchParams({
        query,
        start: Math.floor(start.getTime() / 1000).toString(),
        end: Math.floor(end.getTime() / 1000).toString(),
        step
      });

      const response = await fetch(
        `${this.baseUrl}/api/v1/query_range?${params}`,
        { 
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (!response.ok) {
        return null;
      }

      const data: PrometheusRangeResult = await response.json();
      
      if (data.status === 'success' && data.data.result.length > 0) {
        // Convert to [timestamp, value] pairs
        return data.data.result[0].values.map(([timestamp, value]) => [
          timestamp * 1000, // Convert to milliseconds
          parseFloat(value)
        ]);
      }

      return null;
    } catch (error) {
      logger.warn('Failed to query Prometheus range', { query, error });
      return null;
    }
  }

  /**
   * Get system metrics from Prometheus
   */
  async getSystemMetrics() {
    const [
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkIn,
      networkOut
    ] = await Promise.all([
      // CPU usage percentage
      this.query('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
      
      // Memory usage percentage
      this.query('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
      
      // Disk usage percentage
      this.query('100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)'),
      
      // Network in (MB/s)
      this.query('rate(node_network_receive_bytes_total[5m]) / 1024 / 1024'),
      
      // Network out (MB/s)
      this.query('rate(node_network_transmit_bytes_total[5m]) / 1024 / 1024')
    ]);

    return {
      cpuUsage: cpuUsage || 0,
      memoryUsage: memoryUsage || 0,
      diskUsage: diskUsage || 0,
      networkIn: networkIn || 0,
      networkOut: networkOut || 0
    };
  }

  /**
   * Get application metrics
   */
  async getApplicationMetrics() {
    const [
      responseTime,
      requestRate,
      errorRate,
      activeConnections
    ] = await Promise.all([
      // Average response time (ms)
      this.query('rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]) * 1000'),
      
      // Requests per second
      this.query('rate(http_requests_total[5m])'),
      
      // Error rate (percentage)
      this.query('(rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])) * 100'),
      
      // Active connections
      this.query('http_connections_active')
    ]);

    return {
      responseTime: responseTime || 0,
      requestRate: requestRate || 0,
      errorRate: errorRate || 0,
      activeConnections: activeConnections || 0
    };
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    const [
      connectionCount,
      queryDuration,
      cacheHitRate
    ] = await Promise.all([
      // Active DB connections
      this.query('pg_stat_database_numbackends{datname="mono"}'),
      
      // Average query duration (ms)
      this.query('rate(pg_stat_statements_mean_exec_time_seconds[5m]) * 1000'),
      
      // Cache hit rate
      this.query('pg_stat_database_blks_hit{datname="mono"} / (pg_stat_database_blks_hit{datname="mono"} + pg_stat_database_blks_read{datname="mono"}) * 100')
    ]);

    return {
      connectionCount: connectionCount || 0,
      queryDuration: queryDuration || 0,
      cacheHitRate: cacheHitRate || 0
    };
  }

  /**
   * Get Redis metrics
   */
  async getRedisMetrics() {
    const [
      hitRate,
      usedMemory,
      connectedClients,
      opsPerSec
    ] = await Promise.all([
      // Cache hit rate
      this.query('redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100'),
      
      // Used memory (MB)
      this.query('redis_memory_used_bytes / 1024 / 1024'),
      
      // Connected clients
      this.query('redis_connected_clients'),
      
      // Operations per second
      this.query('rate(redis_commands_processed_total[5m])')
    ]);

    return {
      hitRate: hitRate || 0,
      usedMemory: usedMemory || 0,
      connectedClients: connectedClients || 0,
      opsPerSec: opsPerSec || 0
    };
  }

  /**
   * Check if Prometheus is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/query?query=up`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}