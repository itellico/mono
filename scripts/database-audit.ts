#!/usr/bin/env tsx
/**
 * Database Audit Script
 * Verifies the complete platform installation including RBAC, tenants, accounts, and users
 */

import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function auditDatabase() {
  console.log(chalk.bold.cyan('\n═══ Database Installation Audit ═══\n'));

  try {
    // 1. Audit Tenants
    console.log(chalk.bold.yellow('📋 TENANTS'));
    const tenants = await prisma.tenant.findMany();
    console.log(`Total Tenants: ${chalk.green(tenants.length)}`);
    tenants.forEach(t => {
      console.log(`  - ${t.name} (${t.domain}) - ${t.is_active ? chalk.green('Active') : chalk.red('Inactive')}`);
    });

    // 2. Audit RBAC System
    console.log(chalk.bold.yellow('\n🔐 RBAC SYSTEM'));
    const permissions = await prisma.permission.count();
    const roles = await prisma.role.findMany();
    const rolePermissions = await prisma.rolePermission.count();
    
    console.log(`Total Permissions: ${chalk.green(permissions)}`);
    console.log(`Total Roles: ${chalk.green(roles.length)}`);
    console.log(`Role-Permission Mappings: ${chalk.green(rolePermissions)}`);
    
    console.log('\nRoles breakdown:');
    for (const role of roles) {
      const perms = await prisma.rolePermission.count({
        where: { role_id: role.id }
      });
      console.log(`  - ${role.name} (${role.code}): ${chalk.cyan(perms)} permissions`);
    }

    // 3. Audit Accounts
    console.log(chalk.bold.yellow('\n🏢 ACCOUNTS'));
    const accounts = await prisma.account.findMany({
      include: {
        tenant: true,
        _count: {
          select: { users: true }
        }
      }
    });
    console.log(`Total Accounts: ${chalk.green(accounts.length)}`);
    
    const accountsByType = accounts.reduce((acc, a) => {
      acc[a.account_type] = (acc[a.account_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nAccounts by type:');
    Object.entries(accountsByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${chalk.cyan(count)}`);
    });
    
    console.log('\nAccount details:');
    accounts.forEach(a => {
      console.log(`  - ${a.email} (${a.account_type}) - ${a._count.users} users`);
    });

    // 4. Audit Users
    console.log(chalk.bold.yellow('\n👥 USERS'));
    const users = await prisma.user.findMany({
      include: {
        account: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    console.log(`Total Users: ${chalk.green(users.length)}`);
    
    const usersByType = users.reduce((acc, u) => {
      acc[u.user_type] = (acc[u.user_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nUsers by type:');
    Object.entries(usersByType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${chalk.cyan(count)}`);
    });

    // 5. Users without roles check
    const usersWithoutRoles = users.filter(u => u.userRoles.length === 0);
    if (usersWithoutRoles.length > 0) {
      console.log(chalk.red(`\n⚠️  Users without roles: ${usersWithoutRoles.length}`));
      usersWithoutRoles.forEach(u => {
        console.log(chalk.red(`  - ${u.username} (${u.user_type})`));
      });
    } else {
      console.log(chalk.green('\n✓ All users have role assignments'));
    }

    // 6. User role distribution
    console.log(chalk.bold.yellow('\n🎭 USER ROLE DISTRIBUTION'));
    const roleDistribution = users.reduce((acc, u) => {
      u.userRoles.forEach(ur => {
        const roleCode = ur.role.code;
        acc[roleCode] = (acc[roleCode] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`  - ${role}: ${chalk.cyan(count)} users`);
    });

    // 7. Verification Summary
    console.log(chalk.bold.cyan('\n═══ VERIFICATION SUMMARY ═══\n'));
    
    const checks = [
      { name: 'Platform tenant exists', passed: tenants.some(t => t.slug === 'main-platform') },
      { name: 'GoModels tenant exists', passed: tenants.some(t => t.domain === 'go-models.com') },
      { name: '125+ permissions loaded', passed: permissions >= 125 },
      { name: '8 roles created', passed: roles.length === 8 },
      { name: 'Admin user exists', passed: users.some(u => u.username === 'admin') },
      { name: 'All users have roles', passed: usersWithoutRoles.length === 0 },
      { name: '5 account types created', passed: accounts.length >= 5 },
      { name: '19 users created', passed: users.length >= 19 },
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      if (check.passed) {
        console.log(chalk.green(`✓ ${check.name}`));
      } else {
        console.log(chalk.red(`✗ ${check.name}`));
        allPassed = false;
      }
    });
    
    if (allPassed) {
      console.log(chalk.bold.green('\n🎉 All verification checks passed! Installation successful.'));
    } else {
      console.log(chalk.bold.red('\n⚠️  Some verification checks failed. Please review the installation.'));
    }

    // 8. Sample user credentials
    console.log(chalk.bold.cyan('\n═══ SAMPLE USER CREDENTIALS ═══\n'));
    console.log('Platform Admin:');
    console.log(`  Username: ${chalk.yellow('admin@itellico.ai')}`);
    console.log(`  Password: ${chalk.yellow('Admin123!@#')}`);
    console.log('\nTenant Admin:');
    console.log(`  Username: ${chalk.yellow('admin@go-models.com')}`);
    console.log(`  Password: ${chalk.yellow('Admin123!@#')}`);
    console.log('\nSample Account Admin:');
    console.log(`  Username: ${chalk.yellow('stefan@elite-models.com')}`);
    console.log(`  Password: ${chalk.yellow('Stefan123!@#')}`);

  } catch (error) {
    console.error(chalk.red('Error during audit:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditDatabase();