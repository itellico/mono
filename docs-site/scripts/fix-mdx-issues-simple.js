#!/usr/bin/env node

/**
 * Simple MDX Issue Fixer
 * Fixes common MDX compilation errors, specifically < followed by numbers
 */

const fs = require('fs').promises;
const path = require('path');

// Files known to have MDX issues
const PROBLEM_FILES = [
  'docs/database/performance-monitoring-guide.md',
  'docs/database/nestjs-service-update-guide.md',
  'docs/architecture/nestjs-migration/fastify-to-nestjs-migration-guide.md'
];

async function fixFile(filePath) {
  try {
    const fullPath = path.join('/Users/mm2/dev_mm/mono', filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    // Track changes
    let modified = false;
    let newContent = content;
    
    // Fix patterns that cause MDX issues
    // Pattern 1: <number (e.g., <10ms)
    newContent = newContent.replace(/(<)(\d+)/g, (match, lt, num) => {
      // Skip if it's already escaped or in a code block
      const index = content.indexOf(match);
      if (index > 0 && content[index - 1] === '&') {
        return match;
      }
      modified = true;
      return `&lt;${num}`;
    });
    
    // Pattern 2: Fix specific cases in comments
    // For the specific case in nestjs-service-update-guide.md line 277
    newContent = newContent.replace(/\/\/ (\d+)min/g, '// $1 min');
    
    if (modified || newContent !== content) {
      await fs.writeFile(fullPath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      
      // Show what was changed
      const lines = content.split('\n');
      const newLines = newContent.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] !== newLines[i]) {
          console.log(`   Line ${i + 1}: "${lines[i]}" → "${newLines[i]}"`);
        }
      }
    } else {
      console.log(`✓ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

async function main() {
  console.log('🔧 Fixing MDX Issues in Known Problem Files\n');
  
  for (const file of PROBLEM_FILES) {
    await fixFile(file);
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);