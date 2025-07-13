import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { requireAdminAccess } from '@/lib/admin-access-control';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    const adminInfo = await requireAdminAccess(session, ['super_admin']);
    if (!adminInfo) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search') || '';
    const userTypes = searchParams.get('userTypes')?.split(',').filter(Boolean) || [];
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
    const tenantIds = searchParams.get('tenantIds')?.split(',').filter(Boolean) || [];

    const offset = (page - 1) * limit;

    // ✅ BUILD FILTERS: Cross-tenant user query
    const where: Prisma.UserWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // User type filter
    if (userTypes.length > 0) {
      where.userType = { in: userTypes };
    }

    // Status filter
    if (statuses.length > 0) {
      const activeStatuses = statuses.map(status => {
        switch (status) {
          case 'active': return true;
          case 'inactive': return false;
          default: return undefined;
        }
      }).filter(s => s !== undefined);
      
      if (activeStatuses.length > 0) {
        where.isActive = { in: activeStatuses };
      }
    }

    // Tenant filter
    if (tenantIds.length > 0) {
      const tenantIdNumbers = tenantIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (tenantIdNumbers.length > 0) {
        where.tenantId = { in: tenantIdNumbers };
      }
    }

    // ✅ FETCH USERS: Cross-tenant aggregation with tenant info
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          account: {
            select: {
              email: true,
              isVerified: true
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
          _count: {
            select: {
              sessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // ✅ GET TENANT SUMMARIES: Aggregate stats by tenant
    const tenantSummaries = await prisma.user.groupBy({
      by: ['tenantId'],
      where: statuses.length > 0 ? { isActive: { in: statuses.includes('active') ? [true] : [false] } } : {},
      _count: {
        id: true
      },
      _max: {
        createdAt: true
      }
    });

    // ✅ GET TENANT DETAILS
    const tenantDetails = await prisma.tenant.findMany({
      where: {
        id: { in: tenantSummaries.map(t => t.tenantId) }
      },
      select: {
        id: true,
        name: true,
        domain: true
      }
    });

    // ✅ TRANSFORM DATA: Format platform users with cross-tenant context
    const platformUsers = users.map(user => ({
      id: user.id.toString(),
      uuid: user.uuid,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.account?.email || '',
      isActive: user.isActive,
      isVerified: user.account?.isVerified || false,
      userType: user.userType || 'individual',
      tenantId: user.tenantId,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain
      } : null,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      stats: {
        sessionCount: user._count.sessions,
        lastActivityAt: user.lastLoginAt?.toISOString() || null
      }
    }));

    // ✅ AGGREGATE STATS: Platform-wide statistics
    const platformStats = {
      totalUsers: totalCount,
      activeUsers: await prisma.user.count({ where: { isActive: true } }),
      verifiedUsers: await prisma.user.count({ 
        where: { account: { isVerified: true } } 
      }),
      totalTenants: await prisma.tenant.count(),
      newUsersThisMonth: await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    };

    // ✅ TENANT SUMMARY MAP
    const tenantSummaryMap = tenantSummaries.reduce((acc, summary) => {
      const tenant = tenantDetails.find(t => t.id === summary.tenantId);
      if (tenant) {
        acc[summary.tenantId] = {
          ...tenant,
          userCount: summary._count.id,
          lastActivity: summary._max.createdAt?.toISOString() || null
        };
      }
      return acc;
    }, {} as Record<number, any>);

    const totalPages = Math.ceil(totalCount / limit);

    logger.info('✅ Platform users fetched successfully', {
      userId: adminInfo.userId,
      totalUsers: totalCount,
      page,
      limit,
      filters: { search, userTypes, statuses, tenantIds }
    });

    return NextResponse.json({
      users: platformUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages,
        hasMore: page < totalPages
      },
      stats: platformStats,
      tenantSummaries: tenantSummaryMap
    });

  } catch (error) {
    logger.error('❌ Failed to fetch platform users', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to fetch platform users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    // ✅ SECURITY: Super admin only for platform-wide user management
    const adminInfo = await requireAdminAccess(session, ['super_admin']);
    if (!adminInfo) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userIds, action, data } = body;

    if (!userIds || !Array.isArray(userIds) || !action) {
      return NextResponse.json(
        { error: 'Invalid request body - userIds array and action required' },
        { status: 400 }
      );
    }

    const userIdNumbers = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    let updateData: Prisma.UserUpdateInput = {};
    let actionDescription = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        actionDescription = 'activated';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        actionDescription = 'deactivated';
        break;
      case 'verify':
        // This would update account verification, but we need to handle it properly
        return NextResponse.json(
          { error: 'Email verification must be handled through auth system' },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: activate, deactivate' },
          { status: 400 }
        );
    }

    // ✅ BULK UPDATE: Platform-wide user updates
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIdNumbers }
      },
      data: updateData
    });

    logger.info(`✅ Platform users bulk ${actionDescription}`, {
      adminUserId: adminInfo.userId,
      affectedUsers: result.count,
      userIds: userIdNumbers,
      action
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${actionDescription} ${result.count} users`,
      affectedCount: result.count
    });

  } catch (error) {
    logger.error('❌ Failed to bulk update platform users', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Failed to update platform users' },
      { status: 500 }
    );
  }
}