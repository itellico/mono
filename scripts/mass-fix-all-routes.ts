#!/usr/bin/env tsx
/**
 * MASS FIX ALL ROUTES - Fix every single route to follow 5-tier architecture
 * This will systematically fix all 111 routes
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();
const API_BASE = path.join(PROJECT_ROOT, 'apps/api/src/routes/v1');

// Route fixes to apply to every file
async function massFixRoute(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Determine tier and resource from file path
    const relativePath = path.relative(API_BASE, filePath);
    const pathParts = relativePath.split(path.sep);
    const tier = pathParts[0];
    let resource = pathParts.slice(1, -1).join('.'); // Remove index.ts
    if (!resource) resource = pathParts[0]; // For root level files
    
    console.log(`Processing: ${relativePath} -> Tier: ${tier}, Resource: ${resource}`);
    
    // 1. Add UUID imports if missing
    if (!content.includes('from \'../')) {
      const depthCount = pathParts.length - 1;
      const uuidImportPath = '../'.repeat(depthCount + 6) + 'src/lib/types/uuid';
      
      if (content.includes("from '@sinclair/typebox'")) {
        content = content.replace(
          "from '@sinclair/typebox';",
          "from '@sinclair/typebox';\nimport { UUID, uuidSchema, toUUID } from '" + uuidImportPath + "';"
        );
      } else {
        content = "import { UUID, uuidSchema, toUUID } from '" + uuidImportPath + "';\n" + content;
      }
    }
    
    // 2. Fix all wrong tag patterns
    content = content.replace(
      /tags:\s*\[['"`]([^'"`\]]+)['"`]\]/g,
      `tags: ['${tier}.${resource}']`
    );
    
    // 3. Remove all internal ID exposures
    content = content.replace(/id:\s*Type\.Number\(\),?\s*/g, '');
    content = content.replace(/id:\s*\w+\.id,?\s*/g, '');
    content = content.replace(/(\w+)\.id(?=\s*[,}\]])/g, '$1.uuid as UUID');
    
    // 4. Fix UUID types
    content = content.replace(/uuid:\s*Type\.String\(\)/g, 'uuid: uuidSchema');
    content = content.replace(/:\s*Type\.String\(\)/g, (match, offset) => {
      const before = content.substring(Math.max(0, offset - 10), offset);
      if (before.includes('uuid') || before.includes('Uuid')) {
        return ': uuidSchema';
      }
      return match;
    });
    
    // 5. Add missing permission checks for non-public routes
    if (tier !== 'public') {
      content = content.replace(
        /preHandler:\s*\[\s*fastify\.authenticate\s*\]/g,
        `preHandler: [
      fastify.authenticate,
      fastify.requirePermission('${tier}.${resource}.read')
    ]`
      );
      
      // For routes without any preHandler
      content = content.replace(
        /fastify\.(get|post|patch|put|delete)\('([^']+)',\s*\{(?!\s*preHandler)/g,
        `fastify.$1('$2', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('${tier}.${resource}.read')
    ],`
      );
    }
    
    // 6. Add tenant isolation for tenant/user/account tiers
    if (['tenant', 'user', 'account'].includes(tier)) {
      // Add tenantId to where clauses
      content = content.replace(
        /where:\s*\{\s*([^}]*)\s*\}/g,
        (match, whereContent) => {
          if (!whereContent.includes('tenantId') && whereContent.trim()) {
            return `where: { tenantId: request.user.tenantId, ${whereContent.trim()} }`;
          } else if (!whereContent.includes('tenantId') && !whereContent.trim()) {
            return `where: { tenantId: request.user.tenantId }`;
          }
          return match;
        }
      );
    }
    
    // 7. Fix UUID parameter usage
    content = content.replace(
      /const\s+\{\s*uuid\s*\}\s*=\s*request\.params;/g,
      'const uuid = toUUID(request.params.uuid);'
    );
    
    // 8. Fix error responses to use standard format
    content = content.replace(
      /error:\s*['"`]([^'"`]+)['"`]/g,
      (match, errorMsg) => {
        const errorCode = errorMsg.toUpperCase().replace(/\s+/g, '_');
        return `error: '${errorCode}'`;
      }
    );
    
    // 9. Update permission actions based on HTTP method
    content = content.replace(
      /fastify\.(get)\(/g,
      (match) => {
        return match.replace(
          new RegExp(`requirePermission\\('${tier}\\.${resource}\\.[^']+`),
          `requirePermission('${tier}.${resource}.read`
        );
      }
    );
    
    content = content.replace(
      /fastify\.(post)\(/g,
      (match) => {
        return match.replace(
          new RegExp(`requirePermission\\('${tier}\\.${resource}\\.[^']+`),
          `requirePermission('${tier}.${resource}.create`
        );
      }
    );
    
    content = content.replace(
      /fastify\.(patch|put)\(/g,
      (match) => {
        return match.replace(
          new RegExp(`requirePermission\\('${tier}\\.${resource}\\.[^']+`),
          `requirePermission('${tier}.${resource}.update`
        );
      }
    );
    
    content = content.replace(
      /fastify\.(delete)\(/g,
      (match) => {
        return match.replace(
          new RegExp(`requirePermission\\('${tier}\\.${resource}\\.[^']+`),
          `requirePermission('${tier}.${resource}.delete`
        );
      }
    );
    
    // Write back if changed
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 MASS FIXING ALL ROUTES...\n');
  
  // Find all route files
  const routeFiles = await glob('**/*.ts', { cwd: API_BASE });
  console.log(`📂 Found ${routeFiles.length} route files to fix\n`);
  
  let fixedCount = 0;
  let totalCount = 0;
  
  // Process each file
  for (const file of routeFiles) {
    const filePath = path.join(API_BASE, file);
    totalCount++;
    
    const fixed = await massFixRoute(filePath);
    if (fixed) {
      fixedCount++;
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⏭️  Skipped: ${file}`);
    }
  }
  
  console.log(`\n🎯 MASS FIX COMPLETE!`);
  console.log(`📊 Fixed: ${fixedCount}/${totalCount} files`);
  console.log(`📈 Success Rate: ${Math.round(fixedCount / totalCount * 100)}%`);
  
  console.log('\n✨ ALL ROUTES HAVE BEEN PROCESSED!');
  console.log('\n⚠️  Next steps:');
  console.log('1. Run TypeScript compiler to check for errors');
  console.log('2. Test the API routes');
  console.log('3. Run compliance report again');
}

main().catch(console.error);