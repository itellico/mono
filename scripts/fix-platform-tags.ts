#!/usr/bin/env tsx

/**
 * Fix Platform Route Tag Inconsistencies
 * 
 * This script standardizes all platform route tags to follow the pattern:
 * platform.{resource} instead of platform.admin.{resource}
 * 
 * This fixes the scattered groupings in Swagger documentation.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

interface TagMapping {
  oldTag: string;
  newTag: string;
  oldPermission: string;
  newPermission: string;
}

// Standardized tag mappings
const TAG_MAPPINGS: TagMapping[] = [
  // Admin routes should be consolidated under their main resource
  {
    oldTag: 'platform.admin.tenants',
    newTag: 'platform.tenants',
    oldPermission: 'platform.admin.tenants',
    newPermission: 'platform.tenants'
  },
  {
    oldTag: 'platform.admin.users',
    newTag: 'platform.users',
    oldPermission: 'platform.admin.users',
    newPermission: 'platform.users'
  },
  {
    oldTag: 'platform.admin.permissions',
    newTag: 'platform.permissions',
    oldPermission: 'platform.admin.permissions',
    newPermission: 'platform.permissions'
  },
  {
    oldTag: 'platform.admin.integrations',
    newTag: 'platform.integrations',
    oldPermission: 'platform.admin.integrations',
    newPermission: 'platform.integrations'
  },
  {
    oldTag: 'platform.admin.settings',
    newTag: 'platform.settings',
    oldPermission: 'platform.admin.settings',
    newPermission: 'platform.settings'
  },
  {
    oldTag: 'platform.admin.translations',
    newTag: 'platform.translations',
    oldPermission: 'platform.admin.translations',
    newPermission: 'platform.translations'
  },
  {
    oldTag: 'platform.admin.queue',
    newTag: 'platform.queue',
    oldPermission: 'platform.admin.queue',
    newPermission: 'platform.queue'
  },
  {
    oldTag: 'platform.admin.emergency',
    newTag: 'platform.emergency',
    oldPermission: 'platform.admin.emergency',
    newPermission: 'platform.emergency'
  },
  {
    oldTag: 'platform.admin.platform-users',
    newTag: 'platform.platform-users',
    oldPermission: 'platform.admin.platform-users',
    newPermission: 'platform.platform-users'
  },
  // System routes should also be consolidated
  {
    oldTag: 'platform.system.tenants',
    newTag: 'platform.tenants',
    oldPermission: 'platform.system.tenants',
    newPermission: 'platform.tenants'
  }
];

class PlatformTagFixer {
  private filesProcessed: number = 0;
  private changesCount: number = 0;
  private errors: string[] = [];

  async fixAllTags() {
    console.log('🔧 Starting Platform Tag Standardization...\n');

    // Get all platform route files
    const platformFiles = await glob('apps/api/src/routes/v1/platform/**/*.ts');
    console.log(`📊 Found ${platformFiles.length} platform route files\n`);

    for (const filePath of platformFiles) {
      await this.fixFileTagsAndPermissions(filePath);
    }

    this.printSummary();
  }

  private async fixFileTagsAndPermissions(filePath: string) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let fileChanged = false;
      const originalContent = content;

      // Apply all tag and permission mappings
      for (const mapping of TAG_MAPPINGS) {
        // Fix tags
        const tagPattern = new RegExp(`tags: \\['${mapping.oldTag.replace(/\./g, '\\.')}'\\]`, 'g');
        const newTagContent = content.replace(tagPattern, `tags: ['${mapping.newTag}']`);
        if (newTagContent !== content) {
          content = newTagContent;
          fileChanged = true;
          this.changesCount++;
          console.log(`✅ ${filePath}: Updated tag ${mapping.oldTag} → ${mapping.newTag}`);
        }

        // Fix permissions (all actions: read, create, update, delete, manage)
        const actions = ['read', 'create', 'update', 'delete', 'manage', 'write'];
        for (const action of actions) {
          const permissionPattern = new RegExp(
            `requirePermission\\('${mapping.oldPermission.replace(/\./g, '\\.')}\\.${action}'\\)`,
            'g'
          );
          const newPermissionContent = content.replace(
            permissionPattern, 
            `requirePermission('${mapping.newPermission}.${action}')`
          );
          if (newPermissionContent !== content) {
            content = newPermissionContent;
            fileChanged = true;
            this.changesCount++;
            console.log(`✅ ${filePath}: Updated permission ${mapping.oldPermission}.${action} → ${mapping.newPermission}.${action}`);
          }
        }
      }

      // Write file if changes were made
      if (fileChanged) {
        await fs.writeFile(filePath, content);
        this.filesProcessed++;
        console.log(`💾 ${filePath}: File updated\n`);
      }

    } catch (error) {
      const errorMsg = `Failed to process ${filePath}: ${error}`;
      this.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}\n`);
    }
  }

  private printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PLATFORM TAG STANDARDIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Files processed: ${this.filesProcessed}`);
    console.log(`🔄 Total changes made: ${this.changesCount}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    console.log('\n🎯 EXPECTED SWAGGER IMPROVEMENTS:');
    console.log('✅ Unified platform.tenants section (instead of scattered admin/system)');
    console.log('✅ Clean platform.permissions section');
    console.log('✅ Consolidated platform.integrations section');
    console.log('✅ Streamlined platform.settings section');
    console.log('✅ Organized platform.translations section');
    console.log('\n⚠️ NOTE: You may need to restart the API server to see changes in Swagger');
  }
}

// Run the fixer
async function main() {
  const fixer = new PlatformTagFixer();
  await fixer.fixAllTags();
}

if (require.main === module) {
  main().catch(console.error);
}

export { PlatformTagFixer };