/**
 * Application Integration Tests
 * High-level tests for the complete NestJS application
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('Application Integration (e2e)', () => {
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

  describe('Application Startup and Health', () => {
    it('should start successfully', () => {
      expect(app).toBeDefined();
      expect(app.getHttpAdapter()).toBeDefined();
    });

    it('GET /api/v1/public/health should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
      }));
    });

    it('GET /api/v1/public/health/ready should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
    });

    it('GET /api/v1/public/health/info should return system info', async () => {
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

  describe('Global Middleware and Interceptors', () => {
    it('should apply global prefix to all routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/public/health', // Without /api prefix
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle CORS properly', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/public/health',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should collect metrics for all requests', async () => {
      // Make a request to generate metrics
      await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      // Check metrics endpoint
      const metricsResponse = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(metricsResponse.statusCode).toBe(200);
      expect(metricsResponse.payload).toContain('itellico_http_requests_total');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/non-existent-endpoint',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid JSON gracefully', async () => {
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

    it('should handle method not allowed', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/public/health',
      });

      expect(response.statusCode).toBe(405);
    });
  });

  describe('Security Features', () => {
    it('should require authentication for protected routes', async () => {
      const protectedRoutes = [
        '/api/v1/user/profile',
        '/api/v1/account/users',
        '/api/v1/tenant/settings',
        '/api/v1/platform/admin',
      ];

      for (const route of protectedRoutes) {
        const response = await app.inject({
          method: 'GET',
          url: route,
        });

        expect(response.statusCode).toBe(401);
      }
    });

    it('should allow access to public routes without authentication', async () => {
      const publicRoutes = [
        '/api/v1/public/health',
        '/api/v1/public/health/ready',
        '/api/v1/public/health/info',
        '/api/metrics',
        '/api/docs-json',
      ];

      for (const route of publicRoutes) {
        const response = await app.inject({
          method: 'GET',
          url: route,
        });

        expect([200, 404]).toContain(response.statusCode); // 200 or 404, but not 401
      }
    });
  });

  describe('API Documentation', () => {
    it('should serve OpenAPI documentation', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
      });

      expect(response.statusCode).toBe(200);
      const spec = JSON.parse(response.payload);
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
    });

    it('should serve Swagger UI', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(50).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/v1/public/health',
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should respond quickly to health checks', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(500); // Should respond within 500ms
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle JSON requests properly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/public/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        },
        headers: {
          'content-type': 'application/json',
        },
      });

      // Either 201 (success) or 400 (validation error), but not 415 (unsupported media type)
      expect([201, 400]).toContain(response.statusCode);
    });

    it('should return proper content-type headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});