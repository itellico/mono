#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

interface CheckResult {
  file: string;
  hasFrontmatter: boolean;
  hasTitle: boolean;
  hasCategory: boolean;
  error?: string;
}

function checkYamlFile(filePath: string): CheckResult {
  const relativePath = filePath.replace(process.cwd() + '/', '');
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if file starts with frontmatter
    if (!content.startsWith('---')) {
      return {
        file: relativePath,
        hasFrontmatter: false,
        hasTitle: false,
        hasCategory: false,
        error: 'No frontmatter found'
      };
    }
    
    // Extract frontmatter
    const parts = content.split('---');
    if (parts.length < 3) {
      return {
        file: relativePath,
        hasFrontmatter: false,
        hasTitle: false,
        hasCategory: false,
        error: 'Invalid frontmatter format'
      };
    }
    
    // Parse frontmatter
    try {
      const frontmatter = YAML.parse(parts[1]);
      return {
        file: relativePath,
        hasFrontmatter: true,
        hasTitle: !!frontmatter.title,
        hasCategory: !!frontmatter.category,
        error: (!frontmatter.title || !frontmatter.category) 
          ? `Missing: ${!frontmatter.title ? 'title' : ''} ${!frontmatter.category ? 'category' : ''}`.trim()
          : undefined
      };
    } catch (yamlError) {
      return {
        file: relativePath,
        hasFrontmatter: true,
        hasTitle: false,
        hasCategory: false,
        error: `YAML parse error: ${yamlError.message}`
      };
    }
  } catch (error) {
    return {
      file: relativePath,
      hasFrontmatter: false,
      hasTitle: false,
      hasCategory: false,
      error: `File read error: ${error.message}`
    };
  }
}

function findYamlFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const entries = readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
const dataDir = join(process.cwd(), 'src/data');
const yamlFiles = findYamlFiles(dataDir);

console.log(`Found ${yamlFiles.length} YAML files\n`);

const results = yamlFiles.map(checkYamlFile);
const invalidFiles = results.filter(r => !r.hasFrontmatter || !r.hasTitle || !r.hasCategory);

if (invalidFiles.length === 0) {
  console.log('✅ All YAML files have valid frontmatter!');
} else {
  console.log(`❌ Found ${invalidFiles.length} files with issues:\n`);
  
  for (const result of invalidFiles) {
    console.log(`📄 ${result.file}`);
    console.log(`   Error: ${result.error}`);
    console.log(`   Frontmatter: ${result.hasFrontmatter ? '✓' : '✗'}`);
    console.log(`   Title: ${result.hasTitle ? '✓' : '✗'}`);
    console.log(`   Category: ${result.hasCategory ? '✓' : '✗'}\n`);
  }
}

// Summary
const validCount = results.length - invalidFiles.length;
console.log('\n📊 Summary:');
console.log(`   Valid files: ${validCount}/${results.length}`);
console.log(`   Invalid files: ${invalidFiles.length}/${results.length}`);