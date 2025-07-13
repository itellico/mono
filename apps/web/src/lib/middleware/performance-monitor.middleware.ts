/**
 * Performance Monitoring Middleware
 * 
 * REAL-TIME PERFORMANCE INSIGHTS:
 * - Request timing and metrics collection
 * - Slow operation detection (>100ms warning)
 * - Memory usage tracking
 * - Error rate monitoring
 */

export class PerformanceMonitor {
  private static metrics = new Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
    lastRun: number;
  }>();
  
  static startTimer(operation: string): (error?: boolean) => void {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return (error = false) => {
      const duration = performance.now() - startTime;
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = endMemory - startMemory;
      
      this.recordMetric(operation, duration, error, memoryDelta);
    };
  }
  
  private static recordMetric(
    operation: string, 
    duration: number, 
    error = false, 
    memoryDelta = 0
  ): void {
    const existing = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Infinity,
      errors: 0,
      lastRun: 0
    };
    
    existing.count++;
    existing.totalTime += duration;
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.minTime = Math.min(existing.minTime, duration);
    existing.lastRun = Date.now();
    
    if (error) existing.errors++;
    
    this.metrics.set(operation, existing);
    
    // Alert on slow operations
    if (duration > 100) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }

    // Alert on high memory usage
    if (memoryDelta > 1024 * 1024) { // 1MB
      console.warn(`🧠 High memory usage: ${operation} used ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  static getMetrics() {
    const result: Record<string, any> = {};
    
    for (const [operation, metrics] of this.metrics.entries()) {
      const avgTime = metrics.totalTime / metrics.count;
      const errorRate = metrics.errors / metrics.count;
      
      result[operation] = {
        count: metrics.count,
        averageTime: Math.round(avgTime * 100) / 100,
        maxTime: Math.round(metrics.maxTime * 100) / 100,
        minTime: metrics.minTime === Infinity ? 0 : Math.round(metrics.minTime * 100) / 100,
        errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
        totalTime: Math.round(metrics.totalTime * 100) / 100,
        lastRun: new Date(metrics.lastRun).toISOString()
      };
    }
    
    return result;
  }

  static getHealthScore(): number {
    const metrics = this.getMetrics();
    let score = 100;
    
    for (const [operation, data] of Object.entries(metrics)) {
      // Penalize high error rates
      if (data.errorRate > 5) score -= 20;
      else if (data.errorRate > 1) score -= 10;
      
      // Penalize slow operations
      if (data.averageTime > 500) score -= 15;
      else if (data.averageTime > 200) score -= 10;
      else if (data.averageTime > 100) score -= 5;
    }
    
    return Math.max(0, score);
  }

  static reset(): void {
    this.metrics.clear();
  }
} 