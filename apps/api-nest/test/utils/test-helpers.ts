/**
 * Test Helper Utilities
 * Common utilities and helpers for testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '@common/types/auth.types';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  tier: string;
  permissions: string[];
  tenantId?: string;
  accountId?: string;
}

export class TestHelpers {
  /**
   * Create a test application instance
   */
  static async createTestApp(moduleMetadata: any): Promise<NestFastifyApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
    
    const app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    
    return app;
  }

  /**
   * Generate JWT token for testing
   */
  static generateTestToken(jwtService: JwtService, user: TestUser): string {
    const payload: any = {
      sub: user.id,
      email: user.email,
      tier: user.tier,
      tenantId: user.tenantId,
      accountId: user.accountId,
    };
    
    return jwtService.sign(payload);
  }

  /**
   * Create test user data
   */
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      tier: 'user',
      permissions: ['user.profile.view', 'user.profile.edit'],
      ...overrides,
    };
  }

  /**
   * Create platform admin test user
   */
  static createPlatformAdminUser(): TestUser {
    return this.createTestUser({
      id: 'admin-1',
      email: 'admin@itellico.com',
      name: 'Platform Admin',
      tier: 'platform',
      permissions: [
        'platform.*',
        'tenant.*',
        'account.*',
        'user.*',
        'public.*',
      ],
    });
  }

  /**
   * Create tenant admin test user
   */
  static createTenantAdminUser(tenantId: string = 'tenant-1'): TestUser {
    return this.createTestUser({
      id: 'tenant-admin-1',
      email: 'tenant-admin@example.com',
      name: 'Tenant Admin',
      tier: 'tenant',
      tenantId,
      permissions: [
        'tenant.*',
        'account.*',
        'user.*',
      ],
    });
  }

  /**
   * Wait for a specific condition to be met
   */
  static async waitFor(
    condition: () => Promise<boolean> | boolean,
    timeout: number = 5000,
    interval: number = 100,
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Clear all Redis cache
   */
  static async clearRedisCache(redisService: RedisService): Promise<void> {
    await redisService.reset();
  }

  /**
   * Clear test database
   */
  static async clearDatabase(prisma: PrismaService): Promise<void> {
    // Delete in correct order to avoid foreign key constraints
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.account.deleteMany();
    await prisma.tenant.deleteMany();
  }

  /**
   * Seed test data
   */
  static async seedTestData(prisma: PrismaService): Promise<void> {
    // Create permissions
    const permissions = await Promise.all([
      prisma.permission.create({ data: { name: 'user.profile.view', description: 'View user profile' } }),
      prisma.permission.create({ data: { name: 'user.profile.edit', description: 'Edit user profile' } }),
      prisma.permission.create({ data: { name: 'tenant.users.manage', description: 'Manage tenant users' } }),
      prisma.permission.create({ data: { name: 'platform.admin', description: 'Platform administration' } }),
    ]);

    // Create roles
    const userRole = await prisma.role.create({
      data: { name: 'User', description: 'Standard user role' }
    });
    
    const tenantAdminRole = await prisma.role.create({
      data: { name: 'Tenant Admin', description: 'Tenant administrator role' }
    });

    const platformAdminRole = await prisma.role.create({
      data: { name: 'Platform Admin', description: 'Platform administrator role' }
    });

    // Assign permissions to roles
    await prisma.rolePermission.createMany({
      data: [
        { roleId: userRole.id, permissionId: permissions[0].id },
        { roleId: userRole.id, permissionId: permissions[1].id },
        { roleId: tenantAdminRole.id, permissionId: permissions[0].id },
        { roleId: tenantAdminRole.id, permissionId: permissions[1].id },
        { roleId: tenantAdminRole.id, permissionId: permissions[2].id },
        { roleId: platformAdminRole.id, permissionId: permissions[3].id },
      ]
    });

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        subdomain: 'test-tenant',
        settings: {},
        isActive: true,
      }
    });

    // Create test account
    const account = await prisma.account.create({
      data: {
        email: 'test@example.com',
        passwordHash: '$2b$10$test.hash.for.testing',
        tenantId: tenant.id,
        isActive: true,
      }
    });

    const adminAccount = await prisma.account.create({
      data: {
        email: 'admin@itellico.com',
        passwordHash: '$2b$10$admin.hash.for.testing',
        tenantId: tenant.id,
        isActive: true,
      }
    });

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        uuid: 'test-user-uuid',
        accountId: account.id,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        isActive: true,
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        uuid: 'admin-user-uuid',
        accountId: adminAccount.id,
        firstName: 'Platform',
        lastName: 'Admin',
        username: 'platformadmin',
        isActive: true,
      }
    });

    // Assign roles to users
    await prisma.userRole.createMany({
      data: [
        { userId: testUser.id, roleId: userRole.id },
        { userId: adminUser.id, roleId: platformAdminRole.id },
      ]
    });
  }

  /**
   * Mock successful authentication
   */
  static mockAuthentication(app: NestFastifyApplication, user: TestUser): void {
    const jwtService = app.get(JwtService);
    const token = this.generateTestToken(jwtService, user);
    
    // Mock the JWT guard to return the user
    jest.spyOn(app.get('APP_GUARD'), 'canActivate').mockResolvedValue(true);
  }

  /**
   * Create HTTP headers with authentication
   */
  static createAuthHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Assert successful API response
   */
  static assertSuccessResponse(response: any, expectedData?: any): void {
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    
    if (expectedData) {
      expect(body.data).toMatchObject(expectedData);
    }
  }

  /**
   * Assert error API response
   */
  static assertErrorResponse(response: any, expectedStatus: number, expectedError?: string): void {
    expect(response.statusCode).toBe(expectedStatus);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    
    if (expectedError) {
      expect(body.error).toBe(expectedError);
    }
  }
}