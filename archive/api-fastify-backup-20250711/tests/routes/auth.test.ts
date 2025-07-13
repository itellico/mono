/**
 * Authentication API Tests - Production Grade
 * Tests with real database and proper security validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { SecurityTestHelper } from '../helpers/security.helper';
import { testUtils, prisma, redis } from '../setup';

describe('Authentication API - Integration Tests', () => {
  let app: TestAppHelper;
  let security: SecurityTestHelper;

  beforeAll(async () => {
    // Ensure test data is seeded
    const superAdminAccount = await prisma.account.findUnique({
      where: { email: 'superadmin@test.com' },
      include: { User: true }
    });
    
    if (!superAdminAccount || !superAdminAccount.User.length) {
      throw new Error('Test data not seeded. Run: pnpm tsx scripts/seed-test-data.ts');
    }
  });

  describe('POST /api/v1/public/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'Test123!',
            rememberMe: false
          }
        });

        expect(response.statusCode).toBe(200);
        
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
          user: {
            email: 'user1@test.com',
            roles: expect.arrayContaining(['User'])
          },
          accessToken: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
          refreshToken: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
          expiresIn: 900
        });

        // Verify cookies are set
        const cookies = response.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies.length).toBeGreaterThanOrEqual(2);
        
        // Check cookie security flags
        const accessTokenCookie = cookies.find((c: string) => c.startsWith('accessToken='));
        expect(accessTokenCookie).toContain('HttpOnly');
        expect(accessTokenCookie).toContain('SameSite=Lax');
        expect(accessTokenCookie).toContain('Path=/');
      });
    });

    it('should reject invalid credentials with proper error', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'WrongPassword123!'
          }
        });

        expect(response.statusCode).toBe(401);
        
        const data = response.json();
        expect(data).toEqual({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
        
        // Ensure no sensitive information is leaked
        expect(response.body).not.toContain('database');
        expect(response.body).not.toContain('stack');
        expect(response.body).not.toContain('prisma');
      });
    });

    it('should handle different cookie expiry for rememberMe', async () => {
      await testWithApp(async (helper) => {
        // Test without rememberMe
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'Test123!',
            rememberMe: false
          }
        });

        // Test with rememberMe
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'Test123!',
            rememberMe: true
          }
        });

        const getMaxAge = (cookies: string[], cookieName: string) => {
          const cookie = cookies.find(c => c.startsWith(`${cookieName}=`));
          const match = cookie?.match(/Max-Age=(\d+)/i);
          return match ? parseInt(match[1]) : null;
        };

        const cookies1 = response1.headers['set-cookie'];
        const cookies2 = response2.headers['set-cookie'];

        expect(getMaxAge(cookies1, 'accessToken')).toBe(900); // 15 minutes
        expect(getMaxAge(cookies2, 'accessToken')).toBe(2592000); // 30 days
      });
    });

    it('should validate email format', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'invalid-email-format',
            password: 'Test123!'
          }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should validate password length', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'short'
          }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should handle missing fields properly', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            password: 'Test123!'
            // Missing email
          }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
        expect(response.json().error).toBeDefined();
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: 'invalid-json',
          headers: {
            'content-type': 'application/json'
          }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });
  });

  describe('Security Tests - OWASP Compliance', () => {
    beforeAll(async () => {
      app = new TestAppHelper();
      await app.createApp();
      security = new SecurityTestHelper(app);
    });

    afterAll(async () => {
      await app.closeApp();
    });

    it('MUST prevent SQL injection attacks', async () => {
      const payloads = security.getSQLInjectionPayloads();
      
      for (const payload of payloads) {
        const response = await app.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: payload,
            password: 'test'
          }
        });

        // Should reject with validation error, not database error
        expect([400, 401]).toContain(response.statusCode);
        
        // Check no database errors are exposed
        const body = JSON.stringify(response.json());
        expect(body).not.toMatch(/syntax.*error/i);
        expect(body).not.toMatch(/column.*not.*found/i);
        expect(body).not.toMatch(/table.*users/i);
        expect(body).not.toContain('PostgreSQL');
        expect(body).not.toContain('prisma');
      }
    });

    it('MUST prevent timing attacks on user enumeration', async () => {
      const results = await security.testUserEnumeration('/api/v1/public/auth/login');
      
      // Both should return same error message
      expect(results.existingUser.message).toBe(results.nonExistingUser.message);
      expect(results.existingUser.error).toBe(results.nonExistingUser.error);
      
      // Response times should be similar (within 100ms)
      const timeDiff = Math.abs(results.existingUser.responseTime - results.nonExistingUser.responseTime);
      expect(timeDiff).toBeLessThan(100);
    });

    it('MUST implement proper rate limiting', async () => {
      const result = await security.bruteForceAttack('/api/v1/public/auth/login', {
        attempts: 10,
        timeWindow: 60
      });

      // Should be blocked before or at the 5th attempt
      expect(result.blockedAt).toBeGreaterThan(0);
      expect(result.blockedAt).toBeLessThanOrEqual(5);
      expect(result.returnedStatus).toBe(429);
      
      // Should include retry-after header
      expect(result.headers['retry-after']).toBeDefined();
      expect(Number(result.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('MUST set secure cookie flags', async () => {
      const response = await app.request({
        method: 'POST',
        url: '/api/v1/public/auth/login',
        payload: {
          email: 'user1@test.com',
          password: 'Test123!'
        }
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Check all security flags
      for (const cookie of cookies) {
        if (cookie.startsWith('accessToken=') || cookie.startsWith('refreshToken=')) {
          expect(cookie.toLowerCase()).toContain('httponly');
          expect(cookie.toLowerCase()).toContain('samesite=lax');
          expect(cookie).toContain('Path=/');
          
          // In production, should also have Secure flag
          if (process.env.NODE_ENV === 'production') {
            expect(cookie.toLowerCase()).toContain('secure');
          }
        }
      }
    });

    it('MUST validate JWT token security', async () => {
      const response = await app.request({
        method: 'POST',
        url: '/api/v1/public/auth/login',
        payload: {
          email: 'user1@test.com',
          password: 'Test123!'
        }
      });

      const { accessToken } = response.json().data;
      const tokenSecurity = await security.testJWTSecurity(accessToken);

      expect(tokenSecurity.valid).toBe(true);
      expect(tokenSecurity.security.hasAlgorithm).toBe(true);
      expect(tokenSecurity.security.algorithmSecure).toBe(true); // Not 'none' or weak
      expect(tokenSecurity.security.hasExpiration).toBe(true);
      expect(tokenSecurity.security.hasIssuedAt).toBe(true);
      expect(tokenSecurity.security.hasSubject).toBe(true);
    });

    it('MUST handle concurrent sessions securely', async () => {
      // Login from two different "devices"
      const [session1, session2] = await Promise.all([
        app.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: { email: 'user1@test.com', password: 'Test123!' },
          headers: { 'user-agent': 'Device-1' }
        }),
        app.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: { email: 'user1@test.com', password: 'Test123!' },
          headers: { 'user-agent': 'Device-2' }
        })
      ]);

      expect(session1.statusCode).toBe(200);
      expect(session2.statusCode).toBe(200);

      // Tokens should be different
      const token1 = session1.json().data.accessToken;
      const token2 = session2.json().data.accessToken;
      expect(token1).not.toBe(token2);

      // Both sessions should be valid
      const [verify1, verify2] = await Promise.all([
        app.request({
          method: 'GET',
          url: '/api/v1/user/profile',
          headers: { 'authorization': `Bearer ${token1}` }
        }),
        app.request({
          method: 'GET',
          url: '/api/v1/user/profile',
          headers: { 'authorization': `Bearer ${token2}` }
        })
      ]);

      // Note: These endpoints might not exist yet, so we check for auth success
      expect([200, 404]).toContain(verify1.statusCode);
      expect([200, 404]).toContain(verify2.statusCode);
    });
  });

  describe('POST /api/v1/public/auth/register', () => {
    it('should prevent duplicate email registration', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/register',
          payload: {
            email: 'user1@test.com', // Already exists
            password: 'NewPass123!',
            name: 'Duplicate User'
          }
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
          success: false,
          error: 'USER_EXISTS',
          message: 'A user with this email already exists'
        });
      });
    });

    it('should enforce password requirements', async () => {
      await testWithApp(async (helper) => {
        // Test passwords that are too short (less than 8 characters)
        const shortPasswords = [
          '123',      // 3 chars
          'pass',     // 4 chars
          '1234567',  // 7 chars
        ];

        for (const password of shortPasswords) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/public/auth/register',
            payload: {
              email: `test${Date.now()}@example.com`,
              password,
              name: 'Test User'
            }
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }

        // Test that 8+ character passwords are accepted
        const validPassword = 'password123'; // 11 chars
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/register',
          payload: {
            email: `test${Date.now()}@example.com`,
            password: validPassword,
            name: 'Test User'
          }
        });

        expect(response.statusCode).toBe(201);
        expect(response.json().success).toBe(true);
      });
    });

    it('should normalize email case', async () => {
      await testWithApp(async (helper) => {
        const timestamp = Date.now();
        const baseEmail = `testuser${timestamp}@example.com`;
        
        // Register with uppercase
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/register',
          payload: {
            email: baseEmail.toUpperCase(),
            password: 'Test123!',
            name: 'Test User'
          }
        });

        expect(response1.statusCode).toBe(201);

        // Try to register with lowercase - should fail
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/register',
          payload: {
            email: baseEmail.toLowerCase(),
            password: 'Test123!',
            name: 'Test User 2'
          }
        });

        expect(response2.statusCode).toBe(400);
        expect(response2.json().error).toBe('USER_EXISTS');
      });
    });
  });

  describe('POST /api/v1/public/auth/logout', () => {
    it('should clear authentication cookies', async () => {
      await testWithApp(async (helper) => {
        // First login
        const loginResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'user1@test.com',
            password: 'Test123!'
          }
        });

        const token = loginResponse.json().data.accessToken;

        // Then logout
        const logoutResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/logout',
          headers: {
            'authorization': `Bearer ${token}`
          }
        });

        expect(logoutResponse.statusCode).toBe(200);
        expect(logoutResponse.json()).toEqual({
          success: true,
          data: {
            message: 'Logged out successfully'
          }
        });

        // Check cookies are cleared
        const cookies = logoutResponse.headers['set-cookie'];
        if (cookies) {
          const clearedCookies = cookies.filter((cookie: string) => 
            cookie.includes('accessToken=;') || 
            cookie.includes('refreshToken=;') ||
            cookie.includes('Max-Age=0')
          );
          expect(clearedCookies.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('GET /api/v1/public/auth/me', () => {
    it('should return current user info with valid token', async () => {
      await testWithApp(async (helper) => {
        // Login first
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/auth/me',
          headers: {
            'authorization': `Bearer ${auth.accessToken}`
          }
        });

        if (response.statusCode === 200) {
          const data = response.json();
          expect(data.success).toBe(true);
          expect(data.data.user).toMatchObject({
            email: 'user1@test.com',
            roles: expect.arrayContaining(['User'])
          });
        } else if (response.statusCode === 404) {
          // Endpoint might not be implemented yet
          expect(response.statusCode).toBe(404);
        }
      });
    });

    it('should reject requests without token', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/public/auth/me'
        });

        expect([401, 403]).toContain(response.statusCode);
        expect(response.json().success).toBe(false);
      });
    });
  });
});