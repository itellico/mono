import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive marketplace permissions and roles implementation
const ROLES = {
  // Platform Level
  super_admin: {
    name: 'Super Admin',
    description: 'Platform-wide administrative access with emergency capabilities',
    level: 'platform',
    permissions: 150
  },
  platform_support: {
    name: 'Platform Support',
    description: 'Cross-tenant support operations with limited admin access',
    level: 'platform', 
    permissions: 75
  },
  
  // Tenant Level
  tenant_admin: {
    name: 'Tenant Admin',
    description: 'Complete tenant management and marketplace configuration',
    level: 'tenant',
    permissions: 120
  },
  tenant_manager: {
    name: 'Tenant Manager', 
    description: 'Day-to-day tenant operations and user support',
    level: 'tenant',
    permissions: 80
  },
  content_moderator: {
    name: 'Content Moderator',
    description: 'Content review, moderation, and safety enforcement',
    level: 'tenant',
    permissions: 45
  },
  financial_manager: {
    name: 'Financial Manager',
    description: 'Payment processing, commission management, financial reporting',
    level: 'tenant', 
    permissions: 40
  },
  
  // Account Level
  agency_owner: {
    name: 'Agency Owner',
    description: 'Complete agency management, talent coordination, client relations',
    level: 'account',
    permissions: 120
  },
  agency_manager: {
    name: 'Agency Manager',
    description: 'Day-to-day agency operations, talent coordination, booking management',
    level: 'account',
    permissions: 80
  },
  individual_owner: {
    name: 'Individual Account Owner',
    description: 'Personal account and profile management, self-representation',
    level: 'account',
    permissions: 80
  },
  parent_guardian: {
    name: 'Parent/Guardian',
    description: 'Child account supervision, safety oversight, legal compliance',
    level: 'account',
    permissions: 100
  },
  talent_manager: {
    name: 'Talent Manager',
    description: 'Talent development, profile management, career coordination',
    level: 'account',
    permissions: 60
  },
  booking_coordinator: {
    name: 'Booking Coordinator',
    description: 'Booking coordination, scheduling, logistics management',
    level: 'account',
    permissions: 35
  },
  
  // User Level
  profile_owner: {
    name: 'Profile Owner',
    description: 'Individual profile and career management, marketplace participation',
    level: 'user',
    permissions: 50
  },
  job_poster: {
    name: 'Job Poster',
    description: 'Job creation, talent hiring, applicant management',
    level: 'user',
    permissions: 35
  },
  team_member: {
    name: 'Team Member',
    description: 'Collaborative work within assigned areas, task completion',
    level: 'user',
    permissions: 40
  },
  client_user: {
    name: 'Client User',
    description: 'Client-side marketplace participation, talent browsing',
    level: 'user',
    permissions: 30
  },
  
  // Specialized Roles
  safety_officer: {
    name: 'Safety Officer',
    description: 'Safety and compliance oversight, age verification, monitoring',
    level: 'specialized',
    permissions: 45
  },
  legal_coordinator: {
    name: 'Legal Coordinator', 
    description: 'Legal compliance, contract management, documentation',
    level: 'specialized',
    permissions: 35
  },
  marketing_manager: {
    name: 'Marketing Manager',
    description: 'Marketing campaigns, SEO optimization, social media management',
    level: 'specialized',
    permissions: 40
  }
};

