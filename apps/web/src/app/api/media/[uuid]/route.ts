/**
 * @openapi
 * /api/media/{uuid}:
 *   delete:
 *     tags:
 *       - Media
 *     summary: Media Asset Operations
 *     description: Media Asset Operations - Secure UUID-based access
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Media asset not found
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';

// ✅ TEMPORARY: Disabled for authentication testing
// TODO: Fix schema references and re-enable after login works
 
export async function DELETE(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ uuid: string }> }
) {
  return NextResponse.json(
    { error: 'Media operations temporarily disabled during UUID migration' },
    { status: 503 }
  );
}

/* ORIGINAL CODE - TO BE FIXED LATER
import { auth } from '@/lib/auth';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/schema';
import { eq, and, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const client = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'mono',
  username: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'developer',
  ssl: false
});
const db = drizzle(client, { schema });

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const mediaUuid = resolvedParams.uuid;
    if (!mediaUuid) {
      return NextResponse.json({ error: 'Invalid media UUID' }, { status: 400 });
    }

    // Get the media asset with user verification (now using UUID)
    const mediaAsset = await db.query.mediaAssets.findFirst({
      where: and(
        eq(schema.mediaAssets.uuid, mediaUuid), // ✅ Now using UUID lookup
        eq(schema.mediaAssets.userId, parseInt(session.user.id)),
        // Allow deleting active or pending_deletion assets
        or(
          eq(schema.mediaAssets.deletionStatus, 'active'),
          eq(schema.mediaAssets.deletionStatus, 'pending_deletion')
        )
      ),
      with: {
        owner: {
          with: {
            account: true
          }
        }
      }
    });

    if (!mediaAsset) {
      return NextResponse.json({ error: 'Media asset not found or access denied' }, { status: 404 });
    }

    // Soft delete: Mark as deleted instead of actually deleting
    await db.update(schema.mediaAssets)
      .set({
        deletionStatus: 'deleted',
        deletionRequestedAt: new Date(),
        deletionRequestedBy: parseInt(session.user.id),
        updatedAt: new Date()
      })
      .where(eq(schema.mediaAssets.uuid, mediaUuid)); // ✅ Now using UUID

    // Remove from comp card references (set to null) - using the ID from found asset
    const mediaId = mediaAsset.id;
    
    await db.update(schema.compcardSets)
      .set({
        portraitMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.portraitMediaId, mediaId));

    await db.update(schema.compcardSets)
      .set({
        fullBodyMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.fullBodyMediaId, mediaId));

    await db.update(schema.compcardSets)
      .set({
        halfBodyMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.halfBodyMediaId, mediaId));

    await db.update(schema.compcardSets)
      .set({
        commercialMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.commercialMediaId, mediaId));

    await db.update(schema.compcardSets)
      .set({
        nudeMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.nudeMediaId, mediaId));

    await db.update(schema.compcardSets)
      .set({
        freeMediaId: null,
        updatedAt: new Date()
      })
      .where(eq(schema.compcardSets.freeMediaId, mediaId));

    logger.info(`Media asset ${mediaUuid} marked as deleted (soft delete)`, {
      userId: session.user.id,
      fileName: mediaAsset.fileName,
      deletionStatus: 'deleted'
    });

    return NextResponse.json({
      success: true,
      message: 'Media asset deleted successfully',
      deletionType: 'soft'
    });

  } catch (error) {
    logger.error('Media deletion failed', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 }
    );
  }
}
*/ 