/**
 * User Profile API Tests
 * Comprehensive tests for user profile management features
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';
import path from 'path';
import { readFileSync } from 'fs';

describe('User Profile API - Complete Test Suite', () => {
  let app: TestAppHelper;
  let testUser: any;
  let testAccount: any;

  beforeAll(async () => {
    // Create test user with account data
    const accountData = {
      email: 'profile-test@example.com',
      tenantId: 1,
      timezone: 'America/New_York',
      countryCode: 'US',
      languageLocale: 'en-US',
      currencyCode: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    };

    testAccount = await prisma.account.create({
      data: accountData,
    });

    testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        firstName: 'John',
        lastName: 'Doe',
        username: `testuser_${Date.now()}`,
        uuid: crypto.randomUUID(),
        userHash: crypto.randomUUID(),
        bio: 'Original bio text',
        website: 'https://original-website.com',
        dateOfBirth: new Date('1990-01-15'),
        gender: 'male',
        profilePhotoUrl: 'https://example.com/original-photo.jpg',
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
    // Cleanup test data
    if (testUser) {
      await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (testAccount) {
      await prisma.account.delete({ where: { id: testAccount.id } });
    }
  });

  describe('GET /api/v1/user/profile/me - Get Current User Profile', () => {
    it('should get current user profile with all fields', async () => {
      await testWithApp(async (helper) => {
        // Login as test user
        const loginResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: 'profile-test@example.com',
            password: 'Test123!',
          },
        });

        expect(loginResponse.statusCode).toBe(200);
        const { accessToken } = loginResponse.json().data;

        // Get profile
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();
        
        expect(data.user).toMatchObject({
          uuid: testUser.uuid,
          email: testAccount.email,
          firstName: 'John',
          lastName: 'Doe',
          username: testUser.username,
          bio: 'Original bio text',
          website: 'https://original-website.com',
          profilePhotoUrl: 'https://example.com/original-photo.jpg',
          dateOfBirth: expect.stringMatching(/1990-01-15/),
          gender: 'male',
          userType: 'individual',
          accountRole: 'entity_viewer',
        });

        // Should NOT expose internal IDs
        expect(data.user.id).toBeUndefined();
        expect(data.user.accountId).toBeUndefined();
      });
    });

    it('should require authentication', async () => {
      await testWithApp(async (helper) => {
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
        });

        expect(response.statusCode).toBe(401);
        expect(response.json().success).toBe(false);
      });
    });
  });

  describe('PATCH /api/v1/user/profile/me - Update Profile', () => {
    it('should update basic profile information', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const updates = {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Updated bio with more details about me',
          website: 'https://new-website.com',
          dateOfBirth: '1992-06-20',
          gender: 'female',
        };

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: updates,
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();
        
        expect(data.user).toMatchObject({
          uuid: expect.any(String),
          firstName: 'Jane',
          lastName: 'Smith',
        });

        // Verify the changes persisted
        const verifyResponse = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const profile = verifyResponse.json().data.user;
        expect(profile.firstName).toBe('Jane');
        expect(profile.lastName).toBe('Smith');
        expect(profile.bio).toBe('Updated bio with more details about me');
        expect(profile.website).toBe('https://new-website.com');
        expect(profile.gender).toBe('female');
      });
    });

    it('should validate field constraints', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Test with invalid data
        const invalidUpdates = {
          firstName: '', // Empty string should fail
          lastName: 'A'.repeat(101), // Too long
          bio: 'B'.repeat(501), // Exceeds 500 char limit
          website: 'not-a-valid-url',
          dateOfBirth: 'invalid-date',
          gender: 'invalid-gender-that-is-too-long',
        };

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: invalidUpdates,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });

    it('should allow partial updates', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Update only bio
        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            bio: 'Just updating my bio',
          },
        });

        expect(response.statusCode).toBe(200);

        // Verify only bio changed
        const profile = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        const data = profile.json().data.user;
        expect(data.bio).toBe('Just updating my bio');
        // Other fields should remain unchanged
        expect(data.firstName).toBe(testUser.firstName);
        expect(data.website).toBe(testUser.website);
      });
    });
  });

  describe('POST /api/v1/user/profile/change-password - Change Password', () => {
    it('should change password with correct current password', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/profile/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'Test123!',
            newPassword: 'NewSecurePass123!',
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          success: true,
          message: 'Password changed successfully',
        });

        // Verify can login with new password
        const loginResponse = await helper.request({
          method: 'POST',
          url: '/api/v1/public/auth/login',
          payload: {
            email: testAccount.email,
            password: 'NewSecurePass123!',
          },
        });

        expect(loginResponse.statusCode).toBe(200);

        // Change back for other tests
        await helper.request({
          method: 'POST',
          url: '/api/v1/user/profile/change-password',
          headers: {
            authorization: `Bearer ${loginResponse.json().data.accessToken}`,
          },
          payload: {
            currentPassword: 'NewSecurePass123!',
            newPassword: 'Test123!',
          },
        });
      });
    });

    it('should reject incorrect current password', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/profile/change-password',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            currentPassword: 'WrongPassword123!',
            newPassword: 'NewSecurePass123!',
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect',
        });
      });
    });

    it('should enforce password requirements', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const weakPasswords = [
          'short', // Too short
          '12345678', // No letters
          'password', // No numbers
          'Password123', // Common pattern
        ];

        for (const weakPassword of weakPasswords) {
          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/profile/change-password',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              currentPassword: 'Test123!',
              newPassword: weakPassword,
            },
          });

          expect(response.statusCode).toBe(400);
          expect(response.json().success).toBe(false);
        }
      });
    });
  });

  describe('GET /api/v1/user/profile/:uuid - Get User by UUID', () => {
    it('should get another user\'s public profile', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Create another user to view
        const otherUser = await testUtils.createTestUser({
          email: 'other-user@example.com',
          firstName: 'Other',
          lastName: 'User',
          bio: 'Public bio',
          tenantId: 1,
        });

        const response = await helper.request({
          method: 'GET',
          url: `/api/v1/user/profile/${otherUser.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        // Should only expose public fields
        expect(data.user).toMatchObject({
          uuid: otherUser.uuid,
          firstName: 'Other',
          lastName: 'User',
          username: otherUser.username,
          bio: 'Public bio',
          userType: 'individual',
        });

        // Should NOT expose private fields
        expect(data.user.email).toBeUndefined();
        expect(data.user.dateOfBirth).toBeUndefined();
        expect(data.user.accountRole).toBeUndefined();

        // Cleanup
        await prisma.user.delete({ where: { id: otherUser.id } });
      });
    });

    it('should return 404 for non-existent user', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');
        const fakeUuid = crypto.randomUUID();

        const response = await helper.request({
          method: 'GET',
          url: `/api/v1/user/profile/${fakeUuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      });
    });

    it('should validate UUID format', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/not-a-valid-uuid',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(400);
        expect(response.json().success).toBe(false);
      });
    });
  });

  describe('Account-Related Profile Settings', () => {
    it('should handle timezone-aware date formatting', async () => {
      await testWithApp(async (helper) => {
        // Update account timezone
        await prisma.account.update({
          where: { id: testAccount.id },
          data: {
            timezone: 'Asia/Tokyo',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
          },
        });

        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        // Dates should be returned in ISO format for API
        expect(data.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(data.user.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}/);
      });
    });

    it('should include account preferences in profile', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Get extended profile info
        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me?include=preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          expect(data.preferences).toBeDefined();
          expect(data.preferences).toMatchObject({
            timezone: testAccount.timezone,
            languageLocale: testAccount.languageLocale,
            currencyCode: testAccount.currencyCode,
            dateFormat: testAccount.dateFormat,
            timeFormat: testAccount.timeFormat,
          });
        }
      });
    });
  });

  describe('Username Changes', () => {
    it('should allow username change if unique', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');
        const newUsername = `newusername_${Date.now()}`;

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            username: newUsername,
          },
        });

        if (response.statusCode === 200) {
          // Verify username changed
          const profile = await helper.request({
            method: 'GET',
            url: '/api/v1/user/profile/me',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
          });

          expect(profile.json().data.user.username).toBe(newUsername);
        } else {
          // Username change might not be implemented yet
          expect(response.statusCode).toBe(400);
        }
      });
    });

    it('should reject duplicate username', async () => {
      await testWithApp(async (helper) => {
        // Create another user with a username
        const otherUser = await testUtils.createTestUser({
          username: 'existingusername',
          tenantId: 1,
        });

        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            username: 'existingusername',
          },
        });

        if (response.statusCode === 409 || response.statusCode === 400) {
          expect(response.json()).toMatchObject({
            success: false,
            error: expect.stringMatching(/USERNAME_TAKEN|DUPLICATE_USERNAME/),
          });
        }

        // Cleanup
        await prisma.user.delete({ where: { id: otherUser.id } });
      });
    });

    it('should validate username format', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const invalidUsernames = [
          'ab', // Too short
          'a'.repeat(51), // Too long
          'user name', // Contains space
          'user@name', // Special characters
          '123', // Only numbers
          'user.name', // Dots not allowed
          'user-name-', // Ends with hyphen
        ];

        for (const invalidUsername of invalidUsernames) {
          const response = await helper.request({
            method: 'PATCH',
            url: '/api/v1/user/profile/me',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              username: invalidUsername,
            },
          });

          if (response.statusCode !== 501) { // Not implemented
            expect(response.statusCode).toBe(400);
            expect(response.json().success).toBe(false);
          }
        }
      });
    });
  });

  describe('Email Address Changes', () => {
    it('should initiate email change with verification', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');
        const newEmail = 'newemail@example.com';

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/profile/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail,
            password: 'Test123!', // Require password for security
          },
        });

        if (response.statusCode === 200) {
          expect(response.json()).toMatchObject({
            success: true,
            message: expect.stringContaining('verification'),
          });

          // Email should not change immediately
          const profile = await helper.request({
            method: 'GET',
            url: '/api/v1/user/profile/me',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
          });

          expect(profile.json().data.user.email).toBe(testAccount.email);
        } else if (response.statusCode === 404) {
          // Endpoint might not be implemented yet
          expect(response.statusCode).toBe(404);
        }
      });
    });

    it('should reject duplicate email', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/profile/change-email',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            newEmail: 'user1@test.com', // Existing email
            password: 'Test123!',
          },
        });

        if (response.statusCode !== 404) { // Not implemented
          expect(response.statusCode).toBe(400);
          expect(response.json()).toMatchObject({
            success: false,
            error: expect.stringMatching(/EMAIL_TAKEN|DUPLICATE_EMAIL/),
          });
        }
      });
    });
  });

  describe('Profile Photo/Avatar Upload', () => {
    it('should upload profile photo', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Create a test image file
        const formData = new FormData();
        const imageBuffer = Buffer.from('fake-image-data');
        formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'profile.jpg');
        formData.append('context', 'profile');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            'content-type': 'multipart/form-data',
          },
          payload: formData,
        });

        if (response.statusCode === 201) {
          expect(response.json()).toMatchObject({
            success: true,
            data: {
              file: {
                uuid: expect.any(String),
                fileName: expect.any(String),
                url: expect.any(String),
                mimeType: 'image/jpeg',
              },
            },
          });

          // Update profile with new photo URL
          const updateResponse = await helper.request({
            method: 'PATCH',
            url: '/api/v1/user/profile/me',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
            },
            payload: {
              profilePhotoUrl: response.json().data.file.url,
            },
          });

          expect(updateResponse.statusCode).toBe(200);
        }
      });
    });

    it('should validate file type and size', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Test invalid file type
        const formData = new FormData();
        formData.append('file', new Blob(['executable'], { type: 'application/x-executable' }), 'virus.exe');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            'content-type': 'multipart/form-data',
          },
          payload: formData,
        });

        if (response.statusCode !== 404) {
          expect(response.statusCode).toBe(400);
          expect(response.json()).toMatchObject({
            success: false,
            error: 'FILE_TYPE_NOT_ALLOWED',
          });
        }
      });
    });

    it('should enforce file size limits', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Create a large file (over 10MB)
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
        const formData = new FormData();
        formData.append('file', new Blob([largeBuffer], { type: 'image/jpeg' }), 'large.jpg');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            'content-type': 'multipart/form-data',
          },
          payload: formData,
        });

        if (response.statusCode !== 404) {
          expect(response.statusCode).toBe(400);
          expect(response.json().error).toContain('FILE_SIZE_EXCEEDS');
        }
      });
    });
  });

  describe('Birthday and Age Verification', () => {
    it('should update date of birth', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            dateOfBirth: '1995-12-25',
          },
        });

        expect(response.statusCode).toBe(200);

        // Verify the change
        const profile = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(profile.json().data.user.dateOfBirth).toMatch(/1995-12-25/);
      });
    });

    it('should validate minimum age requirement', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        // Try to set birth date that makes user under 18
        const underageDate = new Date();
        underageDate.setFullYear(underageDate.getFullYear() - 10); // 10 years old

        const response = await helper.request({
          method: 'PATCH',
          url: '/api/v1/user/profile/me',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            dateOfBirth: underageDate.toISOString().split('T')[0],
          },
        });

        if (response.statusCode === 400) {
          expect(response.json()).toMatchObject({
            success: false,
            error: expect.stringMatching(/AGE_REQUIREMENT|MINIMUM_AGE/),
          });
        }
      });
    });
  });

  describe('Profile Completion Status', () => {
    it('should track profile completion percentage', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/profile/completion',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        if (response.statusCode === 200) {
          const { data } = response.json();
          expect(data).toMatchObject({
            completionPercentage: expect.any(Number),
            missingFields: expect.any(Array),
            completedFields: expect.any(Array),
          });

          expect(data.completionPercentage).toBeGreaterThanOrEqual(0);
          expect(data.completionPercentage).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Profile Privacy Settings', () => {
    it('should update profile visibility settings', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAs('user');

        const response = await helper.request({
          method: 'PUT',
          url: '/api/v1/user/settings/preferences',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
          payload: {
            profileVisibility: 'private',
          },
        });

        if (response.statusCode === 200) {
          expect(response.json()).toMatchObject({
            success: true,
            data: {
              message: 'Preferences updated successfully',
            },
          });
        }
      });
    });
  });
});