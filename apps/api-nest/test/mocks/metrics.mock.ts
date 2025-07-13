/**
 * Metrics Service Mock
 * Provides mock implementation for Prometheus metrics in unit tests
 */

export const mockMetricsService = {
  // HTTP metrics
  incrementHttpRequests: jest.fn(),

  // Authentication metrics
  incrementAuthAttempts: jest.fn(),

  // Permission metrics
  incrementPermissionChecks: jest.fn(),

  // Database metrics
  incrementDatabaseQueries: jest.fn(),

  // Cache metrics
  incrementCacheOperations: jest.fn(),

  // Error metrics
  incrementErrors: jest.fn(),

  // Custom metrics
  incrementCustomCounter: jest.fn(),
  setCustomGauge: jest.fn(),
  observeCustomHistogram: jest.fn(),
};

/**
 * Mock metrics counter
 */
export class MockCounter {
  public value = 0;

  inc(value = 1) {
    this.value += value;
  }

  reset() {
    this.value = 0;
  }
}

/**
 * Mock metrics gauge
 */
export class MockGauge {
  public value = 0;

  set(value: number) {
    this.value = value;
  }

  inc(value = 1) {
    this.value += value;
  }

  dec(value = 1) {
    this.value -= value;
  }

  reset() {
    this.value = 0;
  }
}

/**
 * Mock metrics histogram
 */
export class MockHistogram {
  public observations: number[] = [];

  observe(value: number) {
    this.observations.push(value);
  }

  reset() {
    this.observations = [];
  }

  get count() {
    return this.observations.length;
  }

  get sum() {
    return this.observations.reduce((sum, value) => sum + value, 0);
  }

  get avg() {
    return this.observations.length > 0 ? this.sum / this.count : 0;
  }
}

/**
 * Mock Prometheus registry
 */
export const mockPrometheusRegistry = {
  register: jest.fn(),
  clear: jest.fn(),
  metrics: jest.fn(() => 'mock metrics output'),
  getSingleMetric: jest.fn(),
  getMetricsAsJSON: jest.fn(() => []),
};

/**
 * Reset all metrics mocks
 */
export function resetMetricsMocks() {
  Object.keys(mockMetricsService).forEach(key => {
    if (jest.isMockFunction(mockMetricsService[key])) {
      mockMetricsService[key].mockReset();
    }
  });

  Object.keys(mockPrometheusRegistry).forEach(key => {
    if (jest.isMockFunction(mockPrometheusRegistry[key])) {
      mockPrometheusRegistry[key].mockReset();
    }
  });
}