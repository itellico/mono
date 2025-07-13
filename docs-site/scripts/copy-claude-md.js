#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const claudeMdPath = path.join(__dirname, '../../CLAUDE.md');
const staticDataDir = path.join(__dirname, '../static/data');
const outputPath = path.join(staticDataDir, 'claude-md.json');

// Ensure static/data directory exists
if (!fs.existsSync(staticDataDir)) {
  fs.mkdirSync(staticDataDir, { recursive: true });
}

try {
  // Read CLAUDE.md
  const content = fs.readFileSync(claudeMdPath, 'utf-8');
  const stats = fs.statSync(claudeMdPath);
  
  // Create JSON with content and metadata
  const data = {
    content: content,
    lastModified: stats.mtime.toISOString(),
    fileSize: stats.size,
    path: claudeMdPath,
    buildTime: new Date().toISOString()
  };
  
  // Write to static directory
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  console.log('✅ Successfully copied CLAUDE.md to static/data/claude-md.json');
  console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`   Last modified: ${stats.mtime.toLocaleString()}`);
  
} catch (error) {
  console.error('❌ Error copying CLAUDE.md:', error.message);
  
  // Create empty fallback
  const fallback = {
    content: '# CLAUDE.md\n\nError: Unable to read CLAUDE.md file.',
    lastModified: new Date().toISOString(),
    fileSize: 0,
    error: error.message,
    buildTime: new Date().toISOString()
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
  process.exit(1);
}