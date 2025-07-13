import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Schema Migration Integration Tests', () => {
  let testTenant: any;
  let testAccount: any;
  let testUser: any;
  let testRole: any;
  let testPermission: any;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Integration Test Tenant',
        domain: `test-${Date.now()}.example.com`,
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (testUser) {
      await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
      await prisma.userPermission.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (testAccount) {
      await prisma.account.delete({ where: { id: testAccount.id } });
    }
    if (testRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: testRole.id } });
      await prisma.role.delete({ where: { id: testRole.id } });
    }
    if (testPermission) {
      await prisma.permission.delete({ where: { id: testPermission.id } });
    }
    if (testTenant) {
      await prisma.tenant.delete({ where: { id: testTenant.id } });
    }
    
    await prisma.$disconnect();
  });

  describe('UUID Implementation', () => {
    it('should create entities with valid UUID primary keys', async () => {
      // Create account with user
      testAccount = await prisma.account.create({
        data: {
          tenantId: testTenant.id,
          email: `test-${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash('TestPassword123!', 10),
        },
      });

      testUser = await prisma.user.create({
        data: {
          accountId: testAccount.id,
          firstName: 'Test',
          lastName: 'User',
          username: `testuser_${Date.now()}`,
          userHash: uuidv4(),
        },
      });

      // Verify UUID format
      expect(validateUuid(testAccount.uuid)).toBe(true);
      expect(validateUuid(testUser.uuid)).toBe(true);
      
      // Verify auto-increment IDs still work
      expect(testAccount.id).toBeGreaterThan(0);
      expect(testUser.id).toBeGreaterThan(0);
    });

    it('should support UUID-based lookups', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { uuid: testUser.uuid },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
    });

    it('should maintain backward compatibility with ID lookups', async () => {
      const foundUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.uuid).toBe(testUser.uuid);
    });
  });

  describe('Field Ordering', () => {
    it('should have UUID as first field in query results', async () => {
      const rawResult = await prisma.$queryRaw`
        SELECT * FROM users WHERE id = ${testUser.id} LIMIT 1
      `;

      const columns = Object.keys(rawResult[0]);
      expect(columns[0]).toBe('uuid');
      expect(columns[1]).toBe('id');
    });
  });

  describe('Soft Delete Support', () => {
    it('should soft delete records', async () => {
      // Create a test record
      const testCategory = await prisma.category.create({
        data: {
          name: `Test Category ${Date.now()}`,
          type: 'test',
        },
      });

      // Soft delete
      const softDeleted = await prisma.category.update({
        where: { id: testCategory.id },
        data: {
          deletedAt: new Date(),
          deletedBy: testUser.id,
        },
      });

      expect(softDeleted.deletedAt).toBeDefined();
      expect(softDeleted.deletedBy).toBe(testUser.id);

      // Verify default queries exclude soft deleted
      const categories = await prisma.category.findMany({
        where: { deletedAt: null },
      });

      expect(categories.find(c => c.id === testCategory.id)).toBeUndefined();

      // Cleanup
      await prisma.category.delete({ where: { id: testCategory.id } });
    });

    it('should support restore of soft deleted records', async () => {
      const testTag = await prisma.tag.create({
        data: {
          name: `Test Tag ${Date.now()}`,
        },
      });

      // Soft delete
      await prisma.tag.update({
        where: { id: testTag.id },
        data: {
          deletedAt: new Date(),
          deletedBy: testUser.id,
        },
      });

      // Restore
      const restored = await prisma.tag.update({
        where: { id: testTag.id },
        data: {
          deletedAt: null,
          deletedBy: null,
        },
      });

      expect(restored.deletedAt).toBeNull();
      expect(restored.deletedBy).toBeNull();

      // Cleanup
      await prisma.tag.delete({ where: { id: testTag.id } });
    });
  });

  describe('Permission System', () => {
    beforeAll(async () => {
      // Create test permission
      testPermission = await prisma.permission.create({
        data: {
          name: 'test.resource.read',
          domain: 'test',
          resource: 'resource',
          action: 'read',
          displayName: 'Test Resource Read',
          category: 'test',
        },
      });

      // Create test role
      testRole = await prisma.role.create({
        data: {
          name: 'Test Role',
          code: `TEST_ROLE_${Date.now()}`,
          tenantId: testTenant.id,
          level: 50,
        },
      });
    });

    it('should assign permissions to roles', async () => {
      const rolePermission = await prisma.rolePermission.create({
        data: {
          roleId: testRole.id,
          permissionId: testPermission.id,
        },
      });

      expect(rolePermission).toBeDefined();
      expect(rolePermission.createdAt).toBeDefined();
    });

    it('should assign roles to users with validity period', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const userRole = await prisma.userRole.create({
        data: {
          userId: testUser.id,
          roleId: testRole.id,
          validFrom: new Date(),
          validUntil: futureDate,
          grantedBy: testUser.id,
        },
      });

      expect(userRole).toBeDefined();
      expect(userRole.validFrom).toBeDefined();
      expect(userRole.validUntil).toBeDefined();
    });

    it('should check user permissions through roles', async () => {
      const permissions = await prisma.$queryRaw`
        SELECT DISTINCT p.name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ${testUser.id}
        AND ur.valid_until > NOW()
        AND p.is_active = true
      `;

      expect(permissions).toContainEqual(
        expect.objectContaining({ name: 'test.resource.read' })
      );
    });
  });

  describe('Audit Trail', () => {
    it('should create audit logs', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          category: 'DATA_CHANGE',
          eventType: 'test_event',
          entityType: 'user',
          entityId: testUser.uuid,
          tenantId: testTenant.id,
          userId: testUser.id,
          operation: 'test_operation',
          status: 'COMPLETED',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        },
      });

      expect(validateUuid(auditLog.uuid)).toBe(true);
      expect(auditLog.category).toBe('DATA_CHANGE');
      expect(auditLog.createdAt).toBeDefined();
    });

    it('should query audit logs by date range', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          tenantId: testTenant.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].tenantId).toBe(testTenant.id);
    });
  });

  describe('Cache Tables', () => {
    it('should create permission cache entries', async () => {
      const cacheEntry = await prisma.permissionCache.create({
        data: {
          cacheKey: `perm:${testUser.id}:${testTenant.id}`,
          userId: testUser.id,
          tenantId: testTenant.id,
          context: 'tenant',
          permissions: ['test.resource.read', 'test.resource.write'],
          roles: [testRole.id],
          computedAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
          version: 1,
          hash: uuidv4(),
        },
      });

      expect(validateUuid(cacheEntry.uuid)).toBe(true);
      expect(cacheEntry.permissions).toContain('test.resource.read');
    });

    it('should update cache statistics', async () => {
      const cacheKey = `perm:${testUser.id}:${testTenant.id}`;
      
      await prisma.permissionCache.update({
        where: { cacheKey },
        data: {
          hitCount: { increment: 1 },
          accessCount: { increment: 1 },
          lastAccessed: new Date(),
        },
      });

      const updated = await prisma.permissionCache.findUnique({
        where: { cacheKey },
      });

      expect(updated?.hitCount).toBeGreaterThan(0);
      expect(updated?.accessCount).toBeGreaterThan(0);
    });
  });

  describe('Transaction Support', () => {
    it('should handle complex transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        // Create a new tag
        const tag = await tx.tag.create({
          data: {
            name: `Transaction Test ${Date.now()}`,
          },
        });

        // Create audit log
        const audit = await tx.auditLog.create({
          data: {
            category: 'DATA_CHANGE',
            eventType: 'tag_created',
            entityType: 'tag',
            entityId: tag.uuid,
            tenantId: testTenant.id,
            userId: testUser.id,
            operation: 'create',
            status: 'COMPLETED',
          },
        });

        // Invalidate cache
        await tx.cacheInvalidationLog.create({
          data: {
            pattern: 'tags:*',
            reason: 'tag_created',
            invalidatedBy: testUser.id,
          },
        });

        return { tag, audit };
      });

      expect(result.tag).toBeDefined();
      expect(result.audit).toBeDefined();

      // Cleanup
      await prisma.tag.delete({ where: { id: result.tag.id } });
    });

    it('should rollback on transaction failure', async () => {
      let createdTagId: number | null = null;

      try {
        await prisma.$transaction(async (tx) => {
          const tag = await tx.tag.create({
            data: {
              name: `Rollback Test ${Date.now()}`,
            },
          });
          
          createdTagId = tag.id;

          // Force an error
          throw new Error('Forced rollback');
        });
      } catch (error) {
        // Expected error
      }

      // Verify rollback
      if (createdTagId) {
        const tag = await prisma.tag.findUnique({
          where: { id: createdTagId },
        });
        expect(tag).toBeNull();
      }
    });
  });

  describe('Performance Constraints', () => {
    it('should meet UUID lookup performance targets', async () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime();
        
        await prisma.user.findUnique({
          where: { uuid: testUser.uuid },
        });
        
        const [seconds, nanoseconds] = process.hrtime(start);
        times.push(seconds * 1000 + nanoseconds / 1000000);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

      console.log(`UUID Lookup - Avg: ${avgTime.toFixed(2)}ms, P95: ${p95Time.toFixed(2)}ms`);
      
      // Performance targets
      expect(avgTime).toBeLessThan(10); // Average < 10ms
      expect(p95Time).toBeLessThan(20); // P95 < 20ms
    });

    it('should handle concurrent operations', async () => {
      const concurrentOps = 10;
      const promises = [];

      for (let i = 0; i < concurrentOps; i++) {
        promises.push(
          prisma.auditLog.create({
            data: {
              category: 'CONCURRENT_TEST',
              eventType: 'test',
              entityType: 'test',
              entityId: uuidv4(),
              tenantId: testTenant.id,
              userId: testUser.id,
              operation: `concurrent_${i}`,
              status: 'COMPLETED',
            },
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentOps);
      
      // All should have unique UUIDs
      const uuids = results.map(r => r.uuid);
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(concurrentOps);
    });
  });
});