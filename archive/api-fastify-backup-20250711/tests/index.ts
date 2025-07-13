/**
 * Test Suite Index
 * Central registry for all API tests
 */

// Import all test suites to ensure they're discovered
import './routes/auth.test';
import './routes/forms.test';
import './routes/health.test';

// Test utilities for other test files
export { testUtils, testConfig } from './setup';
export { TestAppHelper, createTestApp, testWithApp } from './helpers/app.helper';

// Test categories for organization
export const testCategories = {
  routes: [
    'auth',
    'forms', 
    'health'
  ],
  services: [
    // Add service tests here as they're created
  ],
  integration: [
    // Add integration tests here as they're created
  ],
  performance: [
    // Add performance tests here as they're created
  ]
};

// Test environment configuration
export const testEnvironment = {
  name: 'API Test Suite',
  version: '1.0.0',
  description: 'Comprehensive test suite for Mono Platform Fastify API',
  coverage: {
    target: 80,
    threshold: {
      statements: 80,
      branches: 70,
      functions: 70,
      lines: 80
    }
  },
  performance: {
    maxResponseTime: 1000, // 1 second
    maxMemoryUsage: 512 * 1024 * 1024, // 512 MB
    concurrentRequests: 50
  }
};

console.log(`🧪 Loaded ${testCategories.routes.length} route test suites`);
console.log(`📊 Target coverage: ${testEnvironment.coverage.target}%`);
console.log(`⚡ Performance target: <${testEnvironment.performance.maxResponseTime}ms`);