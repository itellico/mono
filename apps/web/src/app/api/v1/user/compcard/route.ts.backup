/**
 * @openapi
 * /api/v1/user/compcard:
 *   get:
 *     tags:
 *       - User
 *       - Compcard
 *     summary: Get User's Compcard Data v1
 *     description: Retrieve the user's compcard with all media slots and metadata (v1 API)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Compcard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     portrait_media_id:
 *                       type: integer
 *                       nullable: true
 *                     full_body_media_id:
 *                       type: integer
 *                       nullable: true
 *                     half_body_media_id:
 *                       type: integer
 *                       nullable: true
 *                     commercial_media_id:
 *                       type: integer
 *                       nullable: true
 *                     nude_media_id:
 *                       type: integer
 *                       nullable: true
 *                     free_media_id:
 *                       type: integer
 *                       nullable: true
 *                     completion_status:
 *                       type: string
 *                       enum: [incomplete, complete]
 *                     account_hash:
 *                       type: string
 *                       nullable: true
 *                     media:
 *                       type: object
 *                       properties:
 *                         portrait:
 *                           type: object
 *                           nullable: true
 *                         fullBody:
 *                           type: object
 *                           nullable: true
 *                         halfBody:
 *                           type: object
 *                           nullable: true
 *                         commercial:
 *                           type: object
 *                           nullable: true
 *                         nude:
 *                           type: object
 *                           nullable: true
 *                         free:
 *                           type: object
 *                           nullable: true
 *                 timestamp:
 *                   type: string
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 *   put:
 *     tags:
 *       - User
 *       - Compcard
 *     summary: Update User's Compcard v1
 *     description: Create or update the user's compcard with media assignments (v1 API)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portrait_media_id:
 *                 type: integer
 *                 nullable: true
 *               full_body_media_id:
 *                 type: integer
 *                 nullable: true
 *               half_body_media_id:
 *                 type: integer
 *                 nullable: true
 *               commercial_media_id:
 *                 type: integer
 *                 nullable: true
 *               nude_media_id:
 *                 type: integer
 *                 nullable: true
 *               free_media_id:
 *                 type: integer
 *                 nullable: true
 *               completion_status:
 *                 type: string
 *                 enum: [incomplete, complete]
 *     responses:
 *       '200':
 *         description: Compcard updated successfully
 *       '400':
 *         description: Invalid request data
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { createApiLogger } from '@/lib/platform/logging';
import { createApiResponse } from '@/lib/api-utils';
import { getMediaCdnUrl } from '@/lib/media-utils';

// GET /api/v1/user/compcard - Load user's COMPCARD data
export async function GET(request: NextRequest) {
  const log = createApiLogger('GET /api/v1/user/compcard');

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    const userId = Number(session.user.id);
    log.debug('Fetching compcard data', { userId });

    // Find user's COMPCARD set using Prisma
    const compcardData = await prisma.compcardSet.findFirst({
      where: { userId: userId },
    });

    // Return empty COMPCARD if none exists
    if (!compcardData) {
      const emptyCompcard = {
        portrait_media_id: null,
        full_body_media_id: null,
        half_body_media_id: null,
        commercial_media_id: null,
        nude_media_id: null,
        free_media_id: null,
        completion_status: 'incomplete',
        account_hash: null,
        media: {
          portrait: null,
          fullBody: null,
          halfBody: null,
          commercial: null,
          nude: null,
          free: null
        }
      };

      log.info('No compcard found, returning empty structure', { userId });

      return createApiResponse(
        true,
        emptyCompcard,
        undefined,
        'Compcard data retrieved (empty)',
        200
      );
    }

    // Get user and account data separately
    let accountUuid = null;

    const userResult = await prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        accountId: true,
      },
    });

    if (userResult && userResult.accountId) {
      const accountResult = await prisma.account.findFirst({
        where: { id: userResult.accountId },
        select: { uuid: true },
      });

      accountUuid = accountResult?.uuid;
    }

    // Manually fetch ONLY ACTIVE media assets for this user using Prisma
    const activeMediaAssets = await prisma.mediaAsset.findMany({
      where: {
        userId: userId,
        deletionStatus: 'active',
      },
    });

    // Create a map of active media assets by ID
    const mediaMap = new Map();

    activeMediaAssets.forEach(asset => {
      // Add computed CDN URL to each asset
      const assetWithCdnUrl = {
        ...asset,
        cdnUrl: getMediaCdnUrl(asset, accountUuid)
      };
      mediaMap.set(asset.id, assetWithCdnUrl);
    });

    // Helper function to get active media or null
    const getActiveMedia = (mediaId: number | null) => {
      if (!mediaId) return null;
      return mediaMap.get(mediaId) || null;
    };

    // Get only active media for each slot
    const portraitMedia = getActiveMedia(compcardData.portraitMediaId);
    const fullBodyMedia = getActiveMedia(compcardData.fullBodyMediaId);
    const halfBodyMedia = getActiveMedia(compcardData.halfBodyMediaId);
    const commercialMedia = getActiveMedia(compcardData.commercialMediaId);
    const nudeMedia = getActiveMedia(compcardData.nudeMediaId);
    const freeMedia = getActiveMedia(compcardData.freeMediaId);

    log.info('Compcard data loaded successfully', { 
      userId,
      hasPortrait: !!portraitMedia,
      hasFullBody: !!fullBodyMedia,
      hasHalfBody: !!halfBodyMedia,
      hasCommercial: !!commercialMedia,
      hasNude: !!nudeMedia,
      hasFree: !!freeMedia
    });

    const compcardResponse = {
      portrait_media_id: portraitMedia ? compcardData.portraitMediaId : null,
      full_body_media_id: fullBodyMedia ? compcardData.fullBodyMediaId : null,
      half_body_media_id: halfBodyMedia ? compcardData.halfBodyMediaId : null,
      commercial_media_id: commercialMedia ? compcardData.commercialMediaId : null,
      nude_media_id: nudeMedia ? compcardData.nudeMediaId : null,
      free_media_id: freeMedia ? compcardData.freeMediaId : null,
      completion_status: compcardData.completionStatus,
      account_hash: accountUuid,
      media: {
        portrait: portraitMedia,
        fullBody: fullBodyMedia,
        halfBody: halfBodyMedia,
        commercial: commercialMedia,
        nude: nudeMedia,
        free: freeMedia
      }
    };

    return createApiResponse(
      true,
      compcardResponse,
      undefined,
      'Compcard data retrieved successfully',
      200
    );

  } catch (error) {
    log.error('Failed to load compcard data', { error: error.message });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
}

// PUT /api/v1/user/compcard - Save user's COMPCARD data
export async function PUT(request: NextRequest) {
  const log = createApiLogger('PUT /api/v1/user/compcard');

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    const userId = Number(session.user.id);
    const body = await request.json();

    log.debug('Updating compcard data', { 
      userId,
      fieldsPresent: Object.keys(body)
    });

    const {
      portrait_media_id,
      full_body_media_id,
      half_body_media_id,
      commercial_media_id,
      nude_media_id,
      free_media_id,
      completion_status
    } = body;

    // Check if COMPCARD set exists using Prisma
    const existingCompcard = await prisma.compcardSet.findFirst({
      where: { userId: userId },
    });

    if (existingCompcard) {
      // Update existing COMPCARD
      await prisma.compcardSet.update({
        where: { userId: userId },
        data: {
          portraitMediaId: portrait_media_id,
          fullBodyMediaId: full_body_media_id,
          halfBodyMediaId: half_body_media_id,
          commercialMediaId: commercial_media_id,
          nudeMediaId: nude_media_id,
          freeMediaId: free_media_id,
          completionStatus: completion_status || 'incomplete',
          updatedAt: new Date()
        },
      });

      log.info('Compcard updated successfully', { userId });
    } else {
      // Create new COMPCARD
      await prisma.compcardSet.create({
        data: {
          userId,
          portraitMediaId: portrait_media_id,
          fullBodyMediaId: full_body_media_id,
          halfBodyMediaId: half_body_media_id,
          commercialMediaId: commercial_media_id,
          nudeMediaId: nude_media_id,
          freeMediaId: free_media_id,
          completionStatus: completion_status || 'incomplete'
        },
      });

      log.info('Compcard created successfully', { userId });
    }

    return createApiResponse(
      true,
      { message: 'Compcard saved successfully' },
      undefined,
      'Compcard updated successfully',
      200
    );

  } catch (error) {
    log.error('Failed to save compcard data', { error: error.message });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 