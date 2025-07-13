import { readFileSync, writeFileSync } from 'fs';
import { logger } from '../src/lib/logger';

/**
 * Clean up Prisma schema by removing old permission models
 */
async function cleanupPrismaSchema() {
  logger.info('Cleaning up Prisma schema...');
  
  const schemaPath = 'prisma/schema.prisma';
  const backupPath = `prisma/schema.backup.${new Date().toISOString().split('T')[0]}.prisma`;
  
  try {
    // Read current schema
    const schemaContent = readFileSync(schemaPath, 'utf-8');
    
    // Create backup
    writeFileSync(backupPath, schemaContent);
    logger.info(`Backup created: ${backupPath}`);
    
    // Models to remove (old legacy models)
    const modelsToRemove = [
      'EmergencyAccessLog',
      'PermissionTemplate', 
      'PermissionHealthCheck',
      'ResourceScopedPermission',
      'PermissionUsageTracking'
    ];
    
    let cleanedSchema = schemaContent;
    
    // Remove each old model
    for (const modelName of modelsToRemove) {
      // Pattern to match the entire model definition
      const modelPattern = new RegExp(
        `model\\s+${modelName}\\s*\\{[^}]+\\}\\s*(?:\\n\\s*@@[^\\n]*)*`,
        'gs'
      );
      
      const matches = cleanedSchema.match(modelPattern);
      if (matches) {
        cleanedSchema = cleanedSchema.replace(modelPattern, '');
        logger.info(`Removed model: ${modelName}`);
      }
    }
    
    // Remove old relations from User model
    const oldUserRelations = [
      'emergencyAccessLogsAsSuperAdmin\\s+EmergencyAccessLog\\[\\]\\s+@relation\\("SuperAdmin"\\)',
      'emergencyAccessLogsAsRevokedBy\\s+EmergencyAccessLog\\[\\]\\s+@relation\\("RevokedBy"\\)',
      'emergencyAccessLogsAsRevoker\\s+EmergencyAccessLog\\[\\]\\s+@relation\\("EmergencyAccessRevokedBy"\\)',
      'emergencyAccessLogsAsAdmin\\s+EmergencyAccessLog\\[\\]\\s+@relation\\("EmergencyAccessSuperAdmin"\\)',
      'permissionHealthChecks\\s+PermissionHealthCheck\\[\\]',
      'permissionTemplates\\s+PermissionTemplate\\[\\]',
      'permissionTemplatesCreated\\s+PermissionTemplate\\[\\]',
      'permissionUsageTracking\\s+PermissionUsageTracking\\[\\]',
      'resourceScopedPermissionsGranted\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("GrantedBy"\\)',
      'resourceScopedPermissionsRevoked\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("RevokedBy"\\)',
      'resourceScopedPermissionsUser\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("UserScoped"\\)',
      'resourceScopedPermissionsGrantor\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("ResourceScopedPermissionGrantor"\\)',
      'resourceScopedPermissionsRevoker\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("ResourceScopedPermissionRevoker"\\)',
      'resourceScopedPermissionsUser\\s+ResourceScopedPermission\\[\\]\\s+@relation\\("ResourceScopedPermissionUser"\\)'
    ];
    
    for (const relation of oldUserRelations) {
      const relationPattern = new RegExp(`\\s*${relation}\\s*\\n`, 'g');
      cleanedSchema = cleanedSchema.replace(relationPattern, '\\n');
    }
    
    // Remove old relations from Permission model
    const oldPermissionRelations = [
      'permissionUsageTracking\\s+PermissionUsageTracking\\[\\]',
      'resourceScopedPermissions\\s+ResourceScopedPermission\\[\\]'
    ];
    
    for (const relation of oldPermissionRelations) {
      const relationPattern = new RegExp(`\\s*${relation}\\s*\\n`, 'g');
      cleanedSchema = cleanedSchema.replace(relationPattern, '\\n');
    }
    
    // Remove old relations from Tenant model  
    const oldTenantRelations = [
      'permissionHealthChecks\\s+PermissionHealthCheck\\[\\]',
      'permissionTemplates\\s+PermissionTemplate\\[\\]',
      'permissionUsageTracking\\s+PermissionUsageTracking\\[\\]',
      'resourceScopedPermissions\\s+ResourceScopedPermission\\[\\]'
    ];
    
    for (const relation of oldTenantRelations) {
      const relationPattern = new RegExp(`\\s*${relation}\\s*\\n`, 'g');
      cleanedSchema = cleanedSchema.replace(relationPattern, '\\n');
    }
    
    // Clean up extra whitespace and empty lines
    cleanedSchema = cleanedSchema
      .replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n')  // Remove excessive blank lines
      .replace(/\\n\\s*\\n$/g, '\\n')           // Remove trailing blank lines
      .trim();
    
    // Write cleaned schema
    writeFileSync(schemaPath, cleanedSchema);
    
    logger.info('Prisma schema cleaned successfully');
    logger.info(`Removed ${modelsToRemove.length} old models`);
    logger.info('Old relations removed from User, Permission, and Tenant models');
    
    return {
      success: true,
      removedModels: modelsToRemove,
      backupPath
    };
    
  } catch (error) {
    logger.error('Failed to clean up Prisma schema', { error });
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupPrismaSchema()
    .then((result) => {
      logger.info('Prisma schema cleanup completed', result);
      console.log('\\n✅ Prisma schema cleanup successful!');
      console.log('\\nNext steps:');
      console.log('1. Run: npx prisma generate');
      console.log('2. Test your application');
      console.log('3. Run the SQL cleanup script if everything works');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Prisma schema cleanup failed', { error });
      console.log('\\n❌ Prisma schema cleanup failed!');
      process.exit(1);
    });
}

export default cleanupPrismaSchema;