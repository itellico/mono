#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionUpdate {
  name: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
}

async function fixPermissionSchema() {
  console.log('🔧 Fixing Permission Schema to Industry Standards\n');
  console.log('================================================\n');

  try {
    // Define all permissions with proper structure
    const permissionUpdates: PermissionUpdate[] = [
      // Platform Permissions
      { name: 'platform.tenants.create', module: 'platform', resource: 'tenants', action: 'create', scope: 'platform', description: 'Create new tenants on the platform' },
      { name: 'platform.tenants.read', module: 'platform', resource: 'tenants', action: 'read', scope: 'platform', description: 'View tenant information' },
      { name: 'platform.tenants.update', module: 'platform', resource: 'tenants', action: 'update', scope: 'platform', description: 'Update tenant settings and configuration' },
      { name: 'platform.tenants.delete', module: 'platform', resource: 'tenants', action: 'delete', scope: 'platform', description: 'Delete tenants from the platform' },
      { name: 'platform.tenants.suspend', module: 'platform', resource: 'tenants', action: 'suspend', scope: 'platform', description: 'Suspend or activate tenant access' },
      
      { name: 'platform.plans.create', module: 'platform', resource: 'plans', action: 'create', scope: 'platform', description: 'Create subscription plans' },
      { name: 'platform.plans.read', module: 'platform', resource: 'plans', action: 'read', scope: 'platform', description: 'View subscription plans' },
      { name: 'platform.plans.update', module: 'platform', resource: 'plans', action: 'update', scope: 'platform', description: 'Update subscription plan details' },
      { name: 'platform.plans.delete', module: 'platform', resource: 'plans', action: 'delete', scope: 'platform', description: 'Delete subscription plans' },
      
      { name: 'platform.features.create', module: 'platform', resource: 'features', action: 'create', scope: 'platform', description: 'Create platform features' },
      { name: 'platform.features.read', module: 'platform', resource: 'features', action: 'read', scope: 'platform', description: 'View platform features' },
      { name: 'platform.features.update', module: 'platform', resource: 'features', action: 'update', scope: 'platform', description: 'Update platform features' },
      { name: 'platform.features.delete', module: 'platform', resource: 'features', action: 'delete', scope: 'platform', description: 'Delete platform features' },
      
      { name: 'platform.monitoring.read', module: 'platform', resource: 'monitoring', action: 'read', scope: 'platform', description: 'View system monitoring data' },
      { name: 'platform.monitoring.configure', module: 'platform', resource: 'monitoring', action: 'configure', scope: 'platform', description: 'Configure monitoring settings' },
      
      { name: 'platform.analytics.read', module: 'platform', resource: 'analytics', action: 'read', scope: 'platform', description: 'View platform analytics' },
      { name: 'platform.analytics.export', module: 'platform', resource: 'analytics', action: 'export', scope: 'platform', description: 'Export analytics data' },
      
      { name: 'platform.support.read', module: 'platform', resource: 'support', action: 'read', scope: 'platform', description: 'View support tickets' },
      { name: 'platform.support.manage', module: 'platform', resource: 'support', action: 'manage', scope: 'platform', description: 'Manage support tickets' },
      
      { name: 'platform.api.manage', module: 'platform', resource: 'api', action: 'manage', scope: 'platform', description: 'Manage API configuration' },
      { name: 'platform.api.keys', module: 'platform', resource: 'api', action: 'keys', scope: 'platform', description: 'Manage platform API keys' },
      
      { name: 'platform.webhooks.create', module: 'platform', resource: 'webhooks', action: 'create', scope: 'platform', description: 'Create platform webhooks' },
      { name: 'platform.webhooks.manage', module: 'platform', resource: 'webhooks', action: 'manage', scope: 'platform', description: 'Manage platform webhooks' },
      
      { name: 'platform.templates.create', module: 'platform', resource: 'templates', action: 'create', scope: 'platform', description: 'Create platform templates' },
      { name: 'platform.templates.manage', module: 'platform', resource: 'templates', action: 'manage', scope: 'platform', description: 'Manage platform templates' },
      
      { name: 'platform.audit.read', module: 'platform', resource: 'audit', action: 'read', scope: 'platform', description: 'View platform audit logs' },
      { name: 'platform.audit.export', module: 'platform', resource: 'audit', action: 'export', scope: 'platform', description: 'Export audit logs' },
      
      { name: 'platform.system.config', module: 'platform', resource: 'system', action: 'config', scope: 'platform', description: 'Configure system settings' },
      { name: 'platform.system.maintenance', module: 'platform', resource: 'system', action: 'maintenance', scope: 'platform', description: 'Perform system maintenance' },
      
      { name: 'platform.revenue.read', module: 'platform', resource: 'revenue', action: 'read', scope: 'platform', description: 'View platform revenue reports' },
      
      { name: 'platform.users.read', module: 'platform', resource: 'users', action: 'read', scope: 'platform', description: 'View platform users' },
      { name: 'platform.users.manage', module: 'platform', resource: 'users', action: 'manage', scope: 'platform', description: 'Manage platform users' },
      
      { name: 'platform.settings.read', module: 'platform', resource: 'settings', action: 'read', scope: 'platform', description: 'View platform settings' },
      { name: 'platform.settings.manage', module: 'platform', resource: 'settings', action: 'manage', scope: 'platform', description: 'Manage platform settings' },
      
      // Tenant Permissions
      { name: 'tenant.settings.read', module: 'tenant', resource: 'settings', action: 'read', scope: 'tenant', description: 'View tenant settings' },
      { name: 'tenant.settings.update', module: 'tenant', resource: 'settings', action: 'update', scope: 'tenant', description: 'Update tenant settings' },
      
      { name: 'tenant.accounts.create', module: 'tenant', resource: 'accounts', action: 'create', scope: 'tenant', description: 'Create accounts within tenant' },
      { name: 'tenant.accounts.read', module: 'tenant', resource: 'accounts', action: 'read', scope: 'tenant', description: 'View tenant accounts' },
      { name: 'tenant.accounts.update', module: 'tenant', resource: 'accounts', action: 'update', scope: 'tenant', description: 'Update tenant accounts' },
      { name: 'tenant.accounts.delete', module: 'tenant', resource: 'accounts', action: 'delete', scope: 'tenant', description: 'Delete tenant accounts' },
      { name: 'tenant.accounts.suspend', module: 'tenant', resource: 'accounts', action: 'suspend', scope: 'tenant', description: 'Suspend tenant accounts' },
      
      { name: 'tenant.users.create', module: 'tenant', resource: 'users', action: 'create', scope: 'tenant', description: 'Create users within tenant' },
      { name: 'tenant.users.read', module: 'tenant', resource: 'users', action: 'read', scope: 'tenant', description: 'View tenant users' },
      { name: 'tenant.users.update', module: 'tenant', resource: 'users', action: 'update', scope: 'tenant', description: 'Update tenant users' },
      { name: 'tenant.users.delete', module: 'tenant', resource: 'users', action: 'delete', scope: 'tenant', description: 'Delete tenant users' },
      { name: 'tenant.users.impersonate', module: 'tenant', resource: 'users', action: 'impersonate', scope: 'tenant', description: 'Impersonate tenant users' },
      
      { name: 'tenant.billing.read', module: 'tenant', resource: 'billing', action: 'read', scope: 'tenant', description: 'View tenant billing information' },
      { name: 'tenant.billing.manage', module: 'tenant', resource: 'billing', action: 'manage', scope: 'tenant', description: 'Manage tenant billing' },
      { name: 'tenant.billing.invoices', module: 'tenant', resource: 'billing', action: 'invoices', scope: 'tenant', description: 'Manage tenant invoices' },
      
      { name: 'tenant.reports.read', module: 'tenant', resource: 'reports', action: 'read', scope: 'tenant', description: 'View tenant reports' },
      { name: 'tenant.reports.create', module: 'tenant', resource: 'reports', action: 'create', scope: 'tenant', description: 'Create tenant reports' },
      { name: 'tenant.reports.export', module: 'tenant', resource: 'reports', action: 'export', scope: 'tenant', description: 'Export tenant reports' },
      
      { name: 'tenant.integrations.read', module: 'tenant', resource: 'integrations', action: 'read', scope: 'tenant', description: 'View tenant integrations' },
      { name: 'tenant.integrations.manage', module: 'tenant', resource: 'integrations', action: 'manage', scope: 'tenant', description: 'Manage tenant integrations' },
      
      { name: 'tenant.customization.theme', module: 'tenant', resource: 'customization', action: 'theme', scope: 'tenant', description: 'Customize tenant theme' },
      { name: 'tenant.customization.branding', module: 'tenant', resource: 'customization', action: 'branding', scope: 'tenant', description: 'Manage tenant branding' },
      
      { name: 'tenant.data.import', module: 'tenant', resource: 'data', action: 'import', scope: 'tenant', description: 'Import tenant data' },
      { name: 'tenant.data.export', module: 'tenant', resource: 'data', action: 'export', scope: 'tenant', description: 'Export tenant data' },
      { name: 'tenant.data.backup', module: 'tenant', resource: 'data', action: 'backup', scope: 'tenant', description: 'Backup tenant data' },
      
      { name: 'tenant.roles.create', module: 'tenant', resource: 'roles', action: 'create', scope: 'tenant', description: 'Create custom tenant roles' },
      { name: 'tenant.roles.manage', module: 'tenant', resource: 'roles', action: 'manage', scope: 'tenant', description: 'Manage tenant roles' },
      
      { name: 'tenant.permissions.assign', module: 'tenant', resource: 'permissions', action: 'assign', scope: 'tenant', description: 'Assign permissions within tenant' },
      
      { name: 'tenant.api.access', module: 'tenant', resource: 'api', action: 'access', scope: 'tenant', description: 'Access tenant API' },
      { name: 'tenant.api.keys', module: 'tenant', resource: 'api', action: 'keys', scope: 'tenant', description: 'Manage tenant API keys' },
      
      { name: 'tenant.webhooks.create', module: 'tenant', resource: 'webhooks', action: 'create', scope: 'tenant', description: 'Create tenant webhooks' },
      { name: 'tenant.webhooks.manage', module: 'tenant', resource: 'webhooks', action: 'manage', scope: 'tenant', description: 'Manage tenant webhooks' },
      
      { name: 'tenant.notifications.send', module: 'tenant', resource: 'notifications', action: 'send', scope: 'tenant', description: 'Send tenant notifications' },
      { name: 'tenant.notifications.manage', module: 'tenant', resource: 'notifications', action: 'manage', scope: 'tenant', description: 'Manage tenant notifications' },
      
      { name: 'tenant.audit.read', module: 'tenant', resource: 'audit', action: 'read', scope: 'tenant', description: 'View tenant audit logs' },
      
      { name: 'tenant.security.manage', module: 'tenant', resource: 'security', action: 'manage', scope: 'tenant', description: 'Manage tenant security settings' },
      
      { name: 'tenant.workflows.create', module: 'tenant', resource: 'workflows', action: 'create', scope: 'tenant', description: 'Create tenant workflows' },
      { name: 'tenant.workflows.manage', module: 'tenant', resource: 'workflows', action: 'manage', scope: 'tenant', description: 'Manage tenant workflows' },
      
      { name: 'tenant.categories.manage', module: 'tenant', resource: 'categories', action: 'manage', scope: 'tenant', description: 'Manage tenant categories' },
      { name: 'tenant.tags.manage', module: 'tenant', resource: 'tags', action: 'manage', scope: 'tenant', description: 'Manage tenant tags' },
      
      // Account Permissions
      { name: 'account.settings.read', module: 'account', resource: 'settings', action: 'read', scope: 'account', description: 'View account settings' },
      { name: 'account.settings.update', module: 'account', resource: 'settings', action: 'update', scope: 'account', description: 'Update account settings' },
      
      { name: 'account.users.create', module: 'account', resource: 'users', action: 'create', scope: 'account', description: 'Add users to account' },
      { name: 'account.users.read', module: 'account', resource: 'users', action: 'read', scope: 'account', description: 'View account users' },
      { name: 'account.users.update', module: 'account', resource: 'users', action: 'update', scope: 'account', description: 'Update account users' },
      { name: 'account.users.delete', module: 'account', resource: 'users', action: 'delete', scope: 'account', description: 'Remove users from account' },
      
      { name: 'account.teams.create', module: 'account', resource: 'teams', action: 'create', scope: 'account', description: 'Create account teams' },
      { name: 'account.teams.read', module: 'account', resource: 'teams', action: 'read', scope: 'account', description: 'View account teams' },
      { name: 'account.teams.update', module: 'account', resource: 'teams', action: 'update', scope: 'account', description: 'Update account teams' },
      { name: 'account.teams.delete', module: 'account', resource: 'teams', action: 'delete', scope: 'account', description: 'Delete account teams' },
      
      { name: 'account.projects.create', module: 'account', resource: 'projects', action: 'create', scope: 'account', description: 'Create account projects' },
      { name: 'account.projects.read', module: 'account', resource: 'projects', action: 'read', scope: 'account', description: 'View account projects' },
      { name: 'account.projects.update', module: 'account', resource: 'projects', action: 'update', scope: 'account', description: 'Update account projects' },
      { name: 'account.projects.delete', module: 'account', resource: 'projects', action: 'delete', scope: 'account', description: 'Delete account projects' },
      
      { name: 'account.billing.read', module: 'account', resource: 'billing', action: 'read', scope: 'account', description: 'View account billing' },
      { name: 'account.billing.manage', module: 'account', resource: 'billing', action: 'manage', scope: 'account', description: 'Manage account billing' },
      
      { name: 'account.integrations.manage', module: 'account', resource: 'integrations', action: 'manage', scope: 'account', description: 'Manage account integrations' },
      
      { name: 'account.data.export', module: 'account', resource: 'data', action: 'export', scope: 'account', description: 'Export account data' },
      
      { name: 'account.reports.read', module: 'account', resource: 'reports', action: 'read', scope: 'account', description: 'View account reports' },
      { name: 'account.reports.create', module: 'account', resource: 'reports', action: 'create', scope: 'account', description: 'Create account reports' },
      
      { name: 'account.notifications.manage', module: 'account', resource: 'notifications', action: 'manage', scope: 'account', description: 'Manage account notifications' },
      
      { name: 'account.audit.read', module: 'account', resource: 'audit', action: 'read', scope: 'account', description: 'View account audit logs' },
      
      { name: 'account.api.access', module: 'account', resource: 'api', action: 'access', scope: 'account', description: 'Access account API' },
      
      { name: 'account.storage.manage', module: 'account', resource: 'storage', action: 'manage', scope: 'account', description: 'Manage account storage' },
      
      { name: 'account.workflows.use', module: 'account', resource: 'workflows', action: 'use', scope: 'account', description: 'Use account workflows' },
      
      // User Permissions
      { name: 'user.profile.read', module: 'user', resource: 'profile', action: 'read', scope: 'own', description: 'View own profile' },
      { name: 'user.profile.update', module: 'user', resource: 'profile', action: 'update', scope: 'own', description: 'Update own profile' },
      { name: 'user.profile.delete', module: 'user', resource: 'profile', action: 'delete', scope: 'own', description: 'Delete own profile' },
      
      { name: 'user.preferences.read', module: 'user', resource: 'preferences', action: 'read', scope: 'own', description: 'View own preferences' },
      { name: 'user.preferences.update', module: 'user', resource: 'preferences', action: 'update', scope: 'own', description: 'Update own preferences' },
      
      { name: 'user.notifications.read', module: 'user', resource: 'notifications', action: 'read', scope: 'own', description: 'View own notifications' },
      { name: 'user.notifications.manage', module: 'user', resource: 'notifications', action: 'manage', scope: 'own', description: 'Manage own notification settings' },
      
      { name: 'user.content.create', module: 'user', resource: 'content', action: 'create', scope: 'own', description: 'Create own content' },
      { name: 'user.content.read', module: 'user', resource: 'content', action: 'read', scope: 'own', description: 'View own content' },
      { name: 'user.content.update', module: 'user', resource: 'content', action: 'update', scope: 'own', description: 'Update own content' },
      { name: 'user.content.delete', module: 'user', resource: 'content', action: 'delete', scope: 'own', description: 'Delete own content' },
      
      { name: 'user.files.upload', module: 'user', resource: 'files', action: 'upload', scope: 'own', description: 'Upload files' },
      { name: 'user.files.read', module: 'user', resource: 'files', action: 'read', scope: 'own', description: 'View own files' },
      { name: 'user.files.delete', module: 'user', resource: 'files', action: 'delete', scope: 'own', description: 'Delete own files' },
      
      { name: 'user.messages.send', module: 'user', resource: 'messages', action: 'send', scope: 'own', description: 'Send messages' },
      { name: 'user.messages.read', module: 'user', resource: 'messages', action: 'read', scope: 'own', description: 'Read messages' },
      
      { name: 'user.api.access', module: 'user', resource: 'api', action: 'access', scope: 'own', description: 'Access user API' },
      
      { name: 'user.sessions.manage', module: 'user', resource: 'sessions', action: 'manage', scope: 'own', description: 'Manage own sessions' },
      
      { name: 'user.security.manage', module: 'user', resource: 'security', action: 'manage', scope: 'own', description: 'Manage own security settings' },
      
      { name: 'user.data.export', module: 'user', resource: 'data', action: 'export', scope: 'own', description: 'Export own data' },
      
      // Public Permissions
      { name: 'public.content.read', module: 'public', resource: 'content', action: 'read', scope: 'public', description: 'View public content' },
      { name: 'public.search', module: 'public', resource: 'search', action: 'perform', scope: 'public', description: 'Perform public searches' },
      { name: 'public.register', module: 'public', resource: 'auth', action: 'register', scope: 'public', description: 'Register new account' },
      { name: 'public.login', module: 'public', resource: 'auth', action: 'login', scope: 'public', description: 'Login to system' },
      { name: 'public.password.reset', module: 'public', resource: 'auth', action: 'reset', scope: 'public', description: 'Reset password' },
      { name: 'public.docs.read', module: 'public', resource: 'docs', action: 'read', scope: 'public', description: 'View documentation' },
      { name: 'public.api.docs', module: 'public', resource: 'api', action: 'docs', scope: 'public', description: 'View API documentation' },
      { name: 'public.contact', module: 'public', resource: 'support', action: 'contact', scope: 'public', description: 'Contact support' },
      { name: 'public.status', module: 'public', resource: 'system', action: 'status', scope: 'public', description: 'View system status' },
      { name: 'public.plans.view', module: 'public', resource: 'plans', action: 'view', scope: 'public', description: 'View available plans' },
      
      // Admin-specific
      { name: 'admin.access', module: 'admin', resource: 'panel', action: 'access', scope: 'platform', description: 'Access admin panel' },
    ];

    // Update all permissions
    let updated = 0;
    let created = 0;
    let errors = 0;

    for (const perm of permissionUpdates) {
      try {
        // Check if permission exists
        const existing = await prisma.permission.findFirst({
          where: { name: perm.name }
        });

        if (existing) {
          // Update existing permission
          await prisma.permission.update({
            where: { id: existing.id },
            data: {
              module: perm.module,
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
              description: perm.description,
              pattern: `${perm.module}:${perm.resource}:${perm.action}`,
              is_system: true
            }
          });
          updated++;
          console.log(`✅ Updated: ${perm.name}`);
        } else {
          // Create new permission
          await prisma.permission.create({
            data: {
              name: perm.name,
              module: perm.module,
              resource: perm.resource,
              action: perm.action,
              scope: perm.scope,
              description: perm.description,
              pattern: `${perm.module}:${perm.resource}:${perm.action}`,
              is_system: true
            }
          });
          created++;
          console.log(`✨ Created: ${perm.name}`);
        }
      } catch (error) {
        console.error(`❌ Error with ${perm.name}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Updated: ${updated}`);
    console.log(`  Created: ${created}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total: ${updated + created}`);

    // Verify the updates
    console.log('\n🔍 Verifying Schema Updates...');
    const verifyResults = await prisma.permission.groupBy({
      by: ['module'],
      _count: true,
      orderBy: {
        module: 'asc'
      }
    });

    console.log('\nPermissions by Module:');
    verifyResults.forEach(result => {
      console.log(`  ${result.module || 'NULL'}: ${result._count} permissions`);
    });

    // Check for any permissions without proper structure
    const invalidPerms = await prisma.permission.findMany({
      where: {
        OR: [
          { module: null },
          { resource: null },
          { action: null },
          { scope: null }
        ]
      }
    });

    if (invalidPerms.length > 0) {
      console.log(`\n⚠️  Found ${invalidPerms.length} permissions with missing fields:`);
      invalidPerms.forEach(p => {
        console.log(`  - ${p.name}: module=${p.module}, resource=${p.resource}, action=${p.action}, scope=${p.scope}`);
      });
    } else {
      console.log('\n✅ All permissions have complete schema!');
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissionSchema();