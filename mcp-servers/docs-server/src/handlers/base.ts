/**
 * Base handler class with common functionality
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DocumentMetadata {
  title: string;
  category: string;
  tags?: string[];
  technology?: string;
  priority?: 'high' | 'medium' | 'low';
  lastUpdated?: string;
}

export interface Document extends DocumentMetadata {
  content: string;
  filePath: string;
  examples?: any[];
}

export abstract class BaseHandler {
  protected projectRoot: string;
  protected dataDir: string;

  constructor() {
    // Go up from mcp-servers/docs-server/dist/handlers to project root
    this.projectRoot = join(__dirname, '../../../../');
    // Use main docs directory instead of data dir
    this.dataDir = join(this.projectRoot, 'docs');
  }

  /**
   * Load a YAML document with metadata
   */
  protected loadDocument(filePath: string): Document | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const content = readFileSync(filePath, 'utf-8');
      
      // Parse YAML frontmatter if present
      if (content.startsWith('---')) {
        const parts = content.split('---');
        if (parts.length >= 3) {
          const frontmatter = YAML.parse(parts[1]);
          const body = parts.slice(2).join('---').trim();
          
          return {
            ...frontmatter,
            content: body,
            filePath,
          };
        }
      }

      // If no frontmatter, treat as plain content
      return {
        title: this.extractTitleFromPath(filePath),
        category: this.extractCategoryFromPath(filePath),
        content,
        filePath,
      };
    } catch (error) {
      console.error(`Error loading document ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Load all documents from a directory pattern
   */
  protected async loadDocuments(pattern: string): Promise<Document[]> {
    try {
      const files = await glob(pattern, { 
        cwd: this.dataDir,
        absolute: true 
      });
      
      const documents: Document[] = [];
      
      for (const file of files) {
        const doc = this.loadDocument(file);
        if (doc) {
          documents.push(doc);
        }
      }
      return documents;
    } catch (error) {
      console.error(`Error loading documents with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Load existing project documentation
   */
  protected loadProjectDocs(pattern: string): Document[] {
    try {
      const docsDir = join(this.projectRoot, 'docs');
      const files = glob.sync(pattern, { 
        cwd: docsDir,
        absolute: true 
      });
      
      const documents: Document[] = [];
      
      for (const file of files) {
        const doc = this.loadProjectDoc(file);
        if (doc) {
          documents.push(doc);
        }
      }
      
      return documents;
    } catch (error) {
      console.error(`Error loading project docs with pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Load a project documentation file
   */
  private loadProjectDoc(filePath: string): Document | null {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let relativePath = filePath.replace(this.projectRoot, '');
      
      // Remove leading /docs since documentation is served at root
      if (relativePath.startsWith('/docs/')) {
        relativePath = relativePath.substring(5); // Remove '/docs'
      } else if (relativePath.startsWith('docs/')) {
        relativePath = relativePath.substring(4); // Remove 'docs/'
      }
      
      return {
        title: this.extractTitleFromContent(content) || this.extractTitleFromPath(filePath),
        category: this.extractCategoryFromPath(filePath),
        tags: this.extractTagsFromPath(filePath),
        content,
        filePath: relativePath,
      };
    } catch (error) {
      console.error(`Error loading project doc ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract title from file path
   */
  private extractTitleFromPath(filePath: string): string {
    const basename = filePath.split('/').pop() || '';
    return basename.replace(/\.(md|yaml|yml)$/, '').replace(/[-_]/g, ' ');
  }

  /**
   * Extract category from file path
   */
  private extractCategoryFromPath(filePath: string): string {
    const parts = filePath.split('/');
    
    // Look for known category directories (5-tier + supporting)
    const categoryMap: Record<string, string> = {
      // 5-Tier Architecture
      'platform': 'platform',
      'tenant': 'tenant',
      'account': 'account',
      'user': 'user',
      'public': 'public',
      
      // Supporting Documentation
      'architecture': 'architecture',
      'development': 'development',
      'api': 'api',
      'reference': 'reference',
      
      // Subcategories for better organization
      'security': 'security',
      'performance': 'performance',
      'testing': 'testing',
      'deployment': 'deployment',
      'workflows': 'workflows',
      'access-control': 'access-control',
      'subscription-management': 'subscription-management',
      'content-management': 'content-management',
      'system-management': 'system-management',
    };

    for (const part of parts) {
      if (categoryMap[part]) {
        return categoryMap[part];
      }
    }

    return 'general';
  }

  /**
   * Extract tags from file path
   */
  private extractTagsFromPath(filePath: string): string[] {
    const tags: string[] = [];
    const parts = filePath.toLowerCase().split('/');
    
    // Add technology tags
    const techTags = ['react', 'fastify', 'prisma', 'typescript', 'tailwind', 'next.js', 'redis', 'postgresql'];
    for (const tech of techTags) {
      if (parts.some(part => part.includes(tech))) {
        tags.push(tech);
      }
    }
    
    return tags;
  }

  /**
   * Extract title from markdown content
   */
  private extractTitleFromContent(content: string): string | null {
    const lines = content.split('\n');
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      const match = line.match(/^#\s+(.+)$/);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Format response for MCP
   */
  protected formatResponse(content: any, isText: boolean = true) {
    return {
      content: [
        {
          type: 'text',
          text: isText ? (typeof content === 'string' ? content : JSON.stringify(content, null, 2)) : content,
        },
      ],
    };
  }
}