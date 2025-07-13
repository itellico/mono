/**
 * Test Setup
 * Loaded before each test file - handles test isolation and utilities
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import crypto from 'crypto';

// Load test environment
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Real database connections for integration tests
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:testpass123@localhost:5433/mono_test'
    }
  },
  log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error']
});

export const testRedis = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6380',
  {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
  }
);

// Test transaction management for isolation
let txClient: any = null;

export const testUtils = {
  // Database transaction management
  async beginTransaction() {
    // Start a transaction that will be rolled back
    const tx = await testDb.$transaction(async (prisma) => {
      return prisma;
    }, {
      maxWait: 10000,
      timeout: 30000,
      isolationLevel: 'ReadCommitted'
    });
    txClient = tx;
    return tx;
  },

  async rollbackTransaction() {
    if (txClient) {
      // Rollback is automatic when transaction function exits
      txClient = null;
    }
  },

  // Database helpers
  async cleanDatabase() {
    // Clean in correct order due to foreign keys
    await testDb.$transaction([
      testDb.audit_logs.deleteMany(),
      testDb.userPermission.deleteMany(),
      testDb.rolePermission.deleteMany(),
      testDb.userRole.deleteMany(),
      testDb.user.deleteMany(),
      testDb.account.deleteMany(),
      testDb.permission.deleteMany(),
      testDb.role.deleteMany(),
      testDb.tenant.deleteMany(),
    ]);
  },

  async resetDatabase() {
    // More thorough reset using migrations
    execSync('pnpm prisma migrate reset --force --skip-seed', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
  },

  // Redis helpers
  async cleanRedis() {
    await testRedis.flushdb();
  },

  // JWT helpers
  generateToken(payload: any = {}, options: any = {}) {
    const defaultPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      type: 'access',
      sessionId: 'test-session-id',
      tenantId: 'tenant-test-default',
      ...payload
    };

    return jwt.sign(
      defaultPayload,
      options.secret || process.env.JWT_SECRET || 'test-jwt-secret',
      {
        expiresIn: options.expiresIn || '1h',
        ...options
      }
    );
  },

  generateExpiredToken(payload: any = {}) {
    return this.generateToken(payload, { expiresIn: '-1h' });
  },

  // Test data factories
  async createTestUser(data: any = {}) {
    // First create the account
    const account = await testDb.account.create({
      data: {
        email: data.email || `test-${Date.now()}@example.com`,
        passwordHash: data.passwordHash || '$2a$10$K7L1OJ1GqM7NzITNrNnNuLF1C5Grmq9MqK7J4Y6W0zqH6H6H6H6H', // Test123!
        tenantId: data.tenantId || 1,
        emailVerified: true,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Then create the user
    const user = await testDb.user.create({
      data: {
        accountId: account.id,
        firstName: data.firstName || 'Test',
        lastName: data.lastName || 'User',
        username: data.username || `testuser${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uuid: data.uuid || crypto.randomUUID(),
        userHash: crypto.randomUUID(),
        isActive: data.isActive !== false,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Add default role if not specified
    if (!data.skipRole) {
      await testDb.userRole.create({
        data: {
          userId: user.id,
          roleId: data.roleId || 3 // default to 'user' role
        }
      });
    }

    // Add permissions if specified
    if (data.permissions && Array.isArray(data.permissions)) {
      for (const permissionName of data.permissions) {
        // First ensure the permission exists
        const permission = await testDb.permission.upsert({
          where: { name: permissionName },
          update: {},
          create: {
            name: permissionName,
            description: `Test permission: ${permissionName}`,
            pattern: permissionName,
            resource: permissionName.split('.')[1] || null,
            action: permissionName.split('.')[2] || null,
            scope: permissionName.split('.')[0] || null,
            isWildcard: false,
            priority: 100,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Then grant it to the user
        await testDb.userPermission.create({
          data: {
            userId: user.id,
            permissionId: permission.id,
            granted: true,
            validFrom: new Date(),
            grantedBy: 1, // system
            grantReason: 'Test permission'
          }
        });
      }
    }

    // Return user with account email for convenience
    return { ...user, email: account.email, account };
  },

  async createTestTenant(data: any = {}) {
    return testDb.tenant.create({
      data: {
        uuid: data.uuid || crypto.randomUUID(),
        name: data.name || 'Test Tenant',
        slug: data.slug || `test-tenant-${Date.now()}`,
        domain: data.domain || `test-${Date.now()}.localhost`,
        isActive: data.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      }
    });
  },

  // Get test credentials
  getTestCredentials(role: 'superadmin' | 'admin' | 'user' = 'user') {
    const credentials = {
      superadmin: { email: 'superadmin@test.com', password: 'Test123!' },
      admin: { email: 'admin@test.com', password: 'Test123!' },
      user: { email: 'user1@test.com', password: 'Test123!' }
    };
    return credentials[role];
  },

  // Session management
  async createSession(userId: string, data: any = {}) {
    const sessionId = `session-${Date.now()}`;
    const sessionData = {
      userId,
      sessionId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      userAgent: 'Test Runner',
      ipAddress: '127.0.0.1',
      ...data
    };

    await testRedis.setex(
      `temp:session:${sessionId}`,
      3600,
      JSON.stringify(sessionData)
    );

    return sessionId;
  },

  // Wait helpers for async operations
  async waitForCondition(condition: () => Promise<boolean>, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }
};

// Global test hooks
beforeEach(async () => {
  // Ensure clean state for each test
  vi.clearAllMocks();
  
  // Optional: Clean Redis for each test (can be slow)
  if (process.env.CLEAN_REDIS_EACH_TEST === 'true') {
    await testUtils.cleanRedis();
  }
});

afterEach(async () => {
  // Clean up any active transactions
  await testUtils.rollbackTransaction().catch(() => {});
  
  // Clear any test data created during the test
  if (process.env.CLEAN_DB_EACH_TEST === 'true') {
    await testUtils.cleanDatabase();
  }
});

// Export instances for direct use
export { testDb as prisma, testRedis as redis };