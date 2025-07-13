import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { supportedLanguages } from '@/lib/schemas/translations';
import { eq, and, isNull, or } from 'drizzle-orm';

/**
 * PATCH - Update a supported language
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const body = await request.json();
    const { 
      tenantId = null,
      isLive,
      isActive,
      isDefault,
      translationPriority,
      autoTranslateEnabled,
      qualityThreshold,
      fallbackLanguageCode,
      metadata = {}
    } = body;

    logger.info('Updating supported language', { code, tenantId, userId: session.user.id });

    // Build update object with only provided fields
    const updateData: any = { updatedAt: new Date() };

    if (isLive !== undefined) updateData.isLive = isLive;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (translationPriority !== undefined) updateData.translationPriority = translationPriority;
    if (autoTranslateEnabled !== undefined) updateData.autoTranslateEnabled = autoTranslateEnabled;
    if (qualityThreshold !== undefined) updateData.qualityThreshold = qualityThreshold.toString();
    if (fallbackLanguageCode !== undefined) updateData.fallbackLanguageCode = fallbackLanguageCode;
    if (metadata) updateData.metadata = JSON.stringify(metadata);

    // Update the supported language
    const whereCondition = tenantId 
      ? and(eq(supportedLanguages.code, code), eq(supportedLanguages.tenantId, tenantId))
      : and(eq(supportedLanguages.code, code), isNull(supportedLanguages.tenantId));

    const [updated] = await db
      .update(supportedLanguages)
      .set(updateData)
      .where(whereCondition)
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Supported language not found' },
        { status: 404 }
      );
    }

    logger.info('Supported language updated', { code, tenantId, updated: !!updated });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating supported language', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to update supported language' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a supported language
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || null;

    logger.info('Removing supported language', { code, tenantId, userId: session.user.id });

    // Delete the supported language
    const whereCondition = tenantId 
      ? and(eq(supportedLanguages.code, code), eq(supportedLanguages.tenantId, tenantId))
      : and(eq(supportedLanguages.code, code), isNull(supportedLanguages.tenantId));

    const [deleted] = await db
      .delete(supportedLanguages)
      .where(whereCondition)
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Supported language not found' },
        { status: 404 }
      );
    }

    logger.info('Supported language removed', { code, tenantId, deleted: !!deleted });

    return NextResponse.json({
      success: true,
      data: { message: 'Supported language removed successfully' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error removing supported language', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to remove supported language' },
      { status: 500 }
    );
  }
} 