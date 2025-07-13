#!/usr/bin/env tsx
/**
 * API Endpoint Test Script
 * 
 * Tests all Fastify API endpoints to ensure they're working correctly
 * Run with: tsx test-api-endpoints.ts
 */

import { execSync } from 'child_process';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test123!@#';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testEndpoint(
  method: string,
  endpoint: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    requireAuth?: boolean;
    skipAuth?: boolean;
  } = {}
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.requireAuth && accessToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Handle different response types
    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    const result: TestResult = {
      endpoint,
      method,
      status: response.ok ? 'PASS' : 'FAIL',
      statusCode: response.status,
      responseTime,
    };

    if (!response.ok) {
      result.error = data?.error || `HTTP ${response.status}`;
    }

    results.push(result);
    return result;
  } catch (error) {
    const result: TestResult = {
      endpoint,
      method,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
    results.push(result);
    return result;
  }
}

async function authenticateTestUser() {
  console.log(`${colors.cyan}🔐 Authenticating test user...${colors.reset}`);
  
  try {
    // First try to login
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      accessToken = data.data.accessToken;
      refreshToken = data.data.refreshToken;
      console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
      return true;
    } else {
      // Try to register if login fails
      console.log(`${colors.yellow}Login failed, attempting registration...${colors.reset}`);
      
      const registerResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          firstName: 'Test',
          lastName: 'User',
          userType: 'model',
        }),
      });

      if (registerResponse.ok) {
        const data = await registerResponse.json();
        accessToken = data.data.accessToken;
        refreshToken = data.data.refreshToken;
        console.log(`${colors.green}✓ Registration and authentication successful${colors.reset}`);
        return true;
      }
    }
  } catch (error) {
    console.error(`${colors.red}✗ Authentication failed:${colors.reset}`, error);
  }
  
  return false;
}

