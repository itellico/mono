import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PrototypeMetadata {
  path: string;
  tier: string;
  title: string;
  description: string;
  features: string[];
  components: string[];
  implementation_status?: 'not_started' | 'in_progress' | 'completed';
  related_docs?: string[];
  related_tasks?: string[];
}

export class ClickDummyHandler {
  private clickDummyPath: string;
  private metadataCache: Map<string, PrototypeMetadata> = new Map();

  constructor() {
    // Resolve the click-dummy path relative to the MCP server location
    this.clickDummyPath = resolve(__dirname, '../../../../php/click-dummy');
    this.loadMetadata();
  }

  private async loadMetadata() {
    try {
      // Look for YAML metadata files
      const metadataFiles = await glob('**/*.metadata.yaml', {
        cwd: this.clickDummyPath,
      });

      for (const file of metadataFiles) {
        const content = readFileSync(join(this.clickDummyPath, file), 'utf-8');
        const metadata = yaml.load(content) as PrototypeMetadata;
        this.metadataCache.set(metadata.path, metadata);
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  }

  async searchPrototypes(query: string, tier?: string, featureType?: string) {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search PHP files
    const pattern = tier ? `${tier}/**/*.php` : '**/*.php';
    const files = await glob(pattern, {
      cwd: this.clickDummyPath,
      ignore: ['includes/**', 'assets/**'],
    });

    for (const file of files) {
      const content = readFileSync(join(this.clickDummyPath, file), 'utf-8');
      const metadata = this.metadataCache.get(file);

      // Check if file content or metadata matches query
      if (
        content.toLowerCase().includes(lowerQuery) ||
        metadata?.features.some(f => f.toLowerCase().includes(lowerQuery)) ||
        metadata?.title.toLowerCase().includes(lowerQuery)
      ) {
        // Extract relevant information
        const features = this.extractFeatures(content);
        const components = this.extractComponents(content);

        results.push({
          path: file,
          tier: this.getTierFromPath(file),
          title: metadata?.title || this.extractTitle(content),
          description: metadata?.description || this.extractDescription(content),
          features: metadata?.features || features,
          components: metadata?.components || components,
          implementation_status: metadata?.implementation_status || 'not_started',
          preview_url: `http://localhost:4040/${file}`,
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} prototypes matching "${query}":\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  async getPrototypeDetails(path: string) {
    const fullPath = join(this.clickDummyPath, path);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Prototype not found: ${path}`);
    }

    const content = readFileSync(fullPath, 'utf-8');
    const metadata = this.metadataCache.get(path);

    // Extract detailed information
    const details = {
      path,
      tier: this.getTierFromPath(path),
      metadata,
      preview_url: `http://localhost:4040/${path}`,
      features: this.extractFeatures(content),
      components: this.extractComponents(content),
      forms: this.extractForms(content),
      tables: this.extractTables(content),
      modals: this.extractModals(content),
      api_endpoints: this.extractApiEndpoints(content),
      permissions: this.extractPermissions(content),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Prototype Details for ${path}:\n\n${JSON.stringify(details, null, 2)}\n\nKey UI Elements:\n${this.summarizeUIElements(content)}`,
        },
      ],
    };
  }

  async listFeatures(tier?: string) {
    const features = new Map<string, Set<string>>();

    const pattern = tier ? `${tier}/**/*.php` : '**/*.php';
    const files = await glob(pattern, {
      cwd: this.clickDummyPath,
      ignore: ['includes/**', 'assets/**'],
    });

    for (const file of files) {
      const content = readFileSync(join(this.clickDummyPath, file), 'utf-8');
      const fileTier = this.getTierFromPath(file);
      
      if (!features.has(fileTier)) {
        features.set(fileTier, new Set());
      }

      const extractedFeatures = this.extractFeatures(content);
      extractedFeatures.forEach(f => features.get(fileTier)!.add(f));
    }

    const result: any = {};
    features.forEach((featureSet, tier) => {
      result[tier] = Array.from(featureSet);
    });

    return {
      content: [
        {
          type: 'text',
          text: `Available features in click-dummy prototypes:\n\n${JSON.stringify(result, null, 2)}`,
        },
      ],
    };
  }

  async getUIComponents(componentType?: string) {
    const componentsPath = join(this.clickDummyPath, 'includes/components.php');
    const mediaComponentsPath = join(this.clickDummyPath, 'includes/media-components.php');

    const components: any = {
      standard: [],
      media: [],
    };

    if (existsSync(componentsPath)) {
      const content = readFileSync(componentsPath, 'utf-8');
      components.standard = this.extractComponentDefinitions(content, componentType);
    }

    if (existsSync(mediaComponentsPath)) {
      const content = readFileSync(mediaComponentsPath, 'utf-8');
      components.media = this.extractComponentDefinitions(content, componentType);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Reusable UI components from click-dummy:\n\n${JSON.stringify(components, null, 2)}`,
        },
      ],
    };
  }

  // Helper methods
  private getTierFromPath(path: string): string {
    const parts = path.split('/');
    return parts[0] || 'root';
  }

  private extractTitle(content: string): string {
    const match = content.match(/<title>([^<]+)<\/title>/);
    return match ? match[1] : 'Untitled';
  }

  private extractDescription(content: string): string {
    const match = content.match(/<meta name="description" content="([^"]+)"/);
    return match ? match[1] : '';
  }

  private extractFeatures(content: string): string[] {
    const features: string[] = [];
    
    // Look for feature indicators
    if (content.includes('createDataTable')) features.push('data-table');
    if (content.includes('createForm')) features.push('form');
    if (content.includes('createWizard')) features.push('wizard');
    if (content.includes('createModal')) features.push('modal');
    if (content.includes('createChart')) features.push('charts');
    if (content.includes('createCalendar')) features.push('calendar');
    if (content.includes('createKanban')) features.push('kanban');
    if (content.includes('drag-and-drop')) features.push('drag-drop');
    
    return features;
  }

  private extractComponents(content: string): string[] {
    const components: string[] = [];
    const componentRegex = /create(\w+)\(/g;
    
    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      components.push(match[1].toLowerCase());
    }
    
    return [...new Set(components)];
  }

  private extractForms(content: string): any[] {
    const forms: any[] = [];
    const formRegex = /<form[^>]*>[\s\S]*?<\/form>/g;
    
    let match;
    while ((match = formRegex.exec(content)) !== null) {
      const formHtml = match[0];
      const actionMatch = formHtml.match(/action="([^"]+)"/);
      const methodMatch = formHtml.match(/method="([^"]+)"/);
      
      forms.push({
        action: actionMatch ? actionMatch[1] : '',
        method: methodMatch ? methodMatch[1] : 'GET',
        fields: this.extractFormFields(formHtml),
      });
    }
    
    return forms;
  }

