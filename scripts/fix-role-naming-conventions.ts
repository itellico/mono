#!/usr/bin/env npx tsx
/**
 * Fix Role Naming Conventions Script
 * 
 * This script ensures all role codes follow lowercase snake_case convention
 * throughout the codebase.
 * 
 * Usage:
 *   npm run fix:roles           # Fix database and code
 *   npm run fix:roles -- --dry  # Preview changes without applying
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const prisma = new PrismaClient();

const isDryRun = process.argv.includes('--dry');

// Mapping of uppercase to lowercase role codes
const ROLE_CODE_MAPPING = {
  'super_admin': 'super_admin',
  'platform_admin': 'platform_admin',
  'tenant_admin': 'tenant_admin',
  'tenant_manager': 'tenant_manager',
  'account_admin': 'account_admin',
  'account_manager': 'account_manager',
  'user': 'user',
  'guest': 'guest'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

// Fix role codes in database
async function fixDatabaseRoles() {
  log.section('Fixing Database Role Codes');
  
  try {
    // Get all roles with uppercase codes
    const roles = await prisma.role.findMany({
      where: {
        code: {
          in: Object.keys(ROLE_CODE_MAPPING)
        }
      }
    });

    if (roles.length === 0) {
      log.info('No roles with uppercase codes found in database');
      return;
    }

    log.info(`Found ${roles.length} roles with uppercase codes`);

    // Update each role
    for (const role of roles) {
      const newCode = ROLE_CODE_MAPPING[role.code as keyof typeof ROLE_CODE_MAPPING];
      
      if (isDryRun) {
        log.warning(`Would update role: ${role.name} (${role.code} → ${newCode})`);
      } else {
        await prisma.role.update({
          where: { id: role.id },
          data: { code: newCode }
        });
        log.success(`Updated role: ${role.name} (${role.code} → ${newCode})`);
      }
    }
  } catch (error) {
    log.error(`Database update failed: ${error}`);
    throw error;
  }
}

// Fix role codes in source files
async function fixSourceFiles() {
  log.section('Fixing Role Codes in Source Files');
  
  // Patterns to search for
  const patterns = [
    'apps/**/*.{ts,tsx,js,jsx}',
    'packages/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.{ts,js}'
  ];

  // Files to exclude
  const excludePatterns = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/archive/**'
  ];

  let totalFiles = 0;
  let modifiedFiles = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: excludePatterns
    });

    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      let content = await fs.readFile(filePath, 'utf-8');
      let modified = false;

      // Replace uppercase role codes with lowercase
      for (const [uppercase, lowercase] of Object.entries(ROLE_CODE_MAPPING)) {
        // Match role codes in strings (both single and double quotes)
        const patterns = [
          new RegExp(`(['"])${uppercase}\\1`, 'g'),
          new RegExp(`code:\\s*['"]${uppercase}['"]`, 'g'),
          new RegExp(`role\\s*===\\s*['"]${uppercase}['"]`, 'g'),
          new RegExp(`roles\\.includes\\(['"]${uppercase}['"]\\)`, 'g'),
          new RegExp(`hasRole\\(['"]${uppercase}['"]\\)`, 'g')
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            if (!modified) {
              totalFiles++;
              modified = true;
            }
            
            const newContent = content.replace(pattern, (match) => {
              return match.replace(uppercase, lowercase);
            });

            if (newContent !== content) {
              content = newContent;
              log.info(`Found ${uppercase} in ${file}`);
            }
          }
        }
      }

      if (modified) {
        modifiedFiles++;
        if (isDryRun) {
          log.warning(`Would update file: ${file}`);
        } else {
          await fs.writeFile(filePath, content, 'utf-8');
          log.success(`Updated file: ${file}`);
        }
      }
    }
  }

  log.info(`Scanned files, found ${totalFiles} files with uppercase role codes`);
  if (modifiedFiles > 0) {
    log.success(`${isDryRun ? 'Would update' : 'Updated'} ${modifiedFiles} files`);
  }
}

// Fix role codes in installation files
async function fixInstallationFiles() {
  log.section('Fixing Installation Files');
  
  const installationFiles = [
    'installation/platform/admin-user.json',
    'installation/platform/rbac-complete.json'
  ];

  for (const file of installationFiles) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let modified = false;

      // Parse JSON
      const data = JSON.parse(content);
      
      // Fix admin-user.json
      if (file.includes('admin-user.json') && data.admin?.roles) {
        const newRoles = data.admin.roles.map((role: string) => 
          ROLE_CODE_MAPPING[role as keyof typeof ROLE_CODE_MAPPING] || role
        );
        
        if (JSON.stringify(newRoles) !== JSON.stringify(data.admin.roles)) {
          data.admin.roles = newRoles;
          modified = true;
        }
      }

      // Fix rbac-complete.json
      if (file.includes('rbac-complete.json') && data.roles) {
        for (const role of data.roles) {
          // Role names should already be lowercase, but check just in case
          const upperName = role.name.toUpperCase().replace(/[_\s]+/g, '_');
          if (ROLE_CODE_MAPPING[upperName]) {
            role.name = ROLE_CODE_MAPPING[upperName];
            modified = true;
          }
        }
      }

      if (modified) {
        if (isDryRun) {
          log.warning(`Would update installation file: ${file}`);
        } else {
          await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
          log.success(`Updated installation file: ${file}`);
        }
      } else {
        log.info(`No changes needed for: ${file}`);
      }
    } catch (error) {
      log.error(`Failed to process ${file}: ${error}`);
    }
  }
}

// Main execution
async function main() {
  log.section('Role Naming Convention Fixer');
  log.info(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (applying changes)'}`);

  try {
    // Fix database
    await fixDatabaseRoles();

    // Fix source files
    await fixSourceFiles();

    // Fix installation files
    await fixInstallationFiles();

    log.section('Summary');
    
    if (isDryRun) {
      log.warning('This was a dry run. No changes were made.');
      log.info('Run without --dry to apply the changes.');
    } else {
      log.success('All role codes have been updated to lowercase snake_case!');
      log.info('Please restart your application for changes to take effect.');
    }

  } catch (error) {
    log.error(`Script failed: ${error}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();