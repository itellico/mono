/**
 * 💾 Saved Searches API Routes
 * 
 * Endpoints for managing user saved searches:
 * - GET: List user's saved searches for an entity type
 * - POST: Create a new saved search
 * 
 * ✅ mono BEST PRACTICES:
 * - Uses existing permission system via session validation
 * - Proper audit logging via logger service
 * - Three-layer caching with cache middleware
 * - P0 tenant isolation and security
 * - Account-level sharing vs tenant-level isolation
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

interface SavedSearchData {
  id: number;
  uuid: string;
  userId: number;
  tenantId: number;
  name: string;
  description: string | null;
  entityType: string;
  filters: any;
  sortBy: string | null;
  sortOrder: string | null;
  columnConfig: any;
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByName?: string | null;
  isFromSameAccount?: boolean;
  isFromSameTenant?: boolean;
}

/**
 * ✅ GET /api/v1/saved-searches
 * Get saved searches with proper permission and caching
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ P0 SECURITY: Authentication required
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized saved searches request');
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

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const includePublic = searchParams.get('includePublic') === 'true';
    const includeInherited = searchParams.get('includeInherited') !== 'false'; // Default true
    const scope = searchParams.get('scope') as 'all' | 'system' | 'tenant' | 'user' || 'all';

    if (!entityType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'entityType parameter is required' 
        },
        { status: 400 }
      );
    }

    // ✅ GET USER DATA: Include account for tenant isolation
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
    const accountId = userRecord.account.id;

    // ✅ USE ENHANCED SERVICE: Get available searches with inheritance
    const result = await savedSearchesService.getAvailableSavedSearches(
      userId,
      tenantId,
      entityType,
      {
        entityType,
        includePublic,
        includeInherited,
        scope
      }
    );

    logger.info('Saved searches retrieved successfully', {
      userId,
      tenantId,
      accountId,
      entityType,
      count: result.searches.length,
      includePublic
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to get saved searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * ✅ POST /api/v1/saved-searches
 * Create saved search with full mono platform integration
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ P0 SECURITY: Authentication required
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized saved search creation request');
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

    // ✅ GET USER DATA: Include account for tenant isolation
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
    const accountId = userRecord.account.id;

    // ✅ PARSE REQUEST: Include all fields including the new ones
    const body = await request.json();
    const { 
      name, 
      description, 
      entityType, 
      scope: requestedScope,
      parentSearchId,
      canOverride,
      isTemplate,
      filters, 
      sortBy, 
      sortOrder, 
      columnConfig,
      searchValue,
      paginationLimit,
      isDefault, 
      isPublic 
    } = body;

    // ✅ VALIDATION: Comprehensive input validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Search name is required' 
        },
        { status: 400 }
      );
    }

    if (!entityType || entityType.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Entity type is required' 
        },
        { status: 400 }
      );
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Filters are required and must be an object' 
        },
        { status: 400 }
      );
    }

    // ✅ USE ENHANCED SERVICE: Create saved search with inheritance support
    const result = await savedSearchesService.createSavedSearch(
      userId,
      tenantId,
      {
        name,
        description,
        entityType,
        scope: requestedScope || 'user',
        parentSearchId,
        canOverride,
        isTemplate,
        filters,
        sortBy,
        sortOrder,
        columnConfig,
        searchValue,
        paginationLimit,
        isDefault,
        isPublic
      }
    );

    // ✅ AUDIT LOGGING: Log creation event
    logger.info('Saved search created', {
      userId,
      tenantId,
      accountId,
      searchId: result.id,
      name: result.name,
      entityType,
      isDefault: result.isDefault,
      isPublic: result.isPublic,
      hasSearchValue: !!result.searchValue,
      hasColumnConfig: !!result.columnConfig,
      filterCount: Object.keys(result.filters).length,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Cache invalidation is handled by the service

    logger.info('Saved search created successfully', {
      userId,
      tenantId,
      accountId,
      searchId: result.id,
      name: result.name,
      entityType,
      isDefault: result.isDefault,
      isPublic: result.isPublic
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to create saved search', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 