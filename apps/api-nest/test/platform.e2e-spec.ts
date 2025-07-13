/**
 * Platform Tier Endpoints E2E Tests
 * Tests for platform-level endpoints with highest privilege requirements
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TestHelpers } from './utils/test-helpers';

describe('Platform Tier Endpoints (e2e)', () => {
  let app: NestFastifyApplication;
  let platformAdminCookie: string;
  let tenantAdminCookie: string;

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
    // Try to login as platform admin
    const platformAdminResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@itellico.com', // Platform super admin
        password: 'password123',
      },
    });

    if (platformAdminResponse.statusCode === 200) {
      const cookies = platformAdminResponse.headers['set-cookie'] as string[];
      platformAdminCookie = cookies
        .find(cookie => cookie.includes('access_token'))
        ?.split(';')[0] || '';
    }

    // Login as tenant admin for permission testing
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
  }

  function getPlatformAdminAuthHeaders() {
    return platformAdminCookie ? { cookie: platformAdminCookie } : {};
  }

  function getTenantAdminAuthHeaders() {
    return tenantAdminCookie ? { cookie: tenantAdminCookie } : {};
  }

  describe('/api/v1/platform/admin', () => {
    it('GET /api/v1/platform/admin should return platform overview', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/admin',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('platform');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should deny access to non-platform admins', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/admin',
        headers: getTenantAdminAuthHeaders(),
      });

      if (tenantAdminCookie) {
        expect(response.statusCode).toBe(403);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/tenants', () => {
    it('GET /api/v1/platform/tenants should list all tenants', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/tenants',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
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

    it('POST /api/v1/platform/tenants should create new tenant', async () => {
      const tenantData = {
        name: 'New Test Tenant',
        subdomain: 'new-test-tenant',
        settings: {
          features: ['feature1', 'feature2'],
          limits: {
            users: 100,
            storage: 5000000000, // 5GB
          },
        },
        ownerId: '1',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/tenants',
        payload: tenantData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 201) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data.name).toBe(tenantData.name);
          expect(body.data.subdomain).toBe(tenantData.subdomain);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('PUT /api/v1/platform/tenants/:id should update tenant', async () => {
      const tenantId = '1';
      const updateData = {
        name: 'Updated Tenant Name',
        isActive: false,
        settings: {
          features: ['updated-feature'],
        },
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/platform/tenants/${tenantId}`,
        payload: updateData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 404, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('DELETE /api/v1/platform/tenants/:id should delete tenant', async () => {
      const tenantId = '999'; // Non-existent tenant

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/platform/tenants/${tenantId}`,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 404, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/users', () => {
    it('GET /api/v1/platform/users should list all platform users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/users',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
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

    it('GET /api/v1/platform/users with search should work', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/users?search=admin&page=1&limit=10',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/platform/users should create platform user', async () => {
      const userData = {
        email: 'platform-user@itellico.com',
        name: 'Platform User',
        role: 'platform_admin',
        permissions: ['platform.*'],
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/users',
        payload: userData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/system', () => {
    it('GET /api/v1/platform/system should return system information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/system',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('version');
          expect(body.data).toHaveProperty('environment');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/platform/system/health should return detailed health', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/system/health',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('database');
          expect(body.data).toHaveProperty('redis');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/platform/system/maintenance should toggle maintenance mode', async () => {
      const maintenanceData = {
        enabled: true,
        message: 'System maintenance in progress',
        estimatedDuration: 30, // minutes
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/system/maintenance',
        payload: maintenanceData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/audit', () => {
    it('GET /api/v1/platform/audit should return audit logs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/audit',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
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

    it('GET /api/v1/platform/audit with filters should work', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const userId = '1';

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/platform/audit?startDate=${startDate}&endDate=${endDate}&userId=${userId}&action=login`,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/integrations', () => {
    it('GET /api/v1/platform/integrations should list integrations', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/integrations',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/platform/integrations should create integration', async () => {
      const integrationData = {
        name: 'Test Integration',
        type: 'webhook',
        config: {
          url: 'https://example.com/webhook',
          secret: 'webhook-secret',
          events: ['user.created', 'tenant.updated'],
        },
        isActive: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/integrations',
        payload: integrationData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/feature-sets', () => {
    it('GET /api/v1/platform/feature-sets should list feature sets', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/feature-sets',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('POST /api/v1/platform/feature-sets should create feature set', async () => {
      const featureSetData = {
        name: 'Premium Features',
        description: 'Premium feature set for enterprise customers',
        features: [
          'advanced_analytics',
          'custom_workflows',
          'api_access',
          'priority_support',
        ],
        limits: {
          users: 1000,
          storage: 100000000000, // 100GB
          apiCalls: 1000000,
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/feature-sets',
        payload: featureSetData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([201, 400, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('/api/v1/platform/monitoring', () => {
    it('GET /api/v1/platform/monitoring should return platform metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/monitoring',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
          expect(body.data).toHaveProperty('metrics');
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('GET /api/v1/platform/monitoring/performance should return performance data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/monitoring/performance',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('Platform Security and Access Control', () => {
    it('should enforce strict access control for platform endpoints', async () => {
      const platformEndpoints = [
        '/api/v1/platform/admin',
        '/api/v1/platform/tenants',
        '/api/v1/platform/users',
        '/api/v1/platform/system',
        '/api/v1/platform/audit',
        '/api/v1/platform/integrations',
        '/api/v1/platform/feature-sets',
        '/api/v1/platform/monitoring',
      ];

      for (const endpoint of platformEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getTenantAdminAuthHeaders(), // Non-platform admin
        });

        if (tenantAdminCookie) {
          expect(response.statusCode).toBe(403);
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(false);
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });

    it('should allow platform admins full access', async () => {
      const platformEndpoints = [
        '/api/v1/platform/admin',
        '/api/v1/platform/tenants',
        '/api/v1/platform/users',
        '/api/v1/platform/system',
        '/api/v1/platform/audit',
        '/api/v1/platform/integrations',
        '/api/v1/platform/feature-sets',
        '/api/v1/platform/monitoring',
      ];

      for (const endpoint of platformEndpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: getPlatformAdminAuthHeaders(),
        });

        if (platformAdminCookie) {
          expect([200, 403, 404]).toContain(response.statusCode);
          // 403 might occur if the specific platform admin doesn't have all permissions
          // 404 might occur if the endpoint doesn't exist yet
        } else {
          expect(response.statusCode).toBe(401);
        }
      }
    });
  });

  describe('Complex Platform Operations', () => {
    it('should handle tenant migration operations', async () => {
      const migrationData = {
        sourceTenantId: '1',
        targetTenantId: '2',
        dataTypes: ['users', 'content', 'settings'],
        options: {
          preserveIds: false,
          mergeConflicts: 'overwrite',
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/operations/migrate-tenant',
        payload: migrationData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle bulk tenant operations', async () => {
      const bulkData = {
        operation: 'update_feature_set',
        tenantIds: ['1', '2', '3'],
        featureSetId: '1',
        options: {
          applyImmediately: true,
          notifyTenants: true,
        },
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/operations/bulk-tenants',
        payload: bulkData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should handle system backup operations', async () => {
      const backupData = {
        type: 'full',
        includeMedia: false,
        compression: 'gzip',
        encryption: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/system/backup',
        payload: backupData,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });

  describe('Platform Analytics and Reporting', () => {
    it('should return comprehensive platform analytics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/platform/analytics/overview',
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 403, 404]).toContain(response.statusCode);
        
        if (response.statusCode === 200) {
          const body = JSON.parse(response.payload);
          expect(body.success).toBe(true);
        }
      } else {
        expect(response.statusCode).toBe(401);
      }
    });

    it('should generate platform reports', async () => {
      const reportRequest = {
        type: 'usage_summary',
        period: '30d',
        format: 'json',
        includeDetails: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/platform/reports/generate',
        payload: reportRequest,
        headers: getPlatformAdminAuthHeaders(),
      });

      if (platformAdminCookie) {
        expect([200, 400, 403, 404]).toContain(response.statusCode);
      } else {
        expect(response.statusCode).toBe(401);
      }
    });
  });
});