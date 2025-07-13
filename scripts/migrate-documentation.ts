#!/usr/bin/env tsx

/**
 * Documentation Migration Script
 * Consolidates all documentation from various locations into /docs
 * Converts YAML and HTML files to Markdown with frontmatter
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
  codeBlockStyle: 'fenced'
});

interface DocumentMetadata {
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  author?: string;
  lastUpdated: string;
  status?: 'draft' | 'review' | 'published';
}

interface MigrationStats {
  processed: number;
  skipped: number;
  errors: number;
  duplicates: number;
}

class DocumentationMigrator {
  private stats: MigrationStats = {
    processed: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
  };

  private processedFiles = new Set<string>();

  constructor(
    private sourceDir: string,
    private targetDir: string,
    private dryRun: boolean = false
  ) {}

  async migrate() {
    console.log('🚀 Starting documentation migration...');
    console.log(`Source: ${this.sourceDir}`);
    console.log(`Target: ${this.targetDir}`);
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Ensure target directory exists
    if (!this.dryRun) {
      await fs.mkdir(this.targetDir, { recursive: true });
    }

    // Migrate from MCP server YAML files
    await this.migrateMCPDocs();

    // Migrate existing markdown files
    await this.migrateMarkdownDocs();

    // Convert HTML files to markdown
    await this.convertHTMLDocs();

    // Print statistics
    this.printStats();
  }

  private async migrateMCPDocs() {
    console.log('📁 Migrating MCP server documentation...');
    const mcpDocsPath = path.join(this.sourceDir, 'mcp-servers/docs-server/src/data');
    
    try {
      const files = await glob('**/*.{yaml,yml}', {
        cwd: mcpDocsPath,
        absolute: true
      });

      for (const file of files) {
        await this.processYAMLFile(file);
      }
    } catch (error) {
      console.error('Error accessing MCP docs:', error);
    }
  }

  private async migrateMarkdownDocs() {
    console.log('\n📁 Migrating existing markdown files...');
    const docsPath = path.join(this.sourceDir, 'docs');
    
    try {
      const files = await glob('**/*.{md,mdx}', {
        cwd: docsPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/DOCUMENTATION_REORGANIZATION_PLAN.md']
      });

      for (const file of files) {
        await this.processMarkdownFile(file);
      }
    } catch (error) {
      console.error('Error accessing markdown docs:', error);
    }
  }

  private async convertHTMLDocs() {
    console.log('\n📁 Converting HTML documentation to markdown...');
    const docsPath = path.join(this.sourceDir, 'docs');
    
    try {
      const files = await glob('**/*.html', {
        cwd: docsPath,
        absolute: true
      });

      for (const file of files) {
        await this.processHTMLFile(file);
      }
    } catch (error) {
      console.error('Error accessing HTML docs:', error);
    }
  }

  private async processYAMLFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);
      
      // Extract metadata
      const metadata = this.extractMetadata(filePath, data);
      
      // Create markdown with frontmatter
      const finalContent = this.createMarkdownWithFrontmatter(metadata, markdownContent);
      
      // Save to target location
      await this.saveDocument(filePath, metadata.category, metadata.title, finalContent);
      
      this.stats.processed++;
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      this.stats.errors++;
    }
  }

  private async processMarkdownFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data, content: markdownContent } = matter(content);
      
      // Skip if already has proper frontmatter
      if (data.title && data.category) {
        this.stats.skipped++;
        return;
      }
      
      // Extract metadata
      const metadata = this.extractMetadata(filePath, data);
      
      // Create markdown with frontmatter
      const finalContent = this.createMarkdownWithFrontmatter(metadata, markdownContent);
      
      // Save to target location
      await this.saveDocument(filePath, metadata.category, metadata.title, finalContent);
      
      this.stats.processed++;
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      this.stats.errors++;
    }
  }

  private async processHTMLFile(filePath: string) {
    try {
      const htmlContent = await fs.readFile(filePath, 'utf-8');
      
      // Parse HTML
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Extract title
      const title = document.querySelector('h1')?.textContent || 
                   document.querySelector('title')?.textContent ||
                   path.basename(filePath, '.html');
      
      // Convert to markdown
      const markdownContent = turndownService.turndown(htmlContent);
      
      // Extract metadata
      const metadata = this.extractMetadata(filePath, { title });
      
      // Create markdown with frontmatter
      const finalContent = this.createMarkdownWithFrontmatter(metadata, markdownContent);
      
      // Save to target location
      await this.saveDocument(filePath, metadata.category, metadata.title, finalContent);
      
      this.stats.processed++;
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
      this.stats.errors++;
    }
  }

  private extractMetadata(filePath: string, existingData: any = {}): DocumentMetadata {
    // Extract category from path
    const relativePath = path.relative(this.sourceDir, filePath);
    const pathParts = relativePath.split(path.sep);
    
    let category = 'general';
    if (pathParts.includes('architecture')) category = 'architecture';
    else if (pathParts.includes('features')) category = 'features';
    else if (pathParts.includes('guides')) category = 'guides';
    else if (pathParts.includes('reference')) category = 'reference';
    else if (pathParts.includes('tutorials')) category = 'tutorials';
    else if (pathParts.includes('roadmap')) category = 'roadmap';
    else if (pathParts.includes('testing')) category = 'testing';
    else if (pathParts.includes('workflows')) category = 'workflows';
    
    // Generate title if not provided
    const title = existingData.title || 
                 this.generateTitleFromPath(path.basename(filePath, path.extname(filePath)));
    
    return {
      title,
      description: existingData.description || `Documentation for ${title}`,
      category,
      tags: existingData.tags || existingData.related || [],
      author: existingData.author,
      lastUpdated: existingData.lastUpdated || new Date().toISOString().split('T')[0],
      status: existingData.status || 'published'
    };
  }

  private generateTitleFromPath(filename: string): string {
    // Convert kebab-case or snake_case to Title Case
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createMarkdownWithFrontmatter(metadata: DocumentMetadata, content: string): string {
    const frontmatter = matter.stringify(content, metadata);
    return frontmatter;
  }

  private async saveDocument(
    sourcePath: string,
    category: string,
    title: string,
    content: string
  ) {
    // Generate safe filename
    const safeFilename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '.md';
    
    // Check for duplicates
    const fileKey = `${category}/${safeFilename}`;
    if (this.processedFiles.has(fileKey)) {
      console.warn(`⚠️  Duplicate found: ${fileKey}`);
      this.stats.duplicates++;
      return;
    }
    this.processedFiles.add(fileKey);
    
    // Create target path
    const targetPath = path.join(this.targetDir, category, safeFilename);
    
    if (this.dryRun) {
      console.log(`Would save: ${sourcePath} → ${targetPath}`);
    } else {
      // Ensure directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      
      // Write file
      await fs.writeFile(targetPath, content, 'utf-8');
      console.log(`✅ Migrated: ${path.basename(sourcePath)} → ${targetPath}`);
    }
  }

  private printStats() {
    console.log('\n📊 Migration Statistics:');
    console.log(`✅ Processed: ${this.stats.processed}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`⚠️  Duplicates: ${this.stats.duplicates}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    console.log(`📄 Total: ${this.stats.processed + this.stats.skipped}`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const projectRoot = path.resolve(process.cwd());
  const targetDir = path.join(projectRoot, 'docs-consolidated');
  
  const migrator = new DocumentationMigrator(projectRoot, targetDir, dryRun);
  
  try {
    await migrator.migrate();
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. No files were actually moved.');
      console.log('Run without --dry-run to perform the actual migration.');
    } else {
      console.log('\n✅ Migration complete!');
      console.log(`Documentation consolidated in: ${targetDir}`);
      console.log('\nNext steps:');
      console.log('1. Review the migrated documentation');
      console.log('2. Update MCP server config to point to new location');
      console.log('3. Update Docusaurus config');
      console.log('4. Remove old documentation files');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}