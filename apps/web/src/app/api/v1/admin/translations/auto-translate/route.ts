import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { text, fromLanguage, toLanguage, context } = body;

    if (!text || !fromLanguage || !toLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text, fromLanguage, toLanguage' },
        { status: 400 }
      );
    }

    const translatedText = await translationsService.autoTranslate(
      text,
      fromLanguage,
      toLanguage,
      context
    );

    return NextResponse.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        fromLanguage,
        toLanguage,
        context
      }
    });
  } catch (error) {
    logger.error('Error auto-translating text', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 