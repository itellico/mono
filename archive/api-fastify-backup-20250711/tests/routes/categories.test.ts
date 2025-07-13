/**
 * Categories API Tests
 * Tests for category management endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestAppHelper, testWithApp } from '../helpers/app.helper';
import { testUtils, testDb } from '../setup';
import crypto from 'crypto';

describe('Categories API', () => {
  const mockCategoryData = {
    name: 'Test Category',
    slug: 'test-category',
    description: 'A test category for testing',
    isActive: true
  };

  describe('GET /api/v1/tenant/categories', () => {
    it('should return paginated categories list', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read'],
          tenantId: 1
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.categories).toBeInstanceOf(Array);
        expect(data.data.pagination).toBeDefined();
        expect(data.data.pagination.page).toBe(1);
        expect(data.data.pagination.limit).toBe(20);
      });
    });

    it('should support pagination parameters', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories',
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
          permissions: ['tenant.categories.read'],
          tenantId: 1
        });

        // Create a searchable category
        await testDb.category.create({
          data: {
            name: 'Searchable Category',
            slug: 'searchable-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories',
          query: {
            search: 'searchable'
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.categories.some((cat: any) => cat.name.includes('Searchable'))).toBe(true);
      });
    });

    it('should filter by parent category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read'],
          tenantId: 1
        });

        // Create parent category
        const parentCategory = await testDb.category.create({
          data: {
            name: 'Parent Category',
            slug: 'parent-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create child categories
        await testDb.category.createMany({
          data: [
            {
              name: 'Child Category 1',
              slug: 'child-category-1',
              uuid: crypto.randomUUID(),
              parentId: parentCategory.id,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: 'Child Category 2',
              slug: 'child-category-2',
              uuid: crypto.randomUUID(),
              parentId: parentCategory.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories',
          query: {
            parentId: parentCategory.id
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.categories).toHaveLength(2);
        expect(data.data.categories.every((cat: any) => cat.parentId === parentCategory.id)).toBe(true);
      });
    });

    it('should get top-level categories when parentId is 0', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        // Create mix of parent and child categories
        await testDb.category.createMany({
          data: [
            {
              name: 'Top Level 1',
              slug: 'top-level-1',
              uuid: crypto.randomUUID(),
              parentId: null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: 'Top Level 2',
              slug: 'top-level-2',
              uuid: crypto.randomUUID(),
              parentId: null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: 'Child Category',
              slug: 'child-category',
              uuid: crypto.randomUUID(),
              parentId: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories',
          query: {
            parentId: 0
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.categories.every((cat: any) => cat.parentId === null)).toBe(true);
      });
    });

    it('should require authentication', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/tenant/categories'
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('POST /api/v1/tenant/categories', () => {
    it('should create a new category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create'],
          tenantId: 1
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: mockCategoryData
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.category.name).toBe(mockCategoryData.name);
        expect(data.data.category.slug).toBe(mockCategoryData.slug);
        expect(data.data.category.uuid).toBeDefined();
      });
    });

    it('should auto-generate slug if not provided', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create']
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: {
            name: 'Category Without Slug',
            description: 'This category has no slug'
          }
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.data.category.slug).toBe('category-without-slug');
      });
    });

    it('should create subcategory with parent', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create']
        });

        // Create parent category
        const parentCategory = await testDb.category.create({
          data: {
            name: 'Parent Category',
            slug: 'parent-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: {
            name: 'Sub Category',
            slug: 'sub-category',
            parentId: parentCategory.id
          }
        });

        expect(response.statusCode).toBe(201);
        const data = response.json();
        expect(data.data.category.parentId).toBe(parentCategory.id);
      });
    });

    it('should require tenant.categories.create permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read'] // Missing create permission
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: mockCategoryData
        });

        expect(response.statusCode).toBe(403);
      });
    });

    it('should validate required fields', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create']
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: {
            // Missing required name field
            description: 'Category without name'
          }
        });

        expect(response.statusCode).toBe(400);
      });
    });

    it('should handle duplicate slugs', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create']
        });

        // Create first category
        await testDb.category.create({
          data: {
            name: 'Existing Category',
            slug: 'existing-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Try to create with same slug
        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: {
            name: 'New Category',
            slug: 'existing-category'
          }
        });

        expect(response.statusCode).toBe(409);
        const data = response.json();
        expect(data.error).toContain('already exists');
      });
    });
  });

  describe('GET /api/v1/tenant/categories/:uuid', () => {
    it('should return specific category by UUID', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        const category = await testDb.category.create({
          data: {
            name: 'Specific Category',
            slug: 'specific-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/categories/${category.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.category.name).toBe('Specific Category');
      });
    });

    it('should return 404 for non-existent category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/categories/${crypto.randomUUID()}`
        });

        expect(response.statusCode).toBe(404);
        const data = response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      });
    });

    it('should include parent and children relationships', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        // Create parent category
        const parentCategory = await testDb.category.create({
          data: {
            name: 'Parent Category',
            slug: 'parent-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create main category with parent
        const category = await testDb.category.create({
          data: {
            name: 'Main Category',
            slug: 'main-category',
            uuid: crypto.randomUUID(),
            parentId: parentCategory.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create child categories
        await testDb.category.createMany({
          data: [
            {
              name: 'Child 1',
              slug: 'child-1',
              uuid: crypto.randomUUID(),
              parentId: category.id,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: 'Child 2',
              slug: 'child-2',
              uuid: crypto.randomUUID(),
              parentId: category.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: `/api/v1/tenant/categories/${category.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.category.parent).toBeDefined();
        expect(data.data.category.parent.name).toBe('Parent Category');
        expect(data.data.category.children).toHaveLength(2);
      });
    });
  });

  describe('PATCH /api/v1/tenant/categories/:uuid', () => {
    it('should update category fields', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.update']
        });

        const category = await testDb.category.create({
          data: {
            name: 'Original Category',
            slug: 'original-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/categories/${category.uuid}`,
          payload: {
            name: 'Updated Category',
            description: 'Updated description'
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.category.name).toBe('Updated Category');
        expect(data.data.category.description).toBe('Updated description');
      });
    });

    it('should update parent category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.update']
        });

        // Create two parent categories
        const parent1 = await testDb.category.create({
          data: {
            name: 'Parent 1',
            slug: 'parent-1',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const parent2 = await testDb.category.create({
          data: {
            name: 'Parent 2',
            slug: 'parent-2',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create category under parent1
        const category = await testDb.category.create({
          data: {
            name: 'Mobile Category',
            slug: 'mobile-category',
            uuid: crypto.randomUUID(),
            parentId: parent1.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Move to parent2
        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/categories/${category.uuid}`,
          payload: {
            parentId: parent2.id
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.category.parentId).toBe(parent2.id);
      });
    });

    it('should prevent circular parent references', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.update']
        });

        // Create parent category
        const parent = await testDb.category.create({
          data: {
            name: 'Parent',
            slug: 'parent',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create child category
        const child = await testDb.category.create({
          data: {
            name: 'Child',
            slug: 'child',
            uuid: crypto.randomUUID(),
            parentId: parent.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Try to make parent a child of its own child
        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/categories/${parent.uuid}`,
          payload: {
            parentId: child.id
          }
        });

        expect(response.statusCode).toBe(400);
        const data = response.json();
        expect(data.error).toContain('circular');
      });
    });

    it('should require tenant.categories.update permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read'] // Missing update permission
        });

        const category = await testDb.category.create({
          data: {
            name: 'Category to Update',
            slug: 'category-to-update',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'PATCH',
          url: `/api/v1/tenant/categories/${category.uuid}`,
          payload: {
            name: 'Updated Name'
          }
        });

        expect(response.statusCode).toBe(403);
      });
    });
  });

  describe('DELETE /api/v1/tenant/categories/:uuid', () => {
    it('should delete empty category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.delete']
        });

        const category = await testDb.category.create({
          data: {
            name: 'Category to Delete',
            slug: 'category-to-delete',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/categories/${category.uuid}`
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted');

        // Verify category is deleted
        const deletedCategory = await testDb.category.findUnique({
          where: { id: category.id }
        });
        expect(deletedCategory).toBeNull();
      });
    });

    it('should prevent deletion of categories with children', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.delete']
        });

        // Create parent category
        const parent = await testDb.category.create({
          data: {
            name: 'Parent Category',
            slug: 'parent-category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create child category
        await testDb.category.create({
          data: {
            name: 'Child Category',
            slug: 'child-category',
            uuid: crypto.randomUUID(),
            parentId: parent.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/categories/${parent.uuid}`
        });

        expect(response.statusCode).toBe(409);
        const data = response.json();
        expect(data.error).toContain('has children');
      });
    });

    it('should require tenant.categories.delete permission', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read'] // Missing delete permission
        });

        const category = await testDb.category.create({
          data: {
            name: 'Category to Delete',
            slug: 'category-to-delete-2',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'DELETE',
          url: `/api/v1/tenant/categories/${category.uuid}`
        });

        expect(response.statusCode).toBe(403);
      });
    });
  });

  describe('GET /api/v1/tenant/categories/tree', () => {
    it('should return hierarchical category tree', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        // Create hierarchical categories
        const root1 = await testDb.category.create({
          data: {
            name: 'Root 1',
            slug: 'root-1',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const child1 = await testDb.category.create({
          data: {
            name: 'Child 1.1',
            slug: 'child-1-1',
            uuid: crypto.randomUUID(),
            parentId: root1.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        await testDb.category.create({
          data: {
            name: 'Grandchild 1.1.1',
            slug: 'grandchild-1-1-1',
            uuid: crypto.randomUUID(),
            parentId: child1.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories/tree'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.tree).toBeInstanceOf(Array);
        
        // Find root in tree
        const rootNode = data.data.tree.find((node: any) => node.name === 'Root 1');
        expect(rootNode).toBeDefined();
        expect(rootNode.children).toHaveLength(1);
        expect(rootNode.children[0].name).toBe('Child 1.1');
        expect(rootNode.children[0].children).toHaveLength(1);
        expect(rootNode.children[0].children[0].name).toBe('Grandchild 1.1.1');
      });
    });

    it('should filter inactive categories from tree', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        // Create active and inactive categories
        await testDb.category.createMany({
          data: [
            {
              name: 'Active Category',
              slug: 'active-category',
              uuid: crypto.randomUUID(),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              name: 'Inactive Category',
              slug: 'inactive-category',
              uuid: crypto.randomUUID(),
              isActive: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories/tree'
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.tree.some((node: any) => node.name === 'Active Category')).toBe(true);
        expect(data.data.tree.some((node: any) => node.name === 'Inactive Category')).toBe(false);
      });
    });
  });

  describe('POST /api/v1/tenant/categories/:uuid/tags', () => {
    it('should assign tags to category', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.update'],
          tenantId: 1
        });

        const category = await testDb.category.create({
          data: {
            name: 'Category for Tags',
            slug: 'category-for-tags',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Create tags
        const tag1 = await testDb.tag.create({
          data: {
            name: 'Tag 1',
            slug: 'tag-1',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const tag2 = await testDb.tag.create({
          data: {
            name: 'Tag 2',
            slug: 'tag-2',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: `/api/v1/tenant/categories/${category.uuid}/tags`,
          payload: {
            tagIds: [tag1.id, tag2.id]
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.success).toBe(true);
        expect(data.data.assigned).toBe(2);
      });
    });

    it('should handle duplicate tag assignments', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.update'],
          tenantId: 1
        });

        const category = await testDb.category.create({
          data: {
            name: 'Category',
            slug: 'category',
            uuid: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        const tag = await testDb.tag.create({
          data: {
            name: 'Tag',
            slug: 'tag',
            uuid: crypto.randomUUID(),
            tenantId: 1,
            updatedAt: new Date()
          }
        });

        // Assign tag first time
        await testDb.categoryTag.create({
          data: {
            categoryId: category.id,
            tagId: tag.id
          }
        });

        // Try to assign again
        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: `/api/v1/tenant/categories/${category.uuid}/tags`,
          payload: {
            tagIds: [tag.id]
          }
        });

        expect(response.statusCode).toBe(200);
        const data = response.json();
        expect(data.data.assigned).toBe(0); // No new assignments
        expect(data.data.skipped).toBe(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should validate UUID format', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.read']
        });

        const response = await helper.authenticatedRequest({
          method: 'GET',
          url: '/api/v1/tenant/categories/invalid-uuid-format'
        });

        expect(response.statusCode).toBe(400);
        const data = response.json();
        expect(data.error).toContain('Invalid UUID');
      });
    });

    it('should handle validation errors', async () => {
      await testWithApp(async (helper: TestAppHelper) => {
        await helper.createTestUser({
          permissions: ['tenant.categories.create']
        });

        const response = await helper.authenticatedRequest({
          method: 'POST',
          url: '/api/v1/tenant/categories',
          payload: {
            name: 'A', // Too short
            slug: 'invalid slug with spaces' // Invalid slug format
          }
        });

        expect(response.statusCode).toBe(400);
        const data = response.json();
        expect(data.error).toBeDefined();
      });
    });
  });
});