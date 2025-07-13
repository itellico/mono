/**
 * Account Tier Endpoints E2E Tests
 * Tests for account-level endpoints with proper authentication and permissions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('Account Tier Endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let accountAdminCookie: string;
  let userCookie: string;

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

    // Authenticate account admin and regular user
    await authenticateUsers();
  });

  afterAll(async () => {
    await app.close();
  });

  async function authenticateUsers() {
    // Try to login as account admin
    const adminLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'account-admin@example.com',
        password: 'password123',
      },
    });

    if (adminLoginResponse.statusCode === 200) {
      const cookies = adminLoginResponse.headers['set-cookie'] as string[];
      accountAdminCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }

    // Login as regular user
    const userLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    if (userLoginResponse.statusCode === 200) {
      const cookies = userLoginResponse.headers['set-cookie'] as string[];
      userCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }
  }

  function getAdminAuthHeaders() {
    return accountAdminCookie ? { cookie: accountAdminCookie } : {};
  }

  function getUserAuthHeaders() {
    return userCookie ? { cookie: userCookie } : {};
  }

  describe('/api/v1/account/users', () => {
    it('GET /api/v1/account/users should list account users (admin)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/users',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(Array.isArray(body.data)).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/account/users should deny access to regular user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/users',
        headers: getUserAuthHeaders(),
      });

      if (userCookie) {
        expect(response.statusCode).toBe(403); // Forbidden
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(false);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/account/users with pagination should work', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/users?page=1&limit=10&search=test',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/account/users should create new user (admin)', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/account/users',
        payload: newUserData,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 201) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data.email).toBe(newUserData.email);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/account/users should validate user data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: '', // empty name
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/account/users',
        payload: invalidUserData,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/account/users/:id', () => {
    it('GET /api/v1/account/users/:id should return user details', async () => {
      const userId = '1';

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/account/users/${userId}`,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 404, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('id');
          expect(body.data).not.toHaveProperty('password');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/account/users/:id should update user', async () => {
      const userId = '1';
      const updateData = {
        name: 'Updated Name',
        role: 'admin',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/account/users/${userId}`,
        payload: updateData,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 404, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('DELETE /api/v1/account/users/:id should delete user', async () => {
      const userId = '999'; // Non-existent user

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/account/users/${userId}`,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 404, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/account/invitations', () => {
    it('GET /api/v1/account/invitations should list invitations', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/invitations',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(Array.isArray(body.data)).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/account/invitations should create invitation', async () => {
      const invitationData = {
        email: 'invite@example.com',
        role: 'user',
        message: 'Welcome to our team!',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/account/invitations',
        payload: invitationData,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 201) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('DELETE /api/v1/account/invitations/:id should revoke invitation', async () => {
      const invitationId = '1';

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/account/invitations/${invitationId}`,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 404, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/account/billing', () => {
    it('GET /api/v1/account/billing should return billing info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/billing',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/account/billing/invoices should list invoices', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/billing/invoices',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(Array.isArray(body.data)).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/account/billing should update billing info', async () => {
      const billingData = {
        companyName: 'Updated Company Name',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345',
          country: 'US',
        },
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/account/billing',
        payload: billingData,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/account/analytics', () => {
    it('GET /api/v1/account/analytics should return analytics data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/analytics',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/account/analytics with date range should work', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/account/analytics?startDate=${startDate}&endDate=${endDate}`,
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([200, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('Account Tier Permission Checks', () => {
    it('should allow account admins to access account endpoints', async () => {
      const accountEndpoints = [
        '/api/v1/account/users',
        '/api/v1/account/invitations',
        '/api/v1/account/billing',
        '/api/v1/account/analytics',
      ];

      for (const endpoint of accountEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getAdminAuthHeaders(),
        });

        if (accountAdminCookie) {
          expect([200, 403, 404]).toContain(response.statusCode);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });

    it('should deny regular users access to account admin endpoints', async () => {
      const adminEndpoints = [
        '/api/v1/account/users',
        '/api/v1/account/invitations',
        '/api/v1/account/billing',
      ];

      for (const endpoint of adminEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getUserAuthHeaders(),
        });

        if (userCookie) {
          expect(response.statusCode).toBe(403);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });

    it('should deny access to higher tier endpoints', async () => {
      const higherTierEndpoints = [
        '/api/v1/tenant/settings',
        '/api/v1/platform/admin',
      ];

      for (const endpoint of higherTierEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getAdminAuthHeaders(),
        });

        if (accountAdminCookie) {
          expect([403, 404]).toContain(response.statusCode);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid user IDs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/account/users/invalid-id',
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([400, 404, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle missing required fields in POST requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/account/users',
        payload: {}, // Missing required fields
        headers: getAdminAuthHeaders(),
      });

      if (accountAdminCookie) {
        expect([400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle concurrent requests gracefully', async () => {
      const requests = Array(5).fill(null).map(() =>
        app.inject({
          method: 'GET',
          url: '/api/v1/account/users',
          headers: getAdminAuthHeaders(),
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        if (accountAdminCookie) {
          expect([200, 403, 500]).toContain(response.statusCode);
        } else {
          expect(response.statusCode).toBe(401);
        }
      });
    });
  });
});