// Comprehensive permission definitions by category
const PERMISSION_CATEGORIES = {
  // Platform Level Permissions
  platform: [
    'platform.read.global', 'platform.create.global', 'platform.update.global', 'platform.delete.global',
    'platform.manage.global', 'platform.settings.global', 'platform.analytics.global', 'platform.monitoring.global',
    'platform.maintenance.global', 'platform.backup.global', 'platform.restore.global', 'platform.emergency.global',
    'platform.impersonate.global', 'platform.audit.global', 'platform.security.global', 'platform.billing.global',
    'platform.integrations.global', 'platform.workflows.global', 'platform.notifications.global', 'platform.reports.global'
  ],
  
  tenant_management: [
    'tenants.read.global', 'tenants.create.global', 'tenants.update.global', 'tenants.delete.global',
    'tenants.manage.global', 'tenants.approve.global', 'tenants.suspend.global', 'tenants.analytics.global',
    'tenants.billing.global', 'tenants.impersonate.global', 'tenants.subscriptions.global', 'tenants.domains.global',
    'tenants.branding.global', 'tenants.workflows.global', 'tenants.audit.global'
  ],
  
  // Tenant Level Permissions  
  tenant_operations: [
    'tenant.read.tenant', 'tenant.update.tenant', 'tenant.settings.tenant', 'tenant.analytics.tenant',
    'tenant.billing.tenant', 'tenant.subscription.tenant', 'tenant.domain.tenant', 'tenant.branding.tenant',
    'tenant.white-label.tenant', 'tenant.marketplace.tenant', 'tenant.workflows.tenant', 'tenant.integrations.tenant',
    'tenant.compliance.tenant', 'tenant.security.tenant', 'tenant.audit.tenant'
  ],
  
  account_management: [
    'accounts.read.tenant', 'accounts.create.tenant', 'accounts.update.tenant', 'accounts.delete.tenant',
    'accounts.manage.tenant', 'accounts.approve.tenant', 'accounts.suspend.tenant', 'accounts.analytics.tenant',
    'accounts.billing.tenant', 'accounts.subscriptions.tenant', 'accounts.white-label.tenant', 'accounts.impersonate.tenant',
    'accounts.workflows.tenant', 'accounts.notifications.tenant', 'accounts.audit.tenant', 'accounts.types.manage.tenant',
    'accounts.limits.manage.tenant', 'accounts.verification.manage.tenant', 'accounts.compliance.manage.tenant', 'accounts.export.tenant'
  ],
  
  // User & Profile Management
  user_management: [
    'users.read.tenant', 'users.create.tenant', 'users.update.tenant', 'users.delete.tenant',
    'users.manage.tenant', 'users.approve.tenant', 'users.suspend.tenant', 'users.impersonate.tenant',
    'users.analytics.tenant', 'users.workflows.tenant', 'users.read.account', 'users.invite.account',
    'users.manage.account', 'users.suspend.account', 'users.analytics.account'
  ],
  
  profile_management: [
    'profiles.read.tenant', 'profiles.create.tenant', 'profiles.update.tenant', 'profiles.delete.tenant',
    'profiles.manage.tenant', 'profiles.approve.tenant', 'profiles.moderate.tenant', 'profiles.feature.tenant',
    'profiles.analytics.tenant', 'profiles.export.tenant', 'profiles.read.account', 'profiles.create.account',
    'profiles.update.account', 'profiles.delete.account', 'profiles.manage.account', 'profiles.submit.account',
    'profiles.approve.account', 'profiles.feature.account', 'profiles.analytics.account', 'profiles.workflows.account',
    'profiles.read.own', 'profiles.create.own', 'profiles.update.own', 'profiles.delete.own', 'profiles.manage.own',
    'profiles.submit.own', 'profiles.analytics.own', 'profiles.verification.own', 'profiles.compliance.own'
  ],
  
  // Job Management
  job_management: [
    'jobs.read.tenant', 'jobs.create.tenant', 'jobs.update.tenant', 'jobs.delete.tenant',
    'jobs.manage.tenant', 'jobs.approve.tenant', 'jobs.moderate.tenant', 'jobs.feature.tenant',
    'jobs.analytics.tenant', 'jobs.read.account', 'jobs.create.account', 'jobs.update.account',
    'jobs.delete.account', 'jobs.manage.account', 'jobs.submit.account', 'jobs.analytics.account',
    'jobs.read.own', 'jobs.create.own', 'jobs.update.own', 'jobs.delete.own', 'jobs.manage.own',
    'jobs.publish.own', 'jobs.promote.own', 'jobs.analytics.own', 'jobs.apply.account'
  ],
  
  application_management: [
    'applications.read.tenant', 'applications.manage.tenant', 'applications.approve.tenant', 'applications.moderate.tenant',
    'applications.analytics.tenant', 'applications.workflows.tenant', 'applications.read.account', 'applications.manage.account',
    'applications.submit.account', 'applications.analytics.account', 'applications.read.assigned', 'applications.manage.assigned',
    'applications.read.own', 'applications.create.own', 'applications.update.own', 'applications.submit.own',
    'applications.withdraw.own', 'applications.analytics.own', 'applications.status.own', 'applications.resubmit.own'
  ],
  
  // Media Management
  media_management: [
    'media.read.tenant', 'media.approve.tenant', 'media.reject.tenant', 'media.moderate.tenant',
    'media.review.tenant', 'media.optimize.tenant', 'media.analytics.tenant', 'media.export.tenant',
    'media.backup.tenant', 'media.read.account', 'media.upload.account', 'media.manage.account',
    'media.approve.account', 'media.analytics.account', 'media.read.own', 'media.upload.own',
    'media.manage.own', 'media.analytics.own'
  ],
  
  // Booking Management
  booking_management: [
    'bookings.read.tenant', 'bookings.manage.tenant', 'bookings.analytics.tenant', 'bookings.read.account',
    'bookings.manage.account', 'bookings.analytics.account', 'bookings.create.account', 'bookings.confirm.account',
    'bookings.cancel.account', 'bookings.reschedule.account', 'bookings.coordinate.account', 'bookings.read.own',
    'bookings.accept.own', 'bookings.decline.own', 'bookings.manage.own', 'bookings.analytics.own',
    'bookings.create.own', 'bookings.confirm.own', 'bookings.cancel.own', 'bookings.reschedule.own'
  ],
  
  // Financial Management
  financial_management: [
    'payments.read.tenant', 'payments.moderate.tenant', 'payments.analytics.tenant', 'commissions.manage.tenant',
    'payouts.manage.tenant', 'billing.read.account', 'billing.manage.account', 'invoices.create.account',
    'invoices.manage.account', 'payments.read.account', 'payments.manage.account', 'commissions.read.account',
    'commissions.manage.account', 'payouts.read.account', 'payouts.manage.account', 'earnings.read.account',
    'earnings.analytics.account', 'billing.read.own', 'payments.read.own', 'earnings.read.own', 'earnings.analytics.own'
  ],
  
  // Content & Configuration
  content_management: [
    'content.moderate.tenant', 'content.review.tenant', 'content.approve.tenant', 'content.analytics.tenant',
    'content.workflows.tenant', 'content.compliance.tenant', 'categories.read.tenant', 'categories.create.tenant',
    'categories.update.tenant', 'categories.manage.tenant', 'tags.read.tenant', 'tags.create.tenant',
    'tags.update.tenant', 'tags.manage.tenant'
  ],
  
  // Communication & Collaboration
  communication: [
    'messages.read.account', 'messages.send.account', 'messages.manage.account', 'notifications.read.account',
    'notifications.manage.account', 'communication.manage.account', 'team.read.account', 'team.create.account',
    'team.update.account', 'team.delete.account', 'team.manage.account', 'team.invite.account', 'team.roles.account',
    'collaboration.read.team', 'collaboration.participate.team', 'collaboration.comment.team', 'collaboration.share.team'
  ],
  
  // Reviews & Ratings
  review_management: [
    'reviews.moderate.tenant', 'reviews.analytics.tenant', 'reviews.read.account', 'reviews.create.account',
    'reviews.manage.account', 'reviews.read.own', 'reviews.create.own', 'reviews.respond.own',
    'ratings.read.account', 'ratings.create.account', 'testimonials.manage.account', 'testimonials.manage.own'
  ],
  
  // Safety & Compliance
  safety_compliance: [
    'safety.read.account', 'safety.manage.account', 'compliance.read.account', 'compliance.manage.account',
    'legal.read.account', 'legal.manage.account', 'guardian-consent.manage.account', 'age-verification.manage.account',
    'work-permits.manage.account', 'education-coordination.manage.account', 'hours-monitoring.manage.account',
    'supervision.manage.account', 'background-checks.read.account', 'insurance.manage.account', 'emergency-contacts.manage.account'
  ],
  
  // Marketplace Operations
  marketplace_operations: [
    'marketplace.configure.tenant', 'marketplace.moderate.tenant', 'marketplace.analytics.tenant',
    'marketplace.browse.tenant', 'marketplace.search.tenant', 'marketplace.analytics.own',
    'job-search.access.tenant', 'job-filtering.access.tenant', 'job-alerts.manage.own', 'job-favorites.manage.own',
    'talent-search.access.tenant', 'talent-filtering.access.tenant', 'talent-comparison.access.tenant'
  ],
  
  // Workflows & Integrations
  workflow_management: [
    'workflows.read.tenant', 'workflows.create.tenant', 'workflows.update.tenant', 'workflows.delete.tenant',
    'workflows.manage.tenant', 'workflows.execute.tenant', 'integrations.read.tenant', 'integrations.create.tenant',
    'integrations.update.tenant', 'integrations.manage.tenant', 'workflows.read.account', 'workflows.create.account', 'workflows.manage.account'
  ],
  
  // Analytics & Reporting
  analytics_reporting: [
    'analytics.read.account', 'analytics.export.account', 'reports.read.account', 'reports.create.account',
    'reports.export.account', 'performance.read.own', 'performance.monitor.account'
  ]
};

