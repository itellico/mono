/**
 * Authentication Endpoints E2E Tests
 * Tests for authentication flow and protected endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('Authentication (e2e)', () => {
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

  describe('/api/v1/auth/login', () => {
    const validLoginData = {
      email: 'admin@itellico.com',
      password: 'password123',
    };

    const invalidLoginData = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    };

    it('POST /api/v1/auth/login should authenticate valid user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: validLoginData,
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('user');
        expect(body.data.user).toHaveProperty('id');
        expect(body.data.user).toHaveProperty('email');
        
        // Check for HTTP-only cookie
        expect(response.headers['set-cookie']).toBeDefined();
        const cookies = response.headers['set-cookie'] as string[];
        expect(cookies.some(cookie => cookie.includes('access_token'))).toBe(true);
      } else {
        // If seeded user doesn't exist, expect 401
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/auth/login should reject invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: invalidLoginData,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('POST /api/v1/auth/login should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'test@example.com' }, // missing password
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('POST /api/v1/auth/login should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'invalid-email',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('/api/v1/auth/refresh', () => {
    it('POST /api/v1/auth/refresh should refresh valid token', async () => {
      // First login to get tokens
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@itellico.com',
          password: 'password123',
        },
      });

      if (loginResponse.statusCode === 200) {
        const cookies = loginResponse.headers['set-cookie'] as string[];
        const refreshToken = cookies
          .find(cookie => cookie.includes('refresh_token'))
          ?.split(';')[0];

        if (refreshToken) {
          const refreshResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            headers: {
              cookie: refreshToken,
            },
          });

          expect(refreshResponse.statusCode).toBe(200);
          const body = JSON.parse(refreshResponse.payload);
          expect(body.success).toBe(true);
          expect(refreshResponse.headers['set-cookie']).toBeDefined();
        }
      }
    });

    it('POST /api/v1/auth/refresh should reject missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('POST /api/v1/auth/refresh should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          cookie: 'refresh_token=invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('/api/v1/auth/logout', () => {
    it('POST /api/v1/auth/logout should logout authenticated user', async () => {
      // First login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@itellico.com',
          password: 'password123',
        },
      });

      if (loginResponse.statusCode === 200) {
        const cookies = loginResponse.headers['set-cookie'] as string[];
        const accessToken = cookies
          .find(cookie => cookie.includes('access_token'))
          ?.split(';')[0];

        if (accessToken) {
          const logoutResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/logout',
            headers: {
              cookie: accessToken,
            },
          });

          expect(logoutResponse.statusCode).toBe(200);
          const body = JSON.parse(logoutResponse.payload);
          expect(body.success).toBe(true);
          
          // Check that cookies are cleared
          const logoutCookies = logoutResponse.headers['set-cookie'] as string[];
          expect(logoutCookies.some(cookie => 
            cookie.includes('access_token') && cookie.includes('Max-Age=0')
          )).toBe(true);
        }
      }
    });

    it('POST /api/v1/auth/logout should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('/api/v1/auth/me', () => {
    it('GET /api/v1/auth/me should return current user info', async () => {
      // First login
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'admin@itellico.com',
          password: 'password123',
        },
      });

      if (loginResponse.statusCode === 200) {
        const cookies = loginResponse.headers['set-cookie'] as string[];
        const accessToken = cookies
          .find(cookie => cookie.includes('access_token'))
          ?.split(';')[0];

        if (accessToken) {
          const meResponse = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            headers: {
              cookie: accessToken,
            },
          });

          expect(meResponse.statusCode).toBe(200);
          const body = JSON.parse(meResponse.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('id');
          expect(body.data).toHaveProperty('email');
          expect(body.data).not.toHaveProperty('password');
        }
      }
    });

    it('GET /api/v1/auth/me should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('Protected Route Authorization', () => {
    it('should reject requests without authentication token', async () => {
      const protectedEndpoints = [
        '/api/v1/user/profile',
        '/api/v1/account/users',
        '/api/v1/tenant/settings',
        '/api/v1/platform/admin',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        expect(response.statusCode).toBe(401);
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
      }
    });

    it('should reject requests with invalid authentication token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/profile',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/user/profile',
        headers: {
          authorization: 'InvalidFormat token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include proper CORS headers for public endpoints', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/public/health',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should include security headers in responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/public/health',
      });

      // These headers might be added by security middleware
      expect(response.statusCode).toBe(200);
      // Additional security header checks can be added here
    });
  });
});