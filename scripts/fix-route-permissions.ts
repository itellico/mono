#!/usr/bin/env tsx
/**
 * Script to fix all route permissions to match 5-tier structure
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();

// Permission mapping based on tier
const PERMISSION_PATTERNS = {
  // Old pattern -> New pattern
  'admin.': 'platform.admin.',
  'categories.': 'tenant.content.categories.',
  'tags.': 'tenant.content.tags.',
  'templates.': 'tenant.content.templates.',
  'model-schemas.': 'tenant.data.schemas.',
  'option-sets.': 'tenant.data.option-sets.',
  'workflows.': 'tenant.workflows.',
  'forms.': 'tenant.forms.',
  'media.': 'tenant.media.',
  'saved-searches.': 'user.saved-searches.',
  'notifications.': 'user.notifications.',
  'subscriptions.': 'user.subscriptions.',
  'changes.': 'account.changes.',
  'invitations.': 'account.invitations.',
  'audit.': 'platform.audit.',
  'monitoring.': 'platform.monitoring.',
  'integrations.': 'platform.integrations.',
  'webhooks.': 'platform.webhooks.',
  'llm.': 'platform.ai.',
};

// Route tag mapping
const TAG_PATTERNS = {
  'admin': ['platform.admin'],
  'categories': ['tenant.content.categories'],
  'tags': ['tenant.content.tags'],
  'templates': ['tenant.content.templates'],
  'model-schemas': ['tenant.data.schemas'],
  'option-sets': ['tenant.data.option-sets'],
  'workflows': ['tenant.workflows'],
  'forms': ['tenant.forms'],
  'media': ['tenant.media'],
  'saved-searches': ['user.saved-searches'],
  'notifications': ['user.notifications'],
  'subscriptions': ['user.subscriptions'],
  'changes': ['account.changes'],
  'invitations': ['account.invitations'],
  'audit': ['platform.audit'],
  'monitoring': ['platform.monitoring'],
  'integrations': ['platform.integrations'],
  'webhooks': ['platform.webhooks'],
  'llm': ['platform.ai'],
};

async function updatePermissionsInFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Update permission strings
    Object.entries(PERMISSION_PATTERNS).forEach(([oldPattern, newPattern]) => {
      // Update in requirePermission calls
      const permissionRegex = new RegExp(`requirePermission\\(['"\`]${oldPattern.replace('.', '\\.')}`, 'g');
      content = content.replace(permissionRegex, `requirePermission('${newPattern}`);
      
      // Update in permission arrays
      const arrayRegex = new RegExp(`['"\`]${oldPattern.replace('.', '\\.')}`, 'g');
      content = content.replace(arrayRegex, `'${newPattern}`);
    });
    
    // Update route tags
    Object.entries(TAG_PATTERNS).forEach(([oldTag, newTags]) => {
      const tagRegex = new RegExp(`tags:\\s*\\[['"\`]${oldTag}['"\`]\\]`, 'g');
      content = content.replace(tagRegex, `tags: ['${newTags.join("', '")}']`);
    });
    
    // Update schema tag references
    content = content.replace(
      /tags:\s*\[['"`]([^'"`,\]]+)['"`]\]/g,
      (match, tag) => {
        if (TAG_PATTERNS[tag]) {
          return `tags: ['${TAG_PATTERNS[tag].join("', '")}']`;
        }
        // Check if it already follows tier.resource pattern
        if (tag.includes('.')) {
          return match;
        }
        // Try to infer tier from file path
        const tier = inferTierFromPath(filePath);
        if (tier) {
          return `tags: ['${tier}.${tag}']`;
        }
        return match;
      }
    );
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

function inferTierFromPath(filePath: string): string | null {
  const pathParts = filePath.split(path.sep);
  const v1Index = pathParts.indexOf('v1');
  
  if (v1Index !== -1 && v1Index < pathParts.length - 1) {
    const tier = pathParts[v1Index + 1];
    if (['public', 'user', 'account', 'tenant', 'platform'].includes(tier)) {
      return tier;
    }
  }
  
  return null;
}

async function updatePermissionSeeds() {
  console.log('\n🌱 Updating permission seed files...');
  
  const seedFiles = await glob('scripts/seed/**/*.ts', { cwd: PROJECT_ROOT });
  
  for (const file of seedFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Update permission definitions
    Object.entries(PERMISSION_PATTERNS).forEach(([oldPattern, newPattern]) => {
      content = content.replace(
        new RegExp(`resource:\\s*['"\`]${oldPattern.replace('.', '\\.')}`, 'g'),
        `resource: '${newPattern}`
      );
      
      content = content.replace(
        new RegExp(`name:\\s*['"\`]${oldPattern.replace('.', '\\.')}`, 'g'),
        `name: '${newPattern}`
      );
    });
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Updated seed file: ${path.basename(file)}`);
    }
  }
}

async function createPermissionMigrationSQL() {
  console.log('\n💾 Creating permission migration SQL...');
  
  let sql = `-- Permission migration SQL for 5-tier architecture
-- Generated on ${new Date().toISOString()}

BEGIN;

`;

  Object.entries(PERMISSION_PATTERNS).forEach(([oldPattern, newPattern]) => {
    sql += `-- Update ${oldPattern} to ${newPattern}
UPDATE permissions 
SET name = REPLACE(name, '${oldPattern}', '${newPattern}'),
    resource = REPLACE(resource, '${oldPattern}', '${newPattern}'),
    updated_at = NOW()
WHERE name LIKE '${oldPattern}%';

`;
  });

  sql += `-- Update role_permissions to reflect new permission names
UPDATE role_permissions rp
SET updated_at = NOW()
FROM permissions p
WHERE rp.permission_id = p.id
  AND p.updated_at > NOW() - INTERVAL '1 minute';

-- Invalidate permission cache
DELETE FROM cache WHERE key LIKE 'permissions:%';

COMMIT;
`;

  const sqlPath = path.join(PROJECT_ROOT, 'scripts/migrations/fix-permissions-5tier.sql');
  await fs.mkdir(path.dirname(sqlPath), { recursive: true });
  await fs.writeFile(sqlPath, sql);
  console.log('✅ Created permission migration SQL');
}

async function updateClientPermissionChecks() {
  console.log('\n🔍 Updating client-side permission checks...');
  
  const clientFiles = await glob('src/**/*.{ts,tsx}', { cwd: PROJECT_ROOT });
  let updatedCount = 0;
  
  for (const file of clientFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    
    // Skip node_modules and build directories
    if (filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('.next')) {
      continue;
    }
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;
      
      // Update permission checks in hooks and components
      Object.entries(PERMISSION_PATTERNS).forEach(([oldPattern, newPattern]) => {
        // hasPermission checks
        content = content.replace(
          new RegExp(`hasPermission\\(['"\`]${oldPattern.replace('.', '\\.')}`, 'g'),
          `hasPermission('${newPattern}`
        );
        
        // checkPermission checks
        content = content.replace(
          new RegExp(`checkPermission\\(['"\`]${oldPattern.replace('.', '\\.')}`, 'g'),
          `checkPermission('${newPattern}`
        );
        
        // PermissionGate components
        content = content.replace(
          new RegExp(`permission=['"]${oldPattern.replace('.', '\\.')}`, 'g'),
          `permission="${newPattern}`
        );
      });
      
      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        updatedCount++;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  console.log(`✅ Updated ${updatedCount} client files`);
}

async function main() {
  console.log('🔐 Starting permission fix for 5-tier architecture...\n');
  
  // Update API route files
  console.log('📝 Updating API route permissions...');
  const apiFiles = await glob('apps/api/src/routes/**/*.ts', { cwd: PROJECT_ROOT });
  let updatedCount = 0;
  
  for (const file of apiFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    const updated = await updatePermissionsInFile(filePath);
    if (updated) {
      updatedCount++;
      console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
    }
  }
  
  console.log(`Updated ${updatedCount} API files`);
  
  // Update permission seeds
  await updatePermissionSeeds();
  
  // Update client-side permission checks
  await updateClientPermissionChecks();
  
  // Create migration SQL
  await createPermissionMigrationSQL();
  
  console.log('\n✨ Permission fix complete!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Run the SQL migration: pnpm tsx scripts/migrations/fix-permissions-5tier.sql');
  console.log('2. Clear Redis cache: redis-cli FLUSHDB');
  console.log('3. Restart the API server');
  console.log('4. Test permission checks in the UI');
}

main().catch(console.error);