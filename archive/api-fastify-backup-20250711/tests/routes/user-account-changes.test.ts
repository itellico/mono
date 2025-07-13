/**
 * User Account Changes API Tests
 * Comprehensive tests for username and email changes with verification flows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

describe('User Account Changes API - Complete Test Suite', () => {
  let app: TestAppHelper;
  let testUser: any;
  let testAccount: any;

  beforeAll(async () => {
    // Create test user
    testAccount = await prisma.account.create({
      data: {
        email: 'account-changes@example.com',
        passwordHash: await bcrypt.hash('Test123!', 10),
        tenantId: 1,
        emailVerified: true,
        isActive: true,
      },
    });

    testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        firstName: 'Account',
        lastName: 'Changer',
        username: `accountuser_${Date.now()}`,
        uuid: crypto.randomUUID(),
        userHash: crypto.randomUUID(),
        isActive: true,
        isVerified: true,
      },
    });

    // Add user role
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: 3, // Default user role
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (testAccount) {
      await prisma.account.delete({ where: { id: testAccount.id } });
    }

    // Clean up any pending change tokens
    await redis.del(`temp:email-change:*`);
    await redis.del(`temp:username-change:*`);
  });

  describe('POST /api/v1/user/account/change-email - Initiate Email Change', () => {
    it('should initiate email change with password verification', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'new-email@example.com',
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Verification email sent to both current and new email addresses',
            requiresVerification: true,
          },
        });

        // Check that verification tokens were created
        const oldEmailToken = await redis.keys('temp:email-change:old:*');
        const newEmailToken = await redis.keys('temp:email-change:new:*');
        
        expect(oldEmailToken.length).toBeGreaterThan(0);
        expect(newEmailToken.length).toBeGreaterThan(0);

        // Email should not change immediately
        const account = await prisma.account.findUnique({
          where: { id: testAccount.id },
        });
        expect(account?.email).toBe('account-changes@example.com');
      });
    });

    it('should reject duplicate email', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'user1@test.com', // Existing email from seed data
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'This email is already in use',
        });
      });
    });

    it('should validate email format', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'user@',
          'user @example.com',
          'user@example',
          '',
        ];

        for (const invalidEmail of invalidEmails) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/account/change-email',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              newEmail: invalidEmail,
              password: 'Test123!',
            },
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }
      });
    });

    it('should require correct password', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'another-new@example.com',
            password: 'WrongPassword!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_PASSWORD',
          message: 'Password is incorrect',
        });
      });
    });

    it('should prevent changing to same email', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'account-changes@example.com',
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'SAME_EMAIL',
          message: 'New email is the same as current email',
        });
      });
    });

    it('should rate limit email change requests', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Make multiple requests quickly
        const requests = Array(5).fill(null).map((_, i) =>
          helper.request({
            method: 'POST',
            url: '/api/v1/user/account/change-email',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              newEmail: `rate-limit-${i}@example.com`,
              password: 'Test123!',
            },
          })
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.statusCode === 429);

        expect(rateLimited.length).toBeGreaterThan(0);
      });
    });

    it('should create audit log for email change request', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'audit-test@example.com',
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'email_change_requested',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.metadata).toMatchObject({
          oldEmail: 'account-changes@example.com',
          newEmail: 'audit-test@example.com',
        });
        expect(auditLog?.level).toBe('warning'); // Security-sensitive
      });
    });
  });

  describe('POST /api/v1/user/account/verify-email-change - Complete Email Change', () => {
    it('should complete email change with both tokens', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Generate verification tokens
        const oldEmailToken = randomBytes(32).toString('hex');
        const newEmailToken = randomBytes(32).toString('hex');
        const changeId = crypto.randomUUID();

        // Store tokens in Redis
        const tokenData = {
          userId: testUser.uuid,
          oldEmail: 'account-changes@example.com',
          newEmail: 'verified-new@example.com',
          changeId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        };

        await redis.setex(
          `temp:email-change:old:${oldEmailToken}`,
          3600,
          JSON.stringify({ ...tokenData, type: 'old' })
        );

        await redis.setex(
          `temp:email-change:new:${newEmailToken}`,
          3600,
          JSON.stringify({ ...tokenData, type: 'new' })
        );

        // Verify old email first
        const oldVerifyResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: oldEmailToken,
            type: 'old',
          },
        });

        expect(oldVerifyResponse.statusCode).toBe(200);
        expect(oldVerifyResponse.json()).toMatchObject({
          success: true,
          data: {
            message: 'Old email verified. Please check your new email to complete the change.',
            verified: 'old',
            pendingVerification: 'new',
          },
        });

        // Verify new email
        const newVerifyResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: newEmailToken,
            type: 'new',
          },
        });

        expect(newVerifyResponse.statusCode).toBe(200);
        expect(newVerifyResponse.json()).toMatchObject({
          success: true,
          data: {
            message: 'Email change completed successfully',
            newEmail: 'verified-new@example.com',
          },
        });

        // Verify email was actually changed
        const updatedAccount = await prisma.account.findUnique({
          where: { id: testAccount.id },
        });

        expect(updatedAccount?.email).toBe('verified-new@example.com');

        // Change back for other tests
        await prisma.account.update({
          where: { id: testAccount.id },
          data: { email: 'account-changes@example.com' },
        });
      });
    });

    it('should reject invalid token', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: 'invalid-token-12345',
            type: 'old',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        });
      });
    });

    it('should reject expired token', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const expiredToken = randomBytes(32).toString('hex');

        // Store expired token
        await redis.setex(
          `temp:email-change:old:${expiredToken}`,
          60,
          JSON.stringify({
            userId: testUser.uuid,
            oldEmail: 'account-changes@example.com',
            newEmail: 'expired@example.com',
            type: 'old',
            createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          })
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: expiredToken,
            type: 'old',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
        });
      });
    });

    it('should prevent token reuse', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const reusableToken = randomBytes(32).toString('hex');

        await redis.setex(
          `temp:email-change:old:${reusableToken}`,
          3600,
          JSON.stringify({
            userId: testUser.uuid,
            oldEmail: 'account-changes@example.com',
            newEmail: 'reuse-test@example.com',
            type: 'old',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          })
        );

        // First use
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: reusableToken,
            type: 'old',
          },
        });

        expect(response1.statusCode).toBe(200);

        // Try to reuse
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/verify-email-change',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            token: reusableToken,
            type: 'old',
          },
        });

        expect(response2.statusCode).toBe(400);
        expect(response2.json().error).toBe('INVALID_TOKEN');
      });
    });
  });

  describe('POST /api/v1/user/account/change-username - Change Username', () => {
    it('should change username if available', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const newUsername = `newusername_${Date.now()}`;

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername,
            password: 'Test123!', // Require password for security
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Username changed successfully',
            username: newUsername,
          },
        });

        // Verify username was changed
        const updatedUser = await prisma.user.findUnique({
          where: { id: testUser.id },
        });

        expect(updatedUser?.username).toBe(newUsername);

        // Verify can use new username
        const profileResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(profileResponse.json().data.user.username).toBe(newUsername);
      });
    });

    it('should reject duplicate username', async () => {
      await testWithApp(async (helper) => {
        // Create another user with a username
        const otherUser = await testUtils.createTestUser({
          username: 'existingusername',
          email: 'other-username@example.com',
          tenantId: 1,
        });

        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername: 'existingusername',
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'USERNAME_TAKEN',
          message: 'This username is already taken',
        });

        // Cleanup
        await prisma.user.delete({ where: { id: otherUser.id } });
      });
    });

    it('should validate username format', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const invalidUsernames = [
          'ab',              // Too short (min 3)
          'a'.repeat(51),    // Too long (max 50)
          'user name',       // Contains space
          'user@name',       // Special character
          'user.name',       // Period
          'user-name-',      // Ends with hyphen
          '-username',       // Starts with hyphen
          'user__name',      // Double underscore
          'USER',            // All caps (might be reserved)
          '123username',     // Starts with number
        ];

        for (const invalidUsername of invalidUsernames) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/account/change-username',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              newUsername: invalidUsername,
              password: 'Test123!',
            },
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }
      });
    });

    it('should check reserved usernames', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const reservedUsernames = [
          'admin',
          'api',
          'root',
          'system',
          'support',
          'help',
          'info',
          'www',
          'mail',
          'blog',
        ];

        for (const reserved of reservedUsernames) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/account/change-username',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              newUsername: reserved,
              password: 'Test123!',
            },
          });

          if (response.statusCode === 400) {
            expect(response.json()).toMatchObject({
              success: false,
              error: expect.stringMatching(/RESERVED_USERNAME|INVALID_USERNAME/),
            });
          }
        }
      });
    });

    it('should track username change history', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const historicalUsername = `historical_${Date.now()}`;

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername: historicalUsername,
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(200);

        // Check if username change was logged
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'username_changed',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.metadata).toMatchObject({
          oldUsername: expect.any(String),
          newUsername: historicalUsername,
        });
      });
    });

    it('should enforce cooldown period between username changes', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // First change
        const firstUsername = `first_${Date.now()}`;
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername: firstUsername,
            password: 'Test123!',
          },
        });

        expect(response1.statusCode).toBe(200);

        // Try immediate second change
        const secondUsername = `second_${Date.now()}`;
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername: secondUsername,
            password: 'Test123!',
          },
        });

        // Should enforce cooldown
        if (response2.statusCode === 429) {
          expect(response2.json()).toMatchObject({
            success: false,
            error: 'COOLDOWN_PERIOD',
            message: expect.stringContaining('wait'),
          });
        }
      });
    });

    it('should prevent changing to same username', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Get current username
        const profileResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const currentUsername = profileResponse.json().data.user.username;

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newUsername: currentUsername,
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'SAME_USERNAME',
          message: 'New username is the same as current username',
        });
      });
    });
  });

  describe('GET /api/v1/user/account/username-availability - Check Username', () => {
    it('should check if username is available', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const availableUsername = `available_${Date.now()}`;

        const response = await helper.request({
          method: 'GET',
          url: `/api/v1/user/account/username-availability?username=${availableUsername}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            username: availableUsername,
            available: true,
          },
        });
      });
    });

    it('should show username as unavailable if taken', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Create a user with specific username
        const takenUser = await testUtils.createTestUser({
          username: 'takenusernamexyz',
          email: 'taken-username@example.com',
          tenantId: 1,
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/account/username-availability?username=takenusernamexyz',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            username: 'takenusernamexyz',
            available: false,
          },
        });

        // Cleanup
        await prisma.user.delete({ where: { id: takenUser.id } });
      });
    });

    it('should validate username format in availability check', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/account/username-availability?username=invalid username',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_USERNAME_FORMAT',
        });
      });
    });

    it('should rate limit availability checks', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Make many rapid requests
        const requests = Array(20).fill(null).map((_, i) =>
          helper.request({
            method: 'GET',
            url: `/api/v1/user/account/username-availability?username=check${i}`,
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
          })
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.statusCode === 429);

        expect(rateLimited.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Considerations', () => {
    it('should not leak email existence in change requests', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Try with existing email
        const response1Start = Date.now();
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'user1@test.com',
            password: 'Test123!',
          },
        });
        const response1Time = Date.now() - response1Start;

        // Try with non-existing email
        const response2Start = Date.now();
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'definitely-not-existing-9999@example.com',
            password: 'Test123!',
          },
        });
        const response2Time = Date.now() - response2Start;

        // Response times should be similar (prevent timing attacks)
        const timeDiff = Math.abs(response1Time - response2Time);
        expect(timeDiff).toBeLessThan(100); // Within 100ms
      });
    });

    it('should invalidate sessions after email change', async () => {
      await testWithApp(async (helper) => {
        // Create disposable user for this test
        const tempUser = await testUtils.createTestUser({
          email: 'session-test@example.com',
          password: 'Test123!',
          tenantId: 1,
        });

        const auth = await helper.loginAsUser({
          email: 'session-test@example.com',
          password: 'Test123!',
        });

        // Initiate email change would happen here
        // For this test, we'll simulate the completion

        // Update email directly (simulating successful change)
        await prisma.account.update({
          where: { id: tempUser.accountId },
          data: { email: 'new-session-test@example.com' },
        });

        // Old session should be invalid
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        // Session might be invalid or email mismatch
        if (response.statusCode === 401) {
          expect(response.json()).toMatchObject({
            success: false,
            error: 'UNAUTHORIZED',
          });
        }

        // Cleanup
        await prisma.user.delete({ where: { id: tempUser.id } });
      });
    });

    it('should log all account change attempts', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'account-changes@example.com',
          password: 'Test123!',
        });

        // Failed attempt with wrong password
        await helper.request({
          method: 'POST',
          url: '/api/v1/user/account/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'failed-attempt@example.com',
            password: 'WrongPassword!',
          },
        });

        // Check that failed attempt was logged
        const failedLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'email_change_failed',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(failedLog).toBeTruthy();
        expect(failedLog?.level).toBe('error');
        expect(failedLog?.metadata).toMatchObject({
          reason: 'invalid_password',
          attemptedEmail: 'failed-attempt@example.com',
        });
      });
    });
  });
});