/**
 * Jest Setup for Unit Tests
 * Configures global test environment for unit tests
 */

import 'reflect-metadata';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Suppress console.log during tests unless explicitly needed
  console.log = jest.fn();
  
  // Only show errors and warnings in specific cases
  console.error = jest.fn((message) => {
    if (message.includes('Redis Client Error') || message.includes('Database')) {
      originalConsoleError(message);
    }
  });
  
  console.warn = jest.fn((message) => {
    if (message.includes('Deprecated') || message.includes('Warning')) {
      originalConsoleWarn(message);
    }
  });
});

afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout
jest.setTimeout(10000);

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6380';
process.env.DATABASE_URL = 'postgresql://itellico:itellico123@localhost:5433/itellico_test';