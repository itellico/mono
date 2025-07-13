/**
 * ⬆️ Saved Search Promotion API
 * 
 * POST /api/v1/saved-searches/[id]/promote
 * Promote a user search to tenant level (admin function)
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
    const adminUserId = parseInt(user.id);
    const searchId = parseInt(params.id);

    if (isNaN(searchId)) {
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
      where: { id: adminUserId },
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

    // Parse request body for target scope
    const body = await request.json();
    const { scope } = body;

    if (!scope || (scope !== 'TENANT' && scope !== 'SYSTEM')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Valid scope (TENANT or SYSTEM) is required' 
        },
        { status: 400 }
      );
    }

    // TODO: Add permission check for promoting to SYSTEM scope
    // For now, only allow TENANT promotion
    if (scope === 'SYSTEM') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'System-level promotion requires super admin privileges' 
        },
        { status: 403 }
      );
    }

    // Promote the search using the service
    const result = await savedSearchesService.promoteSearchToTenant(
      searchId,
      adminUserId,
      tenantId
    );

    logger.info('Search promoted successfully', {
      searchId,
      adminUserId,
      tenantId,
      scope,
      name: result.name
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to promote search', {
      error: error instanceof Error ? error.message : 'Unknown error',
      searchId: params.id
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