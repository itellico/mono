import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/v1/saved-searches/check-name
 * 
 * Check if a saved search name already exists for the user
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
    const name = searchParams.get('name');
    const entityType = searchParams.get('entityType');

    if (!name || !entityType) {
      return NextResponse.json(
        { success: false, error: 'Name and entity type are required' },
        { status: 400 }
      );
    }

    const existing = await db.savedSearch.findFirst({
      where: {
        name,
        entityType,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      exists: !!existing,
      data: existing ? {
        id: existing.id,
        name: existing.name,
        isDefault: existing.isDefault
      } : null
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}