// Role-Permission Mappings
const ROLE_PERMISSIONS = {
  super_admin: [
    ...PERMISSION_CATEGORIES.platform,
    ...PERMISSION_CATEGORIES.tenant_management,
    'audit-logs.read.global', 'audit-logs.export.global', 'system-health.monitor.global',
    'performance.monitor.global', 'security.monitor.global', 'backups.create.global', 'backups.restore.global'
  ],
  
  platform_support: [
    'platform.read.global', 'platform.monitoring.global', 'tenants.read.global', 'accounts.read.global',
    'users.read.global', 'support.manage.global', 'tickets.manage.global'
  ],
  
  tenant_admin: [
    ...PERMISSION_CATEGORIES.tenant_operations,
    ...PERMISSION_CATEGORIES.account_management,
    ...PERMISSION_CATEGORIES.user_management,
    ...PERMISSION_CATEGORIES.profile_management.filter(p => p.includes('.tenant')),
    ...PERMISSION_CATEGORIES.job_management.filter(p => p.includes('.tenant')),
    ...PERMISSION_CATEGORIES.media_management.filter(p => p.includes('.tenant')),
    ...PERMISSION_CATEGORIES.content_management,
    ...PERMISSION_CATEGORIES.marketplace_operations.filter(p => p.includes('.tenant'))
  ],
  
  content_moderator: [
    'content.moderate.tenant', 'content.review.tenant', 'content.approve.tenant', 'content.flag.tenant',
    'profiles.moderate.tenant', 'profiles.approve.tenant', 'profiles.flag.tenant',
    'jobs.moderate.tenant', 'jobs.approve.tenant', 'jobs.flag.tenant',
    'media.moderate.tenant', 'media.approve.tenant', 'media.reject.tenant', 'media.flag.tenant',
    'applications.moderate.tenant', 'applications.flag.tenant', 'reviews.moderate.tenant', 'reviews.flag.tenant',
    'safety.check.tenant', 'compliance.check.tenant', 'age-verification.check.tenant'
  ],
  
  agency_owner: [
    'account.read.account', 'account.update.account', 'account.settings.account', 'account.billing.account',
    ...PERMISSION_CATEGORIES.profile_management.filter(p => p.includes('.account')),
    ...PERMISSION_CATEGORIES.user_management.filter(p => p.includes('.account')),
    ...PERMISSION_CATEGORIES.job_management.filter(p => p.includes('.account')),
    ...PERMISSION_CATEGORIES.booking_management.filter(p => p.includes('.account')),
    ...PERMISSION_CATEGORIES.financial_management.filter(p => p.includes('.account')),
    ...PERMISSION_CATEGORIES.communication.filter(p => p.includes('.account')),
    'clients.read.account', 'clients.create.account', 'clients.manage.account'
  ],
  
  individual_owner: [
    'account.read.account', 'account.update.account', 'account.settings.account', 'account.billing.account',
    ...PERMISSION_CATEGORIES.profile_management.filter(p => p.includes('.account') || p.includes('.own')),
    ...PERMISSION_CATEGORIES.job_management.filter(p => p.includes('.account') || p.includes('.own')),
    ...PERMISSION_CATEGORIES.application_management.filter(p => p.includes('.account') || p.includes('.own')),
    ...PERMISSION_CATEGORIES.booking_management.filter(p => p.includes('.account') || p.includes('.own')),
    ...PERMISSION_CATEGORIES.media_management.filter(p => p.includes('.account') || p.includes('.own')),
    ...PERMISSION_CATEGORIES.financial_management.filter(p => p.includes('.account') || p.includes('.own'))
  ],
  
  profile_owner: [
    ...PERMISSION_CATEGORIES.profile_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.application_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.booking_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.media_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.marketplace_operations.filter(p => p.includes('.own') || p.includes('.tenant')),
    'communication.read.own', 'communication.send.own', 'reviews.read.own', 'reviews.respond.own'
  ],
  
  job_poster: [
    ...PERMISSION_CATEGORIES.job_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.application_management.filter(p => p.includes('.own')),
    ...PERMISSION_CATEGORIES.booking_management.filter(p => p.includes('.own')),
    'talent-profiles.read.tenant', 'talent-search.access.tenant', 'talent-filtering.access.tenant',
    'reviews.create.own', 'contracts.create.own', 'payments.create.own'
  ]
};

