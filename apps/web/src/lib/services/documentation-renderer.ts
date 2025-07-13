import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { marked } from 'marked';

interface DocumentationFile {
  title: string;
  category: string;
  tags: string[];
  priority: string;
  lastUpdated: string;
  content: string;
}

interface RenderedDoc {
  title: string;
  category: string;
  tags: string[];
  priority: string;
  lastUpdated: string;
  html: string;
  filename: string;
  path: string;
}

export class DocumentationRenderer {
  private sourceDir: string;
  private outputDir: string;

  constructor(sourceDir: string = 'mcp-server/src/data', outputDir: string = 'docs') {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;
  }

  /**
   * Parse a YAML documentation file
   */
  async parseYamlFile(filePath: string): Promise<DocumentationFile> {
    const content = await fs.readFile(filePath, 'utf-8');
    const parts = content.split('---\n');
    
    if (parts.length < 3) {
      throw new Error(`Invalid YAML format in ${filePath}`);
    }

    const frontMatter = yaml.load(parts[1]) as any;
    const markdownContent = parts.slice(2).join('---\n').trim();

    return {
      title: frontMatter.title,
      category: frontMatter.category,
      tags: frontMatter.tags || [],
      priority: frontMatter.priority || 'medium',
      lastUpdated: frontMatter.lastUpdated,
      content: markdownContent
    };
  }

  /**
   * Convert markdown content to HTML
   */
  async renderMarkdownToHtml(markdown: string): Promise<string> {
    // Configure marked for better code highlighting and rendering
    marked.setOptions({
      highlight: function(code, lang) {
        // Basic syntax highlighting - could be enhanced with prism.js
        return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
      },
      breaks: true,
      gfm: true
    });

    return marked(markdown);
  }

