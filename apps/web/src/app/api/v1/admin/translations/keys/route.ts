import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    logger.info('Getting translation keys for navigation');

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') || undefined;
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : undefined;

    // Get translation keys
    const keys = await translationsService.getTranslationKeys(entityType, tenantId);

    logger.info('Translation keys retrieved successfully', { 
      keysCount: keys.length,
      entityType,
      tenantId 
    });

    return NextResponse.json({ data: keys });
  } catch (error) {
    logger.error('Error getting translation keys', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get translation keys' },
      { status: 500 }
    );
  }
} 