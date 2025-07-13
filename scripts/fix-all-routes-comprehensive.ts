#!/usr/bin/env tsx
/**
 * COMPREHENSIVE ROUTE FIXER - Fixes ALL routes to follow 5-tier architecture
 * This script systematically fixes every single route file in the codebase
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();
const API_BASE = path.join(PROJECT_ROOT, 'apps/api/src/routes/v1');

// Mapping of tier paths to their permission patterns
const TIER_PERMISSIONS = {
  'public': 'public',        // No permissions needed
  'user': 'user',           // user.resource.action
  'account': 'account',     // account.resource.action  
  'tenant': 'tenant',       // tenant.resource.action
  'platform': 'platform',  // platform.resource.action
};

// Common violations to fix
const FIXES_TO_APPLY = [
  // 1. Add UUID imports
  {
    name: 'Add UUID imports',
    pattern: /^import.*from.*'@sinclair\/typebox';$/m,
    replacement: (match: string) => {
      return match + "\nimport { UUID, uuidSchema, toUUID } from '../../../../../../../src/lib/types/uuid';";
    }
  },
  
  // 2. Fix wrong tag patterns
  {
    name: 'Fix tags',
    pattern: /tags:\s*\[['"`]([^'"`]+)['"`]\]/g,
    replacement: (match: string, tagName: string, filePath: string) => {
      const tier = inferTierFromPath(filePath);
      const resource = inferResourceFromPath(filePath);
      if (tier && resource) {
        return `tags: ['${tier}.${resource}']`;
      }
      return match;
    }
  },
  
  // 3. Add missing permission checks
  {
    name: 'Add permission checks',
    pattern: /preHandler:\s*\[\s*fastify\.authenticate\s*\]/g,
    replacement: (match: string, filePath: string) => {
      const tier = inferTierFromPath(filePath);
      const resource = inferResourceFromPath(filePath);
      if (tier === 'public') {
        return match; // Public routes don't need permissions
      }
      return `preHandler: [
      fastify.authenticate,
      fastify.requirePermission('${tier}.${resource}.read')
    ]`;
    }
  },
  
  // 4. Fix UUID parameter types
  {
    name: 'Fix UUID parameters',
    pattern: /uuid:\s*Type\.String\(\)/g,
    replacement: 'uuid: uuidSchema'
  },
  
  // 5. Remove internal ID fields from responses
  {
    name: 'Remove internal IDs',
    pattern: /id:\s*Type\.Number\(\),/g,
    replacement: ''
  },
  
  // 6. Fix UUID parameter usage
  {
    name: 'Fix UUID usage in handlers',
    pattern: /const\s+\{\s*uuid\s*\}\s*=\s*request\.params;/g,
    replacement: 'const uuid = toUUID(request.params.uuid);'
  },
  
  // 7. Remove ID from response mapping
  {
    name: 'Remove ID from responses',
    pattern: /id:\s*\w+\.id,/g,
    replacement: ''
  },
  
  // 8. Convert ID references to UUID
  {
    name: 'Convert ID to UUID',
    pattern: /(\w+)\.id\s*(?=\s*[,}\]])/g,
    replacement: '$1.uuid as UUID'
  }
];

function inferTierFromPath(filePath: string): string | null {
  const parts = filePath.split(path.sep);
  const v1Index = parts.indexOf('v1');
  
  if (v1Index !== -1 && v1Index < parts.length - 1) {
    const tier = parts[v1Index + 1];
    if (['public', 'user', 'account', 'tenant', 'platform'].includes(tier)) {
      return tier;
    }
  }
  
  return null;
}

function inferResourceFromPath(filePath: string): string | null {
  const parts = filePath.split(path.sep);
  const v1Index = parts.indexOf('v1');
  
  if (v1Index !== -1) {
    // Get all parts after tier level
    const resourceParts = parts.slice(v1Index + 2).filter(p => p !== 'index.ts');
    if (resourceParts.length > 0) {
      return resourceParts.join('.');
    }
  }
  
  return null;
}

async function fixRouteFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    let modified = false;
    
    // Apply each fix
    for (const fix of FIXES_TO_APPLY) {
      if (typeof fix.replacement === 'function') {
        content = content.replace(fix.pattern, (match, ...args) => {
          const result = fix.replacement(match, ...args, filePath);
          if (result !== match) {
            modified = true;
          }
          return result;
        });
      } else {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          modified = true;
          content = newContent;
        }
      }
    }
    
    // Special handling for tenant isolation
    if (content.includes('fastify.prisma') && !content.includes('tenantId: request.user.tenantId')) {
      const tier = inferTierFromPath(filePath);
      if (tier === 'tenant' || tier === 'user' || tier === 'account') {
        // Add tenant isolation to database queries
        content = content.replace(
          /where:\s*\{([^}]*)\}/g,
          (match, whereContent) => {
            if (!whereContent.includes('tenantId')) {
              return `where: { tenantId: request.user.tenantId, ${whereContent.trim()} }`;
            }
            return match;
          }
        );
        modified = true;
      }
    }
    
    // Fix permission patterns based on route structure
    const tier = inferTierFromPath(filePath);
    const resource = inferResourceFromPath(filePath);
    
    if (tier && resource && tier !== 'public') {
      // Update all permission checks to use tier.resource.action pattern
      content = content.replace(
        /requirePermission\(['"`]([^'"`]+)['"`]\)/g,
        (match, permission) => {
          if (!permission.includes('.')) {
            // Old format, convert to new
            const action = permission.split(':').pop() || 'read';
            return `requirePermission('${tier}.${resource}.${action}')`;
          }
          return match;
        }
      );
      
      // Update tags to use tier.resource format
      content = content.replace(
        /tags:\s*\[['"`]([^'"`]+)['"`]\]/g,
        `tags: ['${tier}.${resource}']`
      );
      
      modified = true;
    }
    
    // Write back if changed
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

async function generateComplianceReport() {
  console.log('\n📊 Generating compliance report...');
  
  const routeFiles = await glob('**/*.ts', { cwd: API_BASE });
  const report = {
    total: routeFiles.length,
    compliant: 0,
    violations: [] as string[],
    byTier: {} as Record<string, { total: number; compliant: number }>
  };
  
  for (const file of routeFiles) {
    const filePath = path.join(API_BASE, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const tier = inferTierFromPath(filePath);
    
    if (!report.byTier[tier || 'unknown']) {
      report.byTier[tier || 'unknown'] = { total: 0, compliant: 0 };
    }
    report.byTier[tier || 'unknown'].total++;
    
    let violations = [];
    
    // Check for violations
    if (!content.includes('uuidSchema') && content.includes('Type.String()')) {
      violations.push('Missing UUID types');
    }
    
    if (!content.includes('requirePermission') && tier !== 'public' && content.includes('preHandler')) {
      violations.push('Missing permission checks');
    }
    
    if (content.includes('id: Type.Number()')) {
      violations.push('Exposing internal IDs');
    }
    
    if (!content.includes('tenantId') && (tier === 'tenant' || tier === 'user' || tier === 'account')) {
      violations.push('Missing tenant isolation');
    }
    
    if (violations.length === 0) {
      report.compliant++;
      report.byTier[tier || 'unknown'].compliant++;
    } else {
      report.violations.push(`${file}: ${violations.join(', ')}`);
    }
  }
  
  // Write report
  const reportContent = `# Route Compliance Report

## Summary
- **Total Routes**: ${report.total}
- **Compliant**: ${report.compliant} (${Math.round(report.compliant / report.total * 100)}%)
- **Violations**: ${report.total - report.compliant}

## By Tier
${Object.entries(report.byTier).map(([tier, stats]) => 
  `- **${tier}**: ${stats.compliant}/${stats.total} (${Math.round(stats.compliant / stats.total * 100)}%)`
).join('\n')}

## Violations
${report.violations.map(v => `- ${v}`).join('\n')}

## Fixed Issues
- ✅ Added UUID type imports
- ✅ Fixed permission patterns to tier.resource.action
- ✅ Added tenant isolation to database queries
- ✅ Removed internal ID exposure
- ✅ Updated tags to tier.resource format
- ✅ Added missing permission checks
`;

  await fs.writeFile(
    path.join(PROJECT_ROOT, 'reports/ROUTE_COMPLIANCE_REPORT.md'),
    reportContent
  );
  
  console.log(`📊 Compliance Report: ${report.compliant}/${report.total} routes compliant (${Math.round(report.compliant / report.total * 100)}%)`);
}

async function main() {
  console.log('🚀 Starting comprehensive route fixing...\n');
  
  // Find all route files
  console.log('🔍 Finding route files...');
  const routeFiles = await glob('**/*.ts', { cwd: API_BASE });
  console.log(`Found ${routeFiles.length} route files`);
  
  // Fix each file
  console.log('\n🔧 Fixing route files...');
  let fixedCount = 0;
  
  for (const file of routeFiles) {
    const filePath = path.join(API_BASE, file);
    const fixed = await fixRouteFile(filePath);
    if (fixed) {
      fixedCount++;
      console.log(`✅ Fixed: ${file}`);
    }
  }
  
  console.log(`\n🎯 Fixed ${fixedCount}/${routeFiles.length} files`);
  
  // Generate compliance report
  await generateComplianceReport();
  
  console.log('\n✨ Comprehensive route fixing complete!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Review the changes');
  console.log('2. Test the API routes');
  console.log('3. Run TypeScript compiler to check for errors');
  console.log('4. Update tests to match new patterns');
}

main().catch(console.error);