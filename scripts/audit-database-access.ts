#!/usr/bin/env npx tsx
/**
 * Database Access Audit Script
 * 
 * Scans the Next.js app for direct database access patterns
 * that should be routed through NestJS API instead.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Patterns that indicate direct database access
const FORBIDDEN_PATTERNS = [
  {
    pattern: /import.*db.*from.*@\/lib\/db/,
    description: 'Direct database import'
  },
  {
    pattern: /import.*prisma.*from/,
    description: 'Direct Prisma import'
  },
  {
    pattern: /await\s+(db|prisma)\.(user|account|tenant|role|permission|category|tag|media)/,
    description: 'Direct database query'
  },
  {
    pattern: /\.(findFirst|findMany|findUnique|create|update|delete|upsert|aggregate|count|groupBy)\(/,
    description: 'Database operation',
    exclude: /\.(set|map|array|selectedValues|newSet|cache|timeouts|promise)\./
  }
];

const ALLOWED_PATHS = [
  'lib/db.ts', // Database connection definition
  'lib/services/', // Service layer is allowed
  'app/api/', // API routes are allowed (they're server-side)
];

interface ViolationResult {
  file: string;
  line: number;
  pattern: string;
  description: string;
  code: string;
}

async function scanFile(filePath: string): Promise<ViolationResult[]> {
  const violations: ViolationResult[] = [];
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      FORBIDDEN_PATTERNS.forEach(patternObj => {
        if (patternObj.pattern.test(line)) {
          // Skip if exclude pattern matches
          if (patternObj.exclude && patternObj.exclude.test(line)) {
            return;
          }
          
          violations.push({
            file: filePath,
            line: index + 1,
            pattern: patternObj.pattern.source,
            description: patternObj.description,
            code: line.trim()
          });
        }
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  
  return violations;
}

function isAllowedPath(filePath: string): boolean {
  return ALLOWED_PATHS.some(allowedPath => 
    filePath.includes(allowedPath)
  );
}

async function main() {
  console.log('🔍 Auditing Next.js app for direct database access...\n');
  
  const patterns = [
    'apps/web/src/app/**/*.{ts,tsx}',
    'apps/web/src/components/**/*.{ts,tsx}',
    'apps/web/src/lib/**/*.{ts,tsx}',
    'apps/web/src/hooks/**/*.{ts,tsx}',
  ];
  
  let totalViolations = 0;
  let violatingFiles = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
    });
    
    for (const file of files) {
      const filePath = path.resolve(file);
      
      if (isAllowedPath(filePath)) {
        continue; // Skip allowed paths
      }
      
      const violations = await scanFile(filePath);
      
      if (violations.length > 0) {
        violatingFiles++;
        console.log(`\n❌ ${file}`);
        
        violations.forEach(violation => {
          totalViolations++;
          console.log(`   Line ${violation.line}: ${violation.code}`);
          console.log(`   Issue: ${violation.description}`);
        });
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 AUDIT RESULTS:`);
  console.log(`   Files with violations: ${violatingFiles}`);
  console.log(`   Total violations: ${totalViolations}`);
  
  if (totalViolations > 0) {
    console.log('\n🚨 VIOLATIONS FOUND!');
    console.log('These files should use NestJS API endpoints instead of direct database access.');
    console.log('\n✅ SOLUTIONS:');
    console.log('1. Create NestJS endpoints with @Auth() and @Permission() decorators');
    console.log('2. Use HTTP calls from Next.js to NestJS API');
    console.log('3. Remove direct database imports from Next.js files');
    process.exit(1);
  } else {
    console.log('\n✅ NO VIOLATIONS FOUND!');
    console.log('All database access is properly routed through NestJS API.');
  }
}

main().catch(console.error);