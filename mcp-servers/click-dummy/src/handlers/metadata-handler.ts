import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'js-yaml';

export class MetadataHandler {
  async createMetadata(path: string, metadata: any) {
    const metadataPath = path.replace('.php', '.metadata.yaml');
    const yamlContent = yaml.dump(metadata);
    writeFileSync(metadataPath, yamlContent, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `Created metadata file: ${metadataPath}`,
        },
      ],
    };
  }

  async updateMetadata(path: string, updates: any) {
    const metadataPath = path.replace('.php', '.metadata.yaml');
    let existing = {};
    
    try {
      const content = readFileSync(metadataPath, 'utf-8');
      existing = yaml.load(content) as any;
    } catch (error) {
      // File doesn't exist yet
    }
    
    const updated = { ...existing, ...updates };
    const yamlContent = yaml.dump(updated);
    writeFileSync(metadataPath, yamlContent, 'utf-8');
    
    return {
      content: [
        {
          type: 'text',
          text: `Updated metadata file: ${metadataPath}`,
        },
      ],
    };
  }
}