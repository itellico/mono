import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const adminRole = (session.user as any).adminRole;
    if (!adminRole || !['super_admin', 'tenant_admin'].includes(adminRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const key = searchParams.get('key');
    const languageCode = searchParams.get('languageCode');
    const tenantId = searchParams.get('tenantId');

    // Validate required parameters
    if (!entityType || !entityId || !key || !languageCode) {
      return NextResponse.json({ 
        error: 'Missing required parameters: entityType, entityId, key, languageCode' 
      }, { status: 400 });
    }

    logger.info('Looking up single translation', {
      entityType,
      entityId,
      key,
      languageCode,
      tenantId
    });

    const translation = await translationsService.getTranslation(
      entityType,
      entityId,
      languageCode,
      key,
      tenantId ? parseInt(tenantId) : undefined
    );

    if (translation) {
      logger.info('Translation found', { 
        id: translation.id,
        entityType,
        entityId,
        key,
        languageCode
      });

      return NextResponse.json({
        success: true,
        data: translation
      });
    } else {
      logger.warn('Translation not found', {
        entityType,
        entityId,
        key,
        languageCode,
        tenantId
      });

      return NextResponse.json({
        success: false,
        error: 'Translation not found'
      }, { status: 404 });
    }

  } catch (error) {
    logger.error('Error in translation lookup', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 