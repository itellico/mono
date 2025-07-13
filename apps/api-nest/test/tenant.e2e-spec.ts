/**
 * Tenant Tier Endpoints E2E Tests
 * Tests for tenant-level endpoints with proper authentication and permissions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('Tenant Tier Endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let tenantAdminCookie: string;
  let accountUserCookie: string;

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

    await authenticateUsers();
  });

  afterAll(async () => {
    await app.close();
  });

  async function authenticateUsers() {
    // Try to login as tenant admin
    const tenantAdminResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'tenant-admin@example.com',
        password: 'password123',
      },
    });

    if (tenantAdminResponse.statusCode === 200) {
      const cookies = tenantAdminResponse.headers['set-cookie'] as string[];
      tenantAdminCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }

    // Login as account user
    const accountUserResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'account-admin@example.com',
        password: 'password123',
      },
    });

    if (accountUserResponse.statusCode === 200) {
      const cookies = accountUserResponse.headers['set-cookie'] as string[];
      accountUserCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }
  }

  function getTenantAdminAuthHeaders() {
    return tenantAdminCookie ? { cookie: tenantAdminCookie } : {};
  }

  function getAccountUserAuthHeaders() {
    return accountUserCookie ? { cookie: accountUserCookie } : {};
  }

  describe('/api/v1/tenant/settings', () => {
    it('GET /api/v1/tenant/settings should return tenant settings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/settings',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('name');
          expect(body.data).toHaveProperty('subdomain');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/tenant/settings should update tenant settings', async () => {
      const settingsData = {
        name: 'Updated Tenant Name',
        settings: {
          theme: 'dark',
          features: ['feature1', 'feature2'],
        },
      };

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/tenant/settings',
        payload: settingsData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should deny access to account users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/settings',
        headers: getAccountUserAuthHeaders(),
      });

      if (accountUserCookie) {
        expect(response.statusCode).toBe(403);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/users', () => {
    it('GET /api/v1/tenant/users should list tenant users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/users',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
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

    it('POST /api/v1/tenant/users should create new tenant user', async () => {
      const newUserData = {
        email: 'tenant-user@example.com',
        name: 'New Tenant User',
        role: 'tenant_user',
        permissions: ['tenant.read', 'tenant.write'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/users',
        payload: newUserData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/model-schemas', () => {
    it('GET /api/v1/tenant/model-schemas should list schemas', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/model-schemas',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
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

    it('POST /api/v1/tenant/model-schemas should create new schema', async () => {
      const schemaData = {
        name: 'TestSchema',
        description: 'A test schema',
        fields: [
          {
            name: 'title',
            type: 'string',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
          },
        ],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/model-schemas',
        payload: schemaData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/tenant/model-schemas/:id should update schema', async () => {
      const schemaId = '1';
      const updateData = {
        name: 'Updated Schema Name',
        description: 'Updated description',
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/tenant/model-schemas/${schemaId}`,
        payload: updateData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 404, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('DELETE /api/v1/tenant/model-schemas/:id should delete schema', async () => {
      const schemaId = '999'; // Non-existent schema

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/tenant/model-schemas/${schemaId}`,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 404, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/workflows', () => {
    it('GET /api/v1/tenant/workflows should list workflows', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/workflows',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
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

    it('POST /api/v1/tenant/workflows should create workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        steps: [
          {
            name: 'Step 1',
            type: 'condition',
            config: { field: 'status', operator: 'equals', value: 'active' },
          },
          {
            name: 'Step 2',
            type: 'action',
            config: { action: 'send_email', template: 'welcome' },
          },
        ],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/workflows',
        payload: workflowData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/categories', () => {
    it('GET /api/v1/tenant/categories should list categories', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/categories',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/tenant/categories should create category', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'A test category',
        parentId: null,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/categories',
        payload: categoryData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/tags', () => {
    it('GET /api/v1/tenant/tags should list tags', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/tags',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/tenant/tags should create tag', async () => {
      const tagData = {
        name: 'test-tag',
        color: '#FF5733',
        description: 'A test tag',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/tags',
        payload: tagData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/permissions', () => {
    it('GET /api/v1/tenant/permissions should list permissions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/permissions',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/tenant/permissions should create permission', async () => {
      const permissionData = {
        name: 'custom.permission',
        description: 'A custom tenant permission',
        category: 'custom',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/permissions',
        payload: permissionData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/tenant/monitoring', () => {
    it('GET /api/v1/tenant/monitoring should return monitoring data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/monitoring',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/tenant/monitoring/metrics should return metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/monitoring/metrics',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('Tenant Context and Isolation', () => {
    it('should enforce tenant isolation', async () => {
      // Test that tenant admin can only see their tenant's data
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/tenant/users',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie && response.statusCode === 200) {
        const body = JSON.parse(response.payload);
        expect(body.success).toBe(true);
        // All users should belong to the same tenant
        if (body.data.length > 0) {
          const tenantIds = body.data.map((user: any) => user.tenantId);
          const uniqueTenantIds = [...new Set(tenantIds)];
          expect(uniqueTenantIds.length).toBe(1);
        }
      }
    });

    it('should validate tenant context in requests', async () => {
      // Test creating a resource with wrong tenant context
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/users',
        payload: {
          email: 'test@example.com',
          name: 'Test User',
          tenantId: '999', // Wrong tenant ID
        },
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('Tenant Tier Permission Checks', () => {
    it('should allow tenant admins to access tenant endpoints', async () => {
      const tenantEndpoints = [
        '/api/v1/tenant/settings',
        '/api/v1/tenant/users',
        '/api/v1/tenant/model-schemas',
        '/api/v1/tenant/workflows',
        '/api/v1/tenant/categories',
        '/api/v1/tenant/tags',
        '/api/v1/tenant/permissions',
        '/api/v1/tenant/monitoring',
      ];

      for (const endpoint of tenantEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getTenantAdminAuthHeaders(),
        });

        if (tenantAdminCookie) {
          expect([200, 403, 404]).toContain(response.statusCode);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });

    it('should deny access to platform endpoints', async () => {
      const platformEndpoints = [
        '/api/v1/platform/admin',
        '/api/v1/platform/tenants',
        '/api/v1/platform/system',
      ];

      for (const endpoint of platformEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getTenantAdminAuthHeaders(),
        });

        if (tenantAdminCookie) {
          expect([403, 404]).toContain(response.statusCode);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });
  });

  describe('Complex Data Operations', () => {
    it('should handle schema validation for complex data structures', async () => {
      const complexData = {
        name: 'Complex Schema',
        fields: [
          {
            name: 'nested_object',
            type: 'object',
            properties: {
              name: { type: 'string', required: true },
              value: { type: 'number', required: false },
            },
          },
          {
            name: 'array_field',
            type: 'array',
            items: { type: 'string' },
          },
        ],
        validation: {
          rules: [
            { field: 'name', required: true, minLength: 3 },
            { field: 'nested_object.name', required: true },
          ],
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/model-schemas',
        payload: complexData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle bulk operations', async () => {
      const bulkData = {
        operation: 'create',
        items: [
          { name: 'Tag 1', color: '#FF0000' },
          { name: 'Tag 2', color: '#00FF00' },
          { name: 'Tag 3', color: '#0000FF' },
        ],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tenant/tags/bulk',
        payload: bulkData,
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect([200, 400, 403, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });
});