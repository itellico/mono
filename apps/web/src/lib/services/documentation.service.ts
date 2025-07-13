import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface DocFile {
  path: string;
  title: string;
  description?: string;
  category: string;
  lastModified: Date;
  related?: string[];
}

interface DocCategory {
  name: string;
  path: string;
  files: DocFile[];
  subcategories: DocCategory[];
}

export class DocumentationService {
  private static instance: DocumentationService;
  private readonly CACHE_TTL = 300; // 5 minutes in production
  private readonly DEV_CACHE_TTL = 5; // 5 seconds in development
  
  // Redis keys following mandatory naming convention
  private readonly REDIS_KEYS = {
    structure: 'platform:docs:structure',
    fileContent: (path: string) => `platform:docs:content:${path.replace(/\//g, '-')}`,
    learning: 'platform:docs:learning:latest',
    implementations: 'platform:docs:implementations:count'
  };

  private constructor() {}

  static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService();
    }
    return DocumentationService.instance;
  }

  /**
   * Get documentation structure with caching
   */
  async getDocumentationStructure(forceRefresh = false): Promise<DocCategory> {
    const cacheKey = this.REDIS_KEYS.structure;
    
    if (!forceRefresh) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Documentation structure retrieved from cache');
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.error('Error retrieving docs from cache', error);
      }
    }

    // Build structure from filesystem
    const structure = await this.scanDirectory(path.join(process.cwd(), 'docs'));
    
    // Cache the structure
    const ttl = process.env.NODE_ENV === 'development' ? this.DEV_CACHE_TTL : this.CACHE_TTL;
    try {
      await redis.setex(cacheKey, ttl, JSON.stringify(structure));
    } catch (error) {
      logger.error('Error caching documentation structure', error);
    }

    return structure;
  }

  /**
   * Scan directory recursively and build structure
   */
  private async scanDirectory(dirPath: string, basePath = ''): Promise<DocCategory> {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const category: DocCategory = {
      name: path.basename(dirPath),
      path: basePath,
      files: [],
      subcategories: []
    };

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.')) {
        const subcategory = await this.scanDirectory(
          itemPath, 
          path.join(basePath, item.name)
        );
        category.subcategories.push(subcategory);
      } else if (item.isFile() && item.name.endsWith('.md')) {
        const file = await this.parseDocFile(itemPath, basePath);
        if (file) {
          category.files.push(file);
        }
      }
    }

    // Sort files and subcategories
    category.files.sort((a, b) => a.title.localeCompare(b.title));
    category.subcategories.sort((a, b) => a.name.localeCompare(b.name));

    return category;
  }

  /**
   * Parse markdown file and extract metadata
   */
  private async parseDocFile(filePath: string, categoryPath: string): Promise<DocFile | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data, content: markdown } = matter(content);
      const stats = await fs.stat(filePath);
      
      // Extract title from frontmatter or first heading
      let title = data.title;
      if (!title) {
        const headingMatch = markdown.match(/^#\s+(.+)$/m);
        title = headingMatch ? headingMatch[1] : path.basename(filePath, '.md');
      }

      return {
        path: path.join(categoryPath, path.basename(filePath, '.md')),
        title,
        description: data.description || this.extractDescription(markdown),
        category: categoryPath,
        lastModified: stats.mtime,
        related: data.related
      };
    } catch (error) {
      logger.error(`Error parsing doc file ${filePath}`, error);
      return null;
    }
  }

  /**
   * Extract description from markdown content
   */
  private extractDescription(markdown: string): string {
    // Remove headings and code blocks
    const cleaned = markdown
      .replace(/^#+\s+.+$/gm, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .trim();
    
    // Get first paragraph
    const firstParagraph = cleaned.split('\n\n')[0];
    return firstParagraph.slice(0, 150) + (firstParagraph.length > 150 ? '...' : '');
  }

  /**
   * Add implementation to learning log
   */
  async addImplementation(implementation: {
    feature: string;
    request: string;
    implementation: string;
    filesChanged: string[];
    patternsUsed: string[];
    learnings: string;
    gotchas?: string;
    relatedDocs?: string[];
  }): Promise<void> {
    const logPath = path.join(process.cwd(), 'docs/learning/IMPLEMENTATIONS_LOG.md');
    const date = new Date().toISOString().split('T')[0];
    
    const entry = `
## ${date} - Feature: ${implementation.feature}
**Request:** ${implementation.request}
**Implementation:** ${implementation.implementation}
**Files Changed:** 
${implementation.filesChanged.map(f => `- ${f}`).join('\n')}
**Patterns Used:** 
${implementation.patternsUsed.map(p => `- ${p}`).join('\n')}
**Learnings:** ${implementation.learnings}
${implementation.gotchas ? `**Gotchas:** ${implementation.gotchas}` : ''}
${implementation.relatedDocs ? `**Related Docs:** ${implementation.relatedDocs.join(', ')}` : ''}

---
`;

    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const newContent = content + '\n' + entry;
      await fs.writeFile(logPath, newContent, 'utf-8');
      
      // Invalidate cache
      await redis.del(this.REDIS_KEYS.structure);
      
      // Update implementation count
      await redis.incr(this.REDIS_KEYS.implementations);
      
      logger.info('Implementation added to learning log', { feature: implementation.feature });
    } catch (error) {
      logger.error('Error adding implementation to log', error);
      throw error;
    }
  }

  /**
   * Get recent implementations for sidebar
   */
  async getRecentImplementations(limit = 5): Promise<any[]> {
    const cacheKey = this.REDIS_KEYS.learning;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Error getting recent implementations from cache', error);
    }

    // Parse implementations log
    const logPath = path.join(process.cwd(), 'docs/learning/IMPLEMENTATIONS_LOG.md');
    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const implementations = this.parseImplementationsLog(content, limit);
      
      // Cache for short time
      await redis.setex(cacheKey, 60, JSON.stringify(implementations));
      
      return implementations;
    } catch (error) {
      logger.error('Error reading implementations log', error);
      return [];
    }
  }

  /**
   * Parse implementations log to extract recent entries
   */
  private parseImplementationsLog(content: string, limit: number): any[] {
    const entries = content.split('## ').filter(e => e.includes('Feature:'));
    const recent = entries.slice(-limit).reverse();
    
    return recent.map(entry => {
      const lines = entry.split('\n');
      const header = lines[0];
      const dateMatch = header.match(/(\d{4}-\d{2}-\d{2})/);
      const featureMatch = header.match(/Feature:\s*(.+)/);
      
      return {
        date: dateMatch ? dateMatch[1] : '',
        feature: featureMatch ? featureMatch[1] : '',
        summary: lines.slice(1, 3).join(' ').replace(/\*\*/g, '').slice(0, 100) + '...'
      };
    });
  }
}

// Export singleton instance
export const documentationService = DocumentationService.getInstance();