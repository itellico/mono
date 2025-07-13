#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface DocMetadata {
  title: string;
  category: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  lastUpdated: string;
  originalFile: string;
}

interface ConversionResult {
  originalPath: string;
  newPath: string;
  category: string;
  title: string;
  success: boolean;
  error?: string;
}

class DocumentationConverter {
  private readonly docsDir = 'docs';
  private readonly mcpDataDir = 'mcp-server/src/data';
  private results: ConversionResult[] = [];

  /**
   * Extract title from markdown content
   */
  private extractTitle(content: string, filePath: string): string {
    // Try to find first H1 heading
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Try to find title in frontmatter if exists
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const titleMatch = frontmatterMatch[1].match(/title:\s*["']?([^"'\n]+)["']?/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }

    // Fallback to filename
    const filename = path.basename(filePath, '.md');
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Determine category based on directory structure
   */
  private determineCategory(filePath: string): string {
    const relativePath = path.relative(this.docsDir, filePath);
    const parts = relativePath.split(path.sep);
    
    if (parts.length === 1) {
      // Root level files
      if (parts[0].toLowerCase().includes('readme')) return 'overview';
      if (parts[0].toLowerCase().includes('roadmap')) return 'roadmap';
      if (parts[0].toLowerCase().includes('status')) return 'status';
      return 'general';
    }

    const directory = parts[0].toLowerCase();
    
    // Map directories to categories
    const categoryMap: Record<string, string> = {
      'architecture': 'architecture',
      'features': 'features',
      'development': 'workflows',
      'getting-started': 'guides',
      'guides': 'guides',
      'for-frontend-developers': 'guides',
      'for-new-developers': 'guides',
      'roadmap': 'roadmap',
      'testing': 'testing',
      'database': 'database',
      'deployment': 'deployment',
      'migrations': 'migrations',
      'integrations': 'integrations',
      'security': 'security',
      'api': 'api',
      'overview': 'overview',
      'reference': 'reference',
      'learning': 'learning',
      'usage': 'usage',
      'templates': 'templates',
      'n8n-workflows': 'integrations'
    };

    return categoryMap[directory] || 'general';
  }

  /**
   * Extract relevant tags from content and path
   */
  private extractTags(content: string, filePath: string, category: string): string[] {
    const tags = new Set<string>();
    
    // Add category as a tag
    tags.add(category);
    
    // Extract from directory structure
    const relativePath = path.relative(this.docsDir, filePath);
    const pathParts = relativePath.split(path.sep);
    pathParts.forEach(part => {
      if (part !== 'README.md' && part !== 'index.md') {
        const tag = part.replace('.md', '').toLowerCase().replace(/[-_]/g, '-');
        if (tag.length > 2) tags.add(tag);
      }
    });

    // Extract common technical terms from content
    const technicalTerms = [
      'api', 'database', 'redis', 'fastify', 'nextjs', 'react', 'typescript',
      'authentication', 'authorization', 'rbac', 'permissions', 'multi-tenant',
      'caching', 'monitoring', 'docker', 'postgresql', 'prisma', 'graphql',
      'webhook', 'n8n', 'mattermost', 'temporal', 'workflow', 'automation',
      'testing', 'deployment', 'migration', 'security', 'audit', 'logging',
      'performance', 'optimization', 'architecture', 'design', 'patterns',
      'components', 'ui', 'frontend', 'backend', 'fullstack'
    ];

    const contentLower = content.toLowerCase();
    technicalTerms.forEach(term => {
      if (contentLower.includes(term)) {
        tags.add(term);
      }
    });

    // Limit to most relevant tags
    return Array.from(tags).slice(0, 8);
  }

  /**
   * Determine priority based on content and filename
   */
  private determinePriority(content: string, filePath: string): 'high' | 'medium' | 'low' {
    const filename = path.basename(filePath).toLowerCase();
    const contentLower = content.toLowerCase();

    // High priority indicators
    const highPriorityKeywords = [
      'critical', 'mandatory', 'required', 'important', 'security',
      'architecture', 'getting-started', 'quick-start', 'readme',
      'workflow', 'authentication', 'rbac', 'api'
    ];

    // Low priority indicators  
    const lowPriorityKeywords = [
      'template', 'example', 'draft', 'todo', 'notes',
      'reference', 'appendix', 'archive'
    ];

    for (const keyword of highPriorityKeywords) {
      if (filename.includes(keyword) || contentLower.includes(keyword)) {
        return 'high';
      }
    }

    for (const keyword of lowPriorityKeywords) {
      if (filename.includes(keyword) || contentLower.includes(keyword)) {
        return 'low';
      }
    }

    return 'medium';
  }

  /**
   * Clean and format markdown content
   */
  private cleanMarkdownContent(content: string): string {
    // Remove any existing frontmatter
    const cleanContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // Ensure proper spacing
    return cleanContent.trim();
  }

  /**
   * Convert a single markdown file to YAML format
   */
  private async convertFile(filePath: string): Promise<ConversionResult> {
    try {
      console.log(`🔄 Converting: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const category = this.determineCategory(filePath);
      const title = this.extractTitle(content, filePath);
      const tags = this.extractTags(content, filePath, category);
      const priority = this.determinePriority(content, filePath);
      const cleanContent = this.cleanMarkdownContent(content);
      
      // Create metadata
      const metadata: DocMetadata = {
        title,
        category,
        tags,
        priority,
        lastUpdated: new Date().toISOString().split('T')[0],
        originalFile: path.relative(process.cwd(), filePath)
      };

      // Generate YAML content
      const yamlContent = this.generateYamlContent(metadata, cleanContent);
      
      // Determine output path
      const relativePath = path.relative(this.docsDir, filePath);
      const filename = path.basename(relativePath, '.md') + '.yaml';
      const categoryDir = path.join(this.mcpDataDir, category);
      const outputPath = path.join(categoryDir, filename);
      
      // Ensure directory exists
      await fs.mkdir(categoryDir, { recursive: true });
      
      // Write YAML file
      await fs.writeFile(outputPath, yamlContent);
      
      console.log(`✅ Converted: ${filePath} → ${outputPath}`);
      
      return {
        originalPath: filePath,
        newPath: outputPath,
        category,
        title,
        success: true
      };

    } catch (error) {
      console.error(`❌ Failed to convert ${filePath}:`, error);
      return {
        originalPath: filePath,
        newPath: '',
        category: '',
        title: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate YAML content with frontmatter and markdown
   */
  private generateYamlContent(metadata: DocMetadata, content: string): string {
    const frontmatter = [
      '---',
      `title: "${metadata.title}"`,
      `category: "${metadata.category}"`,
      `tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]`,
      `priority: "${metadata.priority}"`,
      `lastUpdated: "${metadata.lastUpdated}"`,
      `originalFile: "${metadata.originalFile}"`,
      '---',
      '',
      content
    ].join('\n');

    return frontmatter;
  }

  /**
   * Convert all markdown files to YAML
   */
  public async convertAllFiles(): Promise<void> {
    console.log('🚀 Starting documentation conversion...\n');

    // Find all markdown files
    const markdownFiles = await glob(`${this.docsDir}/**/*.md`);
    console.log(`📄 Found ${markdownFiles.length} markdown files to convert\n`);

    // Convert each file
    for (const filePath of markdownFiles) {
      const result = await this.convertFile(filePath);
      this.results.push(result);
    }

    // Generate summary
    await this.generateSummary();
  }

  /**
   * Generate conversion summary
   */
  private async generateSummary(): Promise<void> {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    // Group by category
    const byCategory = successful.reduce((acc, result) => {
      if (!acc[result.category]) acc[result.category] = 0;
      acc[result.category]++;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🎉 Conversion Complete!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log(`   📁 Total categories: ${Object.keys(byCategory).length}\n`);

    console.log('📋 Files by category:');
    Object.entries(byCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} files`);
      });

    if (failed.length > 0) {
      console.log('\n❌ Failed conversions:');
      failed.forEach(result => {
        console.log(`   ${result.originalPath}: ${result.error}`);
      });
    }

    // Write summary to file
    const summaryPath = path.join(this.mcpDataDir, 'conversion-summary.json');
    const summary = {
      conversionDate: new Date().toISOString(),
      totalFiles: this.results.length,
      successful: successful.length,
      failed: failed.length,
      byCategory,
      results: this.results
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Summary saved to: ${summaryPath}`);

    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npx tsx scripts/build-documentation.ts');
    console.log('   2. Check: mcp-server/src/data/ for all YAML files');
    console.log('   3. View: docs-rendered/index.html for HTML documentation');
  }
}

// Run the conversion
async function main() {
  const converter = new DocumentationConverter();
  await converter.convertAllFiles();
}

if (require.main === module) {
  main().catch(console.error);
}