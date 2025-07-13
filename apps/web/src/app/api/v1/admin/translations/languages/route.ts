import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    logger.info('Getting supported languages');

    const languages = await translationsService.getSupportedLanguages();

    // Find default language
    const defaultLanguage = languages.find(lang => lang.isDefault) || null;

    logger.info('Supported languages retrieved', { count: languages.length });

    return NextResponse.json({
      success: true,
      data: {
        languages,
        defaultLanguage
      }
    });
  } catch (error) {
    logger.error('Error fetching supported languages', { error: error.message });
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch supported languages'
    }, { status: 500 });
  }
} 