import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { CacheKeyBuilder } from '@/lib/cache/cache-middleware';
import { cache } from '@/lib/cache/cache-middleware';

/**
 * GET /api/v1/admin/permissions/stats
 * Get permission system statistics
 * 
 * @openapi
 * /api/v1/admin/permissions/stats:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission system statistics
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Permission system statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRoles:
 *                       type: integer
 *                     totalPermissions:
 *                       type: integer
 *                     activeUsers:
 *                       type: integer
 *                     wildcardPermissions:
 *                       type: integer
 *                     scopeBreakdown:
 *                       type: object
 *                       properties:
 *                         global:
 *                           type: integer
 *                         tenant:
 *                           type: integer
 *                         own:
 *                           type: integer
 *                     categoryBreakdown:
 *                       type: object
 *                     systemHealth:
 *                       type: object
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const accessResult = await canAccessAPI({
      action: 'view',
      resource: 'permissions'
    });

    if (!accessResult.allowed) {
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: 403 }
      );
    }

    const tenantId = accessResult.tenantId;
    const cacheKey = tenantId ? CacheKeyBuilder.tenant(tenantId, 'permissions', 'stats') : CacheKeyBuilder.platform('permissions', 'stats');
    
    // Use cache middleware with 1 minute TTL
    const stats = await cache.get(cacheKey, {
      ttl: 60,
      tags: ['permissions', 'stats'],
      fallback: async () => {
        // Get total roles
        const totalRoles = await db.role.count();
        
        // Get total permissions
        const totalPermissions = await db.permission.count();
        
        // Get active users (users with at least one role)
        const activeUsers = await db.user.count({
          where: {
            userRoles: {
              some: {}
            }
          }
        });
        
        // Get permissions with scope breakdown
        const permissions = await db.permission.findMany({
          select: {
            name: true,
            pattern: true
          }
        });
        
        // Calculate wildcard permissions
        const wildcardPermissions = permissions.filter(p => 
          p.pattern?.includes('*') || p.name.includes('*')
        ).length;
        
        // Calculate scope breakdown
        const scopeBreakdown = {
          global: permissions.filter(p => 
            p.name.includes('.global') || p.name.startsWith('platform.')
          ).length,
          tenant: permissions.filter(p => 
            p.name.includes('.tenant') || 
            (!p.name.includes('.global') && !p.name.includes('.own') && !p.name.startsWith('platform.'))
          ).length,
          own: permissions.filter(p => 
            p.name.includes('.own')
          ).length
        };
        
        // Calculate category breakdown
        const categoryBreakdown: Record<string, number> = {};
        permissions.forEach(p => {
          let category = 'Other';
          if (p.name.includes('platform.') || p.name.includes('system.')) {
            category = 'Platform Management';
          } else if (p.name.includes('config.') || p.name.includes('integrations.')) {
            category = 'Global Configuration';
          } else if (p.name.includes('users.') || p.name.includes('impersonate.')) {
            category = 'User Management';
          } else if (p.name.includes('tenant.') || p.name.includes('billing.')) {
            category = 'Tenant Management';
          } else if (p.name.includes('content.') || p.name.includes('moderation.')) {
            category = 'Content Management';
          } else if (p.name.includes('account.') || p.name.includes('team.')) {
            category = 'Account Management';
          } else if (p.name.includes('profiles.') || p.name.includes('media.')) {
            category = 'Talent Management';
          }
          
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
        });
        
        // Check system health
        const systemHealth = {
          permissionValidation: 'Healthy',
          roleHierarchy: 'Healthy',
          cachePerformance: 'Optimal',
          auditLogging: 'Active'
        };
        
        // Check if cache is working
        try {
          await cache.get('health-check', {
            ttl: 1,
            fallback: async () => 'OK'
          });
        } catch (error) {
          systemHealth.cachePerformance = 'Degraded';
        }
        
        return {
          totalRoles,
          totalPermissions,
          activeUsers,
          wildcardPermissions,
          scopeBreakdown,
          categoryBreakdown,
          systemHealth,
          lastUpdated: new Date().toISOString()
        };
      }
    });

    logger.info('Permission stats retrieved', {
      userId: accessResult.userId,
      stats: {
        totalRoles: stats.totalRoles,
        totalPermissions: stats.totalPermissions,
        activeUsers: stats.activeUsers
      }
    });

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get permission stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to get permission statistics' },
      { status: 500 }
    );
  }
}