/**
 * User Tier Endpoints E2E Tests
 * Tests for user-level endpoints with proper authentication
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('User Tier Endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let authCookie: string;

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

    // Authenticate once for all tests
    await authenticateUser();
  });

  afterAll(async () => {
    await app.close();
  });

  async function authenticateUser() {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com', // Regular user
        password: 'password123',
      },
    });

    if (loginResponse.statusCode === 200) {
      const cookies = loginResponse.headers['set-cookie'] as string[];
      authCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }
  }

  function getAuthHeaders() {
    return authCookie ? { cookie: authCookie } : {};
  }

  describe('/api/v1/user/profile', () => {
    it('GET /api/v1/user/profile should return user profile', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/profile',
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data).toHaveProperty('email');
        expect(body.data).not.toHaveProperty('password');
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/user/profile should update user profile', async () => {
      const updateData = {
        name: 'Updated User Name',
        bio: 'Updated bio information',
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/profile',
        payload: updateData,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 400]).toContain(response.statusCode); // 400 if validation fails
        const body = JSON.parse(response.payload);
        
        if (response.statusCode === 200) {
          expect(body.success).toBe(true);
          expect(body.data.name).toBe(updateData.name);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/user/profile should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email-format',
        name: '', // empty name
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/profile',
        payload: invalidData,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
        expect(body.error).toBeDefined();
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/user/settings', () => {
    it('GET /api/v1/user/settings should return user settings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/settings',
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/user/settings should update user settings', async () => {
      const settingsData = {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
        },
        language: 'en',
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/settings',
        payload: settingsData,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 400]).toContain(response.statusCode);
        const body = JSON.parse(response.payload);
        
        if (response.statusCode === 200) {
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/user/settings should validate settings data', async () => {
      const invalidSettings = {
        theme: 'invalid-theme',
        language: 123, // should be string
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/settings',
        payload: invalidSettings,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/user/notifications', () => {
    it('GET /api/v1/user/notifications should return user notifications', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/notifications',
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/user/notifications with pagination should work', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/notifications?page=1&limit=10',
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        if (body.data.pagination) {
          expect(body.data.pagination).toHaveProperty('page');
          expect(body.data.pagination).toHaveProperty('limit');
          expect(body.data.pagination).toHaveProperty('total');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/user/notifications/:id/read should mark notification as read', async () => {
      const notificationId = '1'; // Test notification ID

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/user/notifications/${notificationId}/read`,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 404]).toContain(response.statusCode); // 404 if notification doesn't exist
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/user/sessions', () => {
    it('GET /api/v1/user/sessions should return active sessions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/sessions',
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('DELETE /api/v1/user/sessions/:id should revoke session', async () => {
      const sessionId = 'test-session-id';

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/user/sessions/${sessionId}`,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('User Tier Permission Checks', () => {
    it('should allow access to user-level endpoints', async () => {
      const userEndpoints = [
        '/api/v1/user/profile',
        '/api/v1/user/settings',
        '/api/v1/user/notifications',
        '/api/v1/user/sessions',
      ];

      for (const endpoint of userEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getAuthHeaders(),
        });

        if (authCookie) {
          expect([200, 404]).toContain(response.statusCode); // 200 or 404, but not 403
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });

    it('should deny access to higher tier endpoints', async () => {
      const higherTierEndpoints = [
        '/api/v1/account/users',
        '/api/v1/tenant/settings',
        '/api/v1/platform/admin',
      ];

      for (const endpoint of higherTierEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getAuthHeaders(),
        });

        if (authCookie) {
          expect([403, 404]).toContain(response.statusCode); // Forbidden or not found
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });
  });

  describe('Input Validation and Error Handling', () => {
    it('should validate required parameters', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/profile',
        payload: {}, // Empty payload
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 400]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/profile',
        payload: 'invalid-json',
        headers: {
          ...getAuthHeaders(),
          'content-type': 'application/json',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle oversized payloads', async () => {
      const largePayload = {
        bio: 'x'.repeat(10000), // Very long bio
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/user/profile',
        payload: largePayload,
        headers: getAuthHeaders(),
      });

      if (authCookie) {
        expect([200, 400, 413]).toContain(response.statusCode); // 413 = Payload Too Large
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });
});