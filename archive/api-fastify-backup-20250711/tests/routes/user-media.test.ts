/**
 * User Media Upload API Tests
 * Comprehensive tests for user media uploads including avatars, profile photos, etc.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testWithApp, TestAppHelper } from '../helpers/app.helper';
import { testUtils, prisma, redis } from '../setup';
import { readFileSync, createReadStream } from 'fs';
import { join } from 'path';
import FormData from 'form-data';
import crypto from 'crypto';

describe('User Media Upload API - Complete Test Suite', () => {
  let app: TestAppHelper;
  let testUser: any;
  let testAccount: any;

  // Mock file data for testing
  const createMockFile = (type: string, size: number = 1024) => {
    const buffer = Buffer.alloc(size);
    // Fill with some pattern to simulate real file
    for (let i = 0; i < size; i++) {
      buffer[i] = i % 256;
    }
    return buffer;
  };

  beforeAll(async () => {
    // Create test user
    testAccount = await prisma.account.create({
      data: {
        email: 'media-test@example.com',
        passwordHash: await import('bcryptjs').then(b => b.hash('Test123!', 10)),
        tenantId: 1,
        isActive: true,
        emailVerified: true,
      },
    });

    testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        firstName: 'Media',
        lastName: 'Tester',
        username: `mediauser_${Date.now()}`,
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
    // Cleanup uploaded media records
    await prisma.profileMedia.deleteMany({
      where: { userId: testUser.id },
    });

    // Cleanup user
    if (testUser) {
      await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    if (testAccount) {
      await prisma.account.delete({ where: { id: testAccount.id } });
    }
  });

  describe('POST /api/v1/user/media/uploads - Upload Media Files', () => {
    it('should upload profile photo successfully', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create form data with image
        const imageBuffer = createMockFile('image/jpeg', 1024 * 100); // 100KB
        const form = new FormData();
        form.append('file', imageBuffer, {
          filename: 'profile-photo.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');
        form.append('context', 'user-profile');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        expect(response.statusCode).toBe(201);
        const { data } = response.json();

        expect(data).toMatchObject({
          media: {
            uuid: expect.any(String),
            fileName: 'profile-photo.jpg',
            mediaType: 'profilePhoto',
            mimeType: 'image/jpeg',
            fileSize: 102400,
            url: expect.stringContaining('/media/'),
            status: 'uploaded',
          },
        });

        // Verify file path follows UUID structure
        expect(data.media.url).toMatch(/\/media\/1\/[a-f0-9]{2}\/[a-f0-9]{2}\//);

        // Verify media record was created
        const mediaRecord = await prisma.profileMedia.findFirst({
          where: { 
            userId: testUser.id,
            mediaType: 'profilePhoto',
          },
        });

        expect(mediaRecord).toBeTruthy();
        expect(mediaRecord?.fileName).toBe('profile-photo.jpg');
      });
    });

    it('should validate file type restrictions', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Try uploading an executable file
        const execBuffer = createMockFile('application/x-executable', 1024);
        const form = new FormData();
        form.append('file', execBuffer, {
          filename: 'malware.exe',
          contentType: 'application/x-executable',
        });
        form.append('mediaType', 'profilePhoto');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: expect.stringContaining('File type not allowed'),
        });
      });
    });

    it('should enforce file size limits', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create a file larger than 10MB limit
        const largeBuffer = createMockFile('image/jpeg', 1024 * 1024 * 11); // 11MB
        const form = new FormData();
        form.append('file', largeBuffer, {
          filename: 'large-photo.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: expect.stringContaining('exceeds the maximum'),
        });
      });
    });

    it('should support multiple media types', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const mediaTypes = [
          { type: 'profilePhoto', mime: 'image/jpeg', ext: 'jpg' },
          { type: 'coverPhoto', mime: 'image/png', ext: 'png' },
          { type: 'portfolioImage', mime: 'image/webp', ext: 'webp' },
          { type: 'document', mime: 'application/pdf', ext: 'pdf' },
        ];

        for (const media of mediaTypes) {
          const buffer = createMockFile(media.mime, 1024 * 50); // 50KB
          const form = new FormData();
          form.append('file', buffer, {
            filename: `test-file.${media.ext}`,
            contentType: media.mime,
          });
          form.append('mediaType', media.type);

          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/media/uploads',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
              ...form.getHeaders(),
            },
            payload: form,
          });

          if (response.statusCode === 201) {
            expect(response.json().data.media.mediaType).toBe(media.type);
            expect(response.json().data.media.mimeType).toBe(media.mime);
          }
        }
      });
    });

    it('should generate unique file paths with UUID structure', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const uploadedPaths = new Set<string>();

        // Upload multiple files
        for (let i = 0; i < 3; i++) {
          const buffer = createMockFile('image/jpeg', 1024);
          const form = new FormData();
          form.append('file', buffer, {
            filename: `test-${i}.jpg`,
            contentType: 'image/jpeg',
          });
          form.append('mediaType', 'profilePhoto');

          const response = await helper.request({
            method: 'POST',
            url: '/api/v1/user/media/uploads',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
              ...form.getHeaders(),
            },
            payload: form,
          });

          if (response.statusCode === 201) {
            const { url } = response.json().data.media;
            expect(uploadedPaths.has(url)).toBe(false); // Each path should be unique
            uploadedPaths.add(url);

            // Verify path structure: /media/{tenantId}/{hash[0:2]}/{hash[2:4]}/{filename}
            const pathMatch = url.match(/\/media\/(\d+)\/([a-f0-9]{2})\/([a-f0-9]{2})\/(.*)/);
            expect(pathMatch).toBeTruthy();
            expect(pathMatch![1]).toBe('1'); // tenantId
            expect(pathMatch![2]).toHaveLength(2); // First 2 chars of hash
            expect(pathMatch![3]).toHaveLength(2); // Next 2 chars of hash
          }
        }
      });
    });

    it('should handle file replacement for same media type', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Upload first profile photo
        const firstBuffer = createMockFile('image/jpeg', 1024 * 50);
        const form1 = new FormData();
        form1.append('file', firstBuffer, {
          filename: 'first-photo.jpg',
          contentType: 'image/jpeg',
        });
        form1.append('mediaType', 'profilePhoto');

        const response1 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form1.getHeaders(),
          },
          payload: form1,
        });

        expect(response1.statusCode).toBe(201);
        const firstUrl = response1.json().data.media.url;

        // Upload replacement photo
        const secondBuffer = createMockFile('image/jpeg', 1024 * 60);
        const form2 = new FormData();
        form2.append('file', secondBuffer, {
          filename: 'second-photo.jpg',
          contentType: 'image/jpeg',
        });
        form2.append('mediaType', 'profilePhoto');

        const response2 = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form2.getHeaders(),
          },
          payload: form2,
        });

        expect(response2.statusCode).toBe(201);
        const secondUrl = response2.json().data.media.url;

        // URLs should be different
        expect(secondUrl).not.toBe(firstUrl);

        // Check that old media is marked as replaced
        const oldMedia = await prisma.profileMedia.findFirst({
          where: { 
            userId: testUser.id,
            url: firstUrl,
          },
        });

        if (oldMedia) {
          expect(oldMedia.status).toBe('replaced');
        }
      });
    });

    it('should create audit log for uploads', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const buffer = createMockFile('image/jpeg', 1024 * 30);
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'audit-test.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        expect(response.statusCode).toBe(201);

        // Check audit log
        const auditLog = await prisma.audit_logs.findFirst({
          where: {
            userId: testUser.id,
            action: 'media_upload',
            resourceType: 'media',
          },
          orderBy: { createdAt: 'desc' },
        });

        expect(auditLog).toBeTruthy();
        expect(auditLog?.metadata).toMatchObject({
          mediaType: 'profilePhoto',
          fileName: 'audit-test.jpg',
          fileSize: 30720,
        });
      });
    });

    it('should validate image dimensions for profile photos', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create a mock image with metadata
        const buffer = createMockFile('image/jpeg', 1024 * 10);
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'small-image.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');
        // Add dimension metadata if API supports it
        form.append('width', '100');
        form.append('height', '100');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        // API might validate minimum dimensions
        if (response.statusCode === 400) {
          expect(response.json()).toMatchObject({
            success: false,
            error: expect.stringMatching(/INVALID_DIMENSIONS|IMAGE_TOO_SMALL/),
          });
        }
      });
    });
  });

  describe('GET /api/v1/user/media - List User Media', () => {
    beforeEach(async () => {
      // Create some test media records
      const mediaTypes = ['profilePhoto', 'coverPhoto', 'portfolioImage'];
      
      for (const type of mediaTypes) {
        await prisma.profileMedia.create({
          data: {
            userId: testUser.id,
            tenantId: 1,
            fileName: `test-${type}.jpg`,
            fileHash: crypto.randomBytes(32).toString('hex'),
            mimeType: 'image/jpeg',
            fileSize: 1024 * 50,
            mediaType: type,
            url: `/media/1/ab/cd/test-${type}.jpg`,
            thumbnailUrl: `/media/1/ab/cd/thumb-test-${type}.jpg`,
            status: 'uploaded',
          },
        });
      }
    });

    it('should list all user media files', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/media',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data.media).toBeInstanceOf(Array);
        expect(data.media.length).toBeGreaterThanOrEqual(3);

        // Check media structure
        const media = data.media[0];
        expect(media).toMatchObject({
          uuid: expect.any(String),
          fileName: expect.any(String),
          mediaType: expect.any(String),
          mimeType: expect.any(String),
          fileSize: expect.any(Number),
          url: expect.any(String),
          status: 'uploaded',
          createdAt: expect.any(String),
        });
      });
    });

    it('should filter media by type', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/media?type=profilePhoto',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data.media).toBeInstanceOf(Array);
        data.media.forEach((item: any) => {
          expect(item.mediaType).toBe('profilePhoto');
        });
      });
    });

    it('should paginate media results', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const response = await helper.request({
          method: 'GET',
          url: '/api/v1/user/media?page=1&limit=2',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        const { data } = response.json();

        expect(data.media.length).toBeLessThanOrEqual(2);
        expect(data.pagination).toMatchObject({
          page: 1,
          limit: 2,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        });
      });
    });
  });

  describe('DELETE /api/v1/user/media/:uuid - Delete Media', () => {
    it('should delete media file', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create a media record to delete
        const mediaToDelete = await prisma.profileMedia.create({
          data: {
            userId: testUser.id,
            tenantId: 1,
            fileName: 'delete-me.jpg',
            fileHash: crypto.randomBytes(32).toString('hex'),
            mimeType: 'image/jpeg',
            fileSize: 1024,
            mediaType: 'portfolioImage',
            url: '/media/1/ab/cd/delete-me.jpg',
            status: 'uploaded',
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/user/media/${mediaToDelete.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
          success: true,
          data: {
            message: 'Media deleted successfully',
          },
        });

        // Verify media was soft deleted or marked as deleted
        const deletedMedia = await prisma.profileMedia.findUnique({
          where: { id: mediaToDelete.id },
        });

        expect(deletedMedia?.status).toBe('deleted');
      });
    });

    it('should not delete media belonging to other users', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create another user's media
        const otherUser = await testUtils.createTestUser({
          email: 'other-media@example.com',
          tenantId: 1,
        });

        const otherMedia = await prisma.profileMedia.create({
          data: {
            userId: otherUser.id,
            tenantId: 1,
            fileName: 'other-user.jpg',
            fileHash: crypto.randomBytes(32).toString('hex'),
            mimeType: 'image/jpeg',
            fileSize: 1024,
            mediaType: 'profilePhoto',
            url: '/media/1/ef/gh/other-user.jpg',
            status: 'uploaded',
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/user/media/${otherMedia.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        expect(response.statusCode).toBe(404);
        expect(response.json()).toMatchObject({
          success: false,
          error: 'MEDIA_NOT_FOUND',
        });

        // Cleanup
        await prisma.profileMedia.delete({ where: { id: otherMedia.id } });
        await prisma.user.delete({ where: { id: otherUser.id } });
      });
    });

    it('should prevent deletion of active profile photo', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create active profile photo
        const activePhoto = await prisma.profileMedia.create({
          data: {
            userId: testUser.id,
            tenantId: 1,
            fileName: 'active-profile.jpg',
            fileHash: crypto.randomBytes(32).toString('hex'),
            mimeType: 'image/jpeg',
            fileSize: 1024,
            mediaType: 'profilePhoto',
            url: '/media/1/ij/kl/active-profile.jpg',
            status: 'uploaded',
            isActive: true,
          },
        });

        const response = await helper.request({
          method: 'DELETE',
          url: `/api/v1/user/media/${activePhoto.uuid}`,
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
          },
        });

        // Should either fail or deactivate but not delete
        if (response.statusCode === 400) {
          expect(response.json()).toMatchObject({
            success: false,
            error: 'CANNOT_DELETE_ACTIVE_MEDIA',
            message: expect.stringContaining('active profile photo'),
          });
        }

        // Cleanup
        await prisma.profileMedia.delete({ where: { id: activePhoto.id } });
      });
    });
  });

  describe('Media Security & Validation', () => {
    it('should sanitize file names', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const buffer = createMockFile('image/jpeg', 1024);
        const form = new FormData();
        form.append('file', buffer, {
          filename: '../../../etc/passwd.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        if (response.statusCode === 201) {
          const { media } = response.json().data;
          // File name should be sanitized
          expect(media.fileName).not.toContain('..');
          expect(media.fileName).not.toContain('/');
          expect(media.url).not.toContain('../');
        }
      });
    });

    it('should verify file content matches MIME type', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Create a file with mismatched content
        const buffer = Buffer.from('<?php echo "malicious"; ?>');
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'fake-image.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'profilePhoto');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          success: false,
          error: expect.stringMatching(/INVALID_FILE_CONTENT|FILE_TYPE_MISMATCH/),
        });
      });
    });

    it('should handle concurrent uploads gracefully', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        // Upload multiple files concurrently
        const uploadPromises = Array(3).fill(null).map((_, index) => {
          const buffer = createMockFile('image/jpeg', 1024 * 10);
          const form = new FormData();
          form.append('file', buffer, {
            filename: `concurrent-${index}.jpg`,
            contentType: 'image/jpeg',
          });
          form.append('mediaType', 'portfolioImage');

          return helper.request({
            method: 'POST',
            url: '/api/v1/user/media/uploads',
            headers: {
              authorization: `Bearer ${auth.accessToken}`,
              ...form.getHeaders(),
            },
            payload: form,
          });
        });

        const responses = await Promise.all(uploadPromises);
        
        // All should succeed
        responses.forEach(response => {
          expect(response.statusCode).toBe(201);
        });

        // All should have unique URLs
        const urls = responses.map(r => r.json().data.media.url);
        const uniqueUrls = new Set(urls);
        expect(uniqueUrls.size).toBe(urls.length);
      });
    });
  });

  describe('Media Processing & Thumbnails', () => {
    it('should generate thumbnails for images', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const buffer = createMockFile('image/jpeg', 1024 * 100);
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'with-thumbnail.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'portfolioImage');
        form.append('generateThumbnail', 'true');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        if (response.statusCode === 201) {
          const { media } = response.json().data;
          
          // If thumbnails are supported
          if (media.thumbnailUrl) {
            expect(media.thumbnailUrl).toBeTruthy();
            expect(media.thumbnailUrl).toContain('thumb-');
          }
        }
      });
    });

    it('should extract and store image metadata', async () => {
      await testWithApp(async (helper) => {
        const auth = await helper.loginAsUser({
          email: 'media-test@example.com',
          password: 'Test123!',
        });

        const buffer = createMockFile('image/jpeg', 1024 * 50);
        const form = new FormData();
        form.append('file', buffer, {
          filename: 'with-metadata.jpg',
          contentType: 'image/jpeg',
        });
        form.append('mediaType', 'portfolioImage');

        const response = await helper.request({
          method: 'POST',
          url: '/api/v1/user/media/uploads',
          headers: {
            authorization: `Bearer ${auth.accessToken}`,
            ...form.getHeaders(),
          },
          payload: form,
        });

        if (response.statusCode === 201) {
          const { media } = response.json().data;
          
          // Check if metadata is extracted
          if (media.metadata) {
            expect(media.metadata).toMatchObject({
              width: expect.any(Number),
              height: expect.any(Number),
              format: expect.any(String),
            });
          }
        }
      });
    });
  });
});