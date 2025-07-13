import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { categoriesService } from '@/lib/services/categories-service';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/categories/stats', 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await categoriesService.getStats();

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to fetch category stats', { error });
    return NextResponse.json({ error: 'Failed to fetch category stats' }, { status: 500 });
  }
}