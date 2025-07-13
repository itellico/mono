#!/usr/bin/env tsx
/**
 * Master Installation Script for itellico Mono Platform
 * 
 * This script installs the complete platform from JSON configuration files.
 * It can install the platform only, specific tenants, or everything.
 * 
 * Usage:
 *   pnpm tsx installation/install.ts                    # Install platform only
 *   pnpm tsx installation/install.ts --tenant=go-models.com  # Platform + specific tenant
 *   pnpm tsx installation/install.ts --all              # Install everything
 *   pnpm tsx installation/install.ts --dry-run          # Preview what would be installed
 *   pnpm tsx installation/install.ts --reset            # Reset database before install
 *   pnpm tsx installation/install.ts --validate-only    # Validate JSONs only
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import chalk from 'chalk';
import ora from 'ora';
import { z } from 'zod';

// Initialize Prisma
const prisma = new PrismaClient({
  log: process.env.DEBUG ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Command line arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  tenant: args.find(arg => arg.startsWith('--tenant='))?.split('=')[1],
  dryRun: args.includes('--dry-run'),
  reset: args.includes('--reset'),
  validateOnly: args.includes('--validate-only'),
  verbose: args.includes('--verbose') || process.env.DEBUG === 'true',
  adminPassword: args.find(arg => arg.startsWith('--admin-password='))?.split('=')[1],
};

// Installation paths
const INSTALLATION_DIR = path.join(process.cwd(), 'installation');
const PLATFORM_DIR = path.join(INSTALLATION_DIR, 'platform');
const TENANTS_DIR = path.join(INSTALLATION_DIR, 'tenants');

// Logging utilities
const log = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✓'), msg),
  warning: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  error: (msg: string) => console.log(chalk.red('✗'), msg),
  debug: (msg: string) => options.verbose && console.log(chalk.gray('→'), msg),
  section: (msg: string) => console.log(`\n${chalk.bold.cyan(`═══ ${msg} ═══`)}\n`),
};

// Progress spinner
let spinner: any = null;

// Generate deterministic UUID from string
function generateUUID(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(12, 15),
    ((parseInt(hash.substring(15, 16), 16) & 0x3) | 0x8).toString(16) + hash.substring(16, 19),
    hash.substring(19, 31),
  ].join('-');
}

// Load and parse JSON file
async function loadJSON<T = any>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error}`);
  }
}

// Validate all JSON files
async function validateJSONFiles(): Promise<boolean> {
  log.section('Validating JSON Files');
  
  const files = [
    // Platform files
    path.join(PLATFORM_DIR, 'platform-config.json'),
    path.join(PLATFORM_DIR, 'default-tenant.json'),
    path.join(PLATFORM_DIR, 'admin-user.json'),
    path.join(PLATFORM_DIR, 'rbac-complete.json'),
    path.join(PLATFORM_DIR, 'categories.json'),
    path.join(PLATFORM_DIR, 'tags.json'),
    path.join(PLATFORM_DIR, 'option-sets.json'),
    path.join(PLATFORM_DIR, 'features.json'),
    path.join(PLATFORM_DIR, 'plans.json'),
  ];

  // Add tenant files if specified
  if (options.tenant || options.all) {
    const tenantsToCheck = options.all 
      ? await fs.readdir(TENANTS_DIR)
      : [options.tenant!];

    for (const tenant of tenantsToCheck) {
      const tenantDir = path.join(TENANTS_DIR, tenant);
      const tenantFiles = await fs.readdir(tenantDir);
      
      for (const file of tenantFiles) {
        if (file.endsWith('.json')) {
          files.push(path.join(tenantDir, file));
        }
      }
    }
  }

  let allValid = true;
  
  for (const file of files) {
    try {
      await loadJSON(file);
      log.success(`Valid: ${path.relative(INSTALLATION_DIR, file)}`);
    } catch (error) {
      log.error(`Invalid: ${path.relative(INSTALLATION_DIR, file)} - ${error}`);
      allValid = false;
    }
  }

  return allValid;
}

// Install platform configuration
async function installPlatform() {
  log.section('Installing Platform Configuration');

  // Load platform config
  const platformConfig = await loadJSON(path.join(PLATFORM_DIR, 'platform-config.json'));
  const defaultTenant = await loadJSON(path.join(PLATFORM_DIR, 'default-tenant.json'));
  const adminUser = await loadJSON(path.join(PLATFORM_DIR, 'admin-user.json'));
  const rbac = await loadJSON(path.join(PLATFORM_DIR, 'rbac-complete.json'));
  const categories = await loadJSON(path.join(PLATFORM_DIR, 'categories.json'));
  const tags = await loadJSON(path.join(PLATFORM_DIR, 'tags.json'));
  const optionSets = await loadJSON(path.join(PLATFORM_DIR, 'option-sets.json'));
  const features = await loadJSON(path.join(PLATFORM_DIR, 'features.json'));
  const plans = await loadJSON(path.join(PLATFORM_DIR, 'plans.json'));

  if (options.dryRun) {
    log.info('DRY RUN: Would install platform configuration');
    log.debug(`Platform: ${platformConfig.platform.name} v${platformConfig.platform.version}`);
    log.debug(`Default Tenant: ${defaultTenant.tenant.name}`);
    log.debug(`Admin User: ${adminUser.admin.email}`);
    log.debug(`Roles: ${rbac.roles.length}`);
    log.debug(`Permissions: ${rbac.permissions.filter((p: any) => p.name).length}`);
    log.debug(`Categories: ${categories.categories.length}`);
    log.debug(`Tags: ${tags.tags.reduce((acc: number, cat: any) => acc + cat.tags.length, 0)}`);
    log.debug(`Option Sets: ${optionSets.optionSets.length}`);
    log.debug(`Features: ${features.features.length}`);
    log.debug(`Plans: ${plans.plans.length}`);
    return;
  }

  // Step 1: Create default tenant
  spinner = ora('Creating default tenant...').start();
  
  const tenant = await prisma.tenant.upsert({
    where: { domain: defaultTenant.tenant.domain },
    update: {
      name: defaultTenant.tenant.name,
      domain: defaultTenant.tenant.domain,
      description: defaultTenant.tenant.description,
      is_active: defaultTenant.tenant.is_active,
      features: defaultTenant.tenant.features,
      settings: defaultTenant.tenant.settings,
    },
    create: {
      uuid: generateUUID(`tenant-${defaultTenant.tenant.slug}`),
      name: defaultTenant.tenant.name,
      domain: defaultTenant.tenant.domain,
      slug: defaultTenant.tenant.slug,
      description: defaultTenant.tenant.description,
      is_active: defaultTenant.tenant.is_active,
      features: defaultTenant.tenant.features,
      settings: defaultTenant.tenant.settings,
    },
  });
  
  spinner.succeed(`Created default tenant: ${tenant.name}`);

  // Step 2: Create RBAC - Permissions first
  spinner = ora('Installing permissions...').start();
  
  const permissionMap = new Map();
  const validPermissions = rbac.permissions.filter((p: any) => p.name);
  
  for (const perm of validPermissions) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
      },
      create: {
        uuid: generateUUID(`permission-${perm.name}`),
        name: perm.name,
        description: perm.description,
        resource: perm.resource,
        action: perm.action,
      },
    });
    permissionMap.set(perm.name, permission);
  }
  
  spinner.succeed(`Installed ${permissionMap.size} permissions`);

  // Step 3: Create roles and assign permissions
  spinner = ora('Creating roles...').start();
  
  const roleMap = new Map();
  
  for (const roleData of rbac.roles) {
    const role = await prisma.role.upsert({
      where: { code: roleData.name },
      update: {
        description: roleData.description,
      },
      create: {
        uuid: generateUUID(`role-${roleData.name}`),
        name: roleData.description || roleData.name,
        code: roleData.name,
        description: roleData.description,
        tenant_id: tenant.id,
      },
    });
    
    roleMap.set(roleData.name, role);

    // Assign permissions to role
    const permissionIds: number[] = [];
    
    if (roleData.permissions.includes('*')) {
      // Super admin gets all permissions
      permissionIds.push(...Array.from(permissionMap.values()).map((p: any) => p.id));
    } else {
      for (const permPattern of roleData.permissions) {
        if (permPattern.endsWith('*')) {
          // Wildcard permissions
          const prefix = permPattern.slice(0, -1);
          const matchingPerms = Array.from(permissionMap.entries())
            .filter(([name]) => name.startsWith(prefix))
            .map(([, perm]) => perm.id);
          permissionIds.push(...matchingPerms);
        } else if (permissionMap.has(permPattern)) {
          // Exact permission
          permissionIds.push(permissionMap.get(permPattern).id);
        }
      }
    }

    // Create role-permission associations
    for (const permissionId of permissionIds) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: role.id,
            permission_id: permissionId,
          },
        },
        update: {},
        create: {
          role_id: role.id,
          permission_id: permissionId,
        },
      });
    }
  }
  
  spinner.succeed(`Created ${roleMap.size} roles`);

  // Step 4: Create default platform account for admin
  spinner = ora('Creating platform account...').start();
  
  const platformAccount = await prisma.account.upsert({
    where: { email: 'platform@itellico.ai' },
    update: {
      is_active: true,
    },
    create: {
      uuid: generateUUID('platform-account'),
      tenant_id: tenant.id,
      email: 'platform@itellico.ai',
      account_type: 'platform',
      timezone: 'Europe/Vienna',
      language_locale: 'en-US',
      currency_code: 'EUR',
      is_active: true,
      is_verified: true,
    },
  });
  
  spinner.succeed('Created platform account');

  // Step 5: Create admin user
  spinner = ora('Creating admin user...').start();
  
  const adminPassword = options.adminPassword || 
    process.env.ADMIN_PASSWORD || 
    adminUser.admin.password.replace('${ADMIN_PASSWORD:-', '').replace('}', '');
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { username: adminUser.admin.username },
    update: {
      first_name: adminUser.admin.firstName,
      last_name: adminUser.admin.lastName,
      is_active: adminUser.admin.isActive,
    },
    create: {
      uuid: generateUUID(`user-${adminUser.admin.email}`),
      account_id: platformAccount.id,
      first_name: adminUser.admin.firstName,
      last_name: adminUser.admin.lastName,
      username: adminUser.admin.username,
      user_type: 'admin',
      is_active: adminUser.admin.isActive,
      is_verified: adminUser.admin.emailVerified || false,
    },
  });

  // Assign roles to admin user
  for (const roleName of adminUser.admin.roles) {
    if (roleMap.has(roleName)) {
      await prisma.userRole.upsert({
        where: {
          user_id_role_id: {
            user_id: admin.id,
            role_id: roleMap.get(roleName).id,
          },
        },
        update: {},
        create: {
          user_id: admin.id,
          role_id: roleMap.get(roleName).id,
        },
      });
    }
  }
  
  spinner.succeed(`Created admin user: ${admin.email}`);

  // Step 5: Create categories (SKIPPED - Category model not in schema)
  log.warning('Skipping platform categories - Category model not found in current schema');
  const categoryCount = 0;

  // Step 6: Create tags (SKIPPED - Tag model not in schema) 
  log.warning('Skipping platform tags - Tag model not found in current schema');
  const tagCount = 0;

  // Step 7: Create option sets (SKIPPED - OptionSet model not in schema)
  log.warning('Skipping platform option sets - OptionSet/OptionValue models not found in current schema');
  const optionSetCount = 0;
  const optionValueCount = 0;

  log.success('Platform installation completed successfully!');
}

// Install specific tenant
async function installTenant(tenantSlug: string) {
  log.section(`Installing Tenant: ${tenantSlug}`);

  const tenantDir = path.join(TENANTS_DIR, tenantSlug);
  
  // Check if tenant directory exists
  try {
    await fs.access(tenantDir);
  } catch {
    throw new Error(`Tenant directory not found: ${tenantDir}`);
  }

  // Load tenant configuration files
  const tenantConfig = await loadJSON(path.join(tenantDir, 'tenant-config.json'));
  const tenantUsers = await loadJSON(path.join(tenantDir, 'tenant-users.json'));
  const tenantCategories = await loadJSON(path.join(tenantDir, 'categories.json'));
  const tenantTags = await loadJSON(path.join(tenantDir, 'tags.json'));
  const tenantOptionSets = await loadJSON(path.join(tenantDir, 'option-sets.json'));
  
  // Load account files if they exist
  let tenantAccounts: any = null;
  let tenantAccountUsers: any = null;
  let tenantProfiles: any = null;
  try {
    tenantAccounts = await loadJSON(path.join(tenantDir, 'accounts.json'));
    tenantAccountUsers = await loadJSON(path.join(tenantDir, 'account-users.json'));
    tenantProfiles = await loadJSON(path.join(tenantDir, 'profiles.json'));
  } catch {
    // Files might not exist for all tenants
  }

  if (options.dryRun) {
    log.info(`DRY RUN: Would install tenant ${tenantConfig.tenant.name}`);
    log.debug(`Domain: ${tenantConfig.tenant.domain}`);
    log.debug(`Industry: ${tenantConfig.tenant.industry}`);
    log.debug(`Users: ${tenantUsers.users.length}`);
    log.debug(`Categories: ${tenantCategories.categories.length}`);
    log.debug(`Tags: ${tenantTags.tags.reduce((acc: number, cat: any) => acc + cat.tags.length, 0)}`);
    log.debug(`Option Sets: ${tenantOptionSets.optionSets.length}`);
    
    if (tenantAccounts) {
      log.debug(`Accounts: ${tenantAccounts.accounts.length}`);
      log.debug(`Account Users: ${tenantAccountUsers.accountUsers.filter((u: any) => u.email).length}`);
      log.debug(`Profiles: ${tenantProfiles.profiles.filter((p: any) => p.displayName).length}`);
    }
    
    return;
  }

  // Step 1: Create tenant
  spinner = ora(`Creating tenant ${tenantConfig.tenant.name}...`).start();
  
  const tenant = await prisma.tenant.upsert({
    where: { domain: tenantConfig.tenant.domain },
    update: {
      name: tenantConfig.tenant.name,
      domain: tenantConfig.tenant.domain,
      description: tenantConfig.tenant.description,
      is_active: tenantConfig.tenant.is_active,
      features: tenantConfig.tenant.features,
      settings: tenantConfig.tenant.settings,
      categories: tenantConfig.tenant.industry ? [tenantConfig.tenant.industry] : undefined,
    },
    create: {
      uuid: generateUUID(`tenant-${tenantConfig.tenant.slug}`),
      name: tenantConfig.tenant.name,
      domain: tenantConfig.tenant.domain,
      slug: tenantConfig.tenant.slug,
      description: tenantConfig.tenant.description,
      is_active: tenantConfig.tenant.is_active,
      features: tenantConfig.tenant.features,
      settings: tenantConfig.tenant.settings,
      categories: tenantConfig.tenant.industry ? [tenantConfig.tenant.industry] : undefined,
    },
  });
  
  spinner.succeed(`Created tenant: ${tenant.name}`);

  // Step 2: Create accounts if account configuration exists
  const accountMap = new Map();
  
  if (tenantAccounts && tenantAccounts.accounts) {
    spinner = ora('Creating accounts...').start();
    
    for (const accountData of tenantAccounts.accounts) {
      const account = await prisma.account.upsert({
        where: { email: accountData.email },
        update: {
          account_type: accountData.type,
          phone: accountData.phone,
          is_active: true,
          is_verified: accountData.metadata?.verified || false,
        },
        create: {
          uuid: generateUUID(`account-${accountData.slug}`),
          tenant_id: tenant.id,
          email: accountData.email,
          account_type: accountData.type,
          phone: accountData.phone,
          city: accountData.address?.city,
          country_code: accountData.address?.country,
          timezone: 'Europe/Vienna',
          language_locale: 'en-US',
          currency_code: 'EUR',
          is_active: true,
          is_verified: accountData.metadata?.verified || false,
          account_capabilities: accountData.settings,
        },
      });
      
      accountMap.set(accountData.slug, account);
    }
    
    spinner.succeed(`Created ${tenantAccounts.accounts.length} accounts`);
  }

  // Step 3: Create tenant users
  spinner = ora('Creating tenant users...').start();
  
  const roleCache = await prisma.role.findMany({
    where: { tenant_id: tenant.id },
  });
  const roleMap = new Map(roleCache.map(r => [r.name, r]));
  
  for (const userData of tenantUsers.users) {
    const password = userData.password.includes('$') 
      ? userData.password.split(':')[1].replace('}', '')
      : userData.password;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        is_active: userData.isActive,
      },
      create: {
        uuid: generateUUID(`user-${userData.email}`),
        account_id: 1, // Will be updated when we create accounts
        first_name: userData.firstName,
        last_name: userData.lastName,
        username: userData.username,
        user_type: 'admin',
        is_active: userData.isActive,
        is_verified: userData.emailVerified || false,
      },
    });

    // Assign roles
    for (const roleName of userData.roles || []) {
      const role = roleMap.get(roleName);
      if (role) {
        await prisma.userRole.upsert({
          where: {
            user_id_role_id: {
              user_id: user.id,
              role_id: role.id,
            },
          },
          update: {},
          create: {
            user_id: user.id,
            role_id: role.id,
          },
        });
      }
    }
  }
  
  spinner.succeed(`Created ${tenantUsers.users.length} users`);
  
  // Step 4: Create account users if account configuration exists
  if (tenantAccountUsers && tenantAccountUsers.accountUsers) {
    spinner = ora('Creating account users...').start();
    
    const accountUserCount = tenantAccountUsers.accountUsers.filter((u: any) => u.email).length;
    
    for (const userData of tenantAccountUsers.accountUsers) {
      // Skip comment entries
      if (!userData.email) continue;
      
      const account = accountMap.get(userData.accountSlug);
      if (!account) {
        log.warning(`Account not found for user ${userData.email}: ${userData.accountSlug}`);
        continue;
      }
      
      const password = userData.password.includes('$') 
        ? userData.password.split(':')[1].replace('}', '')
        : userData.password;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          account_id: account.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          user_type: userData.metadata?.category ? 'model' : 'individual',
          bio: userData.metadata?.age ? `Age: ${userData.metadata.age}` : undefined,
          is_active: userData.isActive,
          is_verified: userData.emailVerified,
          account_role: userData.roles?.includes('account_admin') ? 'account_admin' : 
                       userData.roles?.includes('account_manager') ? 'account_manager' : 'entity_viewer',
        },
        create: {
          uuid: generateUUID(`user-${userData.username}`),
          account_id: account.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          user_type: userData.metadata?.category ? 'model' : 'individual',
          bio: userData.metadata?.age ? `Age: ${userData.metadata.age}` : undefined,
          user_hash: generateUUID(`userhash-${userData.username}`),
          is_active: userData.isActive,
          is_verified: userData.emailVerified,
          account_role: userData.roles?.includes('account_admin') ? 'account_admin' : 
                       userData.roles?.includes('account_manager') ? 'account_manager' : 'entity_viewer',
        },
      });
      
      // Handle guardian relationships for child models
      if (userData.metadata?.guardians) {
        // This would require additional logic to track relationships
        log.debug(`User ${userData.username} has guardians: ${userData.metadata.guardians.join(', ')}`);
      }
    }
    
    spinner.succeed(`Created ${accountUserCount} account users`);
  }

  // Step 5: Create tenant categories (SKIPPED - Category model not in schema)
  log.warning('Skipping categories - Category model not found in current schema');
  const categoryCount = 0;

  // Step 6: Create tenant tags (SKIPPED - Tag model not in schema)
  log.warning('Skipping tags - Tag model not found in current schema');
  const tagCount = 0;

  // Step 7: Create tenant option sets (SKIPPED - OptionSet model not in schema)
  log.warning('Skipping option sets - OptionSet/OptionValue models not found in current schema');
  const optionSetCount = 0;
  const optionValueCount = 0;

  // Step 8: Create profiles (SKIPPED - Profile model not in schema)
  if (tenantProfiles && tenantProfiles.profiles) {
    const profileCount = tenantProfiles.profiles.filter((p: any) => p.displayName).length;
    log.warning(`Skipping ${profileCount} profiles - Profile model not found in current schema`);
  }

  log.success(`Tenant ${tenantConfig.tenant.name} installed successfully!`);
}

// Get available tenants
async function getAvailableTenants(): Promise<string[]> {
  try {
    const entries = await fs.readdir(TENANTS_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

// Main installation function
async function install() {
  try {
    log.section('itellico Mono Platform Installer');
    
    // Validate JSON files
    if (!await validateJSONFiles()) {
      log.error('JSON validation failed. Please fix the errors and try again.');
      process.exit(1);
    }

    if (options.validateOnly) {
      log.success('All JSON files are valid!');
      process.exit(0);
    }

    // Reset database if requested
    if (options.reset && !options.dryRun) {
      log.warning('Resetting database...');
      // Note: In production, you'd want more safeguards here
      await prisma.$executeRaw`TRUNCATE TABLE "User", "Role", "Permission", "RolePermission", "UserRole", "Tenant", "Category", "Tag", "OptionSet", "OptionValue" CASCADE`;
      log.success('Database reset complete');
    }

    // Install platform
    await installPlatform();

    // Install tenants
    if (options.all) {
      const tenants = await getAvailableTenants();
      log.info(`Found ${tenants.length} tenants to install`);
      
      for (const tenant of tenants) {
        await installTenant(tenant);
      }
    } else if (options.tenant) {
      await installTenant(options.tenant);
    }

    log.section('Installation Complete!');
    
    if (!options.dryRun) {
      log.info('\nYou can now access:');
      log.info(`  Platform Admin: ${chalk.cyan('http://localhost:3000')}`);
      log.info(`  API Documentation: ${chalk.cyan('http://localhost:3001/docs')}`);
      log.info(`  Admin Login: ${chalk.cyan('admin@itellico.ai')} / ${chalk.yellow('[your-password]')}`);
      
      if (options.tenant || options.all) {
        log.info('\nTenant URLs:');
        const installedTenants = options.all ? await getAvailableTenants() : [options.tenant!];
        for (const tenant of installedTenants) {
          log.info(`  ${tenant}: ${chalk.cyan(`http://${tenant}:3000`)}`);
        }
      }
    }

  } catch (error) {
    log.error(`Installation failed: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show help
function showHelp() {
  console.log(`
${chalk.bold('itellico Mono Platform Installer')}

${chalk.yellow('Usage:')}
  pnpm tsx installation/install.ts [options]

${chalk.yellow('Options:')}
  --all                    Install platform and all tenants
  --tenant=<name>          Install platform and specific tenant
  --dry-run               Preview what would be installed
  --reset                 Reset database before installation
  --validate-only         Validate JSON files only
  --admin-password=<pass> Set admin password (default: Admin123!@#)
  --verbose               Show detailed output
  --help                  Show this help message

${chalk.yellow('Examples:')}
  pnpm tsx installation/install.ts
  pnpm tsx installation/install.ts --tenant=go-models.com
  pnpm tsx installation/install.ts --all
  pnpm tsx installation/install.ts --dry-run --all
  pnpm tsx installation/install.ts --reset --all
`);
}

// Run installer
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  install();
}