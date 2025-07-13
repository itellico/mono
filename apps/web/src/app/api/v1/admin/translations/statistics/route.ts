import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    logger.info('Getting translation statistics');

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : undefined;

    // Get statistics
    const statistics = await translationsService.getLanguageStatistics(tenantId);

    logger.info('Translation statistics retrieved successfully', { 
      languageCount: statistics.languages.length,
      totalKeys: statistics.totalKeys 
    });

    return NextResponse.json(statistics);
  } catch (error) {
    logger.error('Error getting translation statistics', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get translation statistics' },
      { status: 500 }
    );
  }
} 