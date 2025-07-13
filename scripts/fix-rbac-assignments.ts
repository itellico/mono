#!/usr/bin/env tsx
/**
 * Fix missing RBAC role assignments for all users
 * This script assigns appropriate roles based on user_type and account_role
 */

import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function fixRoleAssignments() {
  console.log(chalk.bold.cyan('\n═══ Fixing RBAC Role Assignments ═══\n'));

  try {
    // Get all users with their current role assignments
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        },
        account: true
      }
    });

    // Get all roles
    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map(r => [r.code, r]));

    let fixedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Skip if user already has roles
      if (user.userRoles.length > 0) {
        console.log(chalk.green(`✓ ${user.username} already has roles assigned`));
        skippedCount++;
        continue;
      }

      // Determine appropriate role based on user type and account role
      let roleCode: string | null = null;

      // Check user_type first
      if (user.user_type === 'admin') {
        // Platform admins
        if (user.username === 'admin') {
          roleCode = 'super_admin';
        } else {
          roleCode = 'tenant_admin';
        }
      } else if (user.account_role) {
        // Use account_role if set
        switch (user.account_role) {
          case 'account_admin':
            roleCode = 'account_admin';
            break;
          case 'account_manager':
            roleCode = 'account_manager';
            break;
          case 'entity_viewer':
          default:
            roleCode = 'user';
            break;
        }
      } else {
        // Default to user role
        roleCode = 'user';
      }

      // Special handling for specific usernames
      const usernameRoleMap: { [key: string]: string } = {
        'gomodels_admin': 'tenant_admin',
        'casting_director': 'tenant_admin',
        'support_team': 'tenant_admin',
        'talent_manager': 'tenant_admin',
        'elite_director': 'account_admin',
        'stefan_berger': 'account_admin',
        'sabine_mueller': 'account_admin',
        'collective_founder': 'account_admin',
        'sophie_laurent': 'account_admin',
        'elite_booking': 'account_manager',
        'thomas_mueller': 'account_manager',
        'sophie_manager': 'account_manager',
      };

      if (usernameRoleMap[user.username]) {
        roleCode = usernameRoleMap[user.username];
      }

      const role = roleMap.get(roleCode);
      if (!role) {
        console.log(chalk.yellow(`⚠ Role not found: ${roleCode} for user ${user.username}`));
        continue;
      }

      // Assign the role
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: role.id
        }
      });

      console.log(chalk.cyan(`→ Assigned ${roleCode} role to ${user.username}`));
      fixedCount++;
    }

    // Summary
    console.log(chalk.bold.green(`\n✓ Fixed ${fixedCount} users`));
    console.log(chalk.bold.blue(`ℹ Skipped ${skippedCount} users (already had roles)`));

    // Verify the fix
    console.log(chalk.bold.cyan('\n═══ Verification ═══\n'));
    
    const usersWithoutRoles = await prisma.user.findMany({
      where: {
        userRoles: {
          none: {}
        }
      }
    });

    if (usersWithoutRoles.length === 0) {
      console.log(chalk.green('✓ All users now have role assignments!'));
    } else {
      console.log(chalk.red(`✗ ${usersWithoutRoles.length} users still without roles:`));
      usersWithoutRoles.forEach(u => {
        console.log(chalk.red(`  - ${u.username}`));
      });
    }

  } catch (error) {
    console.error(chalk.red('Error fixing role assignments:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRoleAssignments();