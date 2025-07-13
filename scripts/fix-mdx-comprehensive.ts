#!/usr/bin/env tsx

/**
 * Comprehensive MDX Syntax Fixer
 * Fixes all MDX compilation errors in documentation files
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

class MDXComprehensiveFixer {
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
    console.log('🔧 Starting comprehensive MDX syntax fix...');
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

    // Fix 1: Escape ALL angle brackets with numbers or comparisons
    // This includes patterns like <2>, <200ms, < 100, etc.
    const patterns = [
      // Pattern: <digit (like <2, <3, <200ms)
      { regex: /<(\d+)/g, replacement: '&lt;$1' },
      // Pattern: < space digit (like < 100)
      { regex: /\s<\s+(\d+)/g, replacement: ' &lt; $1' },
      // Pattern: >digit (like >85)
      { regex: />(\d+)/g, replacement: '&gt;$1' },
      // Pattern: > space digit (like > 100)
      { regex: /\s>\s+(\d+)/g, replacement: ' &gt; $1' },
      // Pattern: Standalone < or > not part of HTML tags
      { regex: /([^&\w])<([^a-zA-Z\/!>])/g, replacement: '$1&lt;$2' },
      { regex: /([^&\w])>([^a-zA-Z])/g, replacement: '$1&gt;$2' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(fixed)) {
        fixed = fixed.replace(pattern.regex, pattern.replacement);
        changesMade = true;
      }
    }

    // Fix 2: Fix code blocks inside lists (common MDX issue)
    // Replace code blocks that break list indentation
    const codeBlockInListPattern = /^(\s*[-*]\s.+)\n```/gm;
    if (codeBlockInListPattern.test(fixed)) {
      fixed = fixed.replace(codeBlockInListPattern, '$1\n\n```');
      changesMade = true;
    }

    // Fix 3: Fix JSX-like patterns that aren't valid JSX
    // Escape things that look like self-closing tags but aren't
    const invalidJSXPattern = /<([^>]+)\/([^>]+)>/g;
    fixed = fixed.replace(invalidJSXPattern, (match, p1, p2) => {
      // Check if it's a valid self-closing tag pattern
      if (p2.trim() === '') {
        return match; // Valid self-closing tag
      }
      return `&lt;${p1}/${p2}&gt;`; // Escape invalid pattern
    });

    // Fix 4: Fix curly braces in code blocks (MDX tries to evaluate them)
    // Wrap inline code with problematic characters
    const inlineCodePattern = /`([^`]*[{}][^`]*)`/g;
    fixed = fixed.replace(inlineCodePattern, (match, code) => {
      // If the code contains { or }, wrap it differently
      return `\`${code.replace(/\{/g, '\\{').replace(/\}/g, '\\}')}\``;
    });

    // Fix 5: Update file references to renamed files
    const linkMappings = [
      { old: 'DEVELOPER_GUIDE_COMPLETE.md', new: 'developer-guide.md' },
      { old: 'API_ENDPOINTS_5_TIER.md', new: 'api-endpoints-5-tier.md' },
      { old: 'IMPLEMENTATION_CHECKLIST.md', new: 'implementation-checklist.md' },
      { old: 'ROADMAP_QUICK_REFERENCE.md', new: 'roadmap-quick-reference.md' }
    ];

    for (const mapping of linkMappings) {
      if (fixed.includes(mapping.old)) {
        fixed = fixed.replace(new RegExp(mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping.new);
        changesMade = true;
      }
    }

    // Fix 6: Fix Markdown links that might break MDX
    // Ensure links don't have spaces or special characters that break parsing
    const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    fixed = fixed.replace(markdownLinkPattern, (match, text, url) => {
      // If URL contains spaces or special characters, encode them
      const encodedUrl = url.replace(/ /g, '%20');
      return `[${text}](${encodedUrl})`;
    });

    // Fix 7: Remove or escape problematic HTML comments
    const htmlCommentPattern = /<!--[\s\S]*?-->/g;
    fixed = fixed.replace(htmlCommentPattern, (match) => {
      // MDX doesn't like HTML comments with certain content
      // Convert to JSX-style comments
      return `{/* ${match.slice(4, -3).trim()} */}`;
    });

    // Fix 8: Clean up any double-escaped entities
    fixed = fixed
      .replace(/&amp;lt;/g, '&lt;')
      .replace(/&amp;gt;/g, '&gt;')
      .replace(/&amp;amp;/g, '&amp;');

    // Fix 9: Ensure proper spacing around headers
    // MDX needs blank lines around headers in certain contexts
    fixed = fixed.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
    fixed = fixed.replace(/(#{1,6} [^\n]+)\n([^\n#])/g, '$1\n\n$2');

    // Fix 10: Fix tables that might have alignment issues
    // Ensure table delimiters are properly formatted
    const tablePattern = /^\|(.+)\|$/gm;
    fixed = fixed.replace(tablePattern, (match) => {
      // Ensure proper spacing in table rows
      return match.replace(/\s*\|\s*/g, ' | ');
    });

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
  
  const fixer = new MDXComprehensiveFixer(docsDir, dryRun);
  
  try {
    await fixer.fix();
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. No files were actually modified.');
      console.log('Run without --dry-run to perform the actual fixes.');
    } else {
      console.log('\n✅ Comprehensive MDX syntax fixes complete!');
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