  /**
   * Generate HTML template for documentation (README.com style)
   */
  generateHtmlTemplate(doc: RenderedDoc, allDocs: RenderedDoc[] = []): string {
    const navigation = this.generateNavigation(allDocs);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title} - itellico Mono Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #0066cc;
            --primary-blue-dark: #004499;
            --bg-light: #fafbfc;
            --border-light: #e1e5e9;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --sidebar-width: 280px;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
        }
        
        .docs-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--bg-light);
            border-right: 1px solid var(--border-light);
            overflow-y: auto;
            z-index: 50;
        }
        
        .docs-header {
            position: sticky;
            top: 0;
            background: white;
            border-bottom: 1px solid var(--border-light);
            padding: 1rem 1.5rem;
            z-index: 40;
        }
        
        .docs-main {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
        }
        
        .docs-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .search-container {
            position: relative;
            margin-bottom: 1.5rem;
        }
        
        .search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid var(--border-light);
            border-radius: 0.5rem;
            background: white;
            font-size: 0.875rem;
        }
        
        .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }
        
        .nav-section {
            margin-bottom: 1.5rem;
        }
        
        .nav-section-title {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            padding: 0 1rem;
        }
        
        .nav-item {
            display: block;
            padding: 0.5rem 1rem;
            color: var(--text-primary);
            text-decoration: none;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            margin: 0 0.5rem;
            transition: all 0.15s ease;
        }
        
        .nav-item:hover {
            background: #e2e8f0;
            color: var(--primary-blue-dark);
        }
        
        .nav-item.active {
            background: var(--primary-blue);
            color: white;
        }
        
        .breadcrumb {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        .breadcrumb a {
            color: var(--primary-blue);
            text-decoration: none;
        }
        
        .doc-header {
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 2rem;
            margin-bottom: 2rem;
        }
        
        .doc-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 1rem;
            line-height: 1.2;
        }
        
        .doc-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .tag {
            display: inline-block;
            background: #f1f5f9;
            color: var(--text-primary);
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .priority-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .priority-high {
            background: #fef2f2;
            color: #dc2626;
        }
        
        .priority-medium {
            background: #fef3c7;
            color: #d97706;
        }
        
        .priority-low {
            background: #f0fdf4;
            color: #16a34a;
        }
        
        .prose {
            color: var(--text-primary);
            max-width: none;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: var(--text-primary);
            font-weight: 600;
            line-height: 1.25;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        
        .prose h1 { font-size: 2rem; }
        .prose h2 { font-size: 1.5rem; }
        .prose h3 { font-size: 1.25rem; }
        
        .prose p {
            margin-bottom: 1rem;
        }
        
        .prose ul, .prose ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
        }
        
        .prose li {
            margin-bottom: 0.5rem;
        }
        
        .prose pre {
            background: #1e293b;
            border-radius: 0.5rem;
            padding: 1.5rem;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .prose code {
            background: #f1f5f9;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
            color: #e11d48;
        }
        
        .prose pre code {
            background: transparent;
            padding: 0;
            color: #e2e8f0;
        }
        
        .prose blockquote {
            border-left: 4px solid var(--primary-blue);
            padding-left: 1rem;
            margin: 1.5rem 0;
            color: var(--text-secondary);
            font-style: italic;
        }
        
        .prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
        }
        
        .prose th, .prose td {
            border: 1px solid var(--border-light);
            padding: 0.75rem;
            text-align: left;
        }
        
        .prose th {
            background: var(--bg-light);
            font-weight: 600;
        }
        
        .toc {
            background: var(--bg-light);
            border: 1px solid var(--border-light);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .toc-title {
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }
        
        .toc ul {
            list-style: none;
            padding: 0;
        }
        
        .toc li {
            margin-bottom: 0.5rem;
        }
        
        .toc a {
            color: var(--primary-blue);
            text-decoration: none;
            font-size: 0.875rem;
        }
        
        .toc a:hover {
            text-decoration: underline;
        }
        
        .mobile-menu-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 60;
            background: var(--primary-blue);
            color: white;
            border: none;
            border-radius: 0.375rem;
            padding: 0.75rem;
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .docs-sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .docs-sidebar.open {
                transform: translateX(0);
            }
            
            .docs-main {
                margin-left: 0;
            }
            
            .mobile-menu-toggle {
                display: block;
            }
            
            .docs-content {
                padding: 1rem;
                padding-top: 4rem;
            }
        }
    </style>
</head>
<body class="bg-white text-gray-900">
    <button class="mobile-menu-toggle" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </button>
    
    <nav class="docs-sidebar" id="sidebar">
        <div class="docs-header">
            <h1 class="text-xl font-bold text-gray-900">itellico Mono</h1>
            <p class="text-sm text-gray-600">Documentation</p>
        </div>
        
        <div class="p-4">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" class="search-input" placeholder="Search documentation..." id="searchInput">
            </div>
            
            <div id="navigation">
                ${navigation}
            </div>
        </div>
    </nav>
    
    <main class="docs-main">
        <div class="docs-content">
            <nav class="breadcrumb">
                <a href="../index.html"><i class="fas fa-home"></i> Home</a>
                <i class="fas fa-chevron-right"></i>
                <span class="capitalize">${doc.category}</span>
                <i class="fas fa-chevron-right"></i>
                <span>${doc.title}</span>
            </nav>
            
            <header class="doc-header">
                <h1 class="doc-title">${doc.title}</h1>
                
                <div class="doc-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Updated ${new Date(doc.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-folder"></i>
                        <span class="capitalize">${doc.category}</span>
                    </div>
                    <div class="priority-indicator priority-${doc.priority}">
                        <i class="fas fa-exclamation-circle"></i>
                        <span class="capitalize">${doc.priority} Priority</span>
                    </div>
                </div>
                
                ${doc.tags.length > 0 ? `
                <div class="mt-4">
                    ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ` : ''}
            </header>
            
            <article class="prose">
                ${doc.html}
            </article>
            
            <footer class="mt-12 pt-8 border-t border-gray-200">
                <div class="text-sm text-gray-500">
                    <p><i class="fas fa-code"></i> Generated from: <code>${doc.path}</code></p>
                    <p><i class="fas fa-robot"></i> Auto-generated documentation for itellico Mono platform</p>
                </div>
            </footer>
        </div>
    </main>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const navItems = document.querySelectorAll('.nav-item');
            
            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                const section = item.closest('.nav-section');
                
                if (text.includes(searchTerm)) {
                    item.style.display = 'block';
                    section.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Hide empty sections
            document.querySelectorAll('.nav-section').forEach(section => {
                const visibleItems = section.querySelectorAll('.nav-item[style*="block"]').length;
                if (visibleItems === 0 && searchTerm) {
                    section.style.display = 'none';
                } else {
                    section.style.display = 'block';
                }
            });
        });
        
        // Highlight current page in navigation
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
        
        // Generate table of contents
        function generateTOC() {
            const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3');
            if (headings.length < 3) return; // Only show TOC if there are enough headings
            
            let tocHTML = '<div class="toc"><div class="toc-title">Table of Contents</div><ul>';
            
            headings.forEach((heading, index) => {
                const id = 'heading-' + index;
                heading.id = id;
                const level = parseInt(heading.tagName.charAt(1));
                const indent = (level - 1) * 20;
                
                tocHTML += \`<li style="margin-left: \${indent}px"><a href="#\${id}">\${heading.textContent}</a></li>\`;
            });
            
            tocHTML += '</ul></div>';
            
            const article = document.querySelector('.prose');
            if (article && article.firstChild) {
                article.insertAdjacentHTML('afterbegin', tocHTML);
            }
        }
        
        // Initialize TOC when page loads
        document.addEventListener('DOMContentLoaded', generateTOC);
    </script>
</body>
</html>`;
  }

  /**
   * Render a single YAML file to HTML
   */
  async renderSingleFile(yamlPath: string): Promise<RenderedDoc> {
    const doc = await this.parseYamlFile(yamlPath);
    const html = await this.renderMarkdownToHtml(doc.content);
    
    const relativePath = path.relative(this.sourceDir, yamlPath);
    const filename = path.basename(yamlPath, '.yaml') + '.html';
    
    return {
      ...doc,
      html,
      filename,
      path: relativePath
    };
  }

  /**
   * Find all YAML files in the source directory
   */
  async findYamlFiles(): Promise<string[]> {
    const files: string[] = [];
    
    async function scanDir(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDir(this.sourceDir);
    return files;
  }

  /**
   * Generate navigation structure (README.com style)
   */
  generateNavigation(docs: RenderedDoc[]): string {
    const categories = docs.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, RenderedDoc[]>);

    // Sort categories by importance
    const categoryOrder = ['overview', 'guides', 'architecture', 'features', 'workflows', 'testing', 'integrations', 'roadmap'];
    const sortedCategories = Object.entries(categories).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    let nav = '';
    for (const [category, categoryDocs] of sortedCategories) {
      // Sort docs by priority and then by title
      const sortedDocs = categoryDocs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.title.localeCompare(b.title);
      });

      nav += `
        <div class="nav-section">
          <div class="nav-section-title">${category}</div>
          ${sortedDocs.map(doc => {
            const truncatedTitle = doc.title.length > 40 ? doc.title.substring(0, 37) + '...' : doc.title;
            return `<a href="../${doc.category}/${doc.filename}" class="nav-item" title="${doc.title}">${truncatedTitle}</a>`;
          }).join('')}
        </div>
      `;
    }
    
    return nav;
  }

  /**
   * Generate index page with sidebar (README.com style with collapsible navigation)
   */
  generateIndexPage(docs: RenderedDoc[]): string {
    const categories = docs.reduce((acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, RenderedDoc[]>);

    // Sort categories by importance
    const categoryOrder = ['overview', 'guides', 'architecture', 'features', 'workflows', 'testing', 'integrations', 'roadmap'];
    const sortedCategories = Object.entries(categories).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Generate category icons
    const categoryIcons = {
      overview: 'fas fa-home',
      guides: 'fas fa-compass',
      architecture: 'fas fa-building',
      features: 'fas fa-star',
      workflows: 'fas fa-code-branch',
      testing: 'fas fa-vial',
      integrations: 'fas fa-plug',
      roadmap: 'fas fa-route',
      general: 'fas fa-file-alt',
      database: 'fas fa-database',
      migrations: 'fas fa-exchange-alt',
      reference: 'fas fa-book',
      learning: 'fas fa-graduation-cap',
      status: 'fas fa-chart-line',
      usage: 'fas fa-tools'
    };

    // Generate collapsible navigation for sidebar
    const navigation = sortedCategories.map(([category, categoryDocs]) => {
      const sortedDocs = categoryDocs.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.title.localeCompare(b.title);
      });

      const icon = categoryIcons[category as keyof typeof categoryIcons] || 'fas fa-file-alt';
      const docCount = categoryDocs.length;
      const highPriorityCount = categoryDocs.filter(doc => doc.priority === 'high').length;

      return `
        <div class="nav-section">
          <div class="nav-section-header" onclick="toggleSection('${category}')">
            <div class="nav-section-title">
              <i class="${icon}"></i>
              <span class="capitalize">${category}</span>
              <span class="doc-count">${docCount}</span>
              ${highPriorityCount > 0 ? `<span class="priority-badge">${highPriorityCount} high</span>` : ''}
            </div>
            <i class="fas fa-chevron-down nav-section-toggle" id="toggle-${category}"></i>
          </div>
          <div class="nav-section-content" id="content-${category}">
            ${sortedDocs.map(doc => {
              const truncatedTitle = doc.title.length > 40 ? doc.title.substring(0, 37) + '...' : doc.title;
              return `<a href="./${doc.category}/${doc.filename}" class="nav-item" title="${doc.title}">
                <span class="nav-item-title">${truncatedTitle}</span>
                <span class="nav-item-priority priority-${doc.priority}"></span>
              </a>`;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    const totalDocs = docs.length;
    const categories_count = Object.keys(categories).length;
    const lastUpdated = Math.max(...docs.map(doc => new Date(doc.lastUpdated).getTime()));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>itellico Mono Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #0066cc;
            --primary-blue-dark: #004499;
            --bg-light: #fafbfc;
            --border-light: #e1e5e9;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --sidebar-width: 280px;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
        }
        
        .docs-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--bg-light);
            border-right: 1px solid var(--border-light);
            overflow-y: auto;
            z-index: 50;
        }
        
        .docs-header {
            position: sticky;
            top: 0;
            background: white;
            border-bottom: 1px solid var(--border-light);
            padding: 1rem 1.5rem;
            z-index: 40;
        }
        
        .docs-main {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            background: white;
        }
        
        .docs-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .search-container {
            position: relative;
            margin-bottom: 1.5rem;
        }
        
        .search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid var(--border-light);
            border-radius: 0.5rem;
            background: white;
            font-size: 0.875rem;
        }
        
        .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }
        
        .nav-section {
            margin-bottom: 0.5rem;
        }
        
        .nav-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-radius: 0.375rem;
            margin: 0 0.5rem;
            transition: all 0.15s ease;
            background: white;
            border: 1px solid var(--border-light);
        }
        
        .nav-section-header:hover {
            background: #f8fafc;
            transform: translateX(2px);
        }
        
        .nav-section-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .nav-section-title i {
            color: var(--primary-blue);
            width: 16px;
        }
        
        .nav-section-toggle {
            transition: transform 0.2s ease;
            color: var(--text-secondary);
        }
        
        .nav-section-toggle.expanded {
            transform: rotate(180deg);
        }
        
        .nav-section-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            margin: 0 0.5rem;
        }
        
        .nav-section-content.expanded {
            max-height: 500px;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            color: var(--text-primary);
            text-decoration: none;
            font-size: 0.875rem;
            border-radius: 0.375rem;
            margin: 0.25rem 0;
            transition: all 0.15s ease;
            border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
            background: #e2e8f0;
            color: var(--primary-blue-dark);
            border-left-color: var(--primary-blue);
            transform: translateX(4px);
        }
        
        .nav-item-title {
            flex: 1;
        }
        
        .nav-item-priority {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-left: 0.5rem;
        }
        
        .nav-item-priority.priority-high {
            background: #dc2626;
        }
        
        .nav-item-priority.priority-medium {
            background: #d97706;
        }
        
        .nav-item-priority.priority-low {
            background: #16a34a;
        }
        
        .doc-count {
            font-size: 0.75rem;
            color: var(--text-secondary);
            background: #f1f5f9;
            padding: 0.125rem 0.375rem;
            border-radius: 0.75rem;
            font-weight: 500;
        }
        
        .priority-badge {
            font-size: 0.75rem;
            color: #dc2626;
            background: #fef2f2;
            padding: 0.125rem 0.375rem;
            border-radius: 0.75rem;
            font-weight: 500;
        }
        
        .mobile-menu-toggle {
            display: none;
            position: fixed;
            top: 1rem;
            left: 1rem;
            background: var(--primary-blue);
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.75rem;
            z-index: 60;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .hero-section {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
            color: white;
            padding: 4rem 2rem;
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .hero-title {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .hero-subtitle {
            font-size: 1.125rem;
            opacity: 0.9;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .hero-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-top: 2rem;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 1.75rem;
            font-weight: 700;
            display: block;
        }
        
        .stat-label {
            font-size: 0.875rem;
            opacity: 0.8;
        }
        
        .main-overview {
            padding: 2rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
        }
        
        .overview-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 1rem;
        }
        
        .overview-description {
            color: var(--text-secondary);
            font-size: 1.125rem;
            line-height: 1.7;
            margin-bottom: 2rem;
        }
        
        .quick-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .quick-link {
            display: block;
            padding: 1.5rem;
            background: var(--bg-light);
            border: 1px solid var(--border-light);
            border-radius: 0.5rem;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .quick-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: var(--primary-blue);
        }
        
        .quick-link-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .quick-link-description {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
            background: var(--bg-light);
            border-top: 1px solid var(--border-light);
        }
        
        @media (max-width: 768px) {
            .docs-sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .docs-sidebar.open {
                transform: translateX(0);
            }
            
            .docs-main {
                margin-left: 0;
            }
            
            .mobile-menu-toggle {
                display: block;
            }
            
            .docs-content {
                padding: 1rem;
                padding-top: 4rem;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .hero-stats {
                flex-direction: column;
                gap: 1rem;
            }
            
            .quick-links {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body class="bg-white text-gray-900">
    <button class="mobile-menu-toggle" onclick="toggleSidebar()">
        <i class="fas fa-bars"></i>
    </button>
    
    <nav class="docs-sidebar" id="sidebar">
        <div class="docs-header">
            <h1 class="text-xl font-bold text-gray-900">itellico Mono</h1>
            <p class="text-sm text-gray-600">Documentation Hub</p>
        </div>
        
        <div class="p-4">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" class="search-input" placeholder="Search documentation..." id="searchInput">
            </div>
            
            <div id="navigation">
                ${navigation}
            </div>
        </div>
    </nav>
    
    <main class="docs-main">
        <div class="hero-section">
            <h1 class="hero-title">itellico Mono Documentation</h1>
            <p class="hero-subtitle">Comprehensive documentation for the multi-tenant SaaS platform with advanced RBAC, dynamic content management, and modern architecture</p>
            
            <div class="hero-stats">
                <div class="stat-item">
                    <span class="stat-number">${totalDocs}</span>
                    <span class="stat-label">Documentation Pages</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${categories_count}</span>
                    <span class="stat-label">Categories</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${new Date(lastUpdated).toLocaleDateString()}</span>
                    <span class="stat-label">Last Updated</span>
                </div>
            </div>
        </div>
        
        <div class="docs-content">
            <div class="main-overview">
                <h2 class="overview-title">Welcome to itellico Mono Documentation</h2>
                <p class="overview-description">
                    This comprehensive documentation covers all aspects of the itellico Mono platform, from quick start guides to advanced architectural concepts. 
                    Use the collapsible sidebar navigation to explore different sections, or use the search functionality to find specific topics.
                </p>
                
                <div class="quick-links">
                    <a href="./guides/getting-started-quick-reference.html" class="quick-link">
                        <h3 class="quick-link-title">
                            <i class="fas fa-rocket"></i>
                            Quick Start Guide
                        </h3>
                        <p class="quick-link-description">Get up and running with itellico Mono in minutes</p>
                    </a>
                    
                    <a href="./architecture/MONO_PLATFORM_COMPLETE_SPECIFICATION.html" class="quick-link">
                        <h3 class="quick-link-title">
                            <i class="fas fa-building"></i>
                            Platform Architecture
                        </h3>
                        <p class="quick-link-description">Understand the complete system architecture and design patterns</p>
                    </a>
                    
                    <a href="./features/RBAC-IMPLEMENTATION-COMPLETE.html" class="quick-link">
                        <h3 class="quick-link-title">
                            <i class="fas fa-shield-alt"></i>
                            Security & RBAC
                        </h3>
                        <p class="quick-link-description">Learn about role-based access control and security features</p>
                    </a>
                    
                    <a href="./workflows/WORKFLOWS_COMPREHENSIVE_GUIDE.html" class="quick-link">
                        <h3 class="quick-link-title">
                            <i class="fas fa-code-branch"></i>
                            Workflow System
                        </h3>
                        <p class="quick-link-description">Explore the powerful workflow and automation capabilities</p>
                    </a>
                </div>
            </div>
        </div>
        
        <footer class="footer">
            <p><i class="fas fa-robot"></i> Auto-generated from YAML documentation files</p>
            <p class="mt-2 text-sm">Built with modern web technologies for the itellico Mono platform</p>
        </footer>
    </main>
    
    <script>
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
        }
        
        function toggleSection(categoryId) {
            const content = document.getElementById('content-' + categoryId);
            const toggle = document.getElementById('toggle-' + categoryId);
            
            content.classList.toggle('expanded');
            toggle.classList.toggle('expanded');
        }
        
        // Initialize all sections as expanded
        document.addEventListener('DOMContentLoaded', function() {
            const allContents = document.querySelectorAll('.nav-section-content');
            const allToggles = document.querySelectorAll('.nav-section-toggle');
            
            allContents.forEach(content => content.classList.add('expanded'));
            allToggles.forEach(toggle => toggle.classList.add('expanded'));
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const navItems = document.querySelectorAll('.nav-item');
            const sections = document.querySelectorAll('.nav-section');
            
            if (!searchTerm) {
                // Show all items and sections when search is empty
                navItems.forEach(item => item.style.display = 'flex');
                sections.forEach(section => section.style.display = 'block');
                return;
            }
            
            sections.forEach(section => {
                const sectionItems = section.querySelectorAll('.nav-item');
                let hasVisibleItems = false;
                
                sectionItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        item.style.display = 'flex';
                        hasVisibleItems = true;
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                // Show/hide section based on whether it has visible items
                section.style.display = hasVisibleItems ? 'block' : 'none';
                
                // Auto-expand sections with search results
                if (hasVisibleItems) {
                    const content = section.querySelector('.nav-section-content');
                    const toggle = section.querySelector('.nav-section-toggle');
                    content.classList.add('expanded');
                    toggle.classList.add('expanded');
                }
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Render all documentation files
   */
  async renderAllDocumentation(): Promise<void> {
    console.log('🏗️  Starting documentation rendering...');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Find all YAML files
    const yamlFiles = await this.findYamlFiles();
    console.log(`📄 Found ${yamlFiles.length} YAML files`);
    
    // Render each file
    const renderedDocs: RenderedDoc[] = [];
    
    for (const yamlFile of yamlFiles) {
      try {
        console.log(`🔄 Rendering ${yamlFile}...`);
        const renderedDoc = await this.renderSingleFile(yamlFile);
        renderedDocs.push(renderedDoc);
      } catch (error) {
        console.error(`❌ Failed to render ${yamlFile}:`, error);
      }
    }
    
    // Now generate HTML files with complete navigation
    for (const renderedDoc of renderedDocs) {
      try {
        // Create category directory
        const categoryDir = path.join(this.outputDir, renderedDoc.category);
        await fs.mkdir(categoryDir, { recursive: true });
        
        // Generate and write HTML file with all docs for navigation
        const htmlContent = this.generateHtmlTemplate(renderedDoc, renderedDocs);
        const outputPath = path.join(categoryDir, renderedDoc.filename);
        await fs.writeFile(outputPath, htmlContent);
        
        console.log(`✅ Generated ${outputPath}`);
      } catch (error) {
        console.error(`❌ Failed to generate HTML for ${renderedDoc.title}:`, error);
      }
    }
    
    // Generate index page
    const indexContent = this.generateIndexPage(renderedDocs);
    await fs.writeFile(path.join(this.outputDir, 'index.html'), indexContent);
    
    console.log(`🎉 Documentation rendering complete! Generated ${renderedDocs.length} pages`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  /**
   * Render documentation from change request
   */
  async renderFromChangeRequest(changes: any[]): Promise<string> {
    // Create temporary files and render preview
    const tempDir = path.join(this.outputDir, 'preview', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      for (const change of changes) {
        if (change.action === 'delete') continue;
        
        const tempFile = path.join(tempDir, path.basename(change.file));
        await fs.writeFile(tempFile, change.after);
        
        const renderedDoc = await this.renderSingleFile(tempFile);
        const htmlContent = this.generateHtmlTemplate(renderedDoc);
        
        const outputPath = path.join(tempDir, renderedDoc.filename);
        await fs.writeFile(outputPath, htmlContent);
      }
      
      return tempDir;
    } catch (error) {
      // Clean up on error
      await fs.rmdir(tempDir, { recursive: true });
      throw error;
    }
  }
}