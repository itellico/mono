/**
 * 🔄 Saved Search Override API
 * 
 * POST /api/v1/saved-searches/[id]/override
 * Create an override of an inherited search (system or tenant level)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { savedSearchesService } from '@/lib/services/saved-searches.service';

interface AuthUser {
  id: string;
  email: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Authentication required
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
        { status: 401 }
      );
    }

    const user = session.user as AuthUser;
    const userId = parseInt(user.id);
    const parentSearchId = parseInt(params.id);

    if (isNaN(parentSearchId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid search ID' 
        },
        { status: 400 }
      );
    }

    // Get user data for tenant isolation
    const userRecord = await db.user.findFirst({
      where: { id: userId },
      include: { account: true }
    });

    if (!userRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    const tenantId = userRecord.account.tenantId;

    // Parse request body for modifications
    const body = await request.json();
    const { modifications } = body;

    if (!modifications || typeof modifications !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Modifications object is required' 
        },
        { status: 400 }
      );
    }

    // Create the override using the service
    const result = await savedSearchesService.createSearchOverride(
      userId,
      tenantId,
      parentSearchId,
      modifications
    );

    logger.info('Search override created successfully', {
      userId,
      tenantId,
      parentSearchId,
      overrideId: result.id,
      name: result.name
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to create search override', {
      error: error instanceof Error ? error.message : 'Unknown error',
      parentSearchId: params.id
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}