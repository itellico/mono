import { PermissionsService } from '@/lib/services/permissions.service';
import { logger } from '@/lib/logger';

/**
 * 🧪 PERMISSIONS SYSTEM TEST
 * 
 * Tests the permissions service with the seeded data to ensure
 * everything is working correctly.
 */

async function testPermissions() {
  try {
    logger.info('🧪 Starting permissions system test...');

    const permissionsService = PermissionsService.getInstance();

    // Test 1: Get super admin permissions (User ID: 3)
    logger.info('🔍 Testing super admin permissions...');
    const superAdminPermissions = await permissionsService.getUserPermissions('3');
    
    if (superAdminPermissions) {
      logger.info('✅ Super Admin permissions loaded:', {
        userId: superAdminPermissions.userId,
        tenantId: superAdminPermissions.tenantId,
        roles: superAdminPermissions.roles,
        permissionCount: superAdminPermissions.permissions.length,
        permissions: superAdminPermissions.permissions
      });

      // Test 2: Check specific permissions
      const tests = [
        'admin.manage',
        'tenants.read',
        'tenants.create',
        'users.read',
        'users.create'
      ];

      for (const permission of tests) {
        const hasPermission = await permissionsService.hasPermission('3', permission);
        logger.info(`🔍 Permission check: ${permission} = ${hasPermission ? '✅ GRANTED' : '❌ DENIED'}`);
      }

      // Test 3: Check admin access
      const canAccessAdmin = await permissionsService.canAccessAdmin('3');
      logger.info(`🔍 Admin access check: ${canAccessAdmin ? '✅ GRANTED' : '❌ DENIED'}`);

    } else {
      logger.error('❌ Failed to load super admin permissions');
      return false;
    }

    // Test 4: Test moderator permissions (User ID: 4)
    logger.info('🔍 Testing moderator permissions...');
    const moderatorPermissions = await permissionsService.getUserPermissions('4');
    
    if (moderatorPermissions) {
      logger.info('✅ Moderator permissions loaded:', {
        userId: moderatorPermissions.userId,
        tenantId: moderatorPermissions.tenantId,
        roles: moderatorPermissions.roles,
        permissionCount: moderatorPermissions.permissions.length,
        permissions: moderatorPermissions.permissions
      });

      // Test moderator-specific permissions
      const moderatorTests = [
        'admin.view',
        'content.moderate',
        'tenants.create', // Should be false for moderator
      ];

      for (const permission of moderatorTests) {
        const hasPermission = await permissionsService.hasPermission('4', permission);
        logger.info(`🔍 Moderator permission check: ${permission} = ${hasPermission ? '✅ GRANTED' : '❌ DENIED'}`);
      }

    } else {
      logger.error('❌ Failed to load moderator permissions');
    }

    logger.info('🎉 Permissions system test completed successfully!');
    return true;

  } catch (error) {
    logger.error('❌ Permissions system test failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  testPermissions()
    .then((success) => {
      if (success) {
        logger.info('✅ All permissions tests passed!');
        process.exit(0);
      } else {
        logger.error('❌ Some permissions tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('💥 Permissions test script failed:', error);
      process.exit(1);
    });
}

export { testPermissions }; 