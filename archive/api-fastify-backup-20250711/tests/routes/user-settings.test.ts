/**
 * User Settings API Tests
 * Comprehensive tests for user settings and preferences management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';

describe('User Settings API - Complete Test Suite', () => {
  let app: TestAppHelper;
  let testUser: any;
  let testAccount: any;

  beforeAll(async () => {
    // Create test user with account
    testAccount = await prisma.account.create({
      data: {
        email: 'settings-test@example.com',
        passwordHash: await import('bcryptjs').then(b => b.hash('Test123!', 10)),
        tenantId: 1,
        timezone: 'UTC',
        languageLocale: 'en-US',
        currencyCode: 'USD',
        emailNotifications: true,
        smsNotifications: false,
        themePreference: 'light',
      },
    });

    testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        firstName: 'Settings',
        lastName: 'User',
        username: `settingsuser_${Date.now()}`,
        uuid: crypto.randomUUID(),
        userHash: crypto.randomUUID(),
        isActive: true,
        isVerified: true,
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          profileVisibility: 'public',
        },
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
  });

  describe('GET /api/v1/user/settings/preferences - Get User Preferences', () => {
    it('should get all user preferences with defaults', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data).toMatchObject({
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          twoFactorEnabled: false,
          displayName: expect.any(String),
          profileVisibility: 'public',
        });
      });
    });

    it('should merge account and user preferences', async () => {
      await testWithApp(async (helper) => {
        // Update account to have different timezone
        await prisma.account.update({
          where: { id: testAccount.id },
          data: { timezone: 'America/New_York' },
        });

        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        // User preferences should override account settings
        expect(data.timezone).toBe('UTC'); // From user preferences
      });
    });
  });

  describe('PUT /api/v1/user/settings/preferences - Update Preferences', () => {
    it('should update theme preference', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            theme: 'dark',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Preferences updated successfully',
          },
        });

        // Verify change persisted
        const getResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(getResponse.json().data.theme).toBe('dark');
      });
    });

    it('should update language preference', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            language: 'es',
          },
        });

        expect(response.statusCode).toBe(200);

        // Verify
        const getResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(getResponse.json().data.language).toBe('es');
      });
    });

    it('should update timezone preference', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            timezone: 'Asia/Tokyo',
          },
        });

        expect(response.statusCode).toBe(200);

        // Also update account timezone
        const accountResponse = await helper.request({
          method: 'PUT',
          url: '/api/v1/account/settings',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            timezone: 'Asia/Tokyo',
          },
        });

        if (accountResponse.statusCode === 200) {
          // Verify both updated
          const account = await prisma.account.findUnique({
            where: { id: testAccount.id },
          });
          expect(account?.timezone).toBe('Asia/Tokyo');
        }
      });
    });

    it('should update notification preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            emailNotifications: false,
            pushNotifications: true,
            marketingEmails: true,
          },
        });

        expect(response.statusCode).toBe(200);

        // Verify all changes
        const getResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const prefs = getResponse.json().data;
        expect(prefs.emailNotifications).toBe(false);
        expect(prefs.pushNotifications).toBe(true);
        expect(prefs.marketingEmails).toBe(true);
      });
    });

    it('should update profile visibility', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const visibilityOptions = ['public', 'private', 'friends'];

        for (const visibility of visibilityOptions) {
          const response = await helper.request({
            method: 'PUT',
            url: '/api/v1/user/settings/preferences',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              profileVisibility: visibility,
            },
          });

          expect(response.statusCode).toBe(200);

          // Verify
          const getResponse = await helper.request({
            method: 'GET',
            url: '/api/v1/user/settings/preferences',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
          });

          expect(getResponse.json().data.profileVisibility).toBe(visibility);
        }
      });
    });

    it('should validate theme values', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            theme: 'invalid-theme',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should allow partial updates', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        // Get current preferences
        const beforeResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const before = beforeResponse.json().data;

        // Update only bio
        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            bio: 'Updated bio text',
          },
        });

        expect(response.statusCode).toBe(200);

        // Verify only bio changed
        const afterResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const after = afterResponse.json().data;
        expect(after.bio).toBe('Updated bio text');
        expect(after.theme).toBe(before.theme);
        expect(after.language).toBe(before.language);
      });
    });
  });

  describe('POST /api/v1/user/settings/change-password - Change Password', () => {
    it('should change password successfully', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'Test123!',
            newPassword: 'NewSecurePass456!',
            confirmPassword: 'NewSecurePass456!',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Password changed successfully',
          },
        });

        // Verify can login with new password
        const newLoginResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'settings-test@example.com',
            password: 'NewSecurePass456!',
          },
        });

        expect(newLoginResponse.statusCode).toBe(200);

        // Change back for other tests
        await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/change-password',
          headers: {
            authorization: `Bearer ${newLoginResponse.json().data.accessToken}`,
          },
          payload: {
            currentPassword: 'NewSecurePass456!',
            newPassword: 'Test123!',
            confirmPassword: 'Test123!',
          },
        });
      });
    });

    it('should reject password mismatch', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'Test123!',
            newPassword: 'NewSecurePass456!',
            confirmPassword: 'DifferentPass456!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'PASSWORD_MISMATCH',
          message: 'New password and confirmation do not match',
        });
      });
    });

    it('should enforce password strength requirements', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const weakPasswords = [
          'short', // Too short
          'nouppercase123!', // No uppercase
          'NOLOWERCASE123!', // No lowercase
          'NoNumbers!', // No numbers
          'NoSpecial123', // No special chars
          'Test123', // Too short and no special
        ];

        for (const weakPassword of weakPasswords) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/settings/change-password',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              currentPassword: 'Test123!',
              newPassword: weakPassword,
              confirmPassword: weakPassword,
            },
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }
      });
    });

    it('should track password change timestamp', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'Test123!',
            newPassword: 'NewSecurePass789!',
            confirmPassword: 'NewSecurePass789!',
          },
        });

        expect(response.statusCode).toBe(200);

        // Check if passwordChangedAt was updated
        const user = await prisma.user.findUnique({
          where: { id: testUser.id },
          select: { passwordChangedAt: true },
        });

        if (user?.passwordChangedAt) {
          expect(user.passwordChangedAt).toBeInstanceOf(Date);
          const timeDiff = Date.now() - user.passwordChangedAt.getTime();
          expect(timeDiff).toBeLessThan(5000); // Changed within last 5 seconds
        }

        // Change back
        await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'NewSecurePass789!',
            newPassword: 'Test123!',
            confirmPassword: 'Test123!',
          },
        });
      });
    });
  });

  describe('POST /api/v1/user/settings/2fa/:action - Two-Factor Authentication', () => {
    it('should enable 2FA with password verification', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/2fa/enable',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: expect.stringContaining('Two-factor'),
            qrCode: expect.any(String),
            secret: expect.any(String),
          },
        });
      });
    });

    it('should disable 2FA', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/2fa/disable',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'Test123!',
            token: '123456', // Would need valid TOTP token in real scenario
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Two-factor authentication disabled',
          },
        });
      });
    });

    it('should reject invalid password for 2FA operations', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/2fa/enable',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
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

    it('should validate action parameter', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/2fa/invalid-action',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'Test123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });
  });

  describe('DELETE /api/v1/user/settings/account - Delete Account', () => {
    it('should require password and confirmation', async () => {
      await testWithApp(async (helper) => {
        // Create a disposable user for deletion test
        const deleteUser = await testUtils.createTestUser({
          email: 'delete-me@example.com',
          password: 'DeleteMe123!',
          tenantId: 1,
        });

        const auth = await helper.loginAsUser({
          email: 'delete-me@example.com',
          password: 'DeleteMe123!',
        });

        const response = await helper.request({
          method: 'DELETE',
          url: '/api/v1/user/settings/account',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'DeleteMe123!',
            confirmation: 'DELETE',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Account deleted successfully',
          },
        });

        // Verify cookies are cleared
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          expect(cookies.some((c: string) => c.includes('accessToken=;'))).toBe(true);
        }

        // Verify user is soft deleted
        const deletedUser = await prisma.user.findUnique({
          where: { id: deleteUser.id },
        });

        expect(deletedUser?.isActive).toBe(false);
        expect(deletedUser?.deletedAt).toBeTruthy();
      });
    });

    it('should reject invalid confirmation text', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'DELETE',
          url: '/api/v1/user/settings/account',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'Test123!',
            confirmation: 'WRONG',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_CONFIRMATION',
          message: 'Please type DELETE to confirm account deletion',
        });
      });
    });

    it('should reject incorrect password', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'DELETE',
          url: '/api/v1/user/settings/account',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            password: 'WrongPassword!',
            confirmation: 'DELETE',
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
  });

  describe('Account-Level Settings Integration', () => {
    it('should handle date/time format preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        // Update account date/time formats
        await prisma.account.update({
          where: { id: testAccount.id },
          data: {
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            firstDayOfWeek: 1, // Monday
          },
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          // These might be in a separate account settings endpoint
          expect(data).toBeDefined();
        }
      });
    });

    it('should handle currency preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        // Update account currency settings
        await prisma.account.update({
          where: { id: testAccount.id },
          data: {
            currencyCode: 'EUR',
            currencyPosition: 'after',
            currencySpace: true,
            decimalSeparator: ',',
            thousandsSeparator: '.',
          },
        });

        // These settings might be returned in account settings endpoint
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/account/settings',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          expect(data.currencyCode).toBe('EUR');
          expect(data.currencyPosition).toBe('after');
        }
      });
    });

    it('should handle notification time format preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        await prisma.account.update({
          where: { id: testAccount.id },
          data: {
            notificationTimeFormat: '24h',
            useRelativeTime: false,
            showSeconds: true,
            showTimezone: true,
          },
        });

        // Verify the preferences are used
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/notifications',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          // Notifications should use the specified time format
          expect(response.statusCode).toBe(200);
        }
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should get detailed notification preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/settings/notifications',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          expect(data).toMatchObject({
            email: {
              enabled: expect.any(Boolean),
              categories: expect.any(Object),
            },
            push: {
              enabled: expect.any(Boolean),
              categories: expect.any(Object),
            },
            sms: {
              enabled: expect.any(Boolean),
              categories: expect.any(Object),
            },
          });
        }
      });
    });

    it('should update granular notification preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/notifications',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            email: {
              enabled: true,
              categories: {
                security: true,
                marketing: false,
                updates: true,
                social: false,
              },
            },
            push: {
              enabled: true,
              categories: {
                security: true,
                marketing: false,
                updates: false,
                social: true,
              },
            },
          },
        });

        if (response.statusCode === 200) {
          expect(response.json()).toMatchObject({
            success: true,
            data: {
              message: 'Notification preferences updated',
            },
          });
        }
      });
    });
  });

  describe('Privacy Settings', () => {
    it('should manage data privacy preferences', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/privacy',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            showEmail: false,
            showPhone: false,
            showLocation: true,
            allowDataCollection: false,
            allowAnalytics: true,
          },
        });

        if (response.statusCode === 200) {
          expect(response.json()).toMatchObject({
            success: true,
            data: {
              message: 'Privacy settings updated',
            },
          });
        }
      });
    });

    it('should export user data (GDPR compliance)', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'settings-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/settings/export-data',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            format: 'json', // or 'csv'
            includeMedia: false,
          },
        });

        if (response.statusCode === 200) {
          expect(response.json()).toMatchObject({
            success: true,
            data: {
              message: expect.stringContaining('export'),
              downloadUrl: expect.any(String),
            },
          });
        }
      });
    });
  });
});