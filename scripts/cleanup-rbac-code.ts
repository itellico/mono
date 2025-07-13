#!/usr/bin/env tsx
/**
 * RBAC Code Cleanup Script
 * Removes references to deleted permission tables
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface CleanupResult {
  filesModified: string[];
  linesRemoved: number;
  errors: string[];
}

async function cleanupRBACCode(): Promise<CleanupResult> {
  const result: CleanupResult = {
    filesModified: [],
    linesRemoved: 0,
    errors: []
  };

  logger.info('Starting RBAC code cleanup...');

  try {
    // 1. Update permission checking logic
    await updatePermissionRoutes(result);
    
    // 2. Remove RBACConfig references
    await removeRBACConfigReferences(result);
    
    // 3. Update environment variables
    await createEnvironmentVariables(result);
    
    // 4. Remove unused imports
    await cleanupImports(result);
    
    // 5. Delete unused service files
    await deleteUnusedServices(result);

    logger.info('RBAC code cleanup completed successfully', result);
  } catch (error) {
    logger.error('RBAC code cleanup failed', error);
    result.errors.push(error.message);
  }

  return result;
}

async function updatePermissionRoutes(result: CleanupResult): Promise<void> {
  const permissionsFile = path.join(__dirname, '../apps/api/src/routes/v1/permissions/index.ts');
  
  try {
    let content = await fs.readFile(permissionsFile, 'utf-8');
    const originalLength = content.split('\n').length;
    
    // Remove UserPermission references
    content = content.replace(/userPermissions:[\s\S]*?include: \{[\s\S]*?permission: true[\s\S]*?\}[\s\S]*?\},/g, '');
    
    // Remove permission set references
    content = content.replace(/permissionSets:[\s\S]*?include: \{[\s\S]*?\}[\s\S]*?\},/g, '');
    
    // Update the permission collection logic
    content = content.replace(
      /\/\/ Direct user permissions[\s\S]*?for \(const userPerm of targetUser\.userPermissions\) \{[\s\S]*?\}/g,
      '// Direct user permissions removed - all permissions now flow through roles'
    );
    
    // Remove RBACConfig function
    content = content.replace(
      /async function getRBACConfig\(\)[\s\S]*?\}/g,
      `async function getRBACConfig() {
  return {
    enableWildcards: process.env.RBAC_ENABLE_WILDCARDS !== 'false',
    enableInheritance: false, // Removed - use wildcards instead
    enableCaching: process.env.RBAC_ENABLE_CACHING !== 'false',
    cacheExpirationMinutes: parseInt(process.env.RBAC_CACHE_EXPIRATION_MINUTES || '15'),
    maxPermissionsPerUser: parseInt(process.env.RBAC_MAX_PERMISSIONS_PER_USER || '1000'),
    enableAuditLog: process.env.RBAC_ENABLE_AUDIT !== 'false',
    auditRetentionDays: parseInt(process.env.RBAC_AUDIT_RETENTION_DAYS || '90'),
  };
}`
    );
    
    await fs.writeFile(permissionsFile, content);
    
    const newLength = content.split('\n').length;
    result.filesModified.push(permissionsFile);
    result.linesRemoved += originalLength - newLength;
    
  } catch (error) {
    result.errors.push(`Failed to update permissions file: ${error.message}`);
  }
}

async function removeRBACConfigReferences(result: CleanupResult): Promise<void> {
  const adminSettingsFile = path.join(__dirname, '../apps/api/src/routes/v1/admin-settings/index.ts');
  
  try {
    let content = await fs.readFile(adminSettingsFile, 'utf-8');
    
    // Replace RBACConfig database calls with environment variables
    content = content.replace(
      /await fastify\.prisma\.rBACConfig\.findUnique\(\{[\s\S]*?\}\)/g,
      'getRBACConfigFromEnv()'
    );
    
    // Add helper function if not exists
    if (!content.includes('getRBACConfigFromEnv')) {
      content = `function getRBACConfigFromEnv() {
  return {
    enableWildcards: process.env.RBAC_ENABLE_WILDCARDS !== 'false',
    enableCaching: process.env.RBAC_ENABLE_CACHING !== 'false',
    cacheExpirationMinutes: parseInt(process.env.RBAC_CACHE_EXPIRATION_MINUTES || '15'),
    enableAuditLog: process.env.RBAC_ENABLE_AUDIT !== 'false',
    auditRetentionDays: parseInt(process.env.RBAC_AUDIT_RETENTION_DAYS || '90'),
  };
}

${content}`;
    }
    
    await fs.writeFile(adminSettingsFile, content);
    result.filesModified.push(adminSettingsFile);
    
  } catch (error) {
    result.errors.push(`Failed to update admin settings file: ${error.message}`);
  }
}

async function createEnvironmentVariables(result: CleanupResult): Promise<void> {
  const envExample = path.join(__dirname, '../.env.example');
  
  try {
    let content = await fs.readFile(envExample, 'utf-8');
    
    // Add RBAC environment variables if not present
    const rbacVars = `
# RBAC Configuration (replacing RBACConfig table)
RBAC_ENABLE_WILDCARDS=true
RBAC_ENABLE_CACHING=true
RBAC_CACHE_EXPIRATION_MINUTES=15
RBAC_MAX_PERMISSIONS_PER_USER=1000
RBAC_ENABLE_AUDIT=true
RBAC_AUDIT_RETENTION_DAYS=90
`;

    if (!content.includes('RBAC Configuration')) {
      content += rbacVars;
      await fs.writeFile(envExample, content);
      result.filesModified.push(envExample);
    }
    
  } catch (error) {
    result.errors.push(`Failed to update .env.example: ${error.message}`);
  }
}

async function cleanupImports(result: CleanupResult): Promise<void> {
  const filesToCheck = [
    'apps/api/src/routes/v1/permissions/index.ts',
    'apps/api/src/routes/v1/user-profiles/index.ts',
    'apps/api/src/routes/v1/admin-settings/index.ts',
  ];
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, '..', file);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Remove unused model imports
      const unusedModels = [
        'UserPermission',
        'PermissionSet',
        'PermissionSetItem',
        'RolePermissionSet',
        'PermissionInheritance',
        'PermissionExpansion',
        'RBACConfig',
        'EmergencyAccess',
        'EmergencyAudit'
      ];
      
      for (const model of unusedModels) {
        const importRegex = new RegExp(`import.*{[^}]*${model}[^}]*}.*from.*@prisma/client.*\n`, 'g');
        content = content.replace(importRegex, '');
      }
      
      await fs.writeFile(filePath, content);
      
    } catch (error) {
      // File might not exist or have imports
      continue;
    }
  }
}

async function deleteUnusedServices(result: CleanupResult): Promise<void> {
  const servicesToDelete = [
    'src/lib/services/emergency-access.service.ts',
    'src/app/api/v1/admin/emergency/cleanup/route.ts',
    'src/app/api/v1/admin/emergency/activate/route.ts',
  ];
  
  for (const service of servicesToDelete) {
    const filePath = path.join(__dirname, '..', service);
    
    try {
      await fs.unlink(filePath);
      result.filesModified.push(filePath);
      logger.info(`Deleted unused service: ${service}`);
    } catch (error) {
      // File might not exist
      continue;
    }
  }
}

// Run the cleanup
cleanupRBACCode()
  .then(result => {
    console.log('\n✅ RBAC Code Cleanup Complete!');
    console.log(`📝 Files modified: ${result.filesModified.length}`);
    console.log(`🗑️  Lines removed: ${result.linesRemoved}`);
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.error(`   - ${err}`));
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });