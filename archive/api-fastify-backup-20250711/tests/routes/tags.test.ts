/**
 * Tags API Tests
 * Tests for tag management endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestAppHelper, testWithApp } from '../helpers/app.helper';
import { testUtils, testDb } from '../setup';
import crypto from 'crypto';

describe('Tags API', () => {
  const mockTagData = {
    name: 'Test Tag',
    slug: 'test-tag',
    description: 'A test tag for testing',
    category: 'general',
    isActive: true
  };

  describe('GET /api/v1/tenant/tags', () => {
    it('should return paginated tags list', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        // Create test user with read permissions
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.tags).toBeInstanceOf(Array);
        expect(data.data.pagination).toBeDefined();
        expect(data.data.pagination.page).toBe(1);
        expect(data.data.pagination.limit).toBe(20);
      });
    });

    it('should support pagination parameters', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags',
          query: {
            page: 2,
            limit: 10
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.pagination.page).toBe(2);
        expect(data.data.pagination.limit).toBe(10);
      });
    });

    it('should support search functionality', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        // Create a searchable tag
        await testDb.tag.create({
          data: {
            name: 'Searchable Tag',
            slug: 'searchable-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags',
          query: {
            search: 'searchable'
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.tags.some((tag: any) => tag.name.includes('Searchable'))).toBe(true);
      });
    });

    it('should filter by category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        // Create tags with different categories
        await testDb.tag.createMany({
          data: [
            {
              name: 'Tech Tag',
              slug: 'tech-tag',
              uuid: crypto.randomUUID(),
              category: 'technology',
              tenantId: 1,
              updatedAt: new Date()
            },
            {
              name: 'Art Tag',
              slug: 'art-tag',
              uuid: crypto.randomUUID(),
              category: 'art',
              tenantId: 1,
              updatedAt: new Date()
            }
          ]
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags',
          query: {
            category: 'technology'
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.tags.every((tag: any) => tag.category === 'technology')).toBe(true);
      });
    });

    it('should require authentication', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/tenant/tags'
        });

        expect(response.statusCode).toBe(401);
      });
    });

    it('should enforce tenant isolation', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        // Create user in tenant 1
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        // Create tag in different tenant
        await testDb.tag.create({
          data: {
            name: 'Other Tenant Tag',
            slug: 'other-tenant-tag',
            uuid: crypto.randomUUID(),
            tenantId: 2,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.tags.some((tag: any) => tag.name === 'Other Tenant Tag')).toBe(false);
      });
    });
  });

  describe('POST /api/v1/tenant/tags', () => {
    it('should create a new tag', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create'],
          tenantId: 1
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: mockTagData
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.tag.name).toBe(mockTagData.name);
        expect(data.data.tag.slug).toBe(mockTagData.slug);
        expect(data.data.tag.uuid).toBeDefined();
      });
    });

    it('should auto-generate slug if not provided', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create']
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: {
            name: 'Tag Without Slug',
            description: 'This tag has no slug'
          }
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.data.tag.slug).toBe('tag-without-slug');
      });
    });

    it('should require tenant.tags.create permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'] // Missing create permission
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: mockTagData
        });

        expect(response.statusCode).toBe(403);
      });
    });

    it('should validate required fields', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create']
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: {
            // Missing required name field
            description: 'Tag without name'
          }
        });

        expect(response.statusCode).toBe(400);
      });
    });

    it('should handle duplicate slugs', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create'],
          tenantId: 1
        });

        // Create first tag
        await testDb.tag.create({
          data: {
            name: 'Existing Tag',
            slug: 'existing-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        // Try to create with same slug
        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: {
            name: 'New Tag',
            slug: 'existing-tag'
          }
        });

        expect(response.statusCode).toBe(409);
        const data = response.json();
        expect(data.error).toContain('already exists');
      });
    });
  });

  describe('GET /api/v1/tenant/tags/:uuid', () => {
    it('should return specific tag by UUID', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Specific Tag',
            slug: 'specific-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.tag.name).toBe('Specific Tag');
      });
    });

    it('should return 404 for non-existent tag', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/tags/${crypto.randomUUID()}`
        });

        expect(response.statusCode).toBe(404);
        const data = response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });
    });

    it('should include usage count', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Used Tag',
            slug: 'used-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            usageCount: 5,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.tag.usageCount).toBe(5);
      });
    });
  });

  describe('PATCH /api/v1/tenant/tags/:uuid', () => {
    it('should update tag fields', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.update'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Original Tag',
            slug: 'original-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/tags/${tag.uuid}`,
          payload: {
            name: 'Updated Tag',
            description: 'Updated description'
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.tag.name).toBe('Updated Tag');
        expect(data.data.tag.description).toBe('Updated description');
      });
    });

    it('should require tenant.tags.update permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'], // Missing update permission
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Tag to Update',
            slug: 'tag-to-update',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/tags/${tag.uuid}`,
          payload: {
            name: 'Updated Name'
          }
        });

        expect(response.statusCode).toBe(403);
      });
    });

    it('should prevent system tag modification', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.update'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'System Tag',
            slug: 'system-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            isSystem: true,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/tags/${tag.uuid}`,
          payload: {
            name: 'Modified System Tag'
          }
        });

        expect(response.statusCode).toBe(403);
        const data = response.json();
        expect(data.error).toContain('system tag');
      });
    });
  });

  describe('DELETE /api/v1/tenant/tags/:uuid', () => {
    it('should delete unused tag', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.delete'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Tag to Delete',
            slug: 'tag-to-delete',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            usageCount: 0,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted');

        // Verify tag is deleted
        const deletedTag = await testDb.tag.findUnique({
          where: { id: tag.id }
        });
        expect(deletedTag).toBeNull();
      });
    });

    it('should prevent deletion of used tags', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.delete'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Used Tag',
            slug: 'used-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            usageCount: 5,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(409);
        const data = response.json();
        expect(data.error).toContain('in use');
      });
    });

    it('should prevent deletion of system tags', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.delete'],
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'System Tag',
            slug: 'system-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            isSystem: true,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(403);
        const data = response.json();
        expect(data.error).toContain('system tag');
      });
    });

    it('should require tenant.tags.delete permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read'], // Missing delete permission
          tenantId: 1
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Tag to Delete',
            slug: 'tag-to-delete-2',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/tags/${tag.uuid}`
        });

        expect(response.statusCode).toBe(403);
      });
    });
  });

  describe('POST /api/v1/tenant/tags/bulk', () => {
    it('should create multiple tags', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create'],
          tenantId: 1
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags/bulk',
          payload: {
            tags: [
              { name: 'Bulk Tag 1', category: 'tech' },
              { name: 'Bulk Tag 2', category: 'art' },
              { name: 'Bulk Tag 3', category: 'general' }
            ]
          }
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.created).toBe(3);
        expect(data.data.tags).toHaveLength(3);
      });
    });

    it('should handle partial success', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create'],
          tenantId: 1
        });

        // Create existing tag
        await testDb.tag.create({
          data: {
            name: 'Existing Tag',
            slug: 'existing-tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags/bulk',
          payload: {
            tags: [
              { name: 'New Tag 1' },
              { name: 'Existing Tag', slug: 'existing-tag' }, // Will fail
              { name: 'New Tag 2' }
            ]
          }
        });

        expect(response.statusCode).toBe(207); // Multi-status
        const data = response.json();
        expect(data.data.created).toBe(2);
        expect(data.data.failed).toBe(1);
        expect(data.data.errors).toHaveLength(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should validate UUID format', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/tags/invalid-uuid-format'
        });

        expect(response.statusCode).toBe(400);
        const data = response.json();
        expect(data.error).toContain('Invalid UUID');
      });
    });

    it('should handle database errors gracefully', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.tags.create']
        });

        // Force a database error by using an invalid tenantId constraint
        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/tags',
          payload: {
            name: 'Tag with Invalid Tenant',
            tenantId: 999999 // Non-existent tenant
          }
        });

        expect(response.statusCode).toBe(500);
        const data = response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });
    });
  });
});