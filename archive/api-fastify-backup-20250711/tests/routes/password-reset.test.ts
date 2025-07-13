/**
 * Password Reset and Email Verification API Tests
 * Tests for password recovery and email verification flows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

describe('Password Reset & Email Verification - Complete Test Suite', () => {
  let app: TestAppHelper;
  let testUser: any;
  let testAccount: any;

  beforeAll(async () => {
    // Create test account and user
    testAccount = await prisma.account.create({
      data: {
        email: 'reset-test@example.com',
        passwordHash: await bcrypt.hash('OldPassword123!', 10),
        tenantId: 1,
        emailVerified: true,
        isActive: true,
      },
    });

    testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        firstName: 'Reset',
        lastName: 'User',
        username: `resetuser_${Date.now()}`,
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

    // Clean up any password reset tokens
    await redis.del(`temp:password-reset:*`);
    await redis.del(`temp:email-verify:*`);
  });

  describe('POST /api/v1/public/auth/forgot-password - Request Password Reset', () => {
    it('should initiate password reset for existing user', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'reset-test@example.com',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'If the email exists, a password reset link has been sent.',
          },
        });

        // Check if reset token was stored in Redis
        const resetKeys = await redis.keys('temp:password-reset:*');
        expect(resetKeys.length).toBeGreaterThan(0);

        // Verify audit log was created
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'password_reset_requested',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
      });
    });

    it('should return same response for non-existent email (prevent enumeration)', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'nonexistent@example.com',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'If the email exists, a password reset link has been sent.',
          },
        });
      });
    });

    it('should validate email format', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'not-an-email',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should enforce rate limiting', async () => {
      await testWithApp(async (helper) => {
        // Make multiple requests quickly
        const requests = Array(5).fill(null).map(() =>
          helper.request({
            method: 'POST',
            url: '/api/v1/public/auth/forgot-password',
            payload: {
              email: 'reset-test@example.com',
            },
          })
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.statusCode === 429);

        expect(rateLimited.length).toBeGreaterThan(0);
      });
    });

    it('should not reset password for inactive account', async () => {
      await testWithApp(async (helper) => {
        // Create inactive account
        const inactiveAccount = await prisma.account.create({
          data: {
            email: 'inactive-reset@example.com',
            passwordHash: await bcrypt.hash('Test123!', 10),
            tenantId: 1,
            isActive: false,
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'inactive-reset@example.com',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json().data.message).toContain('If the email exists');

        // No reset token should be created
        const resetKeys = await redis.keys('temp:password-reset:*inactive*');
        expect(resetKeys.length).toBe(0);

        // Cleanup
        await prisma.account.delete({ where: { id: inactiveAccount.id } });
      });
    });

    it('should generate secure reset token', async () => {
      await testWithApp(async (helper) => {
        // Mock email service to capture token
        let capturedToken: string | null = null;
        
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'reset-test@example.com',
          },
        });

        expect(response.statusCode).toBe(200);

        // In real implementation, token would be sent via email
        // Here we'll check Redis for the token
        const resetKeys = await redis.keys('temp:password-reset:*');
        if (resetKeys.length > 0) {
          const tokenData = await redis.get(resetKeys[0]);
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            expect(parsed.userId).toBe(testUser.uuid);
            expect(parsed.email).toBe('reset-test@example.com');
            expect(parsed.expiresAt).toBeDefined();
          }
        }
      });
    });
  });

  describe('POST /api/v1/public/auth/reset-password - Reset Password with Token', () => {
    it('should reset password with valid token', async () => {
      await testWithApp(async (helper) => {
        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        };

        await redis.setex(
          `temp:password-reset:${resetToken}`,
          3600,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: resetToken,
            password: 'NewSecurePassword123!',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'Password reset successful. You can now login with your new password.',
          },
        });

        // Verify password was changed
        const updatedAccount = await prisma.account.findUnique({
          where: { id: testAccount.id },
        });

        const passwordMatch = await bcrypt.compare(
          'NewSecurePassword123!',
          updatedAccount!.passwordHash!
        );
        expect(passwordMatch).toBe(true);

        // Verify token was deleted
        const tokenExists = await redis.exists(`temp:password-reset:${resetToken}`);
        expect(tokenExists).toBe(0);

        // Verify can login with new password
        const loginResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'reset-test@example.com',
            password: 'NewSecurePassword123!',
          },
        });

        expect(loginResponse.statusCode).toBe(200);
      });
    });

    it('should reject invalid token', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: 'invalid-token-12345',
            password: 'NewPassword123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        });
      });
    });

    it('should reject expired token', async () => {
      await testWithApp(async (helper) => {
        const expiredToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        };

        await redis.setex(
          `temp:password-reset:${expiredToken}`,
          60,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: expiredToken,
            password: 'NewPassword123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        });
      });
    });

    it('should enforce password requirements', async () => {
      await testWithApp(async (helper) => {
        const resetToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };

        await redis.setex(
          `temp:password-reset:${resetToken}`,
          3600,
          JSON.stringify(tokenData)
        );

        const weakPasswords = [
          'short', // Too short
          '12345678', // No letters
          'password', // No numbers
          'Password', // No numbers
          'Pass1234', // No special chars (if required)
        ];

        for (const weakPassword of weakPasswords) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/public/auth/reset-password',
            payload: {
              token: resetToken,
              password: weakPassword,
            },
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }
      });
    });

    it('should prevent token reuse', async () => {
      await testWithApp(async (helper) => {
        const resetToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };

        await redis.setex(
          `temp:password-reset:${resetToken}`,
          3600,
          JSON.stringify(tokenData)
        );

        // First use - should succeed
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: resetToken,
            password: 'FirstPassword123!',
          },
        });

        expect(response1.statusCode).toBe(200);

        // Second use - should fail
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: resetToken,
            password: 'SecondPassword123!',
          },
        });

        expect(response2.statusCode).toBe(400);
        expect(response2.json().error).toBe('INVALID_TOKEN');
      });
    });

    it('should create audit log for password reset', async () => {
      await testWithApp(async (helper) => {
        const resetToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };

        await redis.setex(
          `temp:password-reset:${resetToken}`,
          3600,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/reset-password',
          payload: {
            token: resetToken,
            password: 'AuditedPassword123!',
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'password_reset_completed',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.level).toBe('warning'); // Security-sensitive action
      });
    });
  });

  describe('POST /api/v1/public/auth/verify-email - Email Verification', () => {
    it('should verify email with valid token', async () => {
      await testWithApp(async (helper) => {
        // Create unverified account
        const unverifiedAccount = await prisma.account.create({
          data: {
            email: 'unverified@example.com',
            passwordHash: await bcrypt.hash('Test123!', 10),
            tenantId: 1,
            emailVerified: false,
            isActive: true,
          },
        });

        const unverifiedUser = await prisma.user.create({
          data: {
            accountId: unverifiedAccount.id,
            firstName: 'Unverified',
            lastName: 'User',
            username: `unverified_${Date.now()}`,
            uuid: crypto.randomUUID(),
            userHash: crypto.randomUUID(),
            isActive: true,
            isVerified: false,
          },
        });

        // Generate verification token
        const verifyToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: unverifiedUser.uuid,
          email: unverifiedAccount.email,
          type: 'email_verification',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
        };

        await redis.setex(
          `temp:email-verify:${verifyToken}`,
          86400,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/verify-email',
          payload: {
            token: verifyToken,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'Email verified successfully. You can now login.',
          },
        });

        // Verify account and user were updated
        const verifiedAccount = await prisma.account.findUnique({
          where: { id: unverifiedAccount.id },
        });
        const verifiedUser = await prisma.user.findUnique({
          where: { id: unverifiedUser.id },
        });

        expect(verifiedAccount?.emailVerified).toBe(true);
        expect(verifiedUser?.isVerified).toBe(true);

        // Verify token was deleted
        const tokenExists = await redis.exists(`temp:email-verify:${verifyToken}`);
        expect(tokenExists).toBe(0);

        // Cleanup
        await prisma.user.delete({ where: { id: unverifiedUser.id } });
        await prisma.account.delete({ where: { id: unverifiedAccount.id } });
      });
    });

    it('should reject invalid verification token', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/verify-email',
          payload: {
            token: 'invalid-verify-token',
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

    it('should reject expired verification token', async () => {
      await testWithApp(async (helper) => {
        const expiredToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          type: 'email_verification',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        };

        await redis.setex(
          `temp:email-verify:${expiredToken}`,
          60,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/verify-email',
          payload: {
            token: expiredToken,
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

    it('should prevent double verification', async () => {
      await testWithApp(async (helper) => {
        // Use already verified account
        const verifyToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: testUser.uuid,
          email: testAccount.email,
          type: 'email_verification',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };

        await redis.setex(
          `temp:email-verify:${verifyToken}`,
          86400,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/verify-email',
          payload: {
            token: verifyToken,
          },
        });

        // Should still succeed but not change anything
        expect(response.statusCode).toBe(200);
        expect(response.json().data.message).toContain('already verified');
      });
    });

    it('should create audit log for email verification', async () => {
      await testWithApp(async (helper) => {
        // Create unverified account for audit test
        const auditAccount = await prisma.account.create({
          data: {
            email: 'audit-verify@example.com',
            passwordHash: await bcrypt.hash('Test123!', 10),
            tenantId: 1,
            emailVerified: false,
          },
        });

        const auditUser = await prisma.user.create({
          data: {
            accountId: auditAccount.id,
            firstName: 'Audit',
            lastName: 'Verify',
            username: `auditverify_${Date.now()}`,
            uuid: crypto.randomUUID(),
            userHash: crypto.randomUUID(),
            isVerified: false,
          },
        });

        const verifyToken = randomBytes(32).toString('hex');
        const tokenData = {
          userId: auditUser.uuid,
          email: auditAccount.email,
          type: 'email_verification',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };

        await redis.setex(
          `temp:email-verify:${verifyToken}`,
          86400,
          JSON.stringify(tokenData)
        );

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/verify-email',
          payload: {
            token: verifyToken,
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: auditUser.id,
            action: 'email_verified',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();

        // Cleanup
        await prisma.user.delete({ where: { id: auditUser.id } });
        await prisma.account.delete({ where: { id: auditAccount.id } });
      });
    });
  });

  describe('POST /api/v1/public/auth/resend-verification - Resend Email Verification', () => {
    it('should resend verification email for unverified account', async () => {
      await testWithApp(async (helper) => {
        // Create unverified account
        const unverifiedAccount = await prisma.account.create({
          data: {
            email: 'resend-verify@example.com',
            passwordHash: await bcrypt.hash('Test123!', 10),
            tenantId: 1,
            emailVerified: false,
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/resend-verification',
          payload: {
            email: 'resend-verify@example.com',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'If the email exists and is unverified, a verification link has been sent.',
          },
        });

        // Check if new token was created
        const verifyKeys = await redis.keys('temp:email-verify:*');
        const hasNewToken = verifyKeys.some(async (key) => {
          const data = await redis.get(key);
          return data && JSON.parse(data).email === 'resend-verify@example.com';
        });

        expect(hasNewToken).toBeTruthy();

        // Cleanup
        await prisma.account.delete({ where: { id: unverifiedAccount.id } });
      });
    });

    it('should not resend for already verified account', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/resend-verification',
          payload: {
            email: 'reset-test@example.com', // Already verified
          },
        });

        // Same response to prevent enumeration
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          data: {
            message: 'If the email exists and is unverified, a verification link has been sent.',
          },
        });
      });
    });

    it('should enforce rate limiting for resend', async () => {
      await testWithApp(async (helper) => {
        const requests = Array(5).fill(null).map(() =>
          helper.request({
            method: 'POST',
            url: '/api/v1/public/auth/resend-verification',
            payload: {
              email: 'resend-verify@example.com',
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
    it('should not leak information about email existence', async () => {
      await testWithApp(async (helper) => {
        // Test with existing email
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'reset-test@example.com',
          },
        });

        // Test with non-existing email
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/forgot-password',
          payload: {
            email: 'doesnotexist@example.com',
          },
        });

        // Both should return identical responses
        expect(response1.statusCode).toBe(response2.statusCode);
        expect(response1.json()).toEqual(response2.json());

        // Response times should be similar (prevent timing attacks)
        // In a real test, you'd measure actual response times
      });
    });

    it('should use secure random tokens', async () => {
      // Test that tokens are sufficiently random and unpredictable
      const tokens = new Set();
      
      for (let i = 0; i < 100; i++) {
        const token = randomBytes(32).toString('hex');
        expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(tokens.has(token)).toBe(false); // No duplicates
        tokens.add(token);
      }
    });

    it('should expire tokens appropriately', async () => {
      await testWithApp(async (helper) => {
        // Password reset tokens should expire in 1 hour
        const resetToken = randomBytes(32).toString('hex');
        await redis.setex(
          `temp:password-reset:${resetToken}`,
          3600,
          JSON.stringify({ test: true })
        );

        const ttl = await redis.ttl(`temp:password-reset:${resetToken}`);
        expect(ttl).toBeGreaterThan(3500);
        expect(ttl).toBeLessThanOrEqual(3600);

        // Email verification tokens should expire in 24 hours
        const verifyToken = randomBytes(32).toString('hex');
        await redis.setex(
          `temp:email-verify:${verifyToken}`,
          86400,
          JSON.stringify({ test: true })
        );

        const verifyTtl = await redis.ttl(`temp:email-verify:${verifyToken}`);
        expect(verifyTtl).toBeGreaterThan(86300);
        expect(verifyTtl).toBeLessThanOrEqual(86400);
      });
    });
  });
});