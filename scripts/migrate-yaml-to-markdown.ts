#!/usr/bin/env node
/**
 * YAML to Markdown Migration Script
 * 
 * This script reads all YAML files from the MCP docs server data directory
 * and converts them to proper Markdown format in the docs directory.
 * 
 * Features:
 * - Preserves frontmatter and content structure
 * - Maintains directory hierarchy
 * - Handles YAML parsing errors gracefully
 * - Creates backup of existing files
 * - Validates output format
 * - Comprehensive logging
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define paths
const YAML_SOURCE_DIR = '/Users/mm2/dev_mm/mono/mcp-servers/docs-server/src/data';
const MARKDOWN_TARGET_DIR = '/Users/mm2/dev_mm/mono/docs';
const BACKUP_DIR = '/Users/mm2/dev_mm/mono/backup/docs-migration';

// Logging utilities
const log = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  debug: (msg: string) => console.log(`🔍 ${msg}`),
};

// Statistics tracking
interface MigrationStats {
  totalFiles: number;
  processed: number;
  errors: number;
  skipped: number;
  created: number;
  updated: number;
}

const stats: MigrationStats = {
  totalFiles: 0,
  processed: 0,
  errors: 0,
  skipped: 0,
  created: 0,
  updated: 0,
};

// Interface for YAML document structure
interface YAMLDoc {
  title?: string;
  category?: string;
  tags?: string[];
  priority?: string;
  lastUpdated?: string;
  originalFile?: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Recursively find all .yaml files in a directory
 */
async function findYAMLFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
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
async function parseYAMLFile(filePath: string): Promise<{ frontmatter: YAMLDoc; content: string } | null> {
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
    const frontmatter = yaml.load(frontmatterYAML) as YAMLDoc;
    
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
function generateFrontmatter(data: YAMLDoc): string {
  const frontmatter: Record<string, any> = {};
  
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
function generateTargetPath(yamlPath: string): string {
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
async function createBackup(filePath: string): Promise<void> {
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
async function writeMarkdownFile(targetPath: string, frontmatter: YAMLDoc, content: string): Promise<void> {
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
 * Validate generated markdown file
 */
async function validateMarkdownFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check for proper frontmatter structure
    if (!content.startsWith('---\n')) {
      log.error(`Invalid frontmatter in ${filePath}`);
      return false;
    }
    
    const parts = content.split('---');
    if (parts.length < 3) {
      log.error(`Incomplete frontmatter in ${filePath}`);
      return false;
    }
    
    // Try to parse frontmatter
    try {
      yaml.load(parts[1]);
    } catch (error) {
      log.error(`Invalid YAML frontmatter in ${filePath}: ${error}`);
      return false;
    }
    
    log.debug(`Validated: ${filePath}`);
    return true;
  } catch (error) {
    log.error(`Failed to validate ${filePath}: ${error}`);
    return false;
  }
}

/**
 * Process a single YAML file
 */
async function processYAMLFile(yamlPath: string): Promise<void> {
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
    
    // Validate the output
    const isValid = await validateMarkdownFile(targetPath);
    if (!isValid) {
      stats.errors++;
      return;
    }
    
    stats.processed++;
  } catch (error) {
    log.error(`Failed to process ${yamlPath}: ${error}`);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function migrateYAMLToMarkdown(): Promise<void> {
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

/**
 * CLI entry point
 */
if (require.main === module) {
  migrateYAMLToMarkdown().catch((error) => {
    log.error(`Fatal error: ${error}`);
    process.exit(1);
  });
}

export { migrateYAMLToMarkdown };