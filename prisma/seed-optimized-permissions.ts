import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

interface RoleDefinition {
  name: string;
  code: string;
  level: number;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

interface PermissionDefinition {
  pattern: string;
  description: string;
}

/**
 * Seed optimized permissions and roles
 */
async function seedOptimizedPermissions() {
  logger.info('Seeding optimized permissions and roles...');

  try {
    // Step 1: Create all permissions
    const permissions: PermissionDefinition[] = [
      // Platform Admin Permissions
      { pattern: 'platform.*.global', description: 'Full platform control' },
      { pattern: 'tenants.*.global', description: 'Full tenant management' },
      { pattern: 'system.*.global', description: 'System operations (backup, restore, monitoring)' },
      { pattern: 'emergency.access.global', description: 'Emergency break-glass access' },
      { pattern: 'audit.*.global', description: 'Full audit access' },
      { pattern: 'config.*.global', description: 'All configuration management' },
      { pattern: 'integrations.*.global', description: 'All integrations' },
      { pattern: 'subscriptions.*.global', description: 'Subscription templates' },
      { pattern: 'security.*.global', description: 'Security policies' },
      { pattern: 'compliance.*.global', description: 'Compliance rules' },
      { pattern: 'users.*.global', description: 'Full user management across tenants' },
      { pattern: 'accounts.*.global', description: 'Full account management' },
      { pattern: 'impersonate.*.global', description: 'Impersonate any user/account' },
      { pattern: 'analytics.*.global', description: 'Platform-wide analytics' },
      { pattern: 'reports.*.global', description: 'All reporting capabilities' },

      // Tenant Admin Permissions
      { pattern: 'tenant.manage.tenant', description: 'Tenant settings, branding, domains' },
      { pattern: 'accounts.*.tenant', description: 'Full account management within tenant' },
      { pattern: 'users.*.tenant', description: 'Full user management within tenant' },
      { pattern: 'analytics.read.tenant', description: 'Tenant analytics access' },
      { pattern: 'billing.manage.tenant', description: 'Tenant billing management' },
      { pattern: 'content.*.tenant', description: 'All content types (profiles, jobs, media)' },
      { pattern: 'moderation.*.tenant', description: 'All moderation capabilities' },
      { pattern: 'categories.manage.tenant', description: 'Categories and tags' },
      { pattern: 'schemas.manage.tenant', description: 'Model schemas and forms' },
      { pattern: 'templates.manage.tenant', description: 'Email and page templates' },
      { pattern: 'marketplace.*.tenant', description: 'Full marketplace control' },
      { pattern: 'bookings.*.tenant', description: 'All booking operations' },
      { pattern: 'payments.*.tenant', description: 'Payment and commission management' },
      { pattern: 'disputes.*.tenant', description: 'Dispute resolution' },
      { pattern: 'reviews.*.tenant', description: 'Review management' },
      { pattern: 'config.manage.tenant', description: 'Tenant configuration' },
      { pattern: 'workflows.*.tenant', description: 'Workflow management' },
      { pattern: 'integrations.*.tenant', description: 'Integration management' },
      { pattern: 'subscriptions.*.tenant', description: 'Subscription plans' },
      { pattern: 'compliance.*.tenant', description: 'Compliance settings' },
      { pattern: 'support.*.tenant', description: 'Support operations' },
      { pattern: 'impersonate.users.tenant', description: 'Impersonate tenant users' },
      { pattern: 'audit.read.tenant', description: 'Audit log access' },
      { pattern: 'reports.*.tenant', description: 'Reporting capabilities' },
      { pattern: 'export.*.tenant', description: 'Data export' },

      // Account Owner Permissions
      { pattern: 'account.manage.own', description: 'Full account control' },
      { pattern: 'team.*.own', description: 'Team management' },
      { pattern: 'billing.manage.own', description: 'Billing and subscriptions' },
      { pattern: 'analytics.read.own', description: 'Account analytics' },
      { pattern: 'settings.manage.own', description: 'Account settings' },
      { pattern: 'profiles.*.own', description: 'Full profile management' },
      { pattern: 'media.*.own', description: 'Media management' },
      { pattern: 'portfolio.*.own', description: 'Portfolio management' },
      { pattern: 'availability.*.own', description: 'Availability and rates' },
      { pattern: 'compliance.manage.own', description: 'Compliance and verification' },
      { pattern: 'jobs.*.own', description: 'Job posting and management' },
      { pattern: 'applications.*.own', description: 'Application management' },
      { pattern: 'bookings.*.own', description: 'Booking management' },
      { pattern: 'clients.*.own', description: 'Client management' },
      { pattern: 'contracts.*.own', description: 'Contract management' },
      { pattern: 'payments.*.own', description: 'Payment processing' },
      { pattern: 'invoices.*.own', description: 'Invoice management' },
      { pattern: 'commissions.read.own', description: 'Commission tracking' },
      { pattern: 'reports.generate.own', description: 'Report generation' },
      { pattern: 'export.data.own', description: 'Data export' },

      // Individual Permissions
      { pattern: 'profile.*.own', description: 'Profile management' },
      { pattern: 'jobs.read.tenant', description: 'Browse jobs' },
      { pattern: 'applications.*.own', description: 'Apply and manage applications' },
      { pattern: 'bookings.manage.own', description: 'Accept/decline bookings' },
      { pattern: 'reviews.manage.own', description: 'Respond to reviews' },
      { pattern: 'messages.*.own', description: 'Messaging' },
      { pattern: 'billing.read.own', description: 'View billing' },
      { pattern: 'payments.read.own', description: 'View payments' },
      { pattern: 'contracts.manage.own', description: 'Sign contracts' },
      { pattern: 'disputes.create.own', description: 'File disputes' },

      // Parent/Guardian Permissions
      { pattern: 'children.*.own', description: 'Full child management' },
      { pattern: 'safety.*.own', description: 'Safety controls' },
      { pattern: 'profiles.supervise.own', description: 'Supervise child profiles' },
      { pattern: 'applications.approve.own', description: 'Approve applications' },
      { pattern: 'bookings.approve.own', description: 'Approve bookings' },
      { pattern: 'media.approve.own', description: 'Approve media uploads' },
      { pattern: 'contracts.approve.own', description: 'Approve contracts' },
      { pattern: 'earnings.manage.own', description: 'Manage child earnings' },
      { pattern: 'education.manage.own', description: 'Education accounts' },
      { pattern: 'legal.manage.own', description: 'Legal documentation' },
      { pattern: 'insurance.manage.own', description: 'Insurance management' },
      { pattern: 'taxes.manage.own', description: 'Tax management' },
      { pattern: 'activity.monitor.own', description: 'Monitor all child activity' },
      { pattern: 'communications.*.own', description: 'Monitor/manage communications' },

      // User Role Permissions
      { pattern: 'assigned.*.own', description: 'Manage assigned work' },
      { pattern: 'team.collaborate.team', description: 'Team collaboration' },
      { pattern: 'files.*.team', description: 'Team file access' },
      { pattern: 'communication.*.team', description: 'Team communication' },
      { pattern: 'calendar.read.team', description: 'View team calendar' },
      { pattern: 'reports.read.own', description: 'View own reports' },
      { pattern: 'talents.search.tenant', description: 'Search talent' },
      { pattern: 'talents.contact.own', description: 'Contact talent' },
      { pattern: 'reviews.create.own', description: 'Leave reviews' },

      // Specialized Permissions
      { pattern: 'content.read.tenant', description: 'Read all content' },
      { pattern: 'flags.manage.tenant', description: 'Manage flagged content' },
      { pattern: 'escalation.create.tenant', description: 'Escalate issues' },
      { pattern: 'guidelines.enforce.tenant', description: 'Enforce guidelines' },
      { pattern: 'reports.create.tenant', description: 'Create moderation reports' },
      { pattern: 'training.access.own', description: 'Access training materials' },
      { pattern: 'tools.moderate.tenant', description: 'Use moderation tools' }
    ];

    logger.info(`Creating ${permissions.length} permissions...`);

    for (const perm of permissions) {
      const [resource, action, scope] = perm.pattern.split('.');
      
      await prisma.permission.upsert({
        where: { name: perm.pattern },
        create: {
          name: perm.pattern,
          pattern: perm.pattern,
          resource,
          action,
          scope,
          description: perm.description,
          isWildcard: perm.pattern.includes('*'),
          priority: 100
        },
        update: {
          pattern: perm.pattern,
          resource,
          action,
          scope,
          description: perm.description,
          isWildcard: perm.pattern.includes('*')
        }
      });
    }

    // Step 2: Create roles with permissions
    const roles: RoleDefinition[] = [
      {
        name: 'Super Admin',
        code: 'super_admin',
        level: 5,
        description: 'Platform-wide administrator with full access',
        isSystem: true,
        permissions: [
          'platform.*.global',
          'tenants.*.global',
          'system.*.global',
          'emergency.access.global',
          'audit.*.global',
          'config.*.global',
          'integrations.*.global',
          'subscriptions.*.global',
          'security.*.global',
          'compliance.*.global',
          'users.*.global',
          'accounts.*.global',
          'impersonate.*.global',
          'analytics.*.global',
          'reports.*.global'
        ]
      },
      {
        name: 'Tenant Admin',
        code: 'tenant_admin',
        level: 4,
        description: 'Marketplace owner with full tenant access',
        isSystem: true,
        permissions: [
          'tenant.manage.tenant',
          'accounts.*.tenant',
          'users.*.tenant',
          'analytics.read.tenant',
          'billing.manage.tenant',
          'content.*.tenant',
          'moderation.*.tenant',
          'categories.manage.tenant',
          'schemas.manage.tenant',
          'templates.manage.tenant',
          'marketplace.*.tenant',
          'bookings.*.tenant',
          'payments.*.tenant',
          'disputes.*.tenant',
          'reviews.*.tenant',
          'config.manage.tenant',
          'workflows.*.tenant',
          'integrations.*.tenant',
          'subscriptions.*.tenant',
          'compliance.*.tenant',
          'support.*.tenant',
          'impersonate.users.tenant',
          'audit.read.tenant',
          'reports.*.tenant',
          'export.*.tenant'
        ]
      },
      {
        name: 'Content Moderator',
        code: 'content_moderator',
        level: 3,
        description: 'Content review and moderation specialist',
        isSystem: true,
        permissions: [
          'moderation.*.tenant',
          'content.read.tenant',
          'flags.manage.tenant',
          'escalation.create.tenant',
          'guidelines.enforce.tenant',
          'reports.create.tenant',
          'training.access.own',
          'tools.moderate.tenant'
        ]
      },
      {
        name: 'Agency Owner',
        code: 'agency_owner',
        level: 2,
        description: 'Agency account owner with full management',
        isSystem: false,
        permissions: [
          'account.manage.own',
          'team.*.own',
          'billing.manage.own',
          'analytics.read.own',
          'settings.manage.own',
          'profiles.*.own',
          'media.*.own',
          'portfolio.*.own',
          'availability.*.own',
          'compliance.manage.own',
          'jobs.*.own',
          'applications.*.own',
          'bookings.*.own',
          'clients.*.own',
          'contracts.*.own',
          'payments.*.own',
          'invoices.*.own',
          'commissions.read.own',
          'reports.generate.own',
          'export.data.own'
        ]
      },
      {
        name: 'Individual Owner',
        code: 'individual_owner',
        level: 2,
        description: 'Individual account owner',
        isSystem: false,
        permissions: [
          'account.manage.own',
          'profile.*.own',
          'media.*.own',
          'portfolio.*.own',
          'availability.*.own',
          'jobs.read.tenant',
          'applications.*.own',
          'bookings.manage.own',
          'reviews.manage.own',
          'messages.*.own',
          'billing.read.own',
          'payments.read.own',
          'analytics.read.own',
          'contracts.manage.own',
          'disputes.create.own'
        ]
      },
      {
        name: 'Parent Guardian',
        code: 'parent_guardian',
        level: 2,
        description: 'Parent or guardian with supervision rights',
        isSystem: false,
        permissions: [
          'account.manage.own',
          'children.*.own',
          'safety.*.own',
          'compliance.*.own',
          'emergency.*.own',
          'profiles.supervise.own',
          'applications.approve.own',
          'bookings.approve.own',
          'media.approve.own',
          'contracts.approve.own',
          'earnings.manage.own',
          'education.manage.own',
          'legal.manage.own',
          'insurance.manage.own',
          'taxes.manage.own',
          'activity.monitor.own',
          'communications.*.own',
          'reports.*.own'
        ]
      },
      {
        name: 'Team Member',
        code: 'team_member',
        level: 1,
        description: 'Team member with collaborative access',
        isSystem: false,
        permissions: [
          'assigned.*.own',
          'team.collaborate.team',
          'files.*.team',
          'communication.*.team',
          'calendar.read.team',
          'reports.read.own'
        ]
      },
      {
        name: 'Job Poster',
        code: 'job_poster',
        level: 1,
        description: 'Client who posts jobs and hires talent',
        isSystem: false,
        permissions: [
          'jobs.*.own',
          'applications.review.own',
          'bookings.create.own',
          'talents.search.tenant',
          'talents.contact.own',
          'payments.create.own',
          'reviews.create.own',
          'analytics.read.own'
        ]
      }
    ];

    logger.info(`Creating ${roles.length} roles...`);

    for (const roleDef of roles) {
      // Create role
      const role = await prisma.role.upsert({
        where: { code: roleDef.code },
        create: {
          name: roleDef.name,
          code: roleDef.code,
          level: roleDef.level,
          description: roleDef.description,
          isSystem: roleDef.isSystem
        },
        update: {
          name: roleDef.name,
          level: roleDef.level,
          description: roleDef.description,
          isSystem: roleDef.isSystem
        }
      });

      // Assign permissions to role
      for (const permPattern of roleDef.permissions) {
        const permission = await prisma.permission.findFirst({
          where: { pattern: permPattern }
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
        }
      }

      logger.info(`Created role: ${roleDef.name} with ${roleDef.permissions.length} permissions`);
    }

    // Step 3: Create permission inheritance rules
    logger.info('Setting up permission inheritance...');

    const inheritanceRules = [
      // Platform level inherits everything
      { parent: 'platform.*.global', children: ['tenant.*.tenant', 'account.*.own'] },
      { parent: 'tenants.*.global', children: ['tenant.manage.tenant'] },
      
      // Content bundle inheritance
      { parent: 'content.*.tenant', children: [
        'profiles.*.tenant',
        'jobs.*.tenant',
        'media.*.tenant',
        'reviews.*.tenant'
      ]},
      
      // Marketplace bundle inheritance
      { parent: 'marketplace.*.tenant', children: [
        'bookings.*.tenant',
        'payments.*.tenant',
        'disputes.*.tenant'
      ]},
      
      // Account management inheritance
      { parent: 'account.manage.own', children: [
        'billing.manage.own',
        'settings.manage.own',
        'analytics.read.own'
      ]},
      
      // Profile management inheritance
      { parent: 'profiles.*.own', children: [
        'profile.*.own',
        'media.*.own',
        'portfolio.*.own'
      ]}
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
          }
        }
      }
    }

