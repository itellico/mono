import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getAllModuleTypes, getModuleCategories } from '@/lib/config/module-types';

/**
 * GET /api/v1/admin/modules/types
 * Fetch available module types
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[API:module-types] Fetching module types', { 
      userId: session.user.id
    });

    const moduleTypes = getAllModuleTypes();
    const categories = getModuleCategories();

    logger.info('[API:module-types] Module types retrieved successfully', { 
      count: moduleTypes.length,
      categories: categories.length
    });

    return NextResponse.json({
      success: true,
      data: {
        types: moduleTypes,
        categories
      }
    });

  } catch (error) {
    logger.error('[API:module-types] Failed to fetch module types', { error });
    return NextResponse.json(
      { error: 'Failed to fetch module types' },
      { status: 500 }
    );
  }
} 