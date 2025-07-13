/**
 * Documentation Path Configuration
 * Points MCP server to the consolidated documentation location
 */

import path from 'path';

// Get project root (5 levels up from this file)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../..');

export const DOCS_CONFIG = {
  // Main documentation directory (best practice location)
  primaryDocsPath: path.join(PROJECT_ROOT, 'docs'),
  
  // Legacy MCP data directory (to be phased out)
  legacyDataPath: path.join(__dirname, '../../data'),
  
  // File patterns to include
  includePatterns: [
    '**/*.md',
    '**/*.mdx'
  ],
  
  // Patterns to exclude
  excludePatterns: [
    '**/node_modules/**',
    '**/.*',
    '**/_*',
    '**/drafts/**',
    '**/DOCUMENTATION_REORGANIZATION_PLAN.md'
  ],
  
  // Supported file extensions
  supportedExtensions: ['.md', '.mdx'],
  
  // Category mapping for better organization
  categoryMapping: {
    'architecture': 'System Architecture',
    'features': 'Features & Components',
    'guides': 'How-To Guides',
    'reference': 'API Reference',
    'tutorials': 'Tutorials',
    'concepts': 'Concepts',
    'roadmap': 'Roadmap & Planning',
    'testing': 'Testing & QA',
    'workflows': 'Workflows & Automation'
  }
};

// Helper function to resolve documentation paths
export function resolveDocPath(relativePath: string): string {
  return path.join(DOCS_CONFIG.primaryDocsPath, relativePath);
}

// Check if using legacy path (for migration period)
export function isUsingLegacyPath(): boolean {
  const fs = require('fs');
  return fs.existsSync(DOCS_CONFIG.legacyDataPath) && 
         fs.readdirSync(DOCS_CONFIG.legacyDataPath).length > 0;
}