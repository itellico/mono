#!/usr/bin/env node

/**
 * Fix MDX Compilation Issues Script
 * 
 * This script automatically fixes common MDX compilation errors in markdown files.
 * It addresses issues where MDX interprets certain patterns as JSX tags.
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Patterns that cause MDX compilation issues
const MDX_ISSUE_PATTERNS = [
  {
    name: 'Less than with number',
    pattern: /<(\d+)/g,
    replacement: '&lt;$1',
    description: 'Replace <number with &lt;number'
  },
  {
    name: 'Greater than with space',
    pattern: />\s+(\d+)/g,
    replacement: '&gt; $1',
    description: 'Replace > number with &gt; number'
  },
  {
    name: 'Standalone less than',
    pattern: /(\s)<(\s)/g,
    replacement: '$1&lt;$2',
    description: 'Replace standalone < with &lt;'
  },
  {
    name: 'Standalone greater than',
    pattern: /(\s)>(\s)/g,
    replacement: '$1&gt;$2',
    description: 'Replace standalone > with &gt;'
  },
  {
    name: 'Comparison operators in text',
    pattern: /(\w+)\s*<\s*(\d+)/g,
    replacement: '$1 &lt; $2',
    description: 'Fix comparison operators like "value < 10"'
  },
  {
    name: 'Range expressions',
    pattern: /(\d+)\s*<\s*(\w+)\s*<\s*(\d+)/g,
    replacement: '$1 &lt; $2 &lt; $3',
    description: 'Fix range expressions like "0 < x < 10"'
  }
];

// Patterns to exclude from replacement (e.g., valid HTML/JSX)
const EXCLUSION_PATTERNS = [
  /<[a-zA-Z][a-zA-Z0-9]*(\s|>|\/)/,  // Valid HTML tags
  /<\/[a-zA-Z][a-zA-Z0-9]*>/,        // Closing tags
  /```[\s\S]*?```/,                   // Code blocks
  /`[^`]+`/,                          // Inline code
];

class MDXFixer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.stats = {
      filesScanned: 0,
      filesFixed: 0,
      issuesFound: 0,
      issuesFixed: 0
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async findMarkdownFiles(directory) {
    const patterns = [
      path.join(directory, '**/*.md'),
      path.join(directory, '**/*.mdx')
    ];
    
    const excludePatterns = [
      '**/node_modules/**',
      '**/.next/**',
      '**/build/**',
      '**/dist/**',
      '**/.git/**'
    ];

    let files = [];
    for (const pattern of patterns) {
      const matchedFiles = await glob(pattern, {
        ignore: excludePatterns
      });
      files = files.concat(matchedFiles);
    }

    return files;
  }

  isInCodeBlock(content, index) {
    // Check if the index is within a code block
    const beforeIndex = content.substring(0, index);
    const codeBlockStarts = (beforeIndex.match(/```/g) || []).length;
    return codeBlockStarts % 2 === 1;
  }

  isInInlineCode(content, index) {
    // Check if the index is within inline code
    const line = content.substring(0, index).split('\n').pop();
    const backticks = (line.match(/`/g) || []).length;
    return backticks % 2 === 1;
  }

  fixContent(content, filePath) {
    let fixedContent = content;
    const issues = [];

    for (const fix of MDX_ISSUE_PATTERNS) {
      let match;
      const tempContent = fixedContent;
      
      while ((match = fix.pattern.exec(tempContent)) !== null) {
        const index = match.index;
        
        // Skip if in code block or inline code
        if (this.isInCodeBlock(tempContent, index) || this.isInInlineCode(tempContent, index)) {
          continue;
        }

        issues.push({
          line: tempContent.substring(0, index).split('\n').length,
          column: index - tempContent.lastIndexOf('\n', index),
          pattern: fix.name,
          original: match[0],
          replacement: match[0].replace(fix.pattern, fix.replacement)
        });
      }

      // Apply the fix
      fixedContent = fixedContent.replace(fix.pattern, (match, ...args) => {
        const index = args[args.length - 2]; // Get match index
        if (this.isInCodeBlock(fixedContent, index) || this.isInInlineCode(fixedContent, index)) {
          return match; // Don't replace in code blocks
        }
        return match.replace(fix.pattern, fix.replacement);
      });
    }

    return { fixedContent, issues };
  }

  async processFile(filePath) {
    try {
      this.stats.filesScanned++;
      
      const content = await fs.readFile(filePath, 'utf8');
      const { fixedContent, issues } = this.fixContent(content, filePath);

      if (issues.length > 0) {
        this.stats.issuesFound += issues.length;
        
        if (this.verbose) {
          this.log(`\n📄 ${path.relative(process.cwd(), filePath)}`, 'cyan');
          issues.forEach(issue => {
            this.log(`   Line ${issue.line}, Col ${issue.column}: ${issue.pattern}`, 'yellow');
            this.log(`   "${issue.original}" → "${issue.replacement}"`, 'bright');
          });
        }

        if (!this.dryRun) {
          await fs.writeFile(filePath, fixedContent, 'utf8');
          this.stats.filesFixed++;
          this.stats.issuesFixed += issues.length;
          this.log(`   ✅ Fixed ${issues.length} issues`, 'green');
        } else {
          this.log(`   🔍 Found ${issues.length} issues (dry run)`, 'yellow');
        }
      }

      return issues;
    } catch (error) {
      this.log(`❌ Error processing ${filePath}: ${error.message}`, 'red');
      return [];
    }
  }

  async run(directory) {
    this.log(`\n🔧 MDX Issue Fixer`, 'bright');
    this.log(`📁 Scanning directory: ${directory}`, 'cyan');
    this.log(`${this.dryRun ? '🔍 DRY RUN MODE' : '✏️  FIX MODE'}`, this.dryRun ? 'yellow' : 'green');
    
    const files = await this.findMarkdownFiles(directory);
    this.log(`📋 Found ${files.length} markdown files\n`, 'blue');

    for (const file of files) {
      await this.processFile(file);
    }

    this.log(`\n📊 Summary:`, 'bright');
    this.log(`   Files scanned: ${this.stats.filesScanned}`, 'cyan');
    this.log(`   Files with issues: ${this.stats.filesFixed}`, 'yellow');
    this.log(`   Total issues found: ${this.stats.issuesFound}`, 'yellow');
    this.log(`   Total issues fixed: ${this.stats.issuesFixed}`, 'green');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`
MDX Issue Fixer - Fix common MDX compilation errors in markdown files

Usage: node fix-mdx-issues.js [options] [directory]

Options:
  -d, --dry-run    Show what would be fixed without making changes
  -v, --verbose    Show detailed information about each fix
  -h, --help       Show this help message

Examples:
  node fix-mdx-issues.js                     # Fix issues in current directory
  node fix-mdx-issues.js --dry-run           # Show issues without fixing
  node fix-mdx-issues.js ../docs --verbose   # Fix issues in ../docs with details
`);
    process.exit(0);
  }

  const directory = args.find(arg => !arg.startsWith('-')) || '.';
  const fixer = new MDXFixer(options);

  try {
    await fixer.run(path.resolve(directory));
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MDXFixer;