    // Step 4: Create permission sets
    logger.info('Creating permission sets...');

    const permissionSets = [
      {
        name: 'platform_administration',
        description: 'Complete platform administration',
        permissions: [
          'platform.*.global',
          'tenants.*.global',
          'system.*.global',
          'emergency.access.global'
        ]
      },
      {
        name: 'tenant_administration',
        description: 'Complete tenant administration',
        permissions: [
          'tenant.manage.tenant',
          'content.*.tenant',
          'marketplace.*.tenant',
          'config.manage.tenant'
        ]
      },
      {
        name: 'content_moderation',
        description: 'Content moderation capabilities',
        permissions: [
          'moderation.*.tenant',
          'content.read.tenant',
          'flags.manage.tenant'
        ]
      },
      {
        name: 'financial_management',
        description: 'Financial and billing management',
        permissions: [
          'billing.*.own',
          'payments.*.own',
          'invoices.*.own',
          'commissions.read.own'
        ]
      },
      {
        name: 'talent_management',
        description: 'Talent and profile management',
        permissions: [
          'profiles.*.own',
          'media.*.own',
          'portfolio.*.own',
          'availability.*.own'
        ]
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
    }

    logger.info('Optimized permissions and roles seeded successfully!');

  } catch (error) {
    logger.error('Failed to seed permissions', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
if (require.main === module) {
  seedOptimizedPermissions()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed', { error });
      process.exit(1);
    });
}