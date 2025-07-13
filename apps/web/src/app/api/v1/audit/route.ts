import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
    const search = url.searchParams.get('search') || '';
    const resource = url.searchParams.get('resource') || ''; // Maps to entityType
    const action = url.searchParams.get('action') || '';
    const filterUserId = url.searchParams.get('userId') || '';
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const tenantId = parseInt(url.searchParams.get('tenantId') || '1');

    // Build where conditions
    const where: any = {
      tenantId: tenantId
    };

    if (resource) {
      where.entityType = resource;
    }

    if (action) {
      where.action = action;
    }

    if (filterUserId) {
      where.userId = parseInt(filterUserId);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get paginated results
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            account: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform logs to match the expected format
    const transformedLogs = logs.map(log => ({
      id: Number(log.id), // Convert BigInt to number
      tenantId: log.tenantId,
      userId: log.userId,
      resource: log.entityType, // Map to resource
      resourceId: log.entityId,
      action: log.action,
      level: 'info', // Default level since it's not in our schema
      message: `${log.action} ${log.entityType}${log.entityId ? ` ${log.entityId}` : ''}`,
      metadata: log.metadata || {},
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.createdAt.toISOString(),
      user: log.user ? {
        id: log.user.id,
        email: log.user.account?.email || '',
        firstName: log.user.firstName,
        lastName: log.user.lastName
      } : null
    }));

    logger.info('Audit logs fetched', {
      userId: session.user.id,
      page,
      limit,
      total,
      resultCount: transformedLogs.length
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: transformedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalLogs: total,
          uniqueUsers: 0, // Would need a separate query
          actionBreakdown: {},
          levelBreakdown: { info: total } // All are info level for now
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}