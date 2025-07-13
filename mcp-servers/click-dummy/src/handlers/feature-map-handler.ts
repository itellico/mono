import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface FeatureMapping {
  clickDummy: string;
  implementation: {
    frontend?: string[];
    api?: string[];
    database?: string[];
    tests?: string[];
  };
  status: 'not_implemented' | 'partial' | 'complete';
  kanbanTasks?: string[];
}

export class FeatureMapHandler {
  private mappingPath: string;
  private mappings: Map<string, FeatureMapping> = new Map();

  constructor() {
    this.mappingPath = resolve(__dirname, '../../../../feature-mappings.yaml');
    this.loadMappings();
  }

  private loadMappings() {
    if (existsSync(this.mappingPath)) {
      try {
        const content = readFileSync(this.mappingPath, 'utf-8');
        const data = yaml.load(content) as Record<string, FeatureMapping>;
        Object.entries(data).forEach(([key, value]) => {
          this.mappings.set(key, value);
        });
      } catch (error) {
        console.error('Error loading feature mappings:', error);
      }
    }
  }

  async getImplementationMap(feature: string) {
    const mapping = this.mappings.get(feature);
    
    if (!mapping) {
      // Try to find partial matches
      const partialMatches = Array.from(this.mappings.entries())
        .filter(([key]) => key.toLowerCase().includes(feature.toLowerCase()))
        .map(([key, value]) => ({ feature: key, ...value }));
      
      return {
        content: [
          {
            type: 'text',
            text: partialMatches.length > 0
              ? `Found ${partialMatches.length} partial matches for "${feature}":\n\n${JSON.stringify(partialMatches, null, 2)}`
              : `No implementation mapping found for feature: ${feature}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Implementation map for ${feature}:\n\n${JSON.stringify(mapping, null, 2)}`,
        },
      ],
    };
  }

  async getAllMappings() {
    const allMappings = Object.fromEntries(this.mappings);
    
    return {
      content: [
        {
          type: 'text',
          text: `All feature mappings:\n\n${JSON.stringify(allMappings, null, 2)}`,
        },
      ],
    };
  }
}