  private extractFormFields(formHtml: string): string[] {
    const fields: string[] = [];
    const inputRegex = /<input[^>]*name="([^"]+)"/g;
    const selectRegex = /<select[^>]*name="([^"]+)"/g;
    const textareaRegex = /<textarea[^>]*name="([^"]+)"/g;
    
    let match;
    while ((match = inputRegex.exec(formHtml)) !== null) fields.push(match[1]);
    while ((match = selectRegex.exec(formHtml)) !== null) fields.push(match[1]);
    while ((match = textareaRegex.exec(formHtml)) !== null) fields.push(match[1]);
    
    return [...new Set(fields)];
  }

  private extractTables(content: string): any[] {
    const tables: any[] = [];
    const tableRegex = /createDataTable\([^)]+\)/g;
    
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      tables.push({
        type: 'data-table',
        definition: match[0],
      });
    }
    
    return tables;
  }

  private extractModals(content: string): any[] {
    const modals: any[] = [];
    const modalRegex = /createModal\([^)]+\)/g;
    
    let match;
    while ((match = modalRegex.exec(content)) !== null) {
      modals.push({
        type: 'modal',
        definition: match[0],
      });
    }
    
    return modals;
  }

  private extractApiEndpoints(content: string): string[] {
    const endpoints: string[] = [];
    const apiRegex = /\/api\/v1\/[^'"]+/g;
    
    let match;
    while ((match = apiRegex.exec(content)) !== null) {
      endpoints.push(match[0]);
    }
    
    return [...new Set(endpoints)];
  }

  private extractPermissions(content: string): string[] {
    const permissions: string[] = [];
    const permRegex = /hasPermission\(['"]([^'"]+)['"]\)/g;
    
    let match;
    while ((match = permRegex.exec(content)) !== null) {
      permissions.push(match[1]);
    }
    
    return [...new Set(permissions)];
  }

  private extractComponentDefinitions(content: string, type?: string): any[] {
    const components: any[] = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      if (!type || functionName.toLowerCase().includes(type.toLowerCase())) {
        components.push({
          name: functionName,
          type: this.inferComponentType(functionName),
        });
      }
    }
    
    return components;
  }

  private inferComponentType(functionName: string): string {
    const name = functionName.toLowerCase();
    if (name.includes('table')) return 'table';
    if (name.includes('form')) return 'form';
    if (name.includes('modal')) return 'modal';
    if (name.includes('card')) return 'card';
    if (name.includes('chart')) return 'chart';
    if (name.includes('wizard')) return 'wizard';
    return 'component';
  }

  private summarizeUIElements(content: string): string {
    const summary: string[] = [];
    
    if (content.includes('createDataTable')) summary.push('- Data tables with sorting/filtering');
    if (content.includes('createForm')) summary.push('- Forms with validation');
    if (content.includes('createWizard')) summary.push('- Multi-step wizards');
    if (content.includes('createModal')) summary.push('- Modal dialogs');
    if (content.includes('createChart')) summary.push('- Charts and visualizations');
    if (content.includes('drag-and-drop')) summary.push('- Drag and drop interfaces');
    
    return summary.join('\n');
  }
}