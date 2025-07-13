import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { hexDateMediaService } from '@/lib/hex-date-media-service';
import { logger } from '@/lib/logger';
import { queueImageOptimization } from '@/lib/workers';
import crypto from 'crypto';

const validateFile = (file: File) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP images and MP4, MOV videos are allowed.');
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get session and validate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    logger.info('Processing upload for user', { userId });

    // Get user data with tenant information
    const userResult = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      with: {
        account: {
          with: {
            tenant: true
          }
        }
      }
    }) as any; // Type assertion to handle complex nested relations

    if (!userResult?.account?.tenant) {
      return NextResponse.json({ error: 'User tenant not found' }, { status: 400 });
    }

    const tenantHash = userResult.account.tenant.uuid.split('-').join('').substring(0, 16);
    logger.info('User query result', { userId, tenantId: userResult.account.tenant.id });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pictureType = formData.get('pictureType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    validateFile(file);

    // Create content hash for deduplication (will be used as fileHash)
    const buffer = await file.arrayBuffer();
    const contentHash = crypto.createHash('sha256').update(new Uint8Array(buffer)).digest('hex');

    // Upload file and get organized path structure first to get fileHash
    const accountUuid = userResult.account.uuid;
    const tenantUuid = userResult.account.tenant.uuid;
    const userUuid = userResult.uuid;

    const uploadResult = await hexDateMediaService.uploadFile(file, accountUuid, tenantUuid, userUuid);

    // Check for exact duplicate using fileHash (optimized schema approach)
    logger.info('Checking for duplicate files by fileHash', { fileHash: uploadResult.fileHash, mimeType: file.type });
    const existingDuplicate = await db.query.mediaAssets.findFirst({
      where: (mediaAssets: any, { eq, and }: any) => and(
        eq(mediaAssets.userId, userId),
        eq(mediaAssets.fileHash, uploadResult.fileHash),
        eq(mediaAssets.mimeType, file.type)
      ),
      columns: {
        id: true,
        fileName: true,
        pictureType: true,
        directoryHash: true,
        fileHash: true,
        originalName: true
      }
    });

    if (existingDuplicate) {
      logger.info('Duplicate file detected - returning existing media', { 
        existingId: existingDuplicate.id,
        fileHash: uploadResult.fileHash,
        mimeType: file.type
      });

      // Compute CDN URL for existing file
      const existingCdnUrl = hexDateMediaService.computeCdnUrl(
        accountUuid,
        existingDuplicate.directoryHash,
        existingDuplicate.fileHash,
        existingDuplicate.originalName
      );

      // Update profile photo URL if this is a profile picture
      if (pictureType === 'profile_picture') {
        await db.update(users)
          .set({ 
            profilePhotoUrl: existingCdnUrl,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        logger.info('Updated profile photo URL to existing duplicate', { userId, profilePhotoUrl: existingCdnUrl });
      }

      return NextResponse.json({
        success: true,
        media: {
          id: existingDuplicate.id,
          uuid: null,
          fileName: existingDuplicate.fileName,
          cdnUrl: existingCdnUrl,
          pictureType: existingDuplicate.pictureType
        },
        isDuplicate: true,
        message: 'File already exists with identical content'
      });
    }

    logger.info('File uploaded successfully with hex date structure');

    // Replace existing pictures of the same type (different content)
    if (pictureType) {
      logger.info('Checking for existing pictures of same type to replace');
      const existingPictures = await db.query.mediaAssets.findMany({
        where: (mediaAssets: any, { eq, and }: any) => and(
          eq(mediaAssets.userId, userId),
          eq(mediaAssets.pictureType, pictureType as 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo')
        ),
        columns: {
          id: true,
          fileName: true
        }
      });

      if (existingPictures.length > 0) {
        // Delete existing files from database using Drizzle
        for (const pic of existingPictures) {
          await db.delete(mediaAssets).where(eq(mediaAssets.id, pic.id));
        }
        logger.info('Deleted existing pictures from database (different content)', { 
          count: existingPictures.length,
          replacedFileNames: existingPictures.map(p => p.fileName)
        });
      }
    }

    // Create metadata object
    const metadata = {
      fileId: `upload-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`,
      uploadedAt: new Date().toISOString(),
      garbageCollectionApplied: true,
      replacementType: pictureType,
      hexDateStructure: 'XOR_obfuscated'
    };

    logger.info('Using optimized Drizzle ORM insert with content hash deduplication');

    const fileName = `${uploadResult.directoryHash}_${uploadResult.fileHash}.${file.name.split('.').pop()}`;

    // Insert new media asset with minimal required fields (optimized schema)
    const insertResult = await db.insert(mediaAssets).values({
      tenantId: userResult.account.tenant.id,
      userId, 
      fileName,
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      mediaType: uploadResult.mediaType as 'photo' | 'video' | 'document',
      pictureType: pictureType as 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo',
      directoryHash: uploadResult.directoryHash,
      fileHash: uploadResult.fileHash
      // Note: s3BucketPath removed in optimized schema - CDN URL computed on-demand
      // Note: contentHash field removed in optimized schema  
      // Note: cdnUrl field not used in insert - computed on-demand from hashes
    }).returning({
      id: mediaAssets.id,
      uuid: mediaAssets.uuid,
      fileName: mediaAssets.fileName,
      pictureType: mediaAssets.pictureType,
      directoryHash: mediaAssets.directoryHash,
      fileHash: mediaAssets.fileHash,
      originalName: mediaAssets.originalName
    });

    const insertedMedia = Array.isArray(insertResult) ? insertResult[0] : insertResult;

    if (!insertedMedia || !insertedMedia.id) {
      throw new Error('Database insertion failed - no valid result returned');
    }

    logger.info('Media uploaded successfully with content hash deduplication', { 
      mediaId: insertedMedia.id,
      fileName: insertedMedia.fileName,
      pictureType: insertedMedia.pictureType,
      fileHash: uploadResult.fileHash
    });

    // Update user's profile_photo_url if this is a profile picture
    if (pictureType === 'profile_picture') {
      logger.info('Updating user profile_photo_url for profile picture upload');

      // Compute CDN URL on-demand
      const profilePictureUrl = hexDateMediaService.computeCdnUrl(
        accountUuid,
        insertedMedia.directoryHash,
        insertedMedia.fileHash,
        insertedMedia.originalName
      );

      await db.update(users)
        .set({ 
          profilePhotoUrl: profilePictureUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      logger.info('User profile_photo_url updated successfully', { 
        userId, 
        profilePhotoUrl: profilePictureUrl 
      });
    }

    // Queue background processing job based on media type
    try {
      if (uploadResult.mediaType === 'photo') {
        // Queue image optimization using the main worker system
        const jobId = await queueImageOptimization({
          mediaAssetId: insertedMedia.id,
          filePath: `${uploadResult.directoryHash}_${uploadResult.fileHash}.${file.name.split('.').pop()}`,
          mimeType: file.type,
          thumbnailSizes: ['150', '300', '600'], // Standard thumbnail sizes
          quality: pictureType === 'profile_picture' ? 85 : 80
        });

        if (jobId) {
          logger.info('Image optimization job queued', { 
            mediaId: insertedMedia.id, 
            jobId, 
            processingType: 'optimization' 
          });
        } else {
          logger.warn('Image optimization job not queued - workers may be stopped', { 
            mediaId: insertedMedia.id 
          });
        }
      }
      // Video processing removed for now - will add back when video worker is implemented
    } catch (jobError) {
      logger.error('Failed to queue processing job', { 
        error: jobError.message, 
        mediaId: insertedMedia.id 
      });
      // Don't fail the upload if job queueing fails
    }

    // Compute CDN URL for response
    const cdnUrl = hexDateMediaService.computeCdnUrl(
      accountUuid,
      insertedMedia.directoryHash,
      insertedMedia.fileHash,
      insertedMedia.originalName
    );

    return NextResponse.json({
      success: true,
      media: {
        id: insertedMedia.id,
        uuid: insertedMedia.uuid,
        fileName: insertedMedia.fileName,
        cdnUrl,
        pictureType: insertedMedia.pictureType
      },
      hexDateStructure: {
        tenantHash,
        directoryHash: uploadResult.directoryHash,
        fileHash: uploadResult.fileHash
      },
      isDuplicate: false
    });

  } catch (error: any) {
    logger.error('Upload failed', { error: error.message, stack: error.stack });
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 