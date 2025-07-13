/**
 * @fileoverview Permissions API Route - Enterprise Permission Management
 * 
 * This API route provides comprehensive permission management functionality:
 * - Permission listing with filtering and pagination
 * - Permission creation and management
 * - Three-level caching integration
 * - Proper validation and error handling
 * - Audit logging and security compliance
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache/cache-middleware';

// ============================================================================
// TYPES
// ============================================================================

interface PermissionWithCounts {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    roles: number;
  };
  roles: Array<{
    role: {
      id: number;
      name: string;
      description: string | null;
    };
  }>;
}

/**
 * GET /api/v1/admin/permissions
 * 
 * Fetch all permissions with counts and relationships
 * Includes three-level caching for optimal performance
 */
export async function GET() {
  try {
    // ✅ P0 SECURITY: Authentication and authorization using unified permission system
    const accessResult = await canAccessAPI({
      action: 'view',
      resource: 'permissions',
      metadata: {
        path: '/api/v1/admin/permissions',
        method: 'GET'
      }
    });

    if (!accessResult.allowed) {
      logger.warn('❌ Unauthorized permissions API access', {
        userId: accessResult.userId,
        reason: accessResult.reason,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: accessResult.userId ? 403 : 401 }
      );
    }

    // ✅ Three-level caching: Fetch permissions with cache middleware
    const cacheKey = 'platform:permissions:list:all';
    
    const permissions = await cache.get<PermissionWithCounts[]>(cacheKey, {
      ttl: 300, // 5 minutes
      tags: ['permissions', 'roles'],
      fallback: async () => {
        logger.info('📊 Fetching permissions from database', {
          userId: accessResult.userId,
          cacheKey,
          timestamp: new Date().toISOString()
        });

        return await db.permission.findMany({
          include: {
            _count: {
              select: {
                roles: true,
              }
            },
            roles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  }
                }
              }
            }
          },
          orderBy: [
            { name: 'asc' }
          ]
        });
      }
    });

    // ✅ AUDIT: Log successful access
    logger.info('✅ Permissions API accessed successfully', {
      userId: accessResult.userId,
      permissionCount: permissions?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: permissions,
      meta: {
        total: permissions?.length || 0,
        cached: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Permissions API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/permissions
 * 
 * Create a new permission
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ P0 SECURITY: Authentication and authorization using unified permission system
    const accessResult = await canAccessAPI({
      action: 'create',
      resource: 'permissions',
      metadata: {
        path: '/api/v1/admin/permissions',
        method: 'POST'
      }
    });

    if (!accessResult.allowed) {
      logger.warn('❌ Unauthorized permission creation attempt', {
        userId: accessResult.userId,
        reason: accessResult.reason,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: accessResult.userId ? 403 : 401 }
      );
    }

    // ✅ Parse and validate request body
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // ✅ Check if permission name already exists
    const existingPermission = await db.permission.findFirst({
      where: { name: name.trim() }
    });

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission name already exists' },
        { status: 409 }
      );
    }

    // ✅ Create permission
    const newPermission = await db.permission.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: {
            roles: true,
          }
        },
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          }
        }
      }
    });

    // ✅ Invalidate cache
    await cache.invalidateByTag('permissions');
    await cache.invalidateByTag('roles');

    // ✅ AUDIT: Log permission creation
    logger.info('✅ Permission created successfully', {
      userId: accessResult.userId,
      permissionId: newPermission.id,
      permissionName: name,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: newPermission,
      message: 'Permission created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('❌ Permission creation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create permission',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
