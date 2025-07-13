#!/usr/bin/env node

/**
 * 🔍 VERIFY COMPREHENSIVE SETUP
 * 
 * Tests that all seeded data is correctly configured
 */

import { db } from '../src/lib/db';
import { logger } from '../src/lib/logger';

async function verifySetup() {
  try {
    logger.info('🔍 VERIFYING COMPREHENSIVE SETUP...\n');

    // Test 1: Check Super Admin permissions
    logger.info('📋 TEST 1: Super Admin Permissions');
    const superAdmin = await db.user.findFirst({
      where: {
        account: {
          email: '1@1.com'
        }
      },
      include: {
        account: {
          select: { email: true }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!superAdmin) {
      logger.error('❌ Super admin user not found');
      return false;
    }

    const allPermissions = new Set<string>();
    superAdmin.roles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        allPermissions.add(rp.permission.name);
      });
    });

    const savedSearchPerms = Array.from(allPermissions).filter(p => p.includes('saved_search'));
    const adminPerms = Array.from(allPermissions).filter(p => p.includes('admin'));
    const tenantPerms = Array.from(allPermissions).filter(p => p.includes('tenant'));

    logger.info(`✅ Super Admin (${superAdmin.account?.email})`);
    logger.info(`   - Total permissions: ${allPermissions.size}`);
    logger.info(`   - Saved search permissions: ${savedSearchPerms.length}`);
    logger.info(`   - Admin permissions: ${adminPerms.length}`);
    logger.info(`   - Tenant permissions: ${tenantPerms.length}`);
    logger.info(`   - Has saved_searches.manage.global: ${allPermissions.has('saved_searches.manage.global') ? '✅' : '❌'}`);
    logger.info(`   - Has admin.full_access: ${allPermissions.has('admin.full_access') ? '✅' : '❌'}`);

    // Test 2: Check Content Moderator permissions
    logger.info('\n📋 TEST 2: Content Moderator Permissions');
    const moderator = await db.user.findFirst({
      where: {
        account: {
          email: '2@2.com'
        }
      },
      include: {
        account: {
          select: { email: true }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!moderator) {
      logger.error('❌ Content moderator user not found');
      return false;
    }

    const moderatorPermissions = new Set<string>();
    moderator.roles.forEach(ur => {
      ur.role.permissions.forEach(rp => {
        moderatorPermissions.add(rp.permission.name);
      });
    });

    const moderatorSavedSearchPerms = Array.from(moderatorPermissions).filter(p => p.includes('saved_search'));

    logger.info(`✅ Content Moderator (${moderator.account?.email})`);
    logger.info(`   - Total permissions: ${moderatorPermissions.size}`);
    logger.info(`   - Saved search permissions: ${moderatorSavedSearchPerms.length}`);
    logger.info(`   - Has saved_searches.create.own: ${moderatorPermissions.has('saved_searches.create.own') ? '✅' : '❌'}`);
    logger.info(`   - Cannot manage global: ${!moderatorPermissions.has('saved_searches.manage.global') ? '✅' : '❌'}`);

    // Test 3: Check database integrity
    logger.info('\n📊 TEST 3: Database Integrity');
    const permissionCount = await db.permission.count();
    const roleCount = await db.role.count();
    const userCount = await db.user.count();
    const tenantCount = await db.tenant.count();

    logger.info(`✅ Database counts:`);
    logger.info(`   - Permissions: ${permissionCount} (expected: 33+)`);
    logger.info(`   - Roles: ${roleCount} (expected: 6)`);
    logger.info(`   - Users: ${userCount} (expected: 3+)`);
    logger.info(`   - Tenants: ${tenantCount} (expected: 1+)`);

    // Test 4: Check specific saved search permissions exist
    logger.info('\n🔍 TEST 4: Saved Search Permissions Exist');
    const requiredSavedSearchPerms = [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own',
      'saved_searches.read.global',
      'saved_searches.manage.global',
      'saved_searches.bulk_delete.global'
    ];

    let missingPerms = 0;
    for (const permName of requiredSavedSearchPerms) {
      const perm = await db.permission.findUnique({
        where: { name: permName }
      });
      if (perm) {
        logger.info(`   ✅ ${permName}`);
      } else {
        logger.error(`   ❌ MISSING: ${permName}`);
        missingPerms++;
      }
    }

    const success = missingPerms === 0 && 
                   allPermissions.size >= 30 && 
                   savedSearchPerms.length >= 7 &&
                   moderatorSavedSearchPerms.length >= 4;

    logger.info(success ? '\n🎉 ALL TESTS PASSED! Setup is working correctly.' : '\n❌ TESTS FAILED! Setup needs fixing.');
    
    return success;

  } catch (error) {
    logger.error('❌ Verification failed:', error);
    return false;
  } finally {
    await db.$disconnect();
  }
}

// Run verification
verifySetup().catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
}); 