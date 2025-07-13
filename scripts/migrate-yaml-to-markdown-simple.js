#!/usr/bin/env node
/**
 * YAML to Markdown Migration Script (Simple Version)
 * 
 * This script reads all YAML files from the MCP docs server data directory
 * and converts them to proper Markdown format in the docs directory.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Define paths
const YAML_SOURCE_DIR = '/Users/mm2/dev_mm/mono/mcp-servers/docs-server/src/data';
const MARKDOWN_TARGET_DIR = '/Users/mm2/dev_mm/mono/docs';
const BACKUP_DIR = '/Users/mm2/dev_mm/mono/backup/docs-migration';

// Logging utilities
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`),
};

// Statistics tracking
const stats = {
  totalFiles: 0,
  processed: 0,
  errors: 0,
  skipped: 0,
  created: 0,
  updated: 0,
};

/**
 * Recursively find all .yaml files in a directory
 */
async function findYAMLFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findYAMLFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    log.error(`Failed to read directory ${dir}: ${error}`);
  }
  
  return files;
}

/**
 * Parse YAML file and extract frontmatter + content
 */
async function parseYAMLFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Split the file content by the frontmatter delimiters
    const parts = fileContent.split('---');
    
    if (parts.length < 3) {
      log.warning(`Invalid YAML structure in ${filePath} - missing frontmatter delimiters`);
      return null;
    }
    
    // Parse the frontmatter (second part, index 1)
    const frontmatterYAML = parts[1];
    const frontmatter = yaml.load(frontmatterYAML);
    
    // Extract the content (everything after the second ---)
    const content = parts.slice(2).join('---').trim();
    
    return { frontmatter, content };
  } catch (error) {
    log.error(`Failed to parse YAML file ${filePath}: ${error}`);
    return null;
  }
}

/**
 * Generate markdown frontmatter from YAML data
 */
function generateFrontmatter(data) {
  const frontmatter = {};
  
  // Essential fields
  if (data.title) frontmatter.title = data.title;
  if (data.category) frontmatter.category = data.category;
  if (data.description) frontmatter.description = data.description;
  if (data.tags) frontmatter.tags = data.tags;
  if (data.priority) frontmatter.priority = data.priority;
  if (data.lastUpdated) frontmatter.lastUpdated = data.lastUpdated;
  if (data.status) frontmatter.status = data.status;
  
  // Additional fields (preserve any extra metadata)
  const reservedFields = ['title', 'category', 'description', 'tags', 'priority', 'lastUpdated', 'status'];
  for (const [key, value] of Object.entries(data)) {
    if (!reservedFields.includes(key) && value !== undefined) {
      frontmatter[key] = value;
    }
  }
  
  return yaml.dump(frontmatter, { 
    lineWidth: -1, // Disable line wrapping
    noRefs: true,  // Disable references
    sortKeys: false // Preserve order
  });
}

/**
 * Generate the target markdown file path
 */
function generateTargetPath(yamlPath) {
  // Get relative path from YAML source directory
  const relativePath = path.relative(YAML_SOURCE_DIR, yamlPath);
  
  // Change extension from .yaml to .md
  const mdPath = relativePath.replace(/\.yaml$/, '.md');
  
  // Combine with target directory
  return path.join(MARKDOWN_TARGET_DIR, mdPath);
}

/**
 * Create backup of existing markdown file
 */
async function createBackup(filePath) {
  try {
    await fs.access(filePath);
    
    // File exists, create backup
    const backupPath = path.join(BACKUP_DIR, path.relative(MARKDOWN_TARGET_DIR, filePath));
    const backupDir = path.dirname(backupPath);
    
    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(filePath, backupPath);
    
    log.debug(`Created backup: ${backupPath}`);
  } catch (error) {
    // File doesn't exist, no backup needed
    log.debug(`No backup needed for ${filePath} (file doesn't exist)`);
  }
}

/**
 * Write markdown file with proper formatting
 */
async function writeMarkdownFile(targetPath, frontmatter, content) {
  try {
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Create backup if file exists
    await createBackup(targetPath);
    
    // Generate the markdown content
    const frontmatterYAML = generateFrontmatter(frontmatter);
    const markdownContent = `---\n${frontmatterYAML}---\n\n${content}`;
    
    // Write the file
    await fs.writeFile(targetPath, markdownContent, 'utf8');
    
    // Check if it's a new file or update
    try {
      const backupPath = path.join(BACKUP_DIR, path.relative(MARKDOWN_TARGET_DIR, targetPath));
      await fs.access(backupPath);
      stats.updated++;
      log.success(`Updated: ${targetPath}`);
    } catch {
      stats.created++;
      log.success(`Created: ${targetPath}`);
    }
  } catch (error) {
    log.error(`Failed to write markdown file ${targetPath}: ${error}`);
    throw error;
  }
}

/**
 * Process a single YAML file
 */
async function processYAMLFile(yamlPath) {
  try {
    log.info(`Processing: ${yamlPath}`);
    
    // Parse the YAML file
    const parsed = await parseYAMLFile(yamlPath);
    if (!parsed) {
      stats.errors++;
      return;
    }
    
    const { frontmatter, content } = parsed;
    
    // Skip if no meaningful content
    if (!content.trim() && !frontmatter.title) {
      log.warning(`Skipping ${yamlPath} - no meaningful content`);
      stats.skipped++;
      return;
    }
    
    // Generate target path
    const targetPath = generateTargetPath(yamlPath);
    
    // Write the markdown file
    await writeMarkdownFile(targetPath, frontmatter, content);
    
    stats.processed++;
  } catch (error) {
    log.error(`Failed to process ${yamlPath}: ${error}`);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function migrateYAMLToMarkdown() {
  const startTime = Date.now();
  
  log.info('🚀 Starting YAML to Markdown migration...');
  log.info(`Source: ${YAML_SOURCE_DIR}`);
  log.info(`Target: ${MARKDOWN_TARGET_DIR}`);
  log.info(`Backup: ${BACKUP_DIR}`);
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Find all YAML files
    log.info('📂 Searching for YAML files...');
    const yamlFiles = await findYAMLFiles(YAML_SOURCE_DIR);
    stats.totalFiles = yamlFiles.length;
    
    log.info(`Found ${yamlFiles.length} YAML files`);
    
    if (yamlFiles.length === 0) {
      log.warning('No YAML files found to process');
      return;
    }
    
    // Process each YAML file
    log.info('🔄 Processing YAML files...');
    for (const yamlFile of yamlFiles) {
      await processYAMLFile(yamlFile);
    }
    
    // Calculate execution time
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print final statistics
    log.info('\n📊 Migration Complete!');
    log.info(`⏱️  Duration: ${duration} seconds`);
    log.info(`📁 Total files: ${stats.totalFiles}`);
    log.success(`✅ Processed: ${stats.processed}`);
    log.success(`🆕 Created: ${stats.created}`);
    log.success(`🔄 Updated: ${stats.updated}`);
    log.warning(`⏭️  Skipped: ${stats.skipped}`);
    log.error(`❌ Errors: ${stats.errors}`);
    
    if (stats.errors > 0) {
      log.error(`\n⚠️  ${stats.errors} files had errors. Please check the logs above.`);
      process.exit(1);
    } else {
      log.success('\n🎉 Migration completed successfully!');
    }
  } catch (error) {
    log.error(`Migration failed: ${error}`);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateYAMLToMarkdown().catch((error) => {
    log.error(`Fatal error: ${error}`);
    process.exit(1);
  });
}

module.exports = { migrateYAMLToMarkdown };