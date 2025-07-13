/**
 * @fileoverview Enhanced Permission Management System - Main Page
 * 
 * This is the flagship permission management interface for itellico Mono.
 * Features 4-tab navigation: Overview, Roles, Permissions, Matrix
 * Includes emergency access, templates, health checks, and resource scoping.
 * 
 * @author itellico Mono Team
 * @version 1.0.0
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { AdminPermissionsService } from '@/lib/services/admin-permissions.service';
import { PermissionManagementContainer } from '@/components/admin/permissions/PermissionManagementContainer';

export const metadata: Metadata = {
  title: 'Permission Management | itellico Mono',
  description: 'Comprehensive role and permission management with emergency access controls'
};

/**
 * Permission Management Page - Enhanced Enterprise Edition
 * 
 * This page provides a comprehensive permission management interface with:
 * - 4-tab navigation (Overview, Roles, Permissions, Matrix)
 * - Emergency access controls for Super Admin
 * - Permission templates and health monitoring
 * - Resource-scoped permissions and audit trails
 * 
 * Security: Super Admin access only with comprehensive audit logging
 */
export default async function PermissionManagementPage() {
  try {
    // ✅ P0 SECURITY: Authentication and Authorization
    const session = await auth();
    
    if (!session?.user?.id) {
      logger.warn('🔒 Unauthenticated access attempt to permission management', {
        timestamp: new Date().toISOString(),
        path: '/admin/permissions'
      });
      redirect('/auth/signin?callbackUrl=/admin/permissions');
    }

    // Type assertion for session user with extended properties
    const user = session.user as { 
      id: string; 
      email?: string; 
      name?: string;
      tenantId?: string;
      accountId?: string;
    };

    const userId = user.id;
    const userEmail = user.email || 'Unknown';
    const tenantId = user.tenantId ? Number(user.tenantId) : null;

    logger.info('🔍 Permission management page access attempt', {
      userId,
      userEmail,
      tenantId,
      timestamp: new Date().toISOString()
    });

    // ✅ PROPER ARCHITECTURE: Use NestJS API with centralized authentication
    // This respects the permission system and avoids direct database access
    const userPermissionAccess = await AdminPermissionsService.getUserPermissionAccess();

    if (!userPermissionAccess) {
      logger.error('❌ Failed to get user permission access from API', {
        userId,
        userEmail,
        timestamp: new Date().toISOString()
      });
      redirect('/admin?error=permission_check_failed');
    }

    if (!userPermissionAccess.accessGranted) {
      logger.warn('❌ Insufficient permissions for permission management', {
        userId,
        userEmail,
        isSuperAdmin: userPermissionAccess.isSuperAdmin,
        hasAdminAccess: userPermissionAccess.hasAdminAccess,
        roles: userPermissionAccess.roles.map(r => r.name),
        permissions: userPermissionAccess.permissions.map(p => p.name),
        timestamp: new Date().toISOString()
      });
      redirect('/admin?error=insufficient_permissions');
    }

    // ✅ SUCCESS: User has proper access
    logger.info('✅ Permission management access granted', {
      userId,
      userEmail,
      isSuperAdmin: userPermissionAccess.isSuperAdmin,
      hasAdminAccess: userPermissionAccess.hasAdminAccess,
      roleCount: userPermissionAccess.roles.length,
      permissionCount: userPermissionAccess.permissions.length,
      timestamp: new Date().toISOString()
    });

    // Render the permission management interface
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
            <p className="text-muted-foreground">
              Comprehensive role and permission management with emergency access controls
            </p>
          </div>

          {/* Permission Management Container */}
          <PermissionManagementContainer
            userId={parseInt(userId)}
            userEmail={userEmail}
            tenantId={tenantId}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>
    );

  } catch (error) {
    // ✅ P0 SECURITY: Comprehensive error handling and logging
    logger.error('❌ Critical error in permission management page', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Redirect to admin dashboard with error indicator
    redirect('/admin?error=permission_system_error');
  }
}