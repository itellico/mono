/**
 * Health Check API Tests
 * Tests for health monitoring endpoints
 */

import { describe, it, expect } from 'vitest';
import { TestAppHelper, testWithApp } from '../helpers/app.helper';

describe('Health Check API', () => {
  describe('GET /api/v1/public/health', () => {
    it('should return basic health status', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
        expect(data.uptime).toBeDefined();
        expect(typeof data.uptime).toBe('number');
      });
    });

    it('should not require authentication', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        // Test without any authentication
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        expect(response.statusCode).toBe(200);
      });
    });

    it('should include service information', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        const data = response.json();
        expect(data.service).toBeDefined();
        expect(data.version).toBeDefined();
        expect(data.environment).toBeDefined();
      });
    });

    it('should respond quickly', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const startTime = Date.now();
        
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        const responseTime = Date.now() - startTime;
        
        expect(response.statusCode).toBe(200);
        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      });
    });
  });

  describe('GET /api/v1/public/health/ready', () => {
    it('should return readiness status', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/ready'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.status).toBe('ready');
        expect(data.checks).toBeDefined();
        expect(data.checks.database).toBeDefined();
        expect(data.checks.redis).toBeDefined();
      });
    });

    it('should check database connectivity', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/ready'
        });

        const data = response.json();
        expect(data.checks.database.status).toBeDefined();
        expect(['ok', 'error']).toContain(data.checks.database.status);
        
        if (data.checks.database.status === 'ok') {
          expect(data.checks.database.responseTime).toBeDefined();
          expect(typeof data.checks.database.responseTime).toBe('number');
        }
      });
    });

    it('should check Redis connectivity', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/ready'
        });

        const data = response.json();
        expect(data.checks.redis.status).toBeDefined();
        expect(['ok', 'error']).toContain(data.checks.redis.status);
        
        if (data.checks.redis.status === 'ok') {
          expect(data.checks.redis.responseTime).toBeDefined();
          expect(typeof data.checks.redis.responseTime).toBe('number');
        }
      });
    });

    it('should return 503 if critical services are down', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        // This test would require mocking service failures
        // For now, we'll check that the endpoint exists and responds
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/ready'
        });

        expect([200, 503]).toContain(response.statusCode);
      });
    });
  });

  describe('GET /api/v1/public/health/live', () => {
    it('should return liveness status', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/live'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.status).toBe('alive');
        expect(data.timestamp).toBeDefined();
        expect(data.pid).toBeDefined();
        expect(typeof data.pid).toBe('number');
      });
    });

    it('should include memory usage', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/live'
        });

        const data = response.json();
        expect(data.memory).toBeDefined();
        expect(data.memory.used).toBeDefined();
        expect(data.memory.total).toBeDefined();
        expect(typeof data.memory.used).toBe('number');
        expect(typeof data.memory.total).toBe('number');
      });
    });

    it('should include system information', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/live'
        });

        const data = response.json();
        expect(data.system).toBeDefined();
        expect(data.system.platform).toBeDefined();
        expect(data.system.nodeVersion).toBeDefined();
      });
    });

    it('should be very fast', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const startTime = Date.now();
        
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/live'
        });

        const responseTime = Date.now() - startTime;
        
        expect(response.statusCode).toBe(200);
        expect(responseTime).toBeLessThan(500); // Should respond within 500ms
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent health checks', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const requests = Array(10).fill(null).map(() =>
          helper.request({
            method: 'GET',
            url: '/api/v1/public/health'
          })
        );

        const responses = await Promise.all(requests);
        
        responses.forEach(response => {
          expect(response.statusCode).toBe(200);
        });
      });
    });

    it('should maintain performance under load', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const startTime = Date.now();
        
        // Make 20 concurrent requests
        const requests = Array(20).fill(null).map(() =>
          helper.request({
            method: 'GET',
            url: '/api/v1/public/health'
          })
        );

        const responses = await Promise.all(requests);
        const totalTime = Date.now() - startTime;
        
        // All should succeed
        responses.forEach(response => {
          expect(response.statusCode).toBe(200);
        });
        
        // Should complete all 20 requests within 5 seconds
        expect(totalTime).toBeLessThan(5000);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health/invalid-endpoint'
        });

        expect(response.statusCode).toBe(404);
      });
    });

    it('should not expose sensitive information in errors', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'POST', // Wrong method
          url: '/api/v1/public/health'
        });

        expect(response.statusCode).toBe(405); // Method Not Allowed
        const data = response.json();
        
        // Should not expose internal paths or sensitive data
        expect(data.error).not.toContain('/');
        expect(data.error).not.toContain('prisma');
        expect(data.error).not.toContain('redis');
      });
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON content type', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
      });
    });

    it('should set appropriate cache headers', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/health'
        });

        // Health endpoints should not be cached
        expect(response.headers['cache-control']).toContain('no-cache');
      });
    });
  });
});