const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuration
const DOCS_DIR = path.join(__dirname, '../../docs');
const OUTPUT_FILE = path.join(__dirname, '../static/search-index.json');

// Helper function to extract headings from markdown content
function extractHeadings(content) {
  const headings = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ level, text });
    }
  }
  
  return headings;
}

// Helper function to extract meaningful content snippets
function extractContent(markdown, maxLength = 500) {
  // Remove markdown formatting
  let content = markdown
    .replace(/^#{1,6}\s+/gm, '') // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/^\s*-\s+/gm, '') // Remove list bullets
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/\n\s*\n/g, '\n') // Remove extra newlines
    .trim();
  
  // Take first meaningful paragraph
  const paragraphs = content.split('\n').filter(p => p.trim().length > 20);
  return paragraphs.slice(0, 3).join(' ').substring(0, maxLength);
}

// Helper function to determine category from file path
function getCategory(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  
  if (parts.includes('platform')) return 'Platform';
  if (parts.includes('tenant')) return 'Tenant';
  if (parts.includes('account')) return 'Account';
  if (parts.includes('user')) return 'User';
  if (parts.includes('public')) return 'Public';
  if (parts.includes('architecture')) return 'Architecture';
  if (parts.includes('development')) return 'Development';
  if (parts.includes('reference')) return 'Reference';
  
  return 'Documentation';
}

// Helper function to convert file path to URL path
function getUrlPath(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  let urlPath = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
  
  // Handle README files - these become directory URLs
  if (urlPath.endsWith('/README')) {
    urlPath = urlPath.replace('/README', '') + '/';
  }
  
  // Handle index files - these become directory URLs
  else if (urlPath.endsWith('/index')) {
    urlPath = urlPath.replace('/index', '') + '/';
  }
  
  // Regular markdown files - no trailing slash
  // e.g., architecture/performance/caching-strategy.md -> /architecture/performance/caching-strategy
  
  // Ensure leading slash for root-based routing (routeBasePath: '/')
  if (!urlPath.startsWith('/')) {
    urlPath = '/' + urlPath;
  }
  
  return urlPath;
}

// Main function to process a single markdown file
function processMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content: markdownContent } = matter(content);
  
  const headings = extractHeadings(markdownContent);
  const contentSnippet = extractContent(markdownContent);
  const category = getCategory(filePath);
  const urlPath = getUrlPath(filePath);
  
  // Get title from frontmatter or first heading
  let title = frontmatter.title || frontmatter.sidebar_label;
  if (!title && headings.length > 0) {
    title = headings[0].text;
  }
  if (!title) {
    // Fallback to filename
    title = path.basename(filePath, '.md');
  }
  
  // Build searchable content
  const searchableContent = [
    title,
    frontmatter.description || '',
    contentSnippet,
    headings.map(h => h.text).join(' '),
    (frontmatter.tags || []).join(' '),
    category
  ].filter(Boolean).join(' ');
  
  const entries = [];
  
  // Main entry for the file
  entries.push({
    title,
    path: urlPath,
    content: searchableContent,
    category,
    description: frontmatter.description || contentSnippet.substring(0, 150)
  });
  
  // Add entries for major headings (h1, h2)
  headings.filter(h => h.level <= 2).forEach(heading => {
    entries.push({
      title: `${title} - ${heading.text}`,
      path: `${urlPath}#${heading.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`,
      content: `${heading.text} ${searchableContent}`,
      category,
      description: `${heading.text} section in ${title}`
    });
  });
  
  return entries;
}

// Main function to build the search index
async function buildSearchIndex() {
  const searchIndex = [];
  
  // Function to recursively find all markdown files
  function findMarkdownFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (stat.isFile() && path.extname(item) === '.md') {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  // Find all markdown files
  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  
  console.log(`Found ${markdownFiles.length} markdown files`);
  
  // Process each file
  for (const filePath of markdownFiles) {
    try {
      const entries = processMarkdownFile(filePath);
      searchIndex.push(...entries);
      console.log(`Processed: ${path.relative(DOCS_DIR, filePath)} (${entries.length} entries)`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  // Sort by category and title
  searchIndex.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the search index
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(searchIndex, null, 2));
  
  console.log(`\nSearch index built successfully!`);
  console.log(`- Total entries: ${searchIndex.length}`);
  console.log(`- Categories: ${[...new Set(searchIndex.map(e => e.category))].join(', ')}`);
  console.log(`- Output file: ${OUTPUT_FILE}`);
  
  // Show some sample entries
  console.log('\nSample entries:');
  searchIndex.slice(0, 5).forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.title} (${entry.category})`);
    console.log(`   Path: ${entry.path}`);
    console.log(`   Content: ${entry.content.substring(0, 100)}...`);
  });
}

// Run the script
if (require.main === module) {
  buildSearchIndex().catch(console.error);
}

module.exports = { buildSearchIndex };