#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Counter for tracking changes
let filesModified = 0;
let totalChanges = 0;

/**
 * Recursively find all TypeScript files
 */
function findTSFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
      findTSFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Fix JS imports in a file
 */
function fixJSImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Patterns to match and fix
    const patterns = [
      // import statements with .js extensions
      {
        regex: /import\s+(?:.*?)\s+from\s+(['"`])([^'"`]*?)\.js\1/g,
        replace: (match, quote, path) => match.replace(`.js${quote}`, quote)
      },
      // export statements with .js extensions  
      {
        regex: /export\s+(?:.*?)\s+from\s+(['"`])([^'"`]*?)\.js\1/g,
        replace: (match, quote, path) => match.replace(`.js${quote}`, quote)
      },
      // require statements with .js extensions
      {
        regex: /require\s*\(\s*(['"`])([^'"`]*?)\.js\1\s*\)/g,
        replace: (match, quote, path) => match.replace(`.js${quote}`, quote)
      }
    ];
    
    let newContent = content;
    let changes = 0;
    
    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern.regex)];
      for (const match of matches) {
        const fixed = pattern.replace(match[0], match[1], match[2]);
        newContent = newContent.replace(match[0], fixed);
        changes++;
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed ${changes} imports in: ${path.relative(projectRoot, filePath)}`);
      filesModified++;
      totalChanges += changes;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Starting TypeScript import fixes...\n');
  
  // Find all TypeScript files in the apps/api directory
  const apiDir = path.join(projectRoot, 'apps', 'api', 'src');
  const tsFiles = findTSFiles(apiDir);
  
  console.log(`📁 Found ${tsFiles.length} TypeScript files in apps/api/src\n`);
  
  // Process each file
  for (const file of tsFiles) {
    fixJSImports(file);
  }
  
  console.log(`\n🎉 Import fix completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Files processed: ${tsFiles.length}`);
  console.log(`   - Files modified: ${filesModified}`);
  console.log(`   - Total changes: ${totalChanges}`);
  
  if (filesModified === 0) {
    console.log(`\n✨ No .js imports found - all imports are already clean!`);
  } else {
    console.log(`\n✨ All .js extensions removed from TypeScript imports!`);
  }
}

// Run the script
main();