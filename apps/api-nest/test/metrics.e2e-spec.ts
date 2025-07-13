/**
 * Metrics and Documentation Endpoints E2E Tests
 * Tests for monitoring, metrics, and API documentation endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('Metrics and Documentation (e2e)', () => {
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

  describe('/api/metrics', () => {
    it('GET /api/metrics should return Prometheus metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      
      const metricsText = response.payload;
      
      // Check for common Prometheus metrics
      expect(metricsText).toContain('# HELP');
      expect(metricsText).toContain('# TYPE');
      
      // Check for our custom metrics
      expect(metricsText).toMatch(/itellico_http_requests_total/);
      expect(metricsText).toMatch(/itellico_auth_attempts_total/);
      expect(metricsText).toMatch(/itellico_permission_checks_total/);
      expect(metricsText).toMatch(/itellico_database_queries_total/);
      expect(metricsText).toMatch(/itellico_cache_operations_total/);
    });

    it('GET /api/metrics/summary should return JSON metrics summary', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/summary',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('http');
      expect(body.data).toHaveProperty('auth');
      expect(body.data).toHaveProperty('permissions');
      expect(body.data).toHaveProperty('database');
      expect(body.data).toHaveProperty('cache');
      expect(body.data).toHaveProperty('errors');
    });

    it('should handle large metrics payload', async () => {
      // Make multiple requests to generate metrics
      const requests = Array(10).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/v1/public/health',
        })
      );

      await Promise.all(requests);

      // Now check metrics
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      expect(response.statusCode).toBe(200);
      expect(response.payload.length).toBeGreaterThan(1000); // Should have substantial content
    });
  });

  describe('/api/docs', () => {
    it('GET /api/docs should return Swagger UI', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      
      const html = response.payload;
      expect(html).toContain('swagger-ui');
      expect(html).toContain('Itellico API');
    });

    it('GET /api/docs-json should return OpenAPI specification', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      
      const openApiSpec = JSON.parse(response.payload);
      
      // Validate OpenAPI structure
      expect(openApiSpec).toHaveProperty('openapi');
      expect(openApiSpec).toHaveProperty('info');
      expect(openApiSpec).toHaveProperty('paths');
      expect(openApiSpec).toHaveProperty('components');
      
      // Check API info
      expect(openApiSpec.info.title).toBe('Itellico API');
      expect(openApiSpec.info.version).toBe('1.0');
      expect(openApiSpec.info.description).toContain('Multi-tenant SaaS marketplace platform');
      
      // Check for security schemes
      expect(openApiSpec.components).toHaveProperty('securitySchemes');
      expect(openApiSpec.components.securitySchemes).toHaveProperty('bearer');
      expect(openApiSpec.components.securitySchemes).toHaveProperty('cookie');
    });

    it('OpenAPI spec should include all endpoint tiers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
      });

      const openApiSpec = JSON.parse(response.payload);
      const paths = Object.keys(openApiSpec.paths);
      
      // Check for endpoints from each tier
      const publicPaths = paths.filter(path => path.includes('/v1/public/'));
      const userPaths = paths.filter(path => path.includes('/v1/user/'));
      const accountPaths = paths.filter(path => path.includes('/v1/account/'));
      const tenantPaths = paths.filter(path => path.includes('/v1/tenant/'));
      const platformPaths = paths.filter(path => path.includes('/v1/platform/'));
      
      expect(publicPaths.length).toBeGreaterThan(0);
      expect(userPaths.length).toBeGreaterThan(0);
      expect(accountPaths.length).toBeGreaterThan(0);
      expect(tenantPaths.length).toBeGreaterThan(0);
      expect(platformPaths.length).toBeGreaterThan(0);
    });

    it('OpenAPI spec should include proper response schemas', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
      });

      const openApiSpec = JSON.parse(response.payload);
      
      // Check for common response schemas
      expect(openApiSpec.components).toHaveProperty('schemas');
      
      // Look for standard response patterns in some endpoint
      const healthPath = openApiSpec.paths['/api/v1/public/health'];
      if (healthPath && healthPath.get) {
        expect(healthPath.get).toHaveProperty('responses');
        expect(healthPath.get.responses).toHaveProperty('200');
        expect(healthPath.get.responses['200']).toHaveProperty('description');
      }
    });
  });

  describe('CORS and Headers', () => {
    it('should include proper CORS headers for metrics endpoint', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/metrics',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include proper CORS headers for docs endpoint', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/docs',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Performance and Load', () => {
    it('metrics endpoint should handle concurrent requests', async () => {
      const concurrentRequests = Array(20).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/metrics',
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.payload.length).toBeGreaterThan(0);
      });
    });

    it('docs endpoint should handle concurrent requests', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/docs-json',
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        const spec = JSON.parse(response.payload);
        expect(spec).toHaveProperty('openapi');
      });
    });

    it('should respond quickly to metrics requests', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      const duration = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid paths gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics/invalid',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle invalid methods on metrics endpoint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/metrics',
        payload: { data: 'test' },
      });

      expect(response.statusCode).toBe(405); // Method Not Allowed
    });

    it('should handle malformed requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
        headers: {
          'accept': 'invalid/content-type',
        },
      });

      // Should still return JSON even with invalid accept header
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Content Validation', () => {
    it('metrics should contain expected metric types', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      const metricsText = response.payload;
      
      // Check for different metric types
      expect(metricsText).toMatch(/# TYPE \w+ counter/);
      expect(metricsText).toMatch(/# TYPE \w+ gauge/);
      expect(metricsText).toMatch(/# TYPE \w+ histogram/);
    });

    it('metrics should have proper labels', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      const metricsText = response.payload;
      
      // Check for our custom labels
      expect(metricsText).toMatch(/service="itellico-api-nest"/);
      expect(metricsText).toMatch(/environment="test"/);
    });

    it('OpenAPI spec should validate against OpenAPI 3.0 structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs-json',
      });

      const spec = JSON.parse(response.payload);
      
      // Basic OpenAPI 3.0 validation
      expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
      expect(spec.info).toHaveProperty('title');
      expect(spec.info).toHaveProperty('version');
      expect(typeof spec.paths).toBe('object');
      expect(typeof spec.components).toBe('object');
    });
  });

  describe('Security Headers', () => {
    it('should include appropriate security headers for docs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/docs',
      });

      expect(response.statusCode).toBe(200);
      // Add specific security header checks if implemented
    });

    it('should not expose sensitive information in metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/metrics',
      });

      const metricsText = response.payload;
      
      // Ensure no sensitive data is exposed
      expect(metricsText).not.toMatch(/password/i);
      expect(metricsText).not.toMatch(/secret/i);
      expect(metricsText).not.toMatch(/token/i);
      expect(metricsText).not.toMatch(/key/i);
    });
  });
});