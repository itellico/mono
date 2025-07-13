/**
 * Documentation search and retrieval handler
 */

import Fuse from 'fuse.js';
import { BaseHandler, Document } from './base.js';

interface SearchArgs {
  query: string;
  category?: string;
  limit?: number;
}

interface SearchResult {
  title: string;
  category: string;
  relevance: number;
  excerpt: string;
  filePath: string;
  tags?: string[];
}

export class DocumentationHandler extends BaseHandler {
  private documents: Document[] = [];
  private fuse: Fuse<Document> | null = null;
  private loadingPromise: Promise<void>;

  constructor() {
    super();
    // Load documents asynchronously after construction
    this.loadingPromise = this.loadAllDocuments().catch(error => {
      console.error('Failed to load documents:', error);
    });
  }

  /**
   * Load all documentation from project and structured data
   */
  private async loadAllDocuments(): Promise<void> {
    try {
      // Load all documentation from the main docs directory
      const projectDocs = this.loadProjectDocs('**/*.md');
      
      this.documents = projectDocs;
      
      // Initialize fuzzy search
      this.fuse = new Fuse(this.documents, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'content', weight: 0.3 },
          { name: 'tags', weight: 0.2 },
          { name: 'category', weight: 0.1 },
        ],
        threshold: 0.6,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
      });

      console.error(`Loaded ${this.documents.length} documents for search`);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  /**
   * Search documentation
   */
  async search(args: SearchArgs) {
    const { query, category, limit = 5 } = args;

    // Ensure documents are loaded
    await this.loadingPromise;

    if (!this.fuse) {
      return this.formatResponse('Documentation search not initialized');
    }

    try {
      // Perform fuzzy search
      let results = this.fuse.search(query);

      // Filter by category if specified
      if (category) {
        results = results.filter(result => 
          result.item.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Limit results
      results = results.slice(0, limit);

      // Format results
      const searchResults: SearchResult[] = results.map(result => ({
        title: result.item.title,
        category: result.item.category,
        relevance: Math.round((1 - (result.score || 0)) * 100),
        excerpt: this.extractExcerpt(result.item.content, query),
        filePath: result.item.filePath,
        tags: result.item.tags,
      }));

      if (searchResults.length === 0) {
        return this.formatResponse(`No documentation found for query: "${query}"`);
      }

      // Format response
      const response = this.formatSearchResults(query, searchResults);
      return this.formatResponse(response);

    } catch (error) {
      return this.formatResponse(`Error searching documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract relevant excerpt from content
   */
  private extractExcerpt(content: string, query: string, maxLength: number = 200): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Find the first occurrence of any query word
    const words = lowerQuery.split(/\s+/);
    let bestIndex = -1;
    
    for (const word of words) {
      const index = lowerContent.indexOf(word);
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index;
      }
    }

    if (bestIndex === -1) {
      // No match found, return beginning
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Extract context around the match
    const start = Math.max(0, bestIndex - 50);
    const end = Math.min(content.length, start + maxLength);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt.trim();
  }

  /**
   * Format search results for display
   */
  private formatSearchResults(query: string, results: SearchResult[]): string {
    let response = `# Documentation Search Results\n\n`;
    response += `**Query:** "${query}"\n`;
    response += `**Found:** ${results.length} result(s)\n\n`;

    for (const result of results) {
      response += `## ${result.title}\n\n`;
      response += `- **Category:** ${result.category}\n`;
      response += `- **Relevance:** ${result.relevance}%\n`;
      response += `- **URL:** http://localhost:3005/${result.filePath.startsWith('/') ? result.filePath.substring(1) : result.filePath}\n`;
      response += `- **File:** ${result.filePath}\n`;
      
      if (result.tags && result.tags.length > 0) {
        response += `- **Tags:** ${result.tags.join(', ')}\n`;
      }
      
      response += `\n**Excerpt:**\n${result.excerpt}\n\n`;
      response += `---\n\n`;
    }

    return response;
  }

  /**
   * Get specific document by path
   */
  async getDocument(filePath: string) {
    const document = this.documents.find(doc => 
      doc.filePath === filePath || doc.filePath.endsWith(filePath)
    );

    if (!document) {
      return this.formatResponse(`Document not found: ${filePath}`);
    }

    let response = `# ${document.title}\n\n`;
    response += `**Category:** ${document.category}\n`;
    response += `**URL:** http://localhost:3005/${document.filePath.startsWith('/') ? document.filePath.substring(1) : document.filePath}\n`;
    response += `**File:** ${document.filePath}\n`;
    
    if (document.tags && document.tags.length > 0) {
      response += `**Tags:** ${document.tags.join(', ')}\n`;
    }
    
    response += `\n---\n\n${document.content}`;

    return this.formatResponse(response);
  }

  /**
   * List all available categories
   */
  async listCategories() {
    const categories = [...new Set(this.documents.map(doc => doc.category))].sort();
    
    let response = `# Available Documentation Categories\n\n`;
    
    for (const category of categories) {
      const count = this.documents.filter(doc => doc.category === category).length;
      response += `- **${category}** (${count} documents)\n`;
    }

    return this.formatResponse(response);
  }
}