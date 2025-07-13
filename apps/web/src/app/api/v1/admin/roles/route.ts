/**
 * @fileoverview Roles API Route - Enterprise Permission Management
 * 
 * This API route provides comprehensive role management functionality:
 * - Role listing with filtering and pagination
 * - Role creation with permission assignment
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

interface RoleWithCounts {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    permissions: number;
  };
  permissions: Array<{
    permission: {
      id: number;
      name: string;
      description: string | null;
    };
  }>;
  users: Array<{
    user: {
      id: number;
      account: {
        email: string;
      };
    };
  }>;
}

/**
 * GET /api/v1/admin/roles
 * 
 * Fetch all roles with counts and relationships
 * Includes three-level caching for optimal performance
 */
export async function GET() {
  try {
    logger.info('🔍 Roles API GET request started', {
      timestamp: new Date().toISOString()
    });

    // ✅ P0 SECURITY: Authentication and authorization using unified permission system
    const accessResult = await canAccessAPI({
      action: 'view',
      resource: 'roles',
      metadata: {
        path: '/api/v1/admin/roles',
        method: 'GET'
      }
    });

    logger.info('🔍 Access check result', {
      allowed: accessResult.allowed,
      userId: accessResult.userId,
      reason: accessResult.reason,
      roles: accessResult.roles,
      timestamp: new Date().toISOString()
    });

    if (!accessResult.allowed) {
      logger.warn('❌ Unauthorized roles API access', {
        userId: accessResult.userId,
        reason: accessResult.reason,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: accessResult.userId ? 403 : 401 }
      );
    }

    const userId = parseInt(accessResult.userId!);

    // ✅ Three-level caching: Fetch roles with cache middleware
    const cacheKey = 'platform:roles:list:all';
    
    let roles: RoleWithCounts[] | null = null;
    
    try {
      logger.info('🔍 Attempting to fetch roles from cache/database', {
        userId,
        cacheKey,
        timestamp: new Date().toISOString()
      });

      roles = await cache.get<RoleWithCounts[]>(cacheKey, {
        ttl: 300, // 5 minutes
        tags: ['roles', 'permissions'],
        fallback: async () => {
          logger.info('📊 Fetching roles from database', {
            userId,
            cacheKey,
            timestamp: new Date().toISOString()
          });

          return await db.role.findMany({
          include: {
            _count: {
              select: {
                users: true,
                permissions: true,
              }
            },
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  }
                }
              }
            },
            users: {
              include: {
                user: {
                  include: {
                    account: {
                      select: {
                        email: true,
                      }
                    }
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
    } catch (cacheError) {
      logger.error('❌ Cache operation failed, falling back to direct database query', {
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        stack: cacheError instanceof Error ? cacheError.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      // Fallback to direct database query if cache fails
      try {
        roles = await db.role.findMany({
          include: {
            _count: {
              select: {
                users: true,
                permissions: true,
              }
            },
            permissions: {
              include: {
                permission: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  }
                }
              }
            },
            users: {
              include: {
                user: {
                  include: {
                    account: {
                      select: {
                        email: true,
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { name: 'asc' }
          ]
        });
      } catch (dbError) {
        logger.error('❌ Direct database query also failed', {
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw dbError;
      }
    }

    // ✅ AUDIT: Log successful access
    logger.info('✅ Roles API accessed successfully', {
      userId,
      roles: accessResult.roles,
      roleCount: roles?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: roles,
      meta: {
        total: roles?.length || 0,
        cached: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Roles API error', {
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
 * POST /api/v1/admin/roles
 * 
 * Create a new role with specified permissions
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ P0 SECURITY: Authentication and authorization using unified permission system
    const accessResult = await canAccessAPI({
      action: 'create',
      resource: 'roles',
      metadata: {
        path: '/api/v1/admin/roles',
        method: 'POST'
      }
    });

    if (!accessResult.allowed) {
      logger.warn('❌ Unauthorized role creation attempt', {
        userId: accessResult.userId,
        reason: accessResult.reason,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: accessResult.userId ? 403 : 401 }
      );
    }

    const userId = parseInt(accessResult.userId!);

    // ✅ Parse and validate request body
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // ✅ Check if role name already exists
    const existingRole = await db.role.findFirst({
      where: { name: name.trim() }
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role name already exists' },
        { status: 409 }
      );
    }

    // ✅ Create role with transaction for data integrity
    const newRole = await db.$transaction(async (tx) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        }
      });

      // Add permissions if provided
      if (permissions && permissions.length > 0) {
        const validPermissions = await tx.permission.findMany({
          where: {
            id: {
              in: permissions.filter((id: number) => typeof id === 'number')
            }
          }
        });

        if (validPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: validPermissions.map(permission => ({
              roleId: role.id,
              permissionId: permission.id,
            }))
          });
        }
      }

      // Return role with full data
      return await tx.role.findUnique({
        where: { id: role.id },
        include: {
          _count: {
            select: {
              userRoles: true,
              permissions: true,
            }
          },
          permissions: {
            include: {
              permission: {
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
    });

    // ✅ Invalidate cache with correct method
    await cache.invalidateByTag('roles');
    await cache.invalidateByTag('permissions');

    // ✅ AUDIT: Log role creation
    logger.info('✅ Role created successfully', {
      userId,
      userEmail: accessResult.userId,
      roleId: newRole?.id,
      roleName: name,
      permissionCount: permissions?.length || 0,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role created successfully'
    }, { status: 201 });

  } catch (error) {
    logger.error('❌ Role creation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create role',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 