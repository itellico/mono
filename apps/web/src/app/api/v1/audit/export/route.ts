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
    const format = url.searchParams.get('format') || 'csv';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10000'), 10000);
    const search = url.searchParams.get('search') || '';
    const resource = url.searchParams.get('resource') || '';
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

    // Get logs
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
      take: limit
    });

    if (format === 'json') {
      // Return JSON format
      const jsonLogs = logs.map(log => ({
        id: Number(log.id),
        tenantId: log.tenantId,
        userId: log.userId,
        userEmail: log.user?.account?.email || '',
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : '',
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString()
      }));

      return new NextResponse(JSON.stringify(jsonLogs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    } else {
      // Return CSV format
      const csvHeader = 'ID,Timestamp,User ID,User Email,User Name,Entity Type,Entity ID,Action,IP Address,User Agent\n';
      const csvRows = logs.map(log => {
        const userEmail = log.user?.account?.email || '';
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : '';
        
        return [
          Number(log.id),
          log.createdAt.toISOString(),
          log.userId || '',
          `"${userEmail.replace(/"/g, '""')}"`,
          `"${userName.replace(/"/g, '""')}"`,
          `"${log.entityType.replace(/"/g, '""')}"`,
          `"${log.entityId.replace(/"/g, '""')}"`,
          `"${log.action.replace(/"/g, '""')}"`,
          `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
          `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        ].join(',');
      }).join('\n');

      return new NextResponse(csvHeader + csvRows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

  } catch (error) {
    logger.error('Failed to export audit logs', {
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