async function createRoles() {
  console.log('🔧 Creating comprehensive marketplace roles...');
  
  const createdRoles = [];
  for (const [slug, roleData] of Object.entries(ROLES)) {
    try {
      const role = await prisma.role.upsert({
        where: { slug },
        update: {
          name: roleData.name,
          description: roleData.description
        },
        create: {
          slug,
          name: roleData.name,
          description: roleData.description,
          isActive: true
        }
      });
      createdRoles.push(role);
      console.log(`✅ Role created/updated: ${roleData.name} (${slug})`);
    } catch (error) {
      console.error(`❌ Error creating role ${slug}:`, error);
    }
  }
  
  return createdRoles;
}

async function createPermissions() {
  console.log('🔧 Creating comprehensive marketplace permissions...');
  
  const allPermissions = new Set();
  
  // Collect all unique permissions from categories
  Object.values(PERMISSION_CATEGORIES).forEach(category => {
    category.forEach(permission => allPermissions.add(permission));
  });
  
  // Add role-specific permissions
  Object.values(ROLE_PERMISSIONS).forEach(permissions => {
    permissions.forEach(permission => allPermissions.add(permission));
  });
  
  const createdPermissions = [];
  
  for (const permissionName of allPermissions) {
    try {
      const [entity, action, scope] = permissionName.split('.');
      
      const permission = await prisma.permission.upsert({
        where: { name: permissionName },
        update: {
          description: `${action} ${entity} with ${scope} scope`
        },
        create: {
          name: permissionName,
          description: `${action} ${entity} with ${scope} scope`,
          resource: entity,
          action: action,
          isActive: true
        }
      });
      
      createdPermissions.push(permission);
      console.log(`✅ Permission created/updated: ${permissionName}`);
    } catch (error) {
      console.error(`❌ Error creating permission ${permissionName}:`, error);
    }
  }
  
  console.log(`✅ Total permissions created/updated: ${createdPermissions.length}`);
  return createdPermissions;
}

