/**
 * Jest Setup for E2E Tests
 * Configures test database and environment for integration tests
 */

import 'reflect-metadata';
import { execSync } from 'child_process';

// Global test setup for E2E tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6380';
  process.env.DATABASE_URL = 'postgresql://itellico:itellico123@localhost:5433/itellico_test';
  
  console.log('🧪 Setting up E2E test environment...');
  
  try {
    // Reset test database schema
    execSync('cd ../../ && pnpm prisma migrate reset --force --skip-generate', { 
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    // Run migrations
    execSync('cd ../../ && pnpm prisma migrate deploy', { 
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    // Seed test data
    execSync('cd ../../ && pnpm prisma db seed', { 
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('✅ E2E test database ready');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up test database
    execSync('cd ../../ && pnpm prisma migrate reset --force --skip-generate', { 
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    
    console.log('✅ E2E test cleanup complete');
  } catch (error) {
    console.warn('⚠️ E2E cleanup warning:', error);
  }
}, 30000);

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global test timeout for E2E
jest.setTimeout(30000);