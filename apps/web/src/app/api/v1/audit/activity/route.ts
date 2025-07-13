import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit.service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, component, metadata } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from session - handle multiple possible locations
    let tenantId = null;
    if (session.user && typeof session.user === 'object') {
      const user = session.user as any;
      tenantId = user.tenant?.id || user.tenantId || user.currentTenantId;
    }

    // For development, use a default tenant if none found
    if (!tenantId) {
      if (process.env.NODE_ENV === 'development') {
        tenantId = 1; // Default tenant for development
        logger.warn('Using default tenant ID for development audit logging', {
          userId: session.user.id,
          action
        });
      } else {
        return NextResponse.json(
          { error: 'Missing tenant information' },
          { status: 400 }
        );
      }
    }

    // Log the user activity
    const auditService = new AuditService();
    await auditService.logUserActivity({
      tenantId,
      userId: parseInt(session.user.id),
      action,
      component,
      metadata: {
        ...metadata,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    logger.info('User activity logged via API', {
      tenantId,
      userId: session.user.id,
      action,
      component
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Failed to log user activity via API', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 