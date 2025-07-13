const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

module.exports = function yamlDocsPlugin(context, options) {
  return {
    name: 'yaml-docs-plugin',
    
    async loadContent() {
      // Path to MCP docs server YAML files
      const mcpDocsPath = path.join(context.siteDir, '../../mcp-servers/docs-server/src/data');
      const docsPath = path.join(context.siteDir, '../../docs');
      
      // Process YAML files from MCP server
      if (fs.existsSync(mcpDocsPath)) {
        await processYamlFiles(mcpDocsPath, docsPath);
      }
    },
    
    async contentLoaded({content, actions}) {
      // Additional processing if needed
    },
  };
};

async function processYamlFiles(sourcePath, targetPath) {
  const categories = fs.readdirSync(sourcePath);
  
  for (const category of categories) {
    const categoryPath = path.join(sourcePath, category);
    
    if (fs.statSync(categoryPath).isDirectory()) {
      const files = fs.readdirSync(categoryPath);
      
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(categoryPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          try {
            // Parse YAML frontmatter and content
            const { data, content: markdown } = matter(content);
            
            // Create corresponding markdown file
            const mdFileName = file.replace(/\.(yaml|yml)$/, '.md');
            const targetDir = path.join(targetPath, category);
            
            // Ensure directory exists
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            // Write markdown file with frontmatter
            const mdContent = `---
title: ${data.title || 'Untitled'}
description: ${data.description || ''}
category: ${data.category || category}
lastUpdated: ${data.lastUpdated || new Date().toISOString().split('T')[0]}
---

${markdown}`;
            
            fs.writeFileSync(path.join(targetDir, mdFileName), mdContent);
            
            console.log(`✅ Processed: ${category}/${file} → ${category}/${mdFileName}`);
          } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
          }
        }
      }
    }
  }
}