import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

interface PermissionMapping {
  oldPatterns: string[];
  newPattern: string;
  description?: string;
}

/**
 * Migration script to convert existing granular permissions to optimized wildcard patterns
 */
async function migratePermissionsToOptimized() {
  logger.info('Starting permission migration to optimized format...');

  try {
    // Define permission mappings
    const mappings: PermissionMapping[] = [
      // Platform Admin mappings
      {
        oldPatterns: [
          'platform.read.global',
          'platform.create.global',
          'platform.update.global',
          'platform.delete.global',
          'platform.manage.global',
          'platform.settings.global',
          'platform.analytics.global',
          'platform.monitoring.global',
          'platform.maintenance.global',
          'platform.backup.global',
          'platform.restore.global',
          'platform.emergency.global',
          'platform.impersonate.global',
          'platform.audit.global',
          'platform.security.global',
          'platform.billing.global',
          'platform.integrations.global',
          'platform.workflows.global',
          'platform.notifications.global',
          'platform.reports.global'
        ],
        newPattern: 'platform.*.global',
        description: 'Full platform control'
      },
      {
        oldPatterns: [
          'tenants.read.global',
          'tenants.create.global',
          'tenants.update.global',
          'tenants.delete.global',
          'tenants.manage.global',
          'tenants.approve.global',
          'tenants.suspend.global',
          'tenants.analytics.global',
          'tenants.billing.global',
          'tenants.impersonate.global',
          'tenants.subscriptions.global',
          'tenants.domains.global',
          'tenants.branding.global',
          'tenants.workflows.global',
          'tenants.audit.global'
        ],
        newPattern: 'tenants.*.global',
        description: 'Full tenant management'
      },

      // Content management mappings
      {
        oldPatterns: [
          'profiles.read.tenant',
          'profiles.create.tenant',
          'profiles.update.tenant',
          'profiles.delete.tenant',
          'profiles.manage.tenant',
          'profiles.approve.tenant',
          'profiles.moderate.tenant',
          'profiles.feature.tenant',
          'profiles.analytics.tenant',
          'profiles.export.tenant'
        ],
        newPattern: 'profiles.*.tenant',
        description: 'Full profile management at tenant level'
      },
      {
        oldPatterns: [
          'jobs.read.tenant',
          'jobs.create.tenant',
          'jobs.update.tenant',
          'jobs.delete.tenant',
          'jobs.manage.tenant',
          'jobs.approve.tenant',
          'jobs.moderate.tenant',
          'jobs.feature.tenant',
          'jobs.analytics.tenant'
        ],
        newPattern: 'jobs.*.tenant',
        description: 'Full job management at tenant level'
      },
      {
        oldPatterns: [
          'media.read.tenant',
          'media.approve.tenant',
          'media.reject.tenant',
          'media.moderate.tenant',
          'media.review.tenant',
          'media.optimize.tenant',
          'media.analytics.tenant',
          'media.export.tenant',
          'media.backup.tenant'
        ],
        newPattern: 'media.*.tenant',
        description: 'Full media management at tenant level'
      },

      // Account level mappings
      {
        oldPatterns: [
          'profiles.read.account',
          'profiles.create.account',
          'profiles.update.account',
          'profiles.delete.account',
          'profiles.manage.account',
          'profiles.submit.account',
          'profiles.approve.account',
          'profiles.feature.account',
          'profiles.analytics.account',
          'profiles.workflows.account',
          'profiles.media.account',
          'profiles.bookings.account',
          'profiles.rates.account',
          'profiles.availability.account',
          'profiles.contracts.account',
          'profiles.performance.account',
          'profiles.compliance.account',
          'profiles.verification.account',
          'profiles.export.account',
          'profiles.archive.account'
        ],
        newPattern: 'profiles.*.own',
        description: 'Full profile management for own resources'
      },
      {
        oldPatterns: [
          'jobs.read.own',
          'jobs.create.own',
          'jobs.update.own',
          'jobs.delete.own',
          'jobs.manage.own',
          'jobs.submit.own',
          'jobs.analytics.own'
        ],
        newPattern: 'jobs.*.own',
        description: 'Full job management for own resources'
      },
      
      // Bundled permissions
      {
        oldPatterns: [
          'profiles.moderate.tenant',
          'jobs.moderate.tenant',
          'media.moderate.tenant',
          'applications.moderate.tenant',
          'reviews.moderate.tenant',
          'comments.moderate.tenant'
        ],
        newPattern: 'moderation.*.tenant',
        description: 'All moderation capabilities'
      },
      {
        oldPatterns: [
          'profiles.*.tenant',
          'jobs.*.tenant',
          'media.*.tenant',
          'reviews.*.tenant'
        ],
        newPattern: 'content.*.tenant',
        description: 'All content management'
      }
    ];

    // Step 1: Create new permissions
    logger.info('Creating new wildcard permissions...');
    
    for (const mapping of mappings) {
      const [resource, action, scope] = mapping.newPattern.split('.');
      
      // Check if permission already exists
      const existing = await prisma.permission.findFirst({
        where: { pattern: mapping.newPattern }
      });

      if (!existing) {
        await prisma.permission.create({
          data: {
            name: mapping.newPattern,
            pattern: mapping.newPattern,
            resource,
            action,
            scope,
            description: mapping.description,
            isWildcard: mapping.newPattern.includes('*'),
            priority: 100
          }
        });
        logger.info(`Created permission: ${mapping.newPattern}`);
      }
    }

    // Step 2: Migrate role permissions
    logger.info('Migrating role permissions...');
    
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    for (const role of roles) {
      const currentPermissions = role.permissions.map(rp => rp.permission.name);
      const newPermissions = new Set<string>();

      // Map old permissions to new ones
      for (const mapping of mappings) {
        const hasAnyOldPermission = mapping.oldPatterns.some(old => 
          currentPermissions.includes(old)
        );

        if (hasAnyOldPermission) {
          newPermissions.add(mapping.newPattern);
        }
      }

      // Add new permissions to role
      for (const newPerm of newPermissions) {
        const permission = await prisma.permission.findFirst({
          where: { pattern: newPerm }
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            create: {
              roleId: role.id,
              permissionId: permission.id
            },
            update: {}
          });
          logger.info(`Added ${newPerm} to role ${role.name}`);
        }
      }
    }

    // Step 3: Create permission sets
    logger.info('Creating permission sets...');
    
    const permissionSets = [
      {
        name: 'content_moderation',
        description: 'Content moderation capabilities',
        permissions: ['moderation.*.tenant', 'content.read.tenant']
      },
      {
        name: 'financial_management',
        description: 'Financial and billing management',
        permissions: ['billing.*.own', 'payments.*.own', 'invoices.*.own']
      },
      {
        name: 'platform_administration',
        description: 'Platform-wide administration',
        permissions: ['platform.*.global', 'tenants.*.global', 'system.*.global']
      },
      {
        name: 'tenant_administration',
        description: 'Tenant-wide administration',
        permissions: ['tenant.manage.tenant', 'content.*.tenant', 'marketplace.*.tenant']
      },
      {
        name: 'agency_management',
        description: 'Agency account management',
        permissions: ['account.manage.own', 'profiles.*.own', 'team.*.own', 'jobs.*.own']
      }
    ];

    for (const setDef of permissionSets) {
      const set = await prisma.permissionSet.upsert({
        where: { name: setDef.name },
        create: {
          name: setDef.name,
          description: setDef.description
        },
        update: {
          description: setDef.description
        }
      });

      for (const permPattern of setDef.permissions) {
        const permission = await prisma.permission.findFirst({
          where: { pattern: permPattern }
        });

        if (permission) {
          await prisma.permissionSetItem.upsert({
            where: {
              setId_permissionId: {
                setId: set.id,
                permissionId: permission.id
              }
            },
            create: {
              setId: set.id,
              permissionId: permission.id
            },
            update: {}
          });
        }
      }
      logger.info(`Created permission set: ${setDef.name}`);
    }

    // Step 4: Set up permission inheritance
    logger.info('Setting up permission inheritance...');
    
    const inheritanceRules = [
      { parent: 'platform.*.global', children: ['tenant.*.tenant', 'content.*.tenant'] },
      { parent: 'content.*.tenant', children: ['profiles.*.tenant', 'jobs.*.tenant', 'media.*.tenant'] },
      { parent: 'account.manage.own', children: ['profiles.*.own', 'team.*.own'] }
    ];

    for (const rule of inheritanceRules) {
      const parent = await prisma.permission.findFirst({
        where: { pattern: rule.parent }
      });

      if (parent) {
        for (const childPattern of rule.children) {
          const child = await prisma.permission.findFirst({
            where: { pattern: childPattern }
          });

          if (child) {
            await prisma.permissionInheritance.upsert({
              where: {
                parentId_childId: {
                  parentId: parent.id,
                  childId: child.id
                }
              },
              create: {
                parentId: parent.id,
                childId: child.id
              },
              update: {}
            });
            logger.info(`Created inheritance: ${parent.pattern} -> ${child.pattern}`);
          }
        }
      }
    }

    // Step 5: Clean up old permissions (optional - commented out for safety)
    // logger.info('Cleaning up old granular permissions...');
    // const allMappedOldPatterns = mappings.flatMap(m => m.oldPatterns);
    // await prisma.permission.deleteMany({
    //   where: {
    //     name: { in: allMappedOldPatterns }
    //   }
    // });

    logger.info('Permission migration completed successfully!');

  } catch (error) {
    logger.error('Permission migration failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migratePermissionsToOptimized()
    .then(() => {
      logger.info('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed', { error });
      process.exit(1);
    });
}