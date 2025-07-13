import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { TenantsService } from '@/lib/services/tenants.service';
import { logger } from '@/lib/logger';
import { invalidateTenantCache } from '@/lib/cache/tenant-cache';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  tenantIds: z.array(z.string().uuid()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userContext = extractUserContext(session);
    if (!userContext) {
      return NextResponse.json(
        { error: 'User context not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = bulkActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { action, tenantIds } = validationResult.data;

    // Check API access permissions based on the action
    let requiredPermission: string;
    switch (action) {
      case 'activate':
      case 'deactivate':
        requiredPermission = 'update:tenants';
        break;
      case 'delete':
        requiredPermission = 'delete:tenants';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        );
    }

    const hasAccess = canAccessAPI(userContext, `/api/v1/admin/tenants/bulk-actions`, 'POST', requiredPermission);
    if (!hasAccess.allowed) {
      logger.warn('Bulk action access denied', {
        userId: userContext.userId,
        action,
        reason: hasAccess.reason
      });
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          details: {
            currentRole: userContext.adminRole,
            requiredPermission: requiredPermission
          }
        },
        { status: 403 }
      );
    }

    const tenantsService = new TenantsService();
    let processedCount = 0;

    for (const tenantId of tenantIds) {
      try {
        switch (action) {
          case 'activate':
            await tenantsService.updateTenant(tenantId, { isActive: true });
            break;
          case 'deactivate':
            await tenantsService.updateTenant(tenantId, { isActive: false });
            break;
          case 'delete':
            await tenantsService.deleteTenant(tenantId);
            break;
        }
        processedCount++;
        // Invalidate cache for each processed tenant
        await invalidateTenantCache({
          tenantId: tenantId,
          entityId: tenantId,
          context: 'server',
        });
      } catch (tenantError) {
        logger.error(`Failed to perform ${action} on tenant ${tenantId}`, { error: tenantError });
        // Continue processing other tenants even if one fails
      }
    }

    logger.info('Bulk action completed', {
      userId: userContext.userId,
      action,
      processedCount,
      totalRequested: tenantIds.length
    });

    return NextResponse.json({
      success: true,
      message: `${processedCount} tenants ${action}d successfully.`,
      processedCount,
      totalRequested: tenantIds.length,
    });

  } catch (error) {
    logger.error('Bulk action API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
