#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const docsPath = args.find(arg => !arg.startsWith('--')) || '../docs';
const verbose = args.includes('--verbose');

console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║         MDX Issue Fixer - Comprehensive Node.js            ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
console.log();

console.log(`${colors.cyan}Configuration:${colors.reset}`);
console.log(`  Docs path: ${docsPath}`);
console.log(`  Dry run: ${isDryRun}`);
console.log(`  Verbose: ${verbose}`);
console.log();

// MDX issue patterns to fix
const patterns = [
  {
    name: 'Less-than with numbers',
    // Match < followed by a digit, but not in code blocks or already escaped
    regex: /(?<!`)(?<!&lt;)(?<!\\)<(\d)/g,
    replacement: '&lt;$1',
    description: 'Replace <number with &lt;number'
  },
  {
    name: 'Less-than-or-equal',
    regex: /(?<!`)(?<!\\)<=(?!`)/g,
    replacement: '&lt;=',
    description: 'Replace <= with &lt;='
  },
  {
    name: 'Greater-than-or-equal',
    regex: /(?<!`)(?<!\\)>=(?!`)/g,
    replacement: '&gt;=',
    description: 'Replace >= with &gt;='
  }
];

// Function to check if a line is inside a code block
function isInCodeBlock(lines, lineIndex) {
  let inCodeBlock = false;
  for (let i = 0; i < lineIndex; i++) {
    if (lines[i].startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
  }
  return inCodeBlock;
}

// Function to fix MDX issues in a file
function fixMDXFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modifiedContent = content;
    let changesMade = [];

    // Process each line
    lines.forEach((line, index) => {
      // Skip if in code block
      if (isInCodeBlock(lines, index) || line.trim().startsWith('```')) {
        return;
      }

      // Apply each pattern
      patterns.forEach(pattern => {
        const matches = line.match(pattern.regex);
        if (matches) {
          const newLine = line.replace(pattern.regex, pattern.replacement);
          if (newLine !== line) {
            changesMade.push({
              line: index + 1,
              pattern: pattern.name,
              before: line.trim(),
              after: newLine.trim()
            });
            // Replace in the full content
            modifiedContent = modifiedContent.replace(line, newLine);
          }
        }
      });
    });

    if (changesMade.length > 0) {
      if (isDryRun) {
        console.log(`${colors.yellow}Would fix: ${filePath}${colors.reset}`);
        if (verbose) {
          changesMade.forEach(change => {
            console.log(`  Line ${change.line}: ${change.pattern}`);
            console.log(`    Before: ${change.before}`);
            console.log(`    After:  ${change.after}`);
          });
        }
      } else {
        // Create backup
        fs.writeFileSync(`${filePath}.bak`, content);
        // Write fixed content
        fs.writeFileSync(filePath, modifiedContent);
        // Remove backup
        fs.unlinkSync(`${filePath}.bak`);
        console.log(`${colors.green}✅ Fixed: ${filePath}${colors.reset}`);
        if (verbose) {
          console.log(`   ${changesMade.length} issues fixed`);
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`${colors.red}Error processing ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main execution
const docsDir = path.resolve(docsPath);
console.log(`${colors.cyan}Scanning for MDX issues in: ${docsDir}${colors.reset}`);

// Find all markdown files
const pattern = path.join(docsDir, '**/*.{md,mdx}');
const files = glob.sync(pattern);

console.log(`Found ${files.length} markdown files`);
console.log();

let filesFixed = 0;
let totalIssues = 0;

files.forEach(file => {
  if (fixMDXFile(file)) {
    filesFixed++;
  }
});

// Summary
console.log();
console.log(`${colors.blue}════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}Summary:${colors.reset}`);
console.log(`  Files scanned: ${files.length}`);
console.log(`  Files ${isDryRun ? 'with issues' : 'fixed'}: ${filesFixed}`);

if (isDryRun && filesFixed > 0) {
  console.log();
  console.log(`${colors.yellow}This was a dry run. To apply fixes, run:${colors.reset}`);
  console.log(`${colors.blue}npm run mdx:fix${colors.reset}`);
  process.exit(1); // Exit with error code to fail prebuild check
}

console.log();
console.log(`${colors.green}✅ MDX issue scan complete!${colors.reset}`);

// Exit with appropriate code
process.exit(filesFixed > 0 && isDryRun ? 1 : 0);