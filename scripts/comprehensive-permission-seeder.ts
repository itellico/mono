#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RoleDefinition {
  name: string;
  code: string;
  tier: string;
  level: number;
  description: string;
  is_system: boolean;
  permissions: string[];
}

interface PermissionDefinition {
  name: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
  is_system: boolean;
}

interface TenantDefinition {
  name: string;
  slug: string;
  description: string;
  domain: string;
  is_active: boolean;
}

interface AccountDefinition {
  name: string;
  type: string;
  is_active: boolean;
  tenant_slug: string;
}

interface UserDefinition {
  email: string;
  name: string;
  password_hash: string; // pre-hashed for testing
  tier: string;
  is_active: boolean;
  is_verified: boolean;
  tenant_slug?: string;
  account_name?: string;
  roles: string[];
}

async function comprehensivePermissionSeeder() {
  console.log('🚀 Starting Comprehensive Permission System Seeder\\n');
  console.log('==================================================\\n');

  try {
    // Step 1: Create all industry-standard permissions
    const permissions: PermissionDefinition[] = [
      // Platform-tier permissions (Super Admin only)
      { name: 'platform.tenants.create', module: 'platform', resource: 'tenants', action: 'create', scope: 'platform', description: 'Create new tenants on the platform', is_system: true },
      { name: 'platform.tenants.read', module: 'platform', resource: 'tenants', action: 'read', scope: 'platform', description: 'View all tenant information', is_system: true },
      { name: 'platform.tenants.update', module: 'platform', resource: 'tenants', action: 'update', scope: 'platform', description: 'Update tenant settings globally', is_system: true },
      { name: 'platform.tenants.delete', module: 'platform', resource: 'tenants', action: 'delete', scope: 'platform', description: 'Delete tenants from platform', is_system: true },
      { name: 'platform.tenants.suspend', module: 'platform', resource: 'tenants', action: 'suspend', scope: 'platform', description: 'Suspend or activate tenant access', is_system: true },
      
      { name: 'platform.users.read', module: 'platform', resource: 'users', action: 'read', scope: 'platform', description: 'View all users across platform', is_system: true },
      { name: 'platform.users.manage', module: 'platform', resource: 'users', action: 'manage', scope: 'platform', description: 'Manage users across all tenants', is_system: true },
      { name: 'platform.users.impersonate', module: 'platform', resource: 'users', action: 'impersonate', scope: 'platform', description: 'Impersonate any user on platform', is_system: true },
      
      { name: 'platform.system.config', module: 'platform', resource: 'system', action: 'config', scope: 'platform', description: 'Configure platform-wide settings', is_system: true },
      { name: 'platform.system.maintenance', module: 'platform', resource: 'system', action: 'maintenance', scope: 'platform', description: 'Perform system maintenance operations', is_system: true },
      { name: 'platform.system.backup', module: 'platform', resource: 'system', action: 'backup', scope: 'platform', description: 'Create and manage system backups', is_system: true },
      
      { name: 'platform.audit.read', module: 'platform', resource: 'audit', action: 'read', scope: 'platform', description: 'View platform-wide audit logs', is_system: true },
      { name: 'platform.audit.export', module: 'platform', resource: 'audit', action: 'export', scope: 'platform', description: 'Export platform audit data', is_system: true },
      
      { name: 'platform.analytics.read', module: 'platform', resource: 'analytics', action: 'read', scope: 'platform', description: 'View platform analytics and metrics', is_system: true },
      { name: 'platform.revenue.read', module: 'platform', resource: 'revenue', action: 'read', scope: 'platform', description: 'View platform revenue reports', is_system: true },
      
      // Tenant-tier permissions
      { name: 'tenant.settings.read', module: 'tenant', resource: 'settings', action: 'read', scope: 'tenant', description: 'View tenant configuration', is_system: true },
      { name: 'tenant.settings.update', module: 'tenant', resource: 'settings', action: 'update', scope: 'tenant', description: 'Update tenant settings', is_system: true },
      
      { name: 'tenant.accounts.create', module: 'tenant', resource: 'accounts', action: 'create', scope: 'tenant', description: 'Create accounts within tenant', is_system: true },
      { name: 'tenant.accounts.read', module: 'tenant', resource: 'accounts', action: 'read', scope: 'tenant', description: 'View tenant accounts', is_system: true },
      { name: 'tenant.accounts.update', module: 'tenant', resource: 'accounts', action: 'update', scope: 'tenant', description: 'Update tenant accounts', is_system: true },
      { name: 'tenant.accounts.delete', module: 'tenant', resource: 'accounts', action: 'delete', scope: 'tenant', description: 'Delete tenant accounts', is_system: true },
      { name: 'tenant.accounts.suspend', module: 'tenant', resource: 'accounts', action: 'suspend', scope: 'tenant', description: 'Suspend tenant accounts', is_system: true },
      
      { name: 'tenant.users.create', module: 'tenant', resource: 'users', action: 'create', scope: 'tenant', description: 'Create users within tenant', is_system: true },
      { name: 'tenant.users.read', module: 'tenant', resource: 'users', action: 'read', scope: 'tenant', description: 'View tenant users', is_system: true },
      { name: 'tenant.users.update', module: 'tenant', resource: 'users', action: 'update', scope: 'tenant', description: 'Update tenant users', is_system: true },
      { name: 'tenant.users.delete', module: 'tenant', resource: 'users', action: 'delete', scope: 'tenant', description: 'Delete tenant users', is_system: true },
      { name: 'tenant.users.impersonate', module: 'tenant', resource: 'users', action: 'impersonate', scope: 'tenant', description: 'Impersonate tenant users', is_system: true },
      
      { name: 'tenant.roles.create', module: 'tenant', resource: 'roles', action: 'create', scope: 'tenant', description: 'Create custom tenant roles', is_system: true },
      { name: 'tenant.roles.manage', module: 'tenant', resource: 'roles', action: 'manage', scope: 'tenant', description: 'Manage tenant roles and permissions', is_system: true },
      
      { name: 'tenant.billing.read', module: 'tenant', resource: 'billing', action: 'read', scope: 'tenant', description: 'View tenant billing information', is_system: true },
      { name: 'tenant.billing.manage', module: 'tenant', resource: 'billing', action: 'manage', scope: 'tenant', description: 'Manage tenant billing and invoices', is_system: true },
      
      { name: 'tenant.reports.read', module: 'tenant', resource: 'reports', action: 'read', scope: 'tenant', description: 'View tenant reports and analytics', is_system: true },
      { name: 'tenant.reports.create', module: 'tenant', resource: 'reports', action: 'create', scope: 'tenant', description: 'Create custom tenant reports', is_system: true },
      { name: 'tenant.reports.export', module: 'tenant', resource: 'reports', action: 'export', scope: 'tenant', description: 'Export tenant report data', is_system: true },
      
      { name: 'tenant.integrations.read', module: 'tenant', resource: 'integrations', action: 'read', scope: 'tenant', description: 'View tenant integrations', is_system: true },
      { name: 'tenant.integrations.manage', module: 'tenant', resource: 'integrations', action: 'manage', scope: 'tenant', description: 'Manage tenant integrations', is_system: true },
      
      { name: 'tenant.audit.read', module: 'tenant', resource: 'audit', action: 'read', scope: 'tenant', description: 'View tenant audit logs', is_system: true },
      
      // Account-tier permissions
      { name: 'account.settings.read', module: 'account', resource: 'settings', action: 'read', scope: 'account', description: 'View account settings', is_system: true },
      { name: 'account.settings.update', module: 'account', resource: 'settings', action: 'update', scope: 'account', description: 'Update account settings', is_system: true },
      
      { name: 'account.users.create', module: 'account', resource: 'users', action: 'create', scope: 'account', description: 'Add users to account', is_system: true },
      { name: 'account.users.read', module: 'account', resource: 'users', action: 'read', scope: 'account', description: 'View account users', is_system: true },
      { name: 'account.users.update', module: 'account', resource: 'users', action: 'update', scope: 'account', description: 'Update account users', is_system: true },
      { name: 'account.users.delete', module: 'account', resource: 'users', action: 'delete', scope: 'account', description: 'Remove users from account', is_system: true },
      
      { name: 'account.teams.create', module: 'account', resource: 'teams', action: 'create', scope: 'account', description: 'Create account teams', is_system: true },
      { name: 'account.teams.read', module: 'account', resource: 'teams', action: 'read', scope: 'account', description: 'View account teams', is_system: true },
      { name: 'account.teams.update', module: 'account', resource: 'teams', action: 'update', scope: 'account', description: 'Update account teams', is_system: true },
      { name: 'account.teams.delete', module: 'account', resource: 'teams', action: 'delete', scope: 'account', description: 'Delete account teams', is_system: true },
      
      { name: 'account.projects.create', module: 'account', resource: 'projects', action: 'create', scope: 'account', description: 'Create account projects', is_system: true },
      { name: 'account.projects.read', module: 'account', resource: 'projects', action: 'read', scope: 'account', description: 'View account projects', is_system: true },
      { name: 'account.projects.update', module: 'account', resource: 'projects', action: 'update', scope: 'account', description: 'Update account projects', is_system: true },
      { name: 'account.projects.delete', module: 'account', resource: 'projects', action: 'delete', scope: 'account', description: 'Delete account projects', is_system: true },
      
      { name: 'account.billing.read', module: 'account', resource: 'billing', action: 'read', scope: 'account', description: 'View account billing', is_system: true },
      { name: 'account.billing.manage', module: 'account', resource: 'billing', action: 'manage', scope: 'account', description: 'Manage account billing', is_system: true },
      
      { name: 'account.reports.read', module: 'account', resource: 'reports', action: 'read', scope: 'account', description: 'View account reports', is_system: true },
      { name: 'account.reports.create', module: 'account', resource: 'reports', action: 'create', scope: 'account', description: 'Create account reports', is_system: true },
      
      { name: 'account.audit.read', module: 'account', resource: 'audit', action: 'read', scope: 'account', description: 'View account audit logs', is_system: true },
      
      // User-tier permissions (individual user actions)
      { name: 'user.profile.read', module: 'user', resource: 'profile', action: 'read', scope: 'own', description: 'View own user profile', is_system: true },
      { name: 'user.profile.update', module: 'user', resource: 'profile', action: 'update', scope: 'own', description: 'Update own user profile', is_system: true },
      { name: 'user.profile.delete', module: 'user', resource: 'profile', action: 'delete', scope: 'own', description: 'Delete own user profile', is_system: true },
      
      { name: 'user.preferences.read', module: 'user', resource: 'preferences', action: 'read', scope: 'own', description: 'View own preferences', is_system: true },
      { name: 'user.preferences.update', module: 'user', resource: 'preferences', action: 'update', scope: 'own', description: 'Update own preferences', is_system: true },
      
      { name: 'user.notifications.read', module: 'user', resource: 'notifications', action: 'read', scope: 'own', description: 'View own notifications', is_system: true },
      { name: 'user.notifications.manage', module: 'user', resource: 'notifications', action: 'manage', scope: 'own', description: 'Manage own notification settings', is_system: true },
      
      { name: 'user.files.upload', module: 'user', resource: 'files', action: 'upload', scope: 'own', description: 'Upload files', is_system: true },
      { name: 'user.files.read', module: 'user', resource: 'files', action: 'read', scope: 'own', description: 'View own files', is_system: true },
      { name: 'user.files.delete', module: 'user', resource: 'files', action: 'delete', scope: 'own', description: 'Delete own files', is_system: true },
      
      { name: 'user.sessions.manage', module: 'user', resource: 'sessions', action: 'manage', scope: 'own', description: 'Manage own login sessions', is_system: true },
      { name: 'user.security.manage', module: 'user', resource: 'security', action: 'manage', scope: 'own', description: 'Manage own security settings', is_system: true },
      
      { name: 'user.data.export', module: 'user', resource: 'data', action: 'export', scope: 'own', description: 'Export own user data', is_system: true },
      
      // Public permissions (no authentication required)
      { name: 'public.content.read', module: 'public', resource: 'content', action: 'read', scope: 'public', description: 'View public content', is_system: true },
      { name: 'public.search.perform', module: 'public', resource: 'search', action: 'perform', scope: 'public', description: 'Perform public searches', is_system: true },
      { name: 'public.auth.register', module: 'public', resource: 'auth', action: 'register', scope: 'public', description: 'Register new account', is_system: true },
      { name: 'public.auth.login', module: 'public', resource: 'auth', action: 'login', scope: 'public', description: 'Login to system', is_system: true },
      { name: 'public.auth.reset', module: 'public', resource: 'auth', action: 'reset', scope: 'public', description: 'Reset password', is_system: true },
      { name: 'public.docs.read', module: 'public', resource: 'docs', action: 'read', scope: 'public', description: 'View documentation', is_system: true },
      { name: 'public.api.docs', module: 'public', resource: 'api', action: 'docs', scope: 'public', description: 'View API documentation', is_system: true },
      { name: 'public.support.contact', module: 'public', resource: 'support', action: 'contact', scope: 'public', description: 'Contact support', is_system: true },
      
      // Admin permissions
      { name: 'admin.panel.access', module: 'admin', resource: 'panel', action: 'access', scope: 'platform', description: 'Access admin panel interface', is_system: true },
    ];

    console.log(`📝 Creating ${permissions.length} permissions...`);
    let permissionsCreated = 0;
    let permissionsUpdated = 0;

    for (const perm of permissions) {
      try {
        const existing = await prisma.permission.findFirst({
          where: { name: perm.name }
        });

        if (existing) {
          await prisma.permission.update({
            where: { id: existing.id },
            data: {
              module: perm.module,
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
              description: perm.description,
              pattern: `${perm.module}:${perm.resource}:${perm.action}`,
              is_system: perm.is_system
            }
          });
          permissionsUpdated++;
        } else {
          await prisma.permission.create({
            data: {
              name: perm.name,
              module: perm.module,
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
              description: perm.description,
              pattern: `${perm.module}:${perm.resource}:${perm.action}`,
              is_system: perm.is_system
            }
          });
          permissionsCreated++;
        }
      } catch (error) {
        console.error(`❌ Error creating permission ${perm.name}:`, error);
      }
    }

    console.log(`✅ Permissions: ${permissionsCreated} created, ${permissionsUpdated} updated\\n`);

    // Step 2: Create system roles with proper hierarchy
    const roles: RoleDefinition[] = [
      {
        name: 'Super Admin',
        code: 'super_admin',
        tier: 'platform',
        level: 5,
        description: 'Platform-wide administrator with unrestricted access',
        is_system: true,
        permissions: [
          // Platform permissions (all)
          'platform.tenants.create', 'platform.tenants.read', 'platform.tenants.update', 'platform.tenants.delete', 'platform.tenants.suspend',
          'platform.users.read', 'platform.users.manage', 'platform.users.impersonate',
          'platform.system.config', 'platform.system.maintenance', 'platform.system.backup',
          'platform.audit.read', 'platform.audit.export',
          'platform.analytics.read', 'platform.revenue.read',
          'admin.panel.access'
        ]
      },
      {
        name: 'Platform Admin',
        code: 'platform_admin',
        tier: 'platform',
        level: 4,
        description: 'Platform administrator with limited system access',
        is_system: true,
        permissions: [
          'platform.tenants.read', 'platform.tenants.update',
          'platform.users.read', 'platform.users.manage',
          'platform.audit.read',
          'platform.analytics.read',
          'admin.panel.access'
        ]
      },
      {
        name: 'Tenant Admin',
        code: 'tenant_admin',
        tier: 'tenant',
        level: 3,
        description: 'Full administrator within a tenant',
        is_system: true,
        permissions: [
          // Tenant permissions (all)
          'tenant.settings.read', 'tenant.settings.update',
          'tenant.accounts.create', 'tenant.accounts.read', 'tenant.accounts.update', 'tenant.accounts.delete', 'tenant.accounts.suspend',
          'tenant.users.create', 'tenant.users.read', 'tenant.users.update', 'tenant.users.delete', 'tenant.users.impersonate',
          'tenant.roles.create', 'tenant.roles.manage',
          'tenant.billing.read', 'tenant.billing.manage',
          'tenant.reports.read', 'tenant.reports.create', 'tenant.reports.export',
          'tenant.integrations.read', 'tenant.integrations.manage',
          'tenant.audit.read'
        ]
      },
      {
        name: 'Tenant Manager',
        code: 'tenant_manager',
        tier: 'tenant',
        level: 2,
        description: 'Limited tenant management capabilities',
        is_system: true,
        permissions: [
          'tenant.settings.read',
          'tenant.accounts.read', 'tenant.accounts.update',
          'tenant.users.read', 'tenant.users.update',
          'tenant.billing.read',
          'tenant.reports.read', 'tenant.reports.create',
          'tenant.integrations.read',
          'tenant.audit.read'
        ]
      },
      {
        name: 'Account Admin',
        code: 'account_admin',
        tier: 'account',
        level: 2,
        description: 'Full administrator within an account',
        is_system: true,
        permissions: [
          // Account permissions (all)
          'account.settings.read', 'account.settings.update',
          'account.users.create', 'account.users.read', 'account.users.update', 'account.users.delete',
          'account.teams.create', 'account.teams.read', 'account.teams.update', 'account.teams.delete',
          'account.projects.create', 'account.projects.read', 'account.projects.update', 'account.projects.delete',
          'account.billing.read', 'account.billing.manage',
          'account.reports.read', 'account.reports.create',
          'account.audit.read'
        ]
      },
      {
        name: 'Account Manager',
        code: 'account_manager',
        tier: 'account',
        level: 1,
        description: 'Limited account management capabilities',
        is_system: true,
        permissions: [
          'account.settings.read',
          'account.users.read', 'account.users.update',
          'account.teams.read', 'account.teams.update',
          'account.projects.read', 'account.projects.update',
          'account.billing.read',
          'account.reports.read'
        ]
      },
      {
        name: 'User',
        code: 'user',
        tier: 'user',
        level: 1,
        description: 'Standard user with personal data access',
        is_system: true,
        permissions: [
          // User permissions (all)
          'user.profile.read', 'user.profile.update', 'user.profile.delete',
          'user.preferences.read', 'user.preferences.update',
          'user.notifications.read', 'user.notifications.manage',
          'user.files.upload', 'user.files.read', 'user.files.delete',
          'user.sessions.manage', 'user.security.manage',
          'user.data.export'
        ]
      },
      {
        name: 'Guest',
        code: 'guest',
        tier: 'public',
        level: 0,
        description: 'Unauthenticated user with public access only',
        is_system: true,
        permissions: [
          // Public permissions (all)
          'public.content.read', 'public.search.perform',
          'public.auth.register', 'public.auth.login', 'public.auth.reset',
          'public.docs.read', 'public.api.docs', 'public.support.contact'
        ]
      }
    ];

    console.log(`👥 Creating ${roles.length} system roles...`);
    let rolesCreated = 0;
    let rolesUpdated = 0;

    for (const roleDef of roles) {
      try {
        const existing = await prisma.role.findFirst({
          where: { code: roleDef.code }
        });

        let role;
        if (existing) {
          role = await prisma.role.update({
            where: { id: existing.id },
            data: {
              name: roleDef.name,
              tier: roleDef.tier,
              level: roleDef.level,
              description: roleDef.description,
              is_system: roleDef.is_system
            }
          });
          rolesUpdated++;
        } else {
          role = await prisma.role.create({
            data: {
              name: roleDef.name,
              code: roleDef.code,
              tier: roleDef.tier,
              level: roleDef.level,
              description: roleDef.description,
              is_system: roleDef.is_system
            }
          });
          rolesCreated++;
        }

        // Clear existing role permissions
        await prisma.rolePermission.deleteMany({
          where: { role_id: role.id }
        });

        // Assign permissions to role
        for (const permissionName of roleDef.permissions) {
          const permission = await prisma.permission.findFirst({
            where: { name: permissionName }
          });

          if (permission) {
            await prisma.rolePermission.create({
              data: {
                role_id: role.id,
                permission_id: permission.id
              }
            });
          } else {
            console.log(`⚠️  Permission not found: ${permissionName} for role ${roleDef.name}`);
          }
        }

        console.log(`✅ Role: ${roleDef.name} (${roleDef.permissions.length} permissions)`);
      } catch (error) {
        console.error(`❌ Error creating role ${roleDef.name}:`, error);
      }
    }

    console.log(`✅ Roles: ${rolesCreated} created, ${rolesUpdated} updated\\n`);

    // Step 3: Create sample tenants
    const tenants: TenantDefinition[] = [
      {
        name: 'Demo Marketplace',
        slug: 'demo',
        description: 'Demo tenant for testing and development',
        domain: 'demo.monolocal.com',
        is_active: true
      },
      {
        name: 'Talent Hub',
        slug: 'talent-hub',
        description: 'Professional talent marketplace',
        domain: 'talent.monolocal.com', 
        is_active: true
      }
    ];

    console.log(`🏢 Creating ${tenants.length} demo tenants...`);
    const createdTenants = new Map<string, any>();

    for (const tenantDef of tenants) {
      try {
        const tenant = await prisma.tenant.upsert({
          where: { slug: tenantDef.slug },
          create: {
            name: tenantDef.name,
            slug: tenantDef.slug,
            description: tenantDef.description,
            domain: tenantDef.domain,
            is_active: tenantDef.is_active
          },
          update: {
            name: tenantDef.name,
            description: tenantDef.description,
            domain: tenantDef.domain,
            is_active: tenantDef.is_active
          }
        });
        createdTenants.set(tenantDef.slug, tenant);
        console.log(`✅ Tenant: ${tenantDef.name}`);
      } catch (error) {
        console.error(`❌ Error creating tenant ${tenantDef.name}:`, error);
      }
    }

    // Step 4: Create sample accounts
    const accounts: AccountDefinition[] = [
      {
        name: 'Demo Agency',
        type: 'agency',
        is_active: true,
        tenant_slug: 'demo'
      },
      {
        name: 'Individual Pro',
        type: 'individual',
        is_active: true,
        tenant_slug: 'demo'
      },
      {
        name: 'Talent Agency Inc',
        type: 'agency',
        is_active: true,
        tenant_slug: 'talent-hub'
      }
    ];

    console.log(`🏛️ Creating ${accounts.length} demo accounts...`);
    const createdAccounts = new Map<string, any>();

    for (const accountDef of accounts) {
      try {
        const tenant = createdTenants.get(accountDef.tenant_slug);
        if (!tenant) {
          console.log(`⚠️  Tenant not found: ${accountDef.tenant_slug} for account ${accountDef.name}`);
          continue;
        }

        const account = await prisma.account.upsert({
          where: { 
            name_tenant_id: {
              name: accountDef.name,
              tenant_id: tenant.id
            }
          },
          create: {
            name: accountDef.name,
            type: accountDef.type,
            is_active: accountDef.is_active,
            tenant_id: tenant.id
          },
          update: {
            type: accountDef.type,
            is_active: accountDef.is_active
          }
        });
        createdAccounts.set(accountDef.name, account);
        console.log(`✅ Account: ${accountDef.name} (${accountDef.type})`);
      } catch (error) {
        console.error(`❌ Error creating account ${accountDef.name}:`, error);
      }
    }

    // Step 5: Create test users with proper role assignments
    const users: UserDefinition[] = [
      {
        email: '1@1.com',
        name: 'Super Admin User',
        password_hash: '$2b$10$rGmVgz1vJJ.eSbpD1oPpjeKaF4LOwQG1/vWJvHIWkqOhP7KT5nEY2', // 12345678
        tier: 'platform',
        is_active: true,
        is_verified: true,
        roles: ['super_admin']
      },
      {
        email: 'platform@admin.com',
        name: 'Platform Admin',
        password_hash: '$2b$10$rGmVgz1vJJ.eSbpD1oPpjeKaF4LOwQG1/vWJvHIWkqOhP7KT5nEY2', // 12345678
        tier: 'platform',
        is_active: true,
        is_verified: true,
        roles: ['platform_admin']
      },
      {
        email: 'tenant@admin.com',
        name: 'Tenant Admin',
        password_hash: '$2b$10$rGmVgz1vJJ.eSbpD1oPpjeKaF4LOwQG1/vWJvHIWkqOhP7KT5nEY2', // 12345678
        tier: 'tenant',
        is_active: true,
        is_verified: true,
        tenant_slug: 'demo',
        roles: ['tenant_admin']
      },
      {
        email: 'account@admin.com',
        name: 'Account Admin',
        password_hash: '$2b$10$rGmVgz1vJJ.eSbpD1oPpjeKaF4LOwQG1/vWJvHIWkqOhP7KT5nEY2', // 12345678
        tier: 'account',
        is_active: true,
        is_verified: true,
        tenant_slug: 'demo',
        account_name: 'Demo Agency',
        roles: ['account_admin']
      },
      {
        email: 'user@test.com',
        name: 'Test User',
        password_hash: '$2b$10$rGmVgz1vJJ.eSbpD1oPpjeKaF4LOwQG1/vWJvHIWkqOhP7KT5nEY2', // 12345678
        tier: 'user',
        is_active: true,
        is_verified: true,
        tenant_slug: 'demo',
        account_name: 'Demo Agency',
        roles: ['user']
      }
    ];

    console.log(`👤 Creating ${users.length} test users...`);

    for (const userDef of users) {
      try {
        let tenant_id = null;
        let account_id = null;

        if (userDef.tenant_slug) {
          const tenant = createdTenants.get(userDef.tenant_slug);
          if (tenant) {
            tenant_id = tenant.id;
          }
        }

        if (userDef.account_name) {
          const account = createdAccounts.get(userDef.account_name);
          if (account) {
            account_id = account.id;
          }
        }

        const user = await prisma.user.upsert({
          where: { email: userDef.email },
          create: {
            email: userDef.email,
            name: userDef.name,
            password_hash: userDef.password_hash,
            tier: userDef.tier,
            is_active: userDef.is_active,
            is_verified: userDef.is_verified,
            tenant_id,
            account_id
          },
          update: {
            name: userDef.name,
            tier: userDef.tier,
            is_active: userDef.is_active,
            is_verified: userDef.is_verified,
            tenant_id,
            account_id
          }
        });

        // Clear existing user roles
        await prisma.userRole.deleteMany({
          where: { user_id: user.id }
        });

        // Assign roles to user
        for (const roleCode of userDef.roles) {
          const role = await prisma.role.findFirst({
            where: { code: roleCode }
          });

          if (role) {
            await prisma.userRole.create({
              data: {
                user_id: user.id,
                role_id: role.id
              }
            });
          } else {
            console.log(`⚠️  Role not found: ${roleCode} for user ${userDef.email}`);
          }
        }

        console.log(`✅ User: ${userDef.email} (${userDef.roles.join(', ')})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userDef.email}:`, error);
      }
    }

    console.log('\\n📊 Final Statistics:');
    
    const stats = await Promise.all([
      prisma.permission.count(),
      prisma.role.count(),
      prisma.tenant.count(),
      prisma.account.count(),
      prisma.user.count(),
      prisma.rolePermission.count(),
      prisma.userRole.count()
    ]);

    console.log(`  Permissions: ${stats[0]}`);
    console.log(`  Roles: ${stats[1]}`);
    console.log(`  Tenants: ${stats[2]}`);
    console.log(`  Accounts: ${stats[3]}`);
    console.log(`  Users: ${stats[4]}`);
    console.log(`  Role-Permission Assignments: ${stats[5]}`);
    console.log(`  User-Role Assignments: ${stats[6]}`);

    console.log('\\n🎉 Comprehensive Permission System Seeding Complete!');
    console.log('\\n🧪 Test Credentials:');
    console.log('  Super Admin: 1@1.com / 12345678');
    console.log('  Platform Admin: platform@admin.com / 12345678');
    console.log('  Tenant Admin: tenant@admin.com / 12345678');
    console.log('  Account Admin: account@admin.com / 12345678');
    console.log('  Regular User: user@test.com / 12345678');

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  comprehensivePermissionSeeder()
    .then(() => {
      console.log('\\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { comprehensivePermissionSeeder };