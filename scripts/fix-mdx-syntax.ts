#!/usr/bin/env tsx

/**
 * MDX Syntax Fixer Script
 * Fixes common MDX compilation errors in documentation files
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

interface FixStats {
  filesProcessed: number;
  issuesFixed: number;
  errors: number;
}

class MDXSyntaxFixer {
  private stats: FixStats = {
    filesProcessed: 0,
    issuesFixed: 0,
    errors: 0
  };

  constructor(
    private docsDir: string,
    private dryRun: boolean = false
  ) {}

  async fix() {
    console.log('🔧 Starting MDX syntax fix...');
    console.log(`Directory: ${this.docsDir}`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const mdFiles = await glob('**/*.md', {
      cwd: this.docsDir,
      absolute: true
    });

    for (const mdFile of mdFiles) {
      try {
        await this.fixFile(mdFile);
      } catch (error) {
        console.error(`Error processing ${mdFile}:`, error);
        this.stats.errors++;
      }
    }

    this.printStats();
  }

  private async fixFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: mdContent } = matter(content);
    
    let fixed = mdContent;
    let changesMade = false;

    // Fix 1: Replace angle brackets with HTML entities
    // Matches patterns like <200ms, <2>, etc.
    const anglePattern = /<(\d+)(ms|s|m|h|>)?/g;
    if (anglePattern.test(fixed)) {
      fixed = fixed.replace(anglePattern, '&lt;$1$2');
      changesMade = true;
    }

    // Fix 2: Escape loose angle brackets in comparisons
    // Matches patterns like "< 200" or "< 100"
    const comparisonPattern = /\s<\s*(\d+)/g;
    if (comparisonPattern.test(fixed)) {
      fixed = fixed.replace(comparisonPattern, ' &lt; $1');
      changesMade = true;
    }

    // Fix 3: Fix standalone less than signs
    const standaloneLessThan = /([^&])<([^a-zA-Z\/!])/g;
    if (standaloneLessThan.test(fixed)) {
      fixed = fixed.replace(standaloneLessThan, '$1&lt;$2');
      changesMade = true;
    }

    // Fix 4: Update broken links to renamed files
    // DEVELOPER_GUIDE_COMPLETE.md -> developer-guide.md
    const linkMappings = [
      { old: 'DEVELOPER_GUIDE_COMPLETE.md', new: 'developer-guide.md' },
      { old: 'API_ENDPOINTS_5_TIER.md', new: 'api-endpoints-5-tier.md' },
      { old: 'IMPLEMENTATION_CHECKLIST.md', new: 'implementation-checklist.md' },
      { old: 'ROADMAP_QUICK_REFERENCE.md', new: 'roadmap-quick-reference.md' }
    ];

    for (const mapping of linkMappings) {
      if (fixed.includes(mapping.old)) {
        fixed = fixed.replace(new RegExp(mapping.old, 'g'), mapping.new);
        changesMade = true;
      }
    }

    // Fix 5: Clean up any double-escaped entities
    fixed = fixed.replace(/&amp;lt;/g, '&lt;');
    fixed = fixed.replace(/&amp;gt;/g, '&gt;');

    if (changesMade) {
      const newContent = matter.stringify(fixed, data);
      
      if (!this.dryRun) {
        await fs.writeFile(filePath, newContent, 'utf-8');
      }
      
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      this.stats.issuesFixed++;
    }

    this.stats.filesProcessed++;
  }

  private printStats() {
    console.log('\n📊 Fix Statistics:');
    console.log(`📄 Files processed: ${this.stats.filesProcessed}`);
    console.log(`🔧 Issues fixed: ${this.stats.issuesFixed}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const docsDir = path.resolve(process.cwd(), 'docs');
  
  const fixer = new MDXSyntaxFixer(docsDir, dryRun);
  
  try {
    await fixer.fix();
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. No files were actually modified.');
      console.log('Run without --dry-run to perform the actual fixes.');
    } else {
      console.log('\n✅ MDX syntax fixes complete!');
      console.log('\nNext step: Restart Docusaurus to see the changes.');
    }
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}