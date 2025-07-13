/**
 * @openapi
 * /api/media/upload:
 *   post:
 *     tags:
 *       - Media
 *       - Upload
 *     summary: Upload Media Files
     tags:
       - Media Management
 *     description: Upload images, videos, or documents with automatic processing, compression, and thumbnail generation. Supports multiple file formats and tenant-specific storage.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - context
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (images, videos, documents)
 *               context:
 *                 type: string
 *                 enum: [profile_picture, portfolio_image, portfolio_video, comp_card, documents, media_assets]
 *                 description: Upload context for proper categorization and processing
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the files
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Title for the media files
 *                   description:
 *                     type: string
 *                     description: Description of the media files
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tags for categorization
 *                   isPrivate:
 *                     type: boolean
 *                     description: Whether the files should be private
 *                   category:
 *                     type: string
 *                     description: Category for portfolio organization
 *     responses:
 *       '200':
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           fileName:
 *                             type: string
 *                           originalName:
 *                             type: string
 *                           url:
 *                             type: string
 *                           thumbnailUrl:
 *                             type: string
 *                           fileSize:
 *                             type: integer
 *                           mimeType:
 *                             type: string
 *                           dimensions:
 *                             type: object
 *                             properties:
 *                               width:
 *                                 type: integer
 *                               height:
 *                                 type: integer
 *                           metadata:
 *                             type: object
 *                     totalSize:
 *                       type: integer
 *                     processedCount:
 *                       type: integer
 *       '400':
 *         description: Invalid file upload request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       '401':
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '413':
 *         description: File size too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '415':
 *         description: Unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets, accounts, users, mediaProcessing } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { 
  queueImageOptimization,
  queueVideoOptimization,
  queueDocumentOptimization
} from '@/lib/workers';
import crypto from 'crypto';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { markReplacedMediaAsDeleted } from '@/lib/media-garbage-collection';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

// Get media type from mime type
function getMediaType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'photo';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  // This should never happen due to validation above, but fallback to photo
  return 'photo';
}

// Get picture type from context and slot
function getPictureType(context: string, slotId?: string): 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo' {
  if (context === 'profile_picture') return 'profile_picture';
  if (context === 'compcard' && slotId) return 'set_card';
  if (context === 'portfolio') return 'model_book';
  if (context === 'voice_portfolio') return 'model_book';
  if (context === 'application') return 'application_photo';
  if (context === 'job_submission') return 'application_photo';
  if (context === 'document') return 'verification_photo';
  return 'model_book'; // Default fallback
}

// Generate file hash
function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Generate directory hash (simplified for now)
function generateDirectoryHash(accountUuid: string, mediaType: string): string {
  const combined = accountUuid + mediaType + Date.now().toString();
  return crypto.createHash('md5').update(combined).digest('hex').substring(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    logger.info('=== UPLOAD API START ===');
    const session = await auth();
    logger.info('Session received', { hasSession: !!session, hasUserId: !!session?.user?.id });

    if (!session?.user?.id) {
      logger.warn('❌ No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);
    logger.info('✅ User ID validated', { userId });
    logger.info('Upload request started', { userId });

    // Get form data
    logger.info('📋 Getting form data...');
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const context = formData.get('context') as string;
    const metadataRaw = formData.get('metadata') as string;
    const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};

    logger.info('📋 Form data received', { 
      hasFiles: !!files.length, 
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      fileTypes: files.map(f => f.type),
      context, 
      metadata
    });

    if (!files.length) {
      logger.warn('❌ No files provided');
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!context) {
      logger.warn('❌ No context provided');
      return NextResponse.json({ error: 'Upload context required' }, { status: 400 });
    }

    logger.info('✅ Files and context validation passed');

    // Validate file types
    logger.info('🔍 Validating file types', { fileTypes: files.map(f => f.type) });
    if (!files.every(f => ALL_ALLOWED_TYPES.includes(f.type))) {
      const invalidTypes = files.filter(f => !ALL_ALLOWED_TYPES.includes(f.type)).map(f => f.type);
      logger.warn('❌ Files types not allowed', { invalidTypes, allowedTypes: ALL_ALLOWED_TYPES });
      return NextResponse.json({ 
        error: `Files types ${invalidTypes.join(', ')} not allowed. Allowed types: ${ALL_ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file sizes
    logger.info('🔍 Validating file sizes', { fileSizes: files.map(f => f.size), maxSize: MAX_FILE_SIZE });
    if (files.some(f => f.size > MAX_FILE_SIZE)) {
      const tooLargeFiles = files.filter(f => f.size > MAX_FILE_SIZE).map(f => ({ name: f.name, size: f.size }));
      logger.warn('❌ Files sizes too large', { tooLargeFiles });
      return NextResponse.json({ 
        error: `Files ${tooLargeFiles.map(f => `${f.name} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`).join(', ')} exceed maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    logger.info('✅ Files validation passed');

    // Get user's account for hash
    logger.info('👤 Fetching user account', { userId });

    const userAccount = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
      with: {
        account: true
      }
    });

    logger.info('👤 User account query result', { 
      found: !!userAccount, 
      hasAccount: !!userAccount?.account,
      accountId: userAccount?.accountId
    });

    if (!userAccount?.account) {
      logger.error('❌ User account not found', { userId, userAccount: !!userAccount });
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    logger.info('✅ User account found');

    // Get account hash
    logger.info('🏢 Fetching account data', { accountId: userAccount.accountId });

    const accountData = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, userAccount.accountId)
    });

    logger.info('🏢 Account data result', { found: !!accountData, hasUuid: !!accountData?.uuid });

    if (!accountData) {
      logger.error('❌ Account not found', { accountId: userAccount.accountId });
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    logger.info('✅ Account data found', { accountUuid: accountData.uuid });

    // Convert files to buffers
    logger.info('📄 Converting files to buffers...');
    const buffers = await Promise.all(files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      logger.info('✅ Buffer created', { bufferSize: buffer.length });
      return buffer;
    }));

    // Generate hashes
    logger.info('🔢 Generating hashes...');
    const fileHashes = buffers.map(generateFileHash);
    const mediaTypes = files.map(file => getMediaType(file.type));
    const directoryHashes = mediaTypes.map((mediaType) => generateDirectoryHash(accountData.uuid, mediaType));
    const pictureTypes = files.map((file, index) => getPictureType(context, files[index].name.split('.').pop()));

    logger.info('🔢 Generated values', {
      fileHashesPreview: fileHashes.map(h => h.substring(0, 10) + '...').join(', '),
      mediaTypes,
      directoryHashes,
      pictureTypes
    });

    // Generate file names and paths
    const fileExtensions = files.map(f => path.extname(f.name).toLowerCase());
    const fileNames = files.map((file, index) => {
      const fileName = `${directoryHashes[index]}_${fileHashes[index]}${fileExtensions[index]}`;
      return fileName;
    });

    // S3 bucket paths (simulate for now)
    const s3BucketPaths = files.map((file, index) => {
      const s3BucketPath = `/media/${accountData.uuid}/${directoryHashes[index].substring(0, 2)}/${directoryHashes[index].substring(2, 4)}/${directoryHashes[index].substring(4, 6)}/${directoryHashes[index].substring(6, 8)}`;
      return s3BucketPath;
    });

    // CDN URLs
    const cdnUrls = files.map((file, index) => {
      const cdnUrl = `${s3BucketPaths[index]}/${fileNames[index]}`;
      return cdnUrl;
    });

    logger.info('📂 Generated paths', {
      fileNames,
      s3BucketPaths,
      cdnUrls
    });

    // Create media asset records with minimal required fields only
    const mediaAssetData = files.map((file, index) => ({
      // Required fields only
      tenantId: accountData.tenantId,
      userId: userId,
      fileName: fileNames[index],
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      mediaType: mediaTypes[index],
      directoryHash: directoryHashes[index],
      fileHash: fileHashes[index],
      pictureType: pictureTypes[index]
      // All other fields will use database defaults
      // Note: CDN URL is computed on-demand from directoryHash + fileName
    }));

    logger.info('💾 Media asset data to insert', { mediaAssetData });

    // Log the data we're about to insert for debugging
    logger.info('Preparing media asset insertion', { 
      tenantId: accountData.tenantId,
      userId, 
      fileNames,
      originalNames: files.map(f => f.name),
      mimeTypes: files.map(f => f.type),
      fileSizes: files.map(f => f.size),
      mediaTypes,
      directoryHashes,
      fileHashes,
      pictureTypes,
      hasAllRequiredFields: !!(accountData.tenantId && userId && fileNames.length && files.every(f => f.name) && files.every(f => f.type) && files.every(f => f.size) && mediaTypes.length && directoryHashes.length && fileHashes.length && pictureTypes.length)
    });

    // Validate required fields before insertion
    if (!accountData.tenantId) {
      logger.error('Missing tenantId', { accountData });
      return NextResponse.json({ error: 'Invalid account configuration' }, { status: 500 });
    }

    // Insert media assets
    logger.info('💾 Inserting media assets into database...');

    const results = await db.insert(mediaAssets).values(mediaAssetData).returning({
      id: mediaAssets.id, 
      fileName: mediaAssets.fileName,
      originalName: mediaAssets.originalName,
      mimeType: mediaAssets.mimeType,
      fileSize: mediaAssets.fileSize,
      isProcessed: mediaAssets.isProcessed,
      processingStatus: mediaAssets.processingStatus,
      pictureType: mediaAssets.pictureType
    });

    logger.info('✅ Media assets inserted successfully', { results });

    logger.info('Media asset insertion successful', { 
      insertedCount: results.length,
      mediaAssetIds: results.map(r => r.id) 
    });

    const createdAssets = results;

    // 🖼️ UPDATE USER PROFILE PICTURE URL: Critical for profile pictures
    await Promise.all(createdAssets.map(async (createdAsset, index) => {
      if (pictureTypes[index] === 'profile_picture') {
        logger.info('📸 Updating user profile picture URL...');
        try {
          await db.update(users)
            .set({ 
              profilePhotoUrl: cdnUrls[index],
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));

          logger.info('✅ User profile picture URL updated successfully', { 
            userId, 
            profilePhotoUrl: cdnUrls[index] 
          });
        } catch (profileUpdateError) {
          logger.error('❌ Failed to update user profile picture URL', {
            error: profileUpdateError,
            userId,
            cdnUrl: cdnUrls[index]
          });
          // Don't fail the upload, but log the issue
        }
      }
    }));

    // 🗑️ GARBAGE COLLECTION: Mark old media as deleted
    logger.info('🗑️ Checking for old media to mark as deleted...');
    try {
      await Promise.all(createdAssets.map(async (createdAsset, index) => {
        if (pictureTypes[index] === 'profile_picture') {
          await markReplacedMediaAsDeleted(userId, pictureTypes[index], files[index].name.split('.').pop(), createdAsset.id);
          logger.info('✅ Old media marked for deletion', { pictureType: pictureTypes[index], fileName: files[index].name });
        } else if (pictureTypes[index] === 'set_card') {
          // Skip deletion for set_card - CompCard update API will handle this
          logger.info('⏭️ Skipping deletion for set_card - CompCard API will handle', { pictureType: pictureTypes[index], fileName: files[index].name });
        }
      }));
    } catch (error) {
      // Don't fail the upload if garbage collection fails
      logger.warn('⚠️ Failed to mark old media for deletion', { error, pictureTypes, files });
    }

    logger.info('Media upload successful', {
      userId,
      mediaAssetIds: createdAssets.map(a => a.id),
      fileNames: files.map(f => f.name),
      context,
      metadata
    });

    // Save files to disk first
    logger.info('📁 Saving files to disk...');
    const storageBasePath = process.env.STORAGE_BASE_PATH || './public';

    // Create the full file paths matching the serving route structure
    const diskPaths = files.map((file, index) => {
      const diskPath = path.join(
        storageBasePath, 
        'media',
        accountData.uuid,
        directoryHashes[index].substring(0, 2),
        directoryHashes[index].substring(2, 4), 
        directoryHashes[index].substring(4, 6),
        directoryHashes[index].substring(6, 8),
        fileNames[index]
      );
      return diskPath;
    });

    // Create directory structures if they don't exist
    await Promise.all(diskPaths.map(async (diskPath) => {
      await mkdir(path.dirname(diskPath), { recursive: true });
    }));

    // Write files to disk
    await Promise.all(buffers.map(async (buffer, index) => {
      await writeFile(diskPaths[index], buffer);
      logger.info('📁 File saved successfully', { diskPath: diskPaths[index] });
    }));

    // Create processing records
    logger.info('🔄 Creating processing records...');
    const processingRecords = await db.insert(mediaProcessing).values(files.map((file, index) => ({
      mediaId: createdAssets[index].id,
      processingType: 'optimization',
      status: 'pending',
      startedAt: new Date()
    }))).returning({
      id: mediaProcessing.id,
      status: mediaProcessing.status
    });

    logger.info('✅ Processing records created', { processingIds: processingRecords.map(r => r.id) });

    // Queue optimization jobs based on media types
    logger.info('🚀 Queueing optimization jobs...');

    const jobTypes = files.map((file) => {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
      if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
      return 'document';
    });

    const jobIds = await Promise.all(jobTypes.map((jobType, index) => {
      if (jobType === 'image') {
        return queueImageOptimization({
          mediaAssetId: createdAssets[index].id,
          filePath: diskPaths[index],
          mimeType: files[index].type,
          thumbnailSizes: ['150', '300', '600'],
          quality: 80
        });
      } else if (jobType === 'video') {
        return queueVideoOptimization({
          mediaAssetId: createdAssets[index].id,
          filePath: diskPaths[index],
          mimeType: files[index].type,
          quality: 80
        });
      } else {
        return queueDocumentOptimization({
          mediaAssetId: createdAssets[index].id,
          filePath: diskPaths[index],
          mimeType: files[index].type,
          generateThumbnail: true
        });
      }
    }));

    const jobResults = await Promise.all(jobIds.map(async (jobId, index) => {
      if (jobId) {
        // Update processing record with job ID
        await db.update(mediaProcessing)
          .set({ 
            jobId: jobId,
            processingParams: {
              type: jobTypes[index],
              filePath: diskPaths[index],
              mimeType: files[index].type,
              thumbnailSizes: ['150', '300', '600'],
              quality: 80
            }
          })
          .where(eq(mediaProcessing.id, processingRecords[index].id));

        logger.info('✅ Optimization job queued successfully', { jobId, jobType: jobTypes[index] });
        return { jobId, jobType: jobTypes[index] };
      } else {
        logger.warn('⚠️ Failed to queue optimization job, will retry later');
        return null;
      }
    }));

    logger.info('🎉 Upload completed successfully!');
    logger.info('📤 Final response', {
      success: true,
      mediaAssets: createdAssets.map((asset, index) => ({
        ...asset,
        cdnUrl: cdnUrls[index],
        processingStatus: jobResults[index] ? 'queued' : 'failed',
        jobId: jobResults[index]?.jobId || null
      }))
    });

    return NextResponse.json({
      success: true,
      mediaAssets: createdAssets.map((asset, index) => ({
        ...asset,
        cdnUrl: cdnUrls[index],
        processingStatus: jobResults[index] ? 'queued' : 'failed',
        jobId: jobResults[index]?.jobId || null
      }))
    });

  } catch (error: any) {
    logger.error('=== UPLOAD API ERROR ===', {
      error: error.message, 
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail
    });

    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
} 