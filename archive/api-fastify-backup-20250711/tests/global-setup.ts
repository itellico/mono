/**
 * Global Test Setup
 * Runs once before all tests to ensure test infrastructure is ready
 */

import { execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';

export async function setup() {
  console.log('🧪 Global test setup starting...');
  
  // Check if we're in CI or local environment
  const isCI = process.env.CI === 'true';
  const skipInfraSetup = process.env.SKIP_TEST_SETUP === 'true';
  
  if (!skipInfraSetup && !isCI) {
    // Check if test infrastructure is running
    try {
      execSync('nc -z localhost 5433', { stdio: 'ignore' });
      execSync('nc -z localhost 6380', { stdio: 'ignore' });
      console.log('✅ Test infrastructure is already running');
    } catch {
      console.log('🚀 Starting test infrastructure...');
      const projectRoot = path.resolve(__dirname, '../../..');
      
      // Start test infrastructure
      execSync(`${projectRoot}/scripts/test-setup.sh up`, {
        stdio: 'inherit',
        cwd: projectRoot
      });
    }
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:testpass123@localhost:5433/mono_test';
  process.env.REDIS_URL = 'redis://localhost:6380';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.LOG_LEVEL = 'error';
  
  console.log('✅ Global test setup completed');
}

export async function teardown() {
  console.log('🧹 Global test teardown...');
  
  // Only stop infrastructure if explicitly requested
  if (process.env.STOP_TEST_INFRASTRUCTURE === 'true') {
    const projectRoot = path.resolve(__dirname, '../../..');
    execSync(`${projectRoot}/scripts/test-setup.sh down`, {
      stdio: 'inherit',
      cwd: projectRoot
    });
  }
  
  console.log('✅ Global test teardown completed');
}