const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Test URLs and generate comprehensive link report
const BASE_URL = 'http://localhost:3005';

// Footer links from docusaurus.config.ts
const FOOTER_LINKS = [
  // 5-Tier Architecture
  '/platform/',
  '/tenant/',
  '/account/',
  '/user/',
  '/public/',
  // Documentation
  '/architecture/',
  '/development/',
  '/reference/',
  // Services (external)
  'http://localhost:3000',
  'http://localhost:3001/docs',
  'http://localhost:5005',
  'https://github.com/itellico/mono'
];

// Auto-generated links from file structure
const AUTO_LINKS = [];

// Function to get all potential documentation URLs
function generateDocumentationUrls() {
  const DOCS_DIR = '/Users/mm2/dev_mm/mono/docs';
  const urls = [];
  
  function processDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
        
        // Check if directory has index.md or README.md
        const indexFile = path.join(fullPath, 'index.md');
        const readmeFile = path.join(fullPath, 'README.md');
        
        if (fs.existsSync(indexFile) || fs.existsSync(readmeFile)) {
          urls.push(`/docs/${newRelativePath}/`);
        }
        
        // Process subdirectories
        processDirectory(fullPath, newRelativePath);
      } else if (item.endsWith('.md') && item !== 'index.md' && item !== 'README.md') {
        const fileName = item.replace('.md', '');
        const urlPath = relativePath ? `${relativePath}/${fileName}` : fileName;
        urls.push(`/docs/${urlPath}`);
      }
    }
  }
  
  processDirectory(DOCS_DIR);
  return urls;
}

// Function to test a URL
function testUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const client = fullUrl.startsWith('https') ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const isPageNotFound = data.includes('Page Not Found') || 
                              data.includes('404') ||
                              data.includes('We could not find what you were looking for');
        
        resolve({
          url: fullUrl,
          status: res.statusCode,
          working: res.statusCode === 200 && !isPageNotFound,
          error: isPageNotFound ? 'Page Not Found' : null
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url: fullUrl,
        status: 'ERROR',
        working: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        url: fullUrl,
        status: 'TIMEOUT',
        working: false,
        error: 'Request timeout'
      });
    });
  });
}

// Main audit function
async function auditAllLinks() {
  console.log('🔍 COMPREHENSIVE LINK AUDIT STARTING...\n');
  
  // Get all documentation URLs
  const docUrls = generateDocumentationUrls();
  
  // Combine all URLs
  const allUrls = [
    ...FOOTER_LINKS,
    ...docUrls
  ];
  
  console.log(`📊 Total URLs to test: ${allUrls.length}\n`);
  
  const results = [];
  
  // Test all URLs
  for (const url of allUrls) {
    const result = await testUrl(url);
    results.push(result);
    
    const status = result.working ? '✅' : '❌';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${result.url}${error}`);
  }
  
  // Summary
  const working = results.filter(r => r.working).length;
  const broken = results.filter(r => !r.working).length;
  
  console.log(`\n📈 AUDIT RESULTS:`);
  console.log(`✅ Working: ${working}`);
  console.log(`❌ Broken: ${broken}`);
  console.log(`📊 Total: ${results.length}`);
  
  // Detailed broken links
  const brokenLinks = results.filter(r => !r.working);
  if (brokenLinks.length > 0) {
    console.log(`\n🚨 BROKEN LINKS DETAILS:`);
    brokenLinks.forEach(link => {
      console.log(`❌ ${link.url} - ${link.error || 'Unknown error'}`);
    });
  }
  
  // Generate report file
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    working: working,
    broken: broken,
    results: results
  };
  
  fs.writeFileSync('/Users/mm2/dev_mm/mono/docs-site/link-audit-report.json', JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: link-audit-report.json`);
}

// Run the audit
auditAllLinks().catch(console.error);