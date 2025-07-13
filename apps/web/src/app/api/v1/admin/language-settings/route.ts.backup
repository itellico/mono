import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { supportedLanguages } from '@/lib/schemas/translations';
import { eq, and, isNull } from 'drizzle-orm';
import { getRedisClient } from '@/lib/redis';

/**
 * @swagger
 * /api/v1/admin/language-settings:
 *   get:
 *     summary: Get current language settings
 *     description: Retrieve base, source, and fallback language configuration
 *     tags: [Admin, Language Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Language settings retrieved successfully
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminRole = (session.user as any)?.adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all languages to find base, source, and fallback
    const allLanguages = await db
      .select()
      .from(supportedLanguages)
      .where(isNull(supportedLanguages.tenantId)); // Global settings only

    // Find base language (default)
    const baseLanguage = allLanguages.find(lang => lang.isDefault);

    const settings = {
      baseLanguageCode: baseLanguage?.code || 'en-US',
      sourceLanguageCode: baseLanguage?.code || 'en-US', // For now, same as base
      fallbackLanguageCode: baseLanguage?.fallbackLanguageCode || 'en-US',
      autoTranslateEnabled: baseLanguage?.autoTranslateEnabled || false
    };

    logger.info('Language settings retrieved', { 
      settings,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error retrieving language settings', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve language settings' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/admin/language-settings:
 *   put:
 *     summary: Update language settings
 *     description: Update base, source, and fallback language configuration
 *     tags: [Admin, Language Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               baseLanguageCode:
 *                 type: string
 *                 description: The system base language
 *               sourceLanguageCode:
 *                 type: string  
 *                 description: The translation source language
 *               fallbackLanguageCode:
 *                 type: string
 *                 description: The fallback language
 *               autoTranslateEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Language settings updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminRole = (session.user as any)?.adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { baseLanguageCode, sourceLanguageCode, fallbackLanguageCode, autoTranslateEnabled } = body;

    if (!baseLanguageCode) {
      return NextResponse.json(
        { success: false, error: 'Base language code is required' },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      // First, unset any existing default
      await tx
        .update(supportedLanguages)
        .set({ 
          isDefault: false, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(supportedLanguages.isDefault, true),
          isNull(supportedLanguages.tenantId)
        ));

      // Set new base language as default
      await tx
        .update(supportedLanguages)
        .set({ 
          isDefault: true,
          fallbackLanguageCode: fallbackLanguageCode || 'en-US',
          autoTranslateEnabled: autoTranslateEnabled || false,
          updatedAt: new Date()
        })
        .where(and(
          eq(supportedLanguages.code, baseLanguageCode),
          isNull(supportedLanguages.tenantId)
        ));
    });

    // Invalidate Redis caches
    try {
      const redis = await getRedisClient();
      await redis.del('cache:global:translations:languages');
      await redis.del('cache:global:settings:languages');
    } catch (cacheError) {
      const errorMessage = cacheError instanceof Error ? cacheError.message : 'Unknown cache error';
      logger.warn('Failed to clear language settings cache', { error: errorMessage });
    }

    logger.info('Language settings updated', { 
      baseLanguageCode,
      sourceLanguageCode,
      fallbackLanguageCode,
      autoTranslateEnabled,
      userId: session.user.id 
    });

    return NextResponse.json({
      success: true,
      message: 'Language settings updated successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error updating language settings', { error: errorMessage });

    return NextResponse.json(
      { success: false, error: 'Failed to update language settings' },
      { status: 500 }
    );
  }
} 