async function runTests() {
  console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════╗
║        Fastify API Endpoint Tests         ║
╚═══════════════════════════════════════════╝${colors.reset}
`);

  console.log(`API Base URL: ${colors.cyan}${API_BASE_URL}${colors.reset}\n`);

  // Authenticate first
  const authenticated = await authenticateTestUser();
  if (!authenticated) {
    console.log(`${colors.yellow}⚠️  Running tests without authentication${colors.reset}\n`);
  }

  // Test categories
  console.log(`\n${colors.bright}📁 Testing Categories Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/categories', { requireAuth: true });
  await testEndpoint('POST', '/api/v1/admin/categories', {
    requireAuth: true,
    body: {
      name: 'Test Category',
      slug: 'test-category',
      type: 'general',
      level: 1,
    },
  });
  await testEndpoint('GET', '/api/v1/admin/categories/by-type?type=general', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/categories/stats', { requireAuth: true });

  // Test users
  console.log(`\n${colors.bright}👥 Testing Users Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/users', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/users/stats', { requireAuth: true });

  // Test tenants
  console.log(`\n${colors.bright}🏢 Testing Tenants Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/tenants', { requireAuth: true });
  await testEndpoint('POST', '/api/v1/admin/tenants', {
    requireAuth: true,
    body: {
      name: 'Test Tenant',
      domain: 'test.example.com',
    },
  });

  // Test permissions
  console.log(`\n${colors.bright}🔐 Testing Permissions Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/permissions', { requireAuth: true });
  await testEndpoint('POST', '/api/v1/permissions/check', {
    requireAuth: true,
    body: {
      permission: 'users:read',
      resource: 'users',
    },
  });

  // Test settings
  console.log(`\n${colors.bright}⚙️  Testing Settings Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/settings', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/settings/god-mode', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/settings/email', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/settings/media', { requireAuth: true });

  // Test model schemas
  console.log(`\n${colors.bright}📋 Testing Model Schemas Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/model-schemas', { requireAuth: true });
  await testEndpoint('POST', '/api/v1/admin/model-schemas', {
    requireAuth: true,
    body: {
      name: 'Test Schema',
      slug: 'test-schema',
      fields: [],
    },
  });

  // Test option sets
  console.log(`\n${colors.bright}🎨 Testing Option Sets Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/option-sets', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/option-sets/statistics', { requireAuth: true });

  // Test media
  console.log(`\n${colors.bright}🖼️  Testing Media Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/media/settings', { requireAuth: true });

  // Test workflows
  console.log(`\n${colors.bright}🔄 Testing Workflows Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/workflows', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/workflows/definitions', { requireAuth: true });

  // Test subscriptions
  console.log(`\n${colors.bright}💳 Testing Subscriptions Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/subscriptions/plans', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/subscriptions/features', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/subscriptions/limits', { requireAuth: true });

  // Test translations
  console.log(`\n${colors.bright}🌍 Testing Translations Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/translations', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/translations/languages', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/translations/statistics', { requireAuth: true });

  // Test integrations
  console.log(`\n${colors.bright}🔌 Testing Integrations Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/integrations', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/integrations/statistics', { requireAuth: true });

  // Test queue
  console.log(`\n${colors.bright}📬 Testing Queue Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/queue/stats', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/queue/worker-control', { requireAuth: true });

  // Test LLM
  console.log(`\n${colors.bright}🤖 Testing LLM Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/llm/providers', { requireAuth: true });
  await testEndpoint('GET', '/api/v1/admin/llm/analytics', { requireAuth: true });

  // Test templates
  console.log(`\n${colors.bright}📄 Testing Templates Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/templates', { requireAuth: true });

  // Test audit logs
  console.log(`\n${colors.bright}📝 Testing Audit Endpoints${colors.reset}`);
  await testEndpoint('GET', '/api/v1/admin/audit/logs', { requireAuth: true });

  // Print results summary
  printSummary();
}

function printSummary() {
  console.log(`\n${colors.bright}${colors.blue}
╔═══════════════════════════════════════════╗
║            Test Results Summary           ║
╚═══════════════════════════════════════════╝${colors.reset}
`);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`Total Tests: ${colors.bright}${total}${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  if (skipped > 0) {
    console.log(`${colors.yellow}⊘ Skipped: ${skipped}${colors.reset}`);
  }

  // Calculate average response time
  const responseTimes = results
    .filter(r => r.responseTime !== undefined)
    .map(r => r.responseTime!);
  const avgResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;
  
  console.log(`\nAverage Response Time: ${colors.cyan}${avgResponseTime}ms${colors.reset}`);

  // Show failed tests
  if (failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ${colors.red}✗${colors.reset} ${r.method} ${r.endpoint}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
        if (r.statusCode) {
          console.log(`    Status: ${r.statusCode}`);
        }
      });
  }

  // Show slowest endpoints
  const slowestEndpoints = results
    .filter(r => r.responseTime !== undefined)
    .sort((a, b) => b.responseTime! - a.responseTime!)
    .slice(0, 5);

  if (slowestEndpoints.length > 0) {
    console.log(`\n${colors.yellow}Slowest Endpoints:${colors.reset}`);
    slowestEndpoints.forEach(r => {
      console.log(`  ${r.method} ${r.endpoint}: ${colors.yellow}${r.responseTime}ms${colors.reset}`);
    });
  }

  // Exit code based on results
  const exitCode = failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Check if API server is running
async function checkApiServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      console.log(`${colors.green}✓ API server is running${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}✗ API server is not running at ${API_BASE_URL}${colors.reset}`);
    console.log(`\nPlease start the API server with:`);
    console.log(`  ${colors.cyan}cd apps/api && npm run dev${colors.reset}`);
    return false;
  }
  return false;
}

// Main execution
(async () => {
  const apiRunning = await checkApiServer();
  if (!apiRunning) {
    process.exit(1);
  }

  await runTests();
})().catch(error => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});