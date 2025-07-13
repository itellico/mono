/**
 * Fastify App Testing Helper
 * Utilities for testing Fastify application endpoints with real database
 */

import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testUtils, prisma, redis } from '../setup';
import jwt from 'jsonwebtoken';

export interface TestAppOptions {
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  useTransaction?: boolean;
}

export interface TestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  payload?: any;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  cookies?: Record<string, string>;
}

export interface AuthenticatedRequest extends TestRequest {
  user?: any;
  token?: string;
  csrfToken?: string;
}

export class TestAppHelper {
  private app: FastifyInstance | null = null;
  private testUser: any = null;
  private testSession: any = null;

  /**
   * Build and initialize test app with real database
   */
  async createApp(options: TestAppOptions = {}): Promise<FastifyInstance> {
    const config = {
      logLevel: options.logLevel || 'silent',
      testing: true
    };

    this.app = await buildApp(config);
    await this.app.ready();
    return this.app;
  }

  /**
   * Close test app
   */
  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }
  }

  /**
   * Make unauthenticated request
   */
  async request(request: TestRequest) {
    if (!this.app) {
      throw new Error('App not initialized. Call createApp() first.');
    }

    const response = await this.app.inject({
      method: request.method,
      url: request.url,
      payload: request.payload,
      headers: request.headers || {},
      query: request.query,
      cookies: request.cookies
    });

    return {
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      json: () => {
        try {
          return JSON.parse(response.body);
        } catch {
          return response.body;
        }
      },
      payload: response.payload
    };
  }

  /**
   * Login and get real authentication tokens
   */
  async loginAs(role: 'superadmin' | 'admin' | 'user' = 'user') {
    const credentials = testUtils.getTestCredentials(role);
    
    const response = await this.request({
      method: 'POST',
      url: '/api/v1/public/auth/login',
      payload: credentials
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to login as ${role}: ${response.body}`);
    }

    const data = response.json();
    return {
      user: data.data.user,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      cookies: response.headers['set-cookie']
    };
  }

  /**
   * Create test user in real database
   */
  async createTestUser(data: any = {}) {
    this.testUser = await testUtils.createTestUser(data);
    
    // Create session in Redis
    const sessionId = await testUtils.createSession(this.testUser.uuid);
    this.testSession = { id: sessionId, userId: this.testUser.uuid };
    
    return { user: this.testUser, session: this.testSession };
  }

  /**
   * Make authenticated request with real JWT
   */
  async authenticatedRequest(request: AuthenticatedRequest) {
    let token = request.token;
    
    if (!token) {
      // If we have a test user, generate a token for them
      if (this.testUser) {
        // Generate JWT for the test user
        const payload = {
          sub: this.testUser.uuid,
          email: this.testUser.email,
          accountId: this.testUser.accountId,
          tenantId: this.testUser.account?.tenantId || 1,
          type: 'access',
          sessionId: this.testSession?.id || 'test-session',
        };
        token = testUtils.generateToken(payload);
      } else {
        // Login and get real token
        const auth = await this.loginAs('user');
        token = auth.accessToken;
      }
    }

    const headers = {
      ...request.headers,
      'authorization': `Bearer ${token}`
    };

    // Add CSRF token if needed
    if (request.csrfToken) {
      headers['x-csrf-token'] = request.csrfToken;
    }

    return this.request({
      ...request,
      headers
    });
  }

  /**
   * Make admin request
   */
  async adminRequest(request: AuthenticatedRequest) {
    const auth = await this.loginAs('admin');
    
    return this.request({
      ...request,
      headers: {
        ...request.headers,
        'authorization': `Bearer ${auth.accessToken}`
      }
    });
  }

  /**
   * Make super admin request
   */
  async superAdminRequest(request: AuthenticatedRequest) {
    const auth = await this.loginAs('superadmin');
    
    return this.request({
      ...request,
      headers: {
        ...request.headers,
        'authorization': `Bearer ${auth.accessToken}`
      }
    });
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(endpoint: string, limit: number = 5) {
    const requests = [];
    
    for (let i = 0; i < limit + 1; i++) {
      requests.push(this.request({
        method: 'POST',
        url: endpoint,
        payload: { test: true }
      }));
    }
    
    const responses = await Promise.all(requests);
    return {
      totalRequests: requests.length,
      successfulRequests: responses.filter(r => r.statusCode !== 429).length,
      rateLimited: responses.some(r => r.statusCode === 429),
      lastResponse: responses[responses.length - 1]
    };
  }

  /**
   * Measure response time for timing attack tests
   */
  async measureResponseTime(request: TestRequest): Promise<number> {
    const start = process.hrtime.bigint();
    await this.request(request);
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Clean up any test data created
    if (this.testUser) {
      await prisma.user.delete({
        where: { id: this.testUser.id }
      }).catch(() => {});
    }
    
    this.testUser = null;
    this.testSession = null;
  }

  /**
   * Get current test user
   */
  getTestUser() {
    return this.testUser;
  }

  /**
   * Get current test session
   */
  getTestSession() {
    return this.testSession;
  }
}

// Convenience functions
export async function createTestApp(options?: TestAppOptions): Promise<TestAppHelper> {
  const helper = new TestAppHelper();
  await helper.createApp(options);
  return helper;
}

export async function testWithApp<T>(
  testFn: (helper: TestAppHelper) => Promise<T>,
  options?: TestAppOptions
): Promise<T> {
  const helper = await createTestApp(options);
  try {
    return await testFn(helper);
  } finally {
    await helper.cleanup();
    await helper.closeApp();
  }
}