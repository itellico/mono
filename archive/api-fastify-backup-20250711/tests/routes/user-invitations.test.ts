/**
 * User Invitations API Tests
 * Comprehensive tests for user invitation system
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

describe('User Invitations API - Complete Test Suite', () => {
  let app: TestAppHelper;
  let adminUser: any;
  let adminAccount: any;
  let testTenant: any;

  beforeAll(async () => {
    // Create test tenant
    testTenant = await prisma.tenant.findFirst({
      where: { id: 1 },
    });

    // Create admin account with invitation permissions
    adminAccount = await prisma.account.create({
      data: {
        email: 'invite-admin@example.com',
        passwordHash: await bcrypt.hash('Admin123!', 10),
        tenantId: testTenant.id,
        isActive: true,
        emailVerified: true,
      },
    });

    adminUser = await prisma.user.create({
      data: {
        accountId: adminAccount.id,
        firstName: 'Admin',
        lastName: 'User',
        username: `adminuser_${Date.now()}`,
        uuid: crypto.randomUUID(),
        userHash: crypto.randomUUID(),
        isActive: true,
        isVerified: true,
      },
    });

    // Add admin role with invitation permissions
    const adminRole = await prisma.role.findFirst({
      where: { code: 'tenant_admin' },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });
    }

    // Ensure invitation permission exists
    const invitePermission = await prisma.permission.upsert({
      where: { name: 'users.invite.tenant' },
      update: {},
      create: {
        name: 'users.invite.tenant',
        pattern: 'users.invite.tenant',
        resource: 'users',
        action: 'invite',
        scope: 'tenant',
        description: 'Can invite users to tenant',
      },
    });

    // Grant permission to admin
    if (adminRole) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: invitePermission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: invitePermission.id,
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup invitations
    await prisma.userInvitation.deleteMany({
      where: {
        OR: [
          { email: { contains: 'invite-test' } },
          { invitedById: adminUser.id },
        ],
      },
    });

    // Cleanup users
    if (adminUser) {
      await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });
      await prisma.user.delete({ where: { id: adminUser.id } });
    }
    if (adminAccount) {
      await prisma.account.delete({ where: { id: adminAccount.id } });
    }
  });

  describe('POST /api/v1/account/invitations - Send Invitation', () => {
    it('should send invitation with all required fields', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const invitationData = {
          email: 'invite-test-1@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          message: 'Welcome to our platform! Looking forward to working with you.',
        };

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: invitationData,
        });

        expect(response.statusCode).toBe(201);
        const { data } = response.json();

        expect(data.invitation).toMatchObject({
          uuid: expect.any(String),
          email: 'invite-test-1@example.com',
          token: expect.any(String),
          expiresAt: expect.any(String),
          invitationUrl: expect.stringContaining('/accept-invitation?token='),
        });

        // Token should be plain text for URL
        expect(data.invitation.token).toMatch(/^[a-f0-9]{64}$/);

        // Verify invitation was created in database
        const dbInvitation = await prisma.userInvitation.findFirst({
          where: { email: 'invite-test-1@example.com' },
        });

        expect(dbInvitation).toBeTruthy();
        expect(dbInvitation?.firstName).toBe('Test');
        expect(dbInvitation?.lastName).toBe('User');
        expect(dbInvitation?.role).toBe('user');
        expect(dbInvitation?.status).toBe('pending');
        expect(dbInvitation?.message).toBe(invitationData.message);

        // Token in DB should be hashed
        const tokenMatch = await bcrypt.compare(data.invitation.token, dbInvitation!.token);
        expect(tokenMatch).toBe(true);
      });
    });

    it('should reject invitation for existing user', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        // Try to invite an existing user
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            email: 'user1@test.com', // Existing user from seed data
            firstName: 'Existing',
            lastName: 'User',
            role: 'user',
          },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'USER_WITH_THIS_EMAIL_ALREADY_EXISTS',
        });
      });
    });

    it('should reject duplicate pending invitation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const invitationData = {
          email: 'invite-test-duplicate@example.com',
          firstName: 'Duplicate',
          lastName: 'Test',
          role: 'user',
        };

        // First invitation
        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: invitationData,
        });

        expect(response1.statusCode).toBe(201);

        // Try to send duplicate
        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: invitationData,
        });

        expect(response2.statusCode).toBe(409);
        expect(response2.json()).toMatchObject({
          success: false,
          error: 'ACTIVE_INVITATION_ALREADY_EXISTS_FOR_THIS_EMAIL',
        });
      });
    });

    it('should validate role options', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            email: 'invite-test-role@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'super_admin', // Should not be allowed
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should require invitation permission', async () => {
      await testWithApp(async (helper) => {
        // Login as regular user without invitation permission
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            email: 'invite-test-noperm@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
          },
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'FORBIDDEN',
        });
      });
    });

    it('should create audit log for invitation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            email: 'invite-test-audit@example.com',
            firstName: 'Audit',
            lastName: 'Test',
            role: 'user',
          },
        });

        expect(response.statusCode).toBe(201);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: adminUser.id,
            action: 'user_invite',
            metadata: {
              path: ['inviteeEmail'],
              equals: 'invite-test-audit@example.com',
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.message).toContain('Sent invitation to');
      });
    });
  });

  describe('GET /api/v1/account/invitations - List Invitations', () => {
    beforeEach(async () => {
      // Create test invitations
      const testInvitations = [
        {
          email: 'invite-list-1@example.com',
          firstName: 'List',
          lastName: 'One',
          role: 'user',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'invite-list-2@example.com',
          firstName: 'List',
          lastName: 'Two',
          role: 'content_moderator',
          status: 'accepted',
          acceptedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          email: 'invite-list-3@example.com',
          firstName: 'List',
          lastName: 'Three',
          role: 'user',
          status: 'pending',
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      ];

      for (const inv of testInvitations) {
        await prisma.userInvitation.create({
          data: {
            ...inv,
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
          },
        });
      }
    });

    it('should list all invitations with pagination', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/account/invitations?page=1&limit=20',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data.invitations).toBeInstanceOf(Array);
        expect(data.invitations.length).toBeGreaterThanOrEqual(3);

        // Check invitation structure
        const invitation = data.invitations[0];
        expect(invitation).toMatchObject({
          uuid: expect.any(String),
          email: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          role: expect.any(String),
          status: expect.any(String),
          invitedBy: {
            email: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
          },
          expiresAt: expect.any(String),
          createdAt: expect.any(String),
        });

        expect(data.pagination).toMatchObject({
          page: 1,
          limit: 20,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        });
      });
    });

    it('should filter by status', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        // Filter pending only
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/account/invitations?status=pending',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        const pendingInvites = data.invitations.filter((inv: any) => inv.status === 'pending');
        expect(pendingInvites.length).toBe(data.invitations.length);
      });
    });

    it('should identify expired invitations', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/account/invitations?status=expired',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        const expiredInvites = data.invitations.filter((inv: any) => inv.status === 'expired');
        expect(expiredInvites.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('POST /api/v1/account/invitations/:token/accept - Accept Invitation', () => {
    it('should accept valid invitation and create user', async () => {
      await testWithApp(async (helper) => {
        // Create a fresh invitation
        const token = randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);

        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-accept@example.com',
            firstName: 'Accept',
            lastName: 'Test',
            role: 'user',
            token: hashedToken,
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${token}/accept`,
          payload: {
            password: 'NewUser123!',
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data.user).toMatchObject({
          uuid: expect.any(String),
          email: 'invite-accept@example.com',
          firstName: 'Accept',
          lastName: 'Test',
        });

        expect(data.tokens).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });

        // Verify user was created
        const newUser = await prisma.user.findFirst({
          where: { email: 'invite-accept@example.com' },
        });

        expect(newUser).toBeTruthy();
        expect(newUser?.firstName).toBe('Accept');
        expect(newUser?.isActive).toBe(true);

        // Verify invitation was updated
        const updatedInvitation = await prisma.userInvitation.findUnique({
          where: { id: invitation.id },
        });

        expect(updatedInvitation?.status).toBe('accepted');
        expect(updatedInvitation?.acceptedAt).toBeTruthy();
        expect(updatedInvitation?.acceptedUserId).toBe(newUser?.uuid);

        // Cleanup
        await prisma.user.delete({ where: { id: newUser!.id } });
      });
    });

    it('should reject invalid token', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/account/invitations/invalid-token/accept',
          payload: {
            password: 'NewUser123!',
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_OR_EXPIRED_INVITATION',
        });
      });
    });

    it('should reject expired invitation', async () => {
      await testWithApp(async (helper) => {
        const token = randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);

        await prisma.userInvitation.create({
          data: {
            email: 'invite-expired@example.com',
            firstName: 'Expired',
            lastName: 'Test',
            role: 'user',
            token: hashedToken,
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() - 1000), // Already expired
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${token}/accept`,
          payload: {
            password: 'NewUser123!',
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_OR_EXPIRED_INVITATION',
        });
      });
    });

    it('should enforce password requirements', async () => {
      await testWithApp(async (helper) => {
        const token = randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);

        await prisma.userInvitation.create({
          data: {
            email: 'invite-weak-pass@example.com',
            firstName: 'Weak',
            lastName: 'Pass',
            role: 'user',
            token: hashedToken,
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${token}/accept`,
          payload: {
            password: 'weak', // Too short
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should create audit log for acceptance', async () => {
      await testWithApp(async (helper) => {
        const token = randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);

        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-audit-accept@example.com',
            firstName: 'Audit',
            lastName: 'Accept',
            role: 'user',
            token: hashedToken,
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${token}/accept`,
          payload: {
            password: 'AuditUser123!',
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            action: 'invitation_accepted',
            resourceId: invitation.uuid,
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.message).toContain('accepted invitation');

        // Cleanup
        const user = await prisma.user.findFirst({
          where: { email: 'invite-audit-accept@example.com' },
        });
        if (user) {
          await prisma.user.delete({ where: { id: user.id } });
        }
      });
    });
  });

  describe('DELETE /api/v1/account/invitations/:uuid - Revoke Invitation', () => {
    it('should revoke pending invitation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        // Create invitation to revoke
        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-revoke@example.com',
            firstName: 'Revoke',
            lastName: 'Test',
            role: 'user',
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/account/invitations/${invitation.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          message: 'Invitation revoked successfully',
        });

        // Verify invitation was revoked
        const revokedInvitation = await prisma.userInvitation.findUnique({
          where: { id: invitation.id },
        });

        expect(revokedInvitation?.status).toBe('revoked');
        expect(revokedInvitation?.revokedAt).toBeTruthy();
        expect(revokedInvitation?.revokedById).toBe(adminUser.id);
      });
    });

    it('should not revoke already accepted invitation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        // Create accepted invitation
        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-accepted-revoke@example.com',
            firstName: 'Accepted',
            lastName: 'Test',
            role: 'user',
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'accepted',
            acceptedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/account/invitations/${invitation.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED',
        });
      });
    });

    it('should create audit log for revocation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-audit-revoke@example.com',
            firstName: 'Audit',
            lastName: 'Revoke',
            role: 'user',
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/account/invitations/${invitation.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: adminUser.id,
            action: 'invitation_revoked',
            resourceId: invitation.uuid,
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.message).toContain('Revoked invitation');
      });
    });
  });

  describe('POST /api/v1/account/invitations/:uuid/resend - Resend Invitation', () => {
    it('should resend invitation with new token', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        // Create invitation to resend
        const oldToken = randomBytes(32).toString('hex');
        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-resend@example.com',
            firstName: 'Resend',
            lastName: 'Test',
            role: 'user',
            token: await bcrypt.hash(oldToken, 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 1000), // Expiring soon
            message: 'Original message',
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${invitation.uuid}/resend`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          message: 'Invitation resent successfully',
        });

        // Verify invitation was updated
        const updatedInvitation = await prisma.userInvitation.findUnique({
          where: { id: invitation.id },
        });

        expect(updatedInvitation?.expiresAt.getTime()).toBeGreaterThan(Date.now());
        
        // Token should be different
        const oldTokenMatch = await bcrypt.compare(oldToken, updatedInvitation!.token);
        expect(oldTokenMatch).toBe(false);
      });
    });

    it('should not resend accepted invitation', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-accepted-resend@example.com',
            firstName: 'Accepted',
            lastName: 'Resend',
            role: 'user',
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'accepted',
            acceptedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${invitation.uuid}/resend`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVITATION_NOT_FOUND_OR_ALREADY_PROCESSED',
        });
      });
    });

    it('should create audit log for resend', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const invitation = await prisma.userInvitation.create({
          data: {
            email: 'invite-audit-resend@example.com',
            firstName: 'Audit',
            lastName: 'Resend',
            role: 'user',
            token: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            invitedById: adminUser.id,
            tenantId: testTenant.id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 1000),
          },
        });

        const response = await helper.request({
          method: 'POST',
          url: `/api/v1/account/invitations/${invitation.uuid}/resend`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: adminUser.id,
            action: 'invitation_resent',
            resourceId: invitation.uuid,
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.message).toContain('Resent invitation');
      });
    });
  });

  describe('Invitation Permissions and Access Control', () => {
    it('should allow different roles to be invited', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'invite-admin@example.com',
          password: 'Admin123!',
        });

        const roles = ['user', 'content_moderator', 'tenant_admin'];

        for (const role of roles) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/account/invitations',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              email: `invite-role-${role}@example.com`,
              firstName: 'Role',
              lastName: role,
              role: role,
            },
          });

          expect(response.statusCode).toBe(201);
        }
      });
    });

    it('should respect tenant isolation', async () => {
      await testWithApp(async (helper) => {
        // Create another tenant and admin
        const otherTenant = await prisma.tenant.create({
          data: {
            name: 'Other Tenant',
            domain: 'other-tenant.com',
            slug: 'other-tenant',
          },
        });

        const otherAdmin = await testUtils.createTestUser({
          email: 'other-admin@example.com',
          tenantId: otherTenant.id,
          roleId: 2, // Admin role
        });

        // Login as other tenant admin
        const auth = await helper.loginAsUser({
          email: 'other-admin@example.com',
          password: 'Test123!',
        });

        // Try to view invitations - should only see their tenant's
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/account/invitations',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          // Should not see invitations from testTenant
          const crossTenantInvites = data.invitations.filter(
            (inv: any) => inv.tenantId === testTenant.id
          );
          expect(crossTenantInvites.length).toBe(0);
        }

        // Cleanup
        await prisma.user.delete({ where: { id: otherAdmin.id } });
        await prisma.tenant.delete({ where: { id: otherTenant.id } });
      });
    });
  });
});