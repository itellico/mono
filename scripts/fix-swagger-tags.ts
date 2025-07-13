#!/usr/bin/env tsx

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

/**
 * Fix Swagger tags to use proper tier:feature format instead of box-drawing characters
 */

// Mapping of routes to their proper tier:feature tags
const tagMappings: Record<string, string> = {
  // Public tier
  'auth-v2': 'public:authentication',
  'health': 'public:health',
  
  // User tier
  'categories': 'user:categories',
  'tags': 'user:tags',
  'media': 'user:media',
  'templates': 'user:templates',
  'changes': 'user:changes',
  'notifications': 'user:notifications',
  'saved-searches': 'user:search',
  'conversations': 'user:messaging',
  'user-profiles': 'user:profile',
  'gigs': 'user:gigs',
  'jobs': 'user:jobs',
  
  // Account tier
  'forms': 'account:forms',
  'integrations': 'account:integrations',
  'webhooks': 'account:webhooks',
  'workflows': 'account:workflows',
  'llm': 'account:ai-llm',
  'subscriptions': 'account:billing',
  'industry-templates': 'account:templates',
  'feature-sets': 'account:settings',
  'emails': 'account:settings',
  'invitations': 'account:users',
  'users': 'account:users',
  
  // Tenant tier
  'audit': 'tenant:audit',
  'monitoring': 'tenant:analytics',
  'model-schemas': 'tenant:model-schemas',
  'option-sets': 'tenant:option-sets',
  'artwork': 'tenant:moderation',
  
  // Platform tier
  'admin/tenants': 'platform:tenants',
  'admin/settings': 'platform:settings',
  'admin/emergency': 'platform:emergency',
  'admin/platform-users': 'platform:monitoring',
  'admin/permissions': 'tenant:settings',
  'admin/integrations': 'tenant:settings',
  'admin/users': 'tenant:users',
  'admin/translations': 'tenant:settings',
  'admin/queue': 'tenant:analytics',
};

async function fixSwaggerTags() {
  console.log('🔧 Fixing Swagger tags in API routes...\n');
  
  // Find all route files
  const routeFiles = await glob('apps/api/src/routes/**/*.ts');
  
  let totalFixed = 0;
  
  for (const file of routeFiles) {
    let content = await readFile(file, 'utf-8');
    const originalContent = content;
    
    // Extract route name from path
    const relativePath = path.relative('apps/api/src/routes/v1/', file);
    const routeKey = relativePath.replace('/index.ts', '').replace('.ts', '');
    
    // Find all tags with box-drawing characters
    const tagRegex = /tags:\s*\[\s*['"]([^'"]+)['"]\s*\]/g;
    let modified = false;
    
    content = content.replace(tagRegex, (match, tag) => {
      // Check if tag contains box-drawing characters
      if (tag.includes('├─') || tag.includes('└─') || tag.includes('┌─') || tag.includes('─')) {
        // Find the proper tag from our mapping
        const properTag = tagMappings[routeKey] || routeKey;
        console.log(`  📝 ${file}`);
        console.log(`     Before: tags: ['${tag}']`);
        console.log(`     After:  tags: ['${properTag}']`);
        modified = true;
        totalFixed++;
        return `tags: ['${properTag}']`;
      }
      return match;
    });
    
    // Save the file if modified
    if (modified) {
      await writeFile(file, content);
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} tag references across ${routeFiles.length} files`);
  console.log('\n📋 Summary:');
  console.log('- Removed box-drawing characters (├─, └─, etc.)');
  console.log('- Applied proper tier:feature format');
  console.log('- Tags now follow the 4-tier architecture');
}

// Run the fix
fixSwaggerTags().catch(console.error);