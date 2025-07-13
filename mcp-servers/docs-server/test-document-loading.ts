#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import * as YAML from 'yaml';

// Simulate the server's document loading logic
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Same paths as in base.ts (after our fix)
const projectRoot = join(__dirname, '../../');
const dataDir = join(projectRoot, 'docs');

console.log('Project root:', projectRoot);
console.log('Data dir:', dataDir);
console.log('');

// Test loading from data directory
async function testDataDirLoading() {
  console.log('🔍 Testing data directory loading...');
  
  try {
    const pattern = '**/*.{yaml,yml,md}';
    const files = await glob(pattern, { 
      cwd: dataDir,
      absolute: true 
    });
    
    console.log(`Found ${files.length} files with pattern "${pattern}" in ${dataDir}`);
    
    // Show first 5 files
    console.log('\nFirst 5 files:');
    files.slice(0, 5).forEach(file => {
      console.log(`  - ${file.replace(dataDir + '/', '')}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test loading from docs directory
async function testDocsDirLoading() {
  console.log('\n🔍 Testing docs directory loading...');
  
  const docsDir = join(projectRoot, 'docs');
  console.log('Docs dir:', docsDir);
  
  try {
    const pattern = '**/*.md';
    const files = glob.sync(pattern, { 
      cwd: docsDir,
      absolute: true 
    });
    
    console.log(`Found ${files.length} files with pattern "${pattern}" in ${docsDir}`);
    
    // Show first 5 files
    console.log('\nFirst 5 files:');
    files.slice(0, 5).forEach(file => {
      console.log(`  - ${file.replace(docsDir + '/', '')}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Main
async function main() {
  await testDataDirLoading();
  await testDocsDirLoading();
}

main().catch(console.error);