async function assignPermissionsToRoles() {
  console.log('🔧 Assigning permissions to roles...');
  
  for (const [roleSlug, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    try {
      const role = await prisma.role.findUnique({
        where: { slug: roleSlug }
      });
      
      if (!role) {
        console.error(`❌ Role not found: ${roleSlug}`);
        continue;
      }
      
      // Clear existing permissions for this role
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });
      
      let assignedCount = 0;
      for (const permissionName of permissionNames) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });
        
        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          assignedCount++;
        } else {
          console.warn(`⚠️ Permission not found: ${permissionName}`);
        }
      }
      
      console.log(`✅ Role ${role.name}: ${assignedCount} permissions assigned`);
    } catch (error) {
      console.error(`❌ Error assigning permissions to role ${roleSlug}:`, error);
    }
  }
}

async function updateExistingUsers() {
  console.log('🔧 Updating existing users with appropriate roles...');
  
  // User 1 (1@1.com) - Super Admin  
  const user1 = await prisma.user.findUnique({
    where: { email: '1@1.com' },
    include: { userRoles: true }
  });
  
  if (user1) {
    const superAdminRole = await prisma.role.findUnique({
      where: { slug: 'super_admin' }
    });
    
    if (superAdminRole) {
      // Clear existing roles
      await prisma.userRole.deleteMany({
        where: { userId: user1.id }
      });
      
      // Assign Super Admin role
      await prisma.userRole.create({
        data: {
          userId: user1.id,
          roleId: superAdminRole.id
        }
      });
      
      console.log(`✅ User 1 (${user1.email}) assigned Super Admin role`);
    }
  }
  
  // User 2 (2@2.com) - Content Moderator
  const user2 = await prisma.user.findUnique({
    where: { email: '2@2.com' },
    include: { userRoles: true }
  });
  
  if (user2) {
    const moderatorRole = await prisma.role.findUnique({
      where: { slug: 'content_moderator' }
    });
    
    if (moderatorRole) {
      await prisma.userRole.deleteMany({
        where: { userId: user2.id }
      });
      
      await prisma.userRole.create({
        data: {
          userId: user2.id,
          roleId: moderatorRole.id
        }
      });
      
      console.log(`✅ User 2 (${user2.email}) assigned Content Moderator role`);
    }
  }
  
  // User 3 (3@3.com) - Tenant Admin
  const user3 = await prisma.user.findUnique({
    where: { email: '3@3.com' },
    include: { userRoles: true }
  });
  
  if (user3) {
    const tenantAdminRole = await prisma.role.findUnique({
      where: { slug: 'tenant_admin' }
    });
    
    if (tenantAdminRole) {
      await prisma.userRole.deleteMany({
        where: { userId: user3.id }
      });
      
      await prisma.userRole.create({
        data: {
          userId: user3.id,
          roleId: tenantAdminRole.id
        }
      });
      
      console.log(`✅ User 3 (${user3.email}) assigned Tenant Admin role`);
    }
  }
}

