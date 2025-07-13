import fs from 'fs';
import path from 'path';
import { OpenAPIV3 } from 'openapi-types';

interface ExtractedRoute {
  path: string;
  filePath: string;
  documentation: any;
}

/**
 * Extracts OpenAPI documentation from route files using special comment blocks
 * Looks for comment blocks with @openapi decorator
 */
export class OpenAPIExtractor {
  private routesDir: string;

  constructor(routesDir: string = 'src/app/api') {
    this.routesDir = routesDir;
  }

  /**
   * Recursively scan all route.ts files and extract OpenAPI docs
   */
  async extractAllRoutes(): Promise<ExtractedRoute[]> {
    const routes: ExtractedRoute[] = [];
    await this.scanDirectory(this.routesDir, routes);
    return routes;
  }

  private async scanDirectory(dir: string, routes: ExtractedRoute[]): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, routes);
      } else if (entry.name === 'route.ts') {
        const apiPath = this.filePathToApiPath(fullPath);
        const documentation = await this.extractFromFile(fullPath);

        if (documentation) {
          routes.push({
            path: apiPath,
            filePath: fullPath,
            documentation
          });
        }
      }
    }
  }

  /**
   * Convert file path to API path
   * src/app/api/admin/users/route.ts -> /api/admin/users
   */
  private filePathToApiPath(filePath: string): string {
    const relativePath = filePath.replace(/^src\/app/, '');
    const apiPath = relativePath.replace(/\/route\.ts$/, '');
    return apiPath;
  }

  /**
   * Extract OpenAPI documentation from a single file
   */
  private async extractFromFile(filePath: string): Promise<any> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return this.parseOpenAPIComments(content);
    } catch (error) {
      console.warn(`Failed to read file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse comment blocks starting with @openapi
   */
  private parseOpenAPIComments(content: string): any {
    // Simple string-based parsing to avoid regex issues
    const lines = content.split('\n');
    const matches = [];
    let insideOpenApiComment = false;
    let currentDoc = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for start of comment block with @openapi
      if (line.includes('/**') && (line.includes('@openapi') || lines[i + 1]?.includes('@openapi'))) {
        insideOpenApiComment = true;
        currentDoc = '';
        continue;
      }

      // Check for end of comment block
      if (insideOpenApiComment && line.includes('*/')) {
        insideOpenApiComment = false;

        try {
          if (currentDoc.trim().startsWith('{')) {
            const parsed = JSON.parse(currentDoc.trim());
            matches.push(parsed);
          }
        } catch (error) {
          console.warn('Failed to parse OpenAPI comment:', error);
        }

        currentDoc = '';
        continue;
      }

      // Collect comment content
      if (insideOpenApiComment && !line.includes('@openapi')) {
        const cleanLine = line.replace(/^\s*\*\s?/, '').trim();
        if (cleanLine) {
          currentDoc += cleanLine + '\n';
        }
      }
    }

    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    return matches.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  /**
   * Generate complete OpenAPI specification from all extracted routes
   */
  async generateSpec(): Promise<OpenAPIV3.Document> {
    const routes = await this.extractAllRoutes();
    const paths: OpenAPIV3.PathsObject = {};

    for (const route of routes) {
      paths[route.path] = route.documentation;
    }

    return {
      openapi: '3.0.3',
      info: {
        title: 'mono API',
        version: '1.0.0',
        description: 'Multi-tenant modeling platform API'
      },
      paths,
      components: {
        schemas: {}
      }
    };
  }
}

// Export a singleton instance
export const openApiExtractor = new OpenAPIExtractor(); 