/**
 * Circuit Breaker Middleware
 * 
 * ENTERPRISE RELIABILITY PATTERN:
 * - Protects against cascading failures
 * - Automatic recovery with half-open state
 * - Configurable failure thresholds
 */

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        console.log('🔄 Circuit breaker half-open - testing service');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    if (this.state !== 'closed') {
      console.log('✅ Circuit breaker closed - service recovered');
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error(`🚨 Circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Global circuit breakers for different services
export const authCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s timeout
export const redisCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1min timeout
export const dbCircuitBreaker = new CircuitBreaker(10, 120000); // 10 failures, 2min timeout 