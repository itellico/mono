#!/usr/bin/env tsx

/**
 * Documentation Cleanup Script
 * Consolidates, converts, and reorganizes all documentation
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Add custom rules for better conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`
});

interface FileMapping {
  oldPath: string;
  newPath: string;
  category: string;
  title: string;
}

interface CleanupStats {
  htmlConverted: number;
  markdownMoved: number;
  rootFilesMoved: number;
  duplicatesRemoved: number;
  filesRenamed: number;
  errors: number;
}

class DocumentationCleaner {
  private stats: CleanupStats = {
    htmlConverted: 0,
    markdownMoved: 0,
    rootFilesMoved: 0,
    duplicatesRemoved: 0,
    filesRenamed: 0,
    errors: 0
  };

  private fileMappings: FileMapping[] = [];
  private processedContent = new Map<string, string>();

  constructor(
    private rootDir: string,
    private docsDir: string,
    private dryRun: boolean = false
  ) {}

  async cleanup() {
    console.log('🧹 Starting documentation cleanup...');
    console.log(`Root: ${this.rootDir}`);
    console.log(`Docs: ${this.docsDir}`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Step 1: Convert HTML files to Markdown
    await this.convertHTMLFiles();

    // Step 2: Move root documentation files
    await this.moveRootDocFiles();

    // Step 3: Reorganize and rename files
    await this.reorganizeFiles();

    // Step 4: Remove duplicates
    await this.removeDuplicates();

    // Step 5: Create index files
    await this.createIndexFiles();

    // Step 6: Update Docusaurus sidebar
    await this.updateDocusaurusSidebar();

    // Print results
    this.printStats();
    this.saveMappingReport();
  }

  private async convertHTMLFiles() {
    console.log('📄 Converting HTML files to Markdown...');
    
    const htmlFiles = await glob('**/*.html', {
      cwd: this.docsDir,
      absolute: true
    });

    for (const htmlFile of htmlFiles) {
      try {
        await this.convertHTMLToMarkdown(htmlFile);
      } catch (error) {
        console.error(`Error converting ${htmlFile}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async convertHTMLToMarkdown(htmlPath: string) {
    const htmlContent = await fs.readFile(htmlPath, 'utf-8');
    
    // Parse HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract title
    const h1 = document.querySelector('h1');
    const title = h1?.textContent || 
                 document.querySelector('title')?.textContent ||
                 this.generateTitleFromPath(path.basename(htmlPath, '.html'));
    
    // Remove the h1 from content if it exists (we'll add it via frontmatter)
    if (h1) h1.remove();
    
    // Convert to markdown
    const bodyContent = document.body?.innerHTML || htmlContent;
    let markdownContent = turndownService.turndown(bodyContent);
    
    // Clean up the markdown
    markdownContent = this.cleanupMarkdown(markdownContent);
    
    // Extract category from path
    const category = this.determineCategoryFromPath(htmlPath);
    
    // Create frontmatter
    const frontmatter = {
      title: this.cleanupTitle(title),
      category,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    // Create full markdown with frontmatter
    const fullContent = matter.stringify(markdownContent, frontmatter);
    
    // Generate new path
    const newFileName = this.generateCleanFileName(title);
    const newPath = htmlPath.replace(/\.html$/, '.md').replace(path.basename(htmlPath), newFileName);
    
    // Save mapping
    this.fileMappings.push({
      oldPath: htmlPath,
      newPath,
      category,
      title: frontmatter.title
    });
    
    // Store content for duplicate detection
    this.processedContent.set(this.normalizeContent(markdownContent), newPath);
    
    if (!this.dryRun) {
      await fs.writeFile(newPath, fullContent, 'utf-8');
      await fs.unlink(htmlPath); // Remove HTML file
    }
    
    console.log(`✅ Converted: ${path.basename(htmlPath)} → ${path.basename(newPath)}`);
    this.stats.htmlConverted++;
  }

  private async moveRootDocFiles() {
    console.log('\n📁 Moving root documentation files...');
    
    const rootMdFiles = await glob('*.md', {
      cwd: this.rootDir,
      absolute: true,
      ignore: ['README.md', 'CLAUDE.md'] // Keep these in root
    });

    for (const mdFile of rootMdFiles) {
      try {
        await this.moveRootFile(mdFile);
      } catch (error) {
        console.error(`Error moving ${mdFile}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async moveRootFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: mdContent } = matter(content);
    
    // Determine category based on content
    const fileName = path.basename(filePath);
    const category = this.determineCategoryFromFileName(fileName);
    
    // Clean up title
    const title = data.title || this.generateTitleFromPath(fileName);
    const cleanTitle = this.cleanupTitle(title);
    
    // Update frontmatter
    const updatedFrontmatter = {
      ...data,
      title: cleanTitle,
      category,
      lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0]
    };
    
    // Create new content
    const newContent = matter.stringify(mdContent, updatedFrontmatter);
    
    // Generate new path
    const cleanFileName = this.generateCleanFileName(cleanTitle);
    const newPath = path.join(this.docsDir, category, cleanFileName);
    
    // Save mapping
    this.fileMappings.push({
      oldPath: filePath,
      newPath,
      category,
      title: cleanTitle
    });
    
    if (!this.dryRun) {
      await fs.mkdir(path.dirname(newPath), { recursive: true });
      await fs.writeFile(newPath, newContent, 'utf-8');
      await fs.unlink(filePath); // Remove from root
    }
    
    console.log(`✅ Moved: ${fileName} → ${category}/${cleanFileName}`);
    this.stats.rootFilesMoved++;
  }

  private async reorganizeFiles() {
    console.log('\n🗂️  Reorganizing and renaming files...');
    
    const mdFiles = await glob('**/*.md', {
      cwd: this.docsDir,
      absolute: true,
      ignore: ['**/README.md', '**/DOCUMENTATION_*.md']
    });

    for (const mdFile of mdFiles) {
      try {
        await this.reorganizeFile(mdFile);
      } catch (error) {
        console.error(`Error reorganizing ${mdFile}:`, error);
        this.stats.errors++;
      }
    }
  }

  private async reorganizeFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: mdContent } = matter(content);
    
    // Skip if already processed
    if (this.fileMappings.some(m => m.newPath === filePath)) {
      return;
    }
    
    // Clean up title
    const originalTitle = data.title || this.generateTitleFromPath(path.basename(filePath));
    const cleanTitle = this.cleanupTitle(originalTitle);
    
    // Check if title needs shortening
    if (originalTitle !== cleanTitle) {
      data.title = cleanTitle;
      const newContent = matter.stringify(mdContent, data);
      
      // Generate new filename
      const newFileName = this.generateCleanFileName(cleanTitle);
      const dir = path.dirname(filePath);
      const newPath = path.join(dir, newFileName);
      
      if (newPath !== filePath) {
        if (!this.dryRun) {
          await fs.writeFile(newPath, newContent, 'utf-8');
          await fs.unlink(filePath);
        }
        
        console.log(`✅ Renamed: ${path.basename(filePath)} → ${newFileName}`);
        this.stats.filesRenamed++;
      }
    }
  }

  private async removeDuplicates() {
    console.log('\n🔍 Removing duplicate content...');
    
    const contentMap = new Map<string, string[]>();
    
    // Group files by normalized content
    for (const [content, filePath] of this.processedContent) {
      const files = contentMap.get(content) || [];
      files.push(filePath);
      contentMap.set(content, files);
    }
    
    // Remove duplicates
    for (const [content, files] of contentMap) {
      if (files.length > 1) {
        // Keep the first file, remove others
        const [keep, ...remove] = files;
        console.log(`📋 Keeping: ${path.basename(keep)}`);
        
        for (const duplicate of remove) {
          if (!this.dryRun && await this.fileExists(duplicate)) {
            await fs.unlink(duplicate);
          }
          console.log(`   ❌ Removing duplicate: ${path.basename(duplicate)}`);
          this.stats.duplicatesRemoved++;
        }
      }
    }
  }

  private async createIndexFiles() {
    console.log('\n📝 Creating index files...');
    
    const categories = ['getting-started', 'architecture', 'features', 'api-reference', 
                       'development', 'deployment', 'testing', 'troubleshooting'];
    
    for (const category of categories) {
      const categoryPath = path.join(this.docsDir, category);
      const indexPath = path.join(categoryPath, 'README.md');
      
      if (!this.dryRun) {
        await fs.mkdir(categoryPath, { recursive: true });
        
        const indexContent = `---
title: ${this.titleCase(category.replace('-', ' '))}
category: ${category}
---

# ${this.titleCase(category.replace('-', ' '))}

This section contains documentation about ${category.replace('-', ' ')}.
`;
        
        await fs.writeFile(indexPath, indexContent, 'utf-8');
      }
    }
  }

  private async updateDocusaurusSidebar() {
    console.log('\n⚙️  Updating Docusaurus sidebar configuration...');
    
    const sidebarConfig = `module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        {type: 'autogenerated', dirName: 'getting-started'}
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        {type: 'autogenerated', dirName: 'architecture'}
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        {type: 'autogenerated', dirName: 'features'}
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        {type: 'autogenerated', dirName: 'api-reference'}
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        {type: 'autogenerated', dirName: 'development'}
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        {type: 'autogenerated', dirName: 'deployment'}
      ],
    },
    {
      type: 'category',
      label: 'Testing',
      items: [
        {type: 'autogenerated', dirName: 'testing'}
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        {type: 'autogenerated', dirName: 'troubleshooting'}
      ],
    },
  ],
};`;

    if (!this.dryRun) {
      const sidebarPath = path.join(this.rootDir, 'docs-site', 'sidebars.js');
      await fs.writeFile(sidebarPath, sidebarConfig, 'utf-8');
    }
  }

  // Helper methods
  
  private cleanupTitle(title: string): string {
    // Remove common prefixes
    return title
      .replace(/^itellico\s+mono\s+/i, '')
      .replace(/^mono\s+/i, '')
      .replace(/\s+guide$/i, '')
      .replace(/\s+documentation$/i, '')
      .replace(/\s+complete$/i, '')
      .replace(/\s+comprehensive$/i, '')
      .trim();
  }

  private generateCleanFileName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '.md';
  }

  private cleanupMarkdown(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/\t/g, '  '); // Convert tabs to spaces
  }

  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  private determineCategoryFromPath(filePath: string): string {
    const relativePath = path.relative(this.docsDir, filePath).toLowerCase();
    
    if (relativePath.includes('architecture')) return 'architecture';
    if (relativePath.includes('feature')) return 'features';
    if (relativePath.includes('api')) return 'api-reference';
    if (relativePath.includes('test')) return 'testing';
    if (relativePath.includes('deploy')) return 'deployment';
    if (relativePath.includes('develop')) return 'development';
    if (relativePath.includes('guide')) return 'getting-started';
    if (relativePath.includes('troubleshoot')) return 'troubleshooting';
    
    return 'general';
  }

  private determineCategoryFromFileName(fileName: string): string {
    const name = fileName.toLowerCase();
    
    if (name.includes('api')) return 'api-reference';
    if (name.includes('test')) return 'testing';
    if (name.includes('deploy')) return 'deployment';
    if (name.includes('develop')) return 'development';
    if (name.includes('guide') || name.includes('start')) return 'getting-started';
    if (name.includes('architecture')) return 'architecture';
    
    return 'general';
  }

  private generateTitleFromPath(filename: string): string {
    return filename
      .replace(/\.(md|html)$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  private titleCase(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private printStats() {
    console.log('\n📊 Cleanup Statistics:');
    console.log(`📄 HTML files converted: ${this.stats.htmlConverted}`);
    console.log(`📁 Root files moved: ${this.stats.rootFilesMoved}`);
    console.log(`✏️  Files renamed: ${this.stats.filesRenamed}`);
    console.log(`🗑️  Duplicates removed: ${this.stats.duplicatesRemoved}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
  }

  private async saveMappingReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      mappings: this.fileMappings
    };
    
    if (!this.dryRun) {
      const reportPath = path.join(this.rootDir, 'reports', 'documentation-cleanup-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`\n📋 Mapping report saved to: ${reportPath}`);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const rootDir = path.resolve(process.cwd());
  const docsDir = path.join(rootDir, 'docs');
  
  const cleaner = new DocumentationCleaner(rootDir, docsDir, dryRun);
  
  try {
    await cleaner.cleanup();
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. No files were actually modified.');
      console.log('Run without --dry-run to perform the actual cleanup.');
    } else {
      console.log('\n✅ Documentation cleanup complete!');
      console.log('\nNext steps:');
      console.log('1. Review the changes in /docs');
      console.log('2. Test Docusaurus: cd docs-site && pnpm start');
      console.log('3. Commit the changes');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}