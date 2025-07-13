/**
 * Public Endpoints E2E Tests
 * Tests for all public endpoints that don't require authentication
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('Public Endpoints (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/public/health', () => {
    it('GET /api/v1/public/health should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toEqual({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
        }),
      });
    });

    it('GET /api/v1/public/health/ready should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('ready');
    });

    it('GET /api/v1/public/health/live should return liveness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health/live',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('alive');
    });

    it('GET /api/v1/public/health/info should return system information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health/info',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.objectContaining({
        name: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
      }));
    });
  });

  describe('/api/v1/public/auth', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      name: 'Test User',
    };

    const invalidRegistrationData = {
      email: 'invalid-email',
      password: '123', // too short
      name: '',
    };

    it('POST /api/v1/public/auth/register should register new user with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/register',
        payload: validRegistrationData,
      });

      if (response.statusCode === 201) {
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data.email).toBe(validRegistrationData.email);
      } else {
        // If user already exists, expect 400
        expect(response.statusCode).toBe(400);
      }
    });

    it('POST /api/v1/public/auth/register should reject invalid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/register',
        payload: invalidRegistrationData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('POST /api/v1/public/auth/forgot-password should accept valid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/forgot-password',
        payload: { email: 'test@example.com' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
    });

    it('POST /api/v1/public/auth/forgot-password should reject invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/forgot-password',
        payload: { email: 'invalid-email' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('POST /api/v1/public/auth/reset-password should reject invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/reset-password',
        payload: {
          token: 'invalid-token',
          password: 'NewPassword123!',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('POST /api/v1/public/auth/verify-email should reject invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/verify-email',
        payload: { token: 'invalid-token' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('GET /api/v1/public/auth/verify-email/:token should reject invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/auth/verify-email/invalid-token',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('/api/v1/public (other endpoints)', () => {
    it('GET /api/v1/public/tenants should list active tenants', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/tenants',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('GET /api/v1/public/tenant/:subdomain should return tenant info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/tenant/test-tenant',
      });

      // Either 200 (found) or 404 (not found) is acceptable
      expect([200, 404]).toContain(response.statusCode);
      const body = JSON.parse(response.payload);
      expect(body.success).toBeDefined();
    });

    it('GET /api/v1/public/tenant/invalid-subdomain should validate subdomain format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/tenant/a', // too short
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent public endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid JSON payloads', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/register',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/register',
        payload: {}, // missing required fields
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });
});