async function generateSummaryReport() {
  console.log('\n📊 COMPREHENSIVE MARKETPLACE PERMISSIONS SUMMARY');
  console.log('=' .repeat(60));
  
  const totalRoles = await prisma.role.count();
  const totalPermissions = await prisma.permission.count();
  const totalRolePermissions = await prisma.rolePermission.count();
  
  console.log(`📋 Total Roles: ${totalRoles}`);
  console.log(`🔑 Total Permissions: ${totalPermissions}`);
  console.log(`🔗 Total Role-Permission Assignments: ${totalRolePermissions}`);
  
  console.log('\n🏢 ROLE BREAKDOWN:');
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { rolePermissions: true }
      }
    }
  });
  
  roles.forEach(role => {
    console.log(`  ${role.name}: ${role._count.rolePermissions} permissions`);
  });
  
  console.log('\n📈 PERMISSION CATEGORIES:');
  Object.keys(PERMISSION_CATEGORIES).forEach(category => {
    console.log(`  ${category}: ${PERMISSION_CATEGORIES[category].length} permissions`);
  });
  
  console.log('\n✅ Marketplace permission system implementation complete!');
}

async function main() {
  try {
    console.log('🚀 Implementing Comprehensive Marketplace Permissions System');
    console.log('=' .repeat(70));
    
    // Step 1: Create all roles
    await createRoles();
    
    // Step 2: Create all permissions
    await createPermissions();
    
    // Step 3: Assign permissions to roles
    await assignPermissionsToRoles();
    
    // Step 4: Update existing users
    await updateExistingUsers();
    
    // Step 5: Generate summary report
    await generateSummaryReport();
    
    console.log('\n🎉 SUCCESS: Comprehensive marketplace permission system implemented!');
    
  } catch (error) {
    console.error('❌ Error implementing permission system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main; 