#!/usr/bin/env tsx
/**
 * Script to update all services to use type-safe UUID types
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

const PROJECT_ROOT = process.cwd();

// Patterns to replace
const REPLACEMENTS = [
  // Replace string type with UUID for uuid parameters
  {
    pattern: /(\w+):\s*string(\s*[,\)])/g,
    test: (match: string, varName: string) => {
      return varName.toLowerCase().includes('uuid') || 
             varName.endsWith('Id') && !varName.includes('string');
    },
    replacement: '$1: UUID$2'
  },
  // Replace z.string() with uuidSchema for uuid validations
  {
    pattern: /(\w+):\s*z\.string\(\)\.uuid\(\)/g,
    replacement: '$1: uuidSchema'
  },
  // Update function parameters
  {
    pattern: /\(([^)]*)\buuid:\s*string([^)]*)\)/g,
    replacement: '($1uuid: UUID$2)'
  },
  // Update interface properties
  {
    pattern: /^(\s*)uuid:\s*string;/gm,
    replacement: '$1uuid: UUID;'
  },
  // Update return types
  {
    pattern: /:\s*Promise<([^>]*)uuid:\s*string([^>]*)>/g,
    replacement: ': Promise<$1uuid: UUID$2>'
  }
];

async function updateFile(filePath: string): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Skip if already has UUID import
    const hasUuidImport = content.includes("from '@/lib/types/uuid'") || 
                         content.includes('from "../types/uuid"') ||
                         content.includes("from '../../types/uuid'");
    
    // Apply replacements
    let modified = false;
    for (const replacement of REPLACEMENTS) {
      if (replacement.test) {
        // Complex replacement with test function
        content = content.replace(replacement.pattern, (match, ...args) => {
          if (replacement.test!(match, args[0])) {
            modified = true;
            return match.replace(args[0] + ': string', args[0] + ': UUID');
          }
          return match;
        });
      } else {
        // Simple replacement
        const newContent = content.replace(replacement.pattern, replacement.replacement);
        if (newContent !== content) {
          modified = true;
          content = newContent;
        }
      }
    }
    
    // Add UUID import if needed and file was modified
    if (modified && !hasUuidImport && content.includes('UUID')) {
      // Determine import path based on file location
      const relativePath = path.relative(path.dirname(filePath), path.join(PROJECT_ROOT, 'src/lib/types/uuid'));
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      
      // Add import after other imports
      if (content.includes('import ')) {
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + 
                 `import { UUID, uuidSchema, toUUID, parseUUID } from '${importPath.replace(/\\/g, '/').replace(/\.ts$/, '')}';\n` +
                 content.slice(endOfLine + 1);
      } else {
        // No imports, add at top
        content = `import { UUID, uuidSchema, toUUID, parseUUID } from '${importPath.replace(/\\/g, '/').replace(/\.ts$/, '')}';\n\n` + content;
      }
    }
    
    // Write back if changed
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

async function findServiceFiles(): Promise<string[]> {
  const patterns = [
    'src/lib/services/**/*.ts',
    'apps/api/src/services/**/*.ts',
    'src/app/api/**/*.ts',
    'apps/api/src/routes/**/*.ts'
  ];
  
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: PROJECT_ROOT });
    files.push(...matches.map(f => path.join(PROJECT_ROOT, f)));
  }
  
  return files;
}

async function updateApiResponses() {
  console.log('\n🔒 Updating API responses to hide internal IDs...');
  
  const apiFiles = await glob('apps/api/src/routes/**/*.ts', { cwd: PROJECT_ROOT });
  
  for (const file of apiFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Remove id from response objects
    content = content.replace(
      /return\s*{\s*([^}]*)\s*id:\s*\w+\.id,/g,
      'return {\n$1'
    );
    
    // Remove id from spread operations
    content = content.replace(
      /\.\.\.(\w+),\s*id:\s*undefined/g,
      '...$1'
    );
    
    // Add explicit omit for id fields
    content = content.replace(
      /const\s+(\w+)\s*=\s*await\s+[^;]+;/g,
      (match, varName) => {
        if (match.includes('findMany') || match.includes('findFirst') || match.includes('create')) {
          return match + `\n    const { id, ...${varName}Data } = ${varName};`;
        }
        return match;
      }
    );
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Updated API responses in ${path.basename(file)}`);
    }
  }
}

async function createUuidMigrationGuide() {
  const guide = `# UUID Migration Guide

## Overview
This guide helps migrate from string-based IDs to type-safe UUIDs.

## Import UUID Types
\`\`\`typescript
import { UUID, uuidSchema, toUUID, parseUUID, isUUID } from '@/lib/types/uuid';
\`\`\`

## Common Patterns

### Service Methods
\`\`\`typescript
// Before
async getUser(userId: string) { ... }

// After
async getUser(userId: UUID) { ... }
\`\`\`

### Validation
\`\`\`typescript
// Before
userId: z.string().uuid()

// After
userId: uuidSchema
\`\`\`

### Type Conversion
\`\`\`typescript
// Safe conversion with validation
const uuid = toUUID(request.params.uuid); // Throws if invalid

// Parse with null on invalid
const uuid = parseUUID(request.params.uuid); // Returns null if invalid
if (!uuid) {
  return reply.status(400).send({ error: 'Invalid UUID' });
}
\`\`\`

### API Responses
\`\`\`typescript
// Never expose internal IDs
const { id, ...userData } = user;
return { success: true, data: userData };
\`\`\`

## Testing
Always validate UUIDs at API boundaries and in tests.
`;

  await fs.writeFile(path.join(PROJECT_ROOT, 'docs/migrations/UUID_MIGRATION_GUIDE.md'), guide);
  console.log('📚 Created UUID migration guide');
}

async function main() {
  console.log('🔄 Starting UUID type migration...\n');
  
  // Find all service files
  console.log('🔍 Finding service files...');
  const files = await findServiceFiles();
  console.log(`Found ${files.length} files to check`);
  
  // Update each file
  console.log('\n📝 Updating files...');
  let updatedCount = 0;
  
  for (const file of files) {
    const updated = await updateFile(file);
    if (updated) {
      updatedCount++;
      console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, file)}`);
    }
  }
  
  // Update API responses
  await updateApiResponses();
  
  // Create migration guide
  await createUuidMigrationGuide();
  
  console.log(`\n✨ UUID migration complete! Updated ${updatedCount} files.`);
  console.log('\n⚠️  Next steps:');
  console.log('1. Run TypeScript compiler to check for type errors');
  console.log('2. Update tests to use UUID types');
  console.log('3. Run all tests to ensure functionality');
}

main().catch(console.error);