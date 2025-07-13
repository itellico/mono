#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Fix MDX compilation errors by escaping angle brackets in markdown files
 * This script fixes patterns like <5ms, >90%, <1000 items that break MDX compilation
 */

console.log('🔧 Starting MDX angle bracket fix...');

// Find all markdown files in docs directory
const docsDir = path.join(__dirname, '..', 'docs');
const command = `find "${docsDir}" -name "*.md" -type f`;
const files = execSync(command, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

console.log(`📁 Found ${files.length} markdown files to process`);

let totalFixed = 0;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileFixed = 0;

    // Pattern 1: <number followed by letters/units (e.g., <5ms, <1000 items, <50/min)
    const pattern1 = /(<)(\d+(?:\.\d+)?(?:[a-zA-Z\/]+)?)/g;
    newContent = newContent.replace(pattern1, (match, bracket, rest) => {
      fileFixed++;
      return `&lt;${rest}`;
    });

    // Pattern 2: >number followed by letters/units (e.g., >90%, >100/sec)
    const pattern2 = /(>)(\d+(?:\.\d+)?(?:[a-zA-Z\/]+)?)/g;
    newContent = newContent.replace(pattern2, (match, bracket, rest) => {
      fileFixed++;
      return `&gt;${rest}`;
    });

    // Pattern 3: Escaped backslashes that need to be converted (e.g., \\<, \\>)
    const pattern3 = /\\\\([<>])(\d+(?:\.\d+)?(?:[a-zA-Z\/]+)?)/g;
    newContent = newContent.replace(pattern3, (match, bracket, rest) => {
      fileFixed++;
      if (bracket === '<') {
        return `&lt;${rest}`;
      } else {
        return `&gt;${rest}`;
      }
    });

    // Pattern 4: Already partially escaped patterns like \<, \>
    const pattern4 = /\\([<>])(\d+(?:\.\d+)?(?:[a-zA-Z\/]+)?)/g;
    newContent = newContent.replace(pattern4, (match, bracket, rest) => {
      fileFixed++;
      if (bracket === '<') {
        return `&lt;${rest}`;
      } else {
        return `&gt;${rest}`;
      }
    });

    if (fileFixed > 0) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed ${fileFixed} patterns in ${path.relative(docsDir, filePath)}`);
      totalFixed += fileFixed;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Complete! Fixed ${totalFixed} angle bracket patterns across all files.`);
console.log('\n🧪 Testing MDX compilation...');

// Test the build
try {
  execSync('cd docs-site && pnpm run build', { stdio: 'inherit' });
  console.log('✅ MDX compilation successful!');
} catch (error) {
  console.log('❌ Some MDX errors may still exist. Check the build output above.');
}