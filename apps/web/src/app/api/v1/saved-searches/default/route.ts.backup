import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/saved-searches/default
 * 
 * Get the default saved search for a specific entity type
 * Returns the user's default search or the first public default if none exists
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    if (!entityType) {
      return NextResponse.json(
        { success: false, error: 'Entity type is required' },
        { status: 400 }
      );
    }

    // First, try to find user's own default
    let defaultSearch = await db.savedSearch.findFirst({
      where: {
        userId,
        entityType,
        isDefault: true,
        isActive: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // If no personal default, look for a public default
    if (!defaultSearch) {
      defaultSearch = await db.savedSearch.findFirst({
        where: {
          entityType,
          isDefault: true,
          isPublic: true,
          isActive: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    }

    if (!defaultSearch) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No default saved search found'
      });
    }

    logger.info('Default saved search retrieved', {
      userId,
      entityType,
      searchId: defaultSearch.id,
      searchName: defaultSearch.name
    });

    return NextResponse.json({
      success: true,
      data: {
        id: defaultSearch.id,
        name: defaultSearch.name,
        entityType: defaultSearch.entityType,
        filterCriteria: defaultSearch.filterCriteria,
        sortConfig: defaultSearch.sortConfig,
        columnConfig: defaultSearch.columnConfig,
        searchValue: defaultSearch.searchValue,
        paginationLimit: defaultSearch.paginationLimit,
        isDefault: defaultSearch.isDefault,
        isPublic: defaultSearch.isPublic
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve default saved search', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}