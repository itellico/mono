/**
 * Comprehensive Link Audit for Docusaurus Site
 * Tests ALL links including navigation, footer, internal docs, and external links
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = 'http://localhost:3005';
const TIMEOUT = 30000;
const AUDIT_RESULTS = {
  navigationLinks: [],
  footerLinks: [],
  internalLinks: [],
  externalLinks: [],
  brokenLinks: [],
  crashingLinks: [],
  workingLinks: [],
  totalLinks: 0,
  summary: {
    working: 0,
    broken: 0,
    crashing: 0,
    external: 0
  }
};

// Extract links from configuration files
function extractConfigLinks() {
  const configPath = path.join(__dirname, 'docusaurus.config.ts');
  const sidebarPath = path.join(__dirname, 'sidebars.ts');
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  
  const links = [];
  
  // Extract navbar links
  const navbarMatch = configContent.match(/navbar:\s*{[^}]*items:\s*\[([^\]]*)\]/s);
  if (navbarMatch) {
    const navItems = navbarMatch[1];
    const linkMatches = navItems.match(/(?:to|href):\s*['"]([^'"]+)['"]/g);
    if (linkMatches) {
      linkMatches.forEach(match => {
        const link = match.match(/['"]([^'"]+)['"]/)[1];
        links.push({
          type: 'navigation',
          url: link,
          source: 'navbar'
        });
      });
    }
  }
  
  // Extract footer links
  const footerMatch = configContent.match(/footer:\s*{[^}]*links:\s*\[([^\]]*)\]/s);
  if (footerMatch) {
    const footerItems = footerMatch[1];
    const linkMatches = footerItems.match(/(?:to|href):\s*['"]([^'"]+)['"]/g);
    if (linkMatches) {
      linkMatches.forEach(match => {
        const link = match.match(/['"]([^'"]+)['"]/)[1];
        links.push({
          type: 'footer',
          url: link,
          source: 'footer'
        });
      });
    }
  }
  
  return links;
}

// Extract all markdown files and their internal links
function extractMarkdownLinks() {
  const docsPath = path.join(__dirname, '../docs');
  const links = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(docsPath, filePath);
        
        // Extract markdown links [text](url)
        const linkMatches = content.match(/\[([^\]]*)\]\(([^)]+)\)/g);
        if (linkMatches) {
          linkMatches.forEach(match => {
            const urlMatch = match.match(/\[([^\]]*)\]\(([^)]+)\)/);
            if (urlMatch) {
              const linkText = urlMatch[1];
              const linkUrl = urlMatch[2];
              
              links.push({
                type: 'markdown',
                url: linkUrl,
                text: linkText,
                source: relativePath,
                isExternal: linkUrl.startsWith('http') || linkUrl.startsWith('https')
              });
            }
          });
        }
        
        // Extract relative links to other docs
        const relativeLinks = content.match(/\]\(\.\.?\/[^)]+\)/g);
        if (relativeLinks) {
          relativeLinks.forEach(match => {
            const linkUrl = match.match(/\]\(([^)]+)\)/)[1];
            links.push({
              type: 'relative',
              url: linkUrl,
              source: relativePath
            });
          });
        }
      }
    });
  }
  
  if (fs.existsSync(docsPath)) {
    scanDirectory(docsPath);
  }
  
  return links;
}

// Test a single link
async function testLink(page, link, baseUrl) {
  const result = {
    ...link,
    status: 'unknown',
    error: null,
    responseCode: null,
    loadTime: null
  };
  
  try {
    const startTime = Date.now();
    
    // Determine full URL
    let fullUrl;
    if (link.url.startsWith('http')) {
      fullUrl = link.url;
      result.isExternal = true;
    } else if (link.url.startsWith('/')) {
      fullUrl = baseUrl + link.url;
    } else {
      fullUrl = baseUrl + '/' + link.url;
    }
    
    console.log(`Testing: ${fullUrl}`);
    
    // Navigate to the link
    const response = await page.goto(fullUrl, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT
    });
    
    result.loadTime = Date.now() - startTime;
    result.responseCode = response.status();
    
    if (response.ok()) {
      // Check for JavaScript errors
      const errors = await page.evaluate(() => {
        return window.errors || [];
      });
      
      if (errors.length > 0) {
        result.status = 'crashing';
        result.error = `JavaScript errors: ${errors.join(', ')}`;
      } else {
        result.status = 'working';
      }
    } else {
      result.status = 'broken';
      result.error = `HTTP ${response.status()}`;
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    
    if (error.message.includes('Navigation timeout')) {
      result.status = 'timeout';
    } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      result.status = 'dns_error';
    }
  }
  
  return result;
}

// Test all links with detailed reporting
async function runComprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Link Audit...');
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Set up error tracking
  await page.evaluateOnNewDocument(() => {
    window.errors = [];
    window.addEventListener('error', (e) => {
      window.errors.push(e.message);
    });
    window.addEventListener('unhandledrejection', (e) => {
      window.errors.push(e.reason);
    });
  });
  
  try {
    // Extract all links
    console.log('📋 Extracting links from configuration...');
    const configLinks = extractConfigLinks();
    
    console.log('📋 Extracting links from markdown files...');
    const markdownLinks = extractMarkdownLinks();
    
    const allLinks = [...configLinks, ...markdownLinks];
    AUDIT_RESULTS.totalLinks = allLinks.length;
    
    console.log(`📊 Found ${allLinks.length} total links to test`);
    
    // Test each link
    for (const link of allLinks) {
      const result = await testLink(page, link, BASE_URL);
      
      // Categorize results
      if (result.type === 'navigation') {
        AUDIT_RESULTS.navigationLinks.push(result);
      } else if (result.type === 'footer') {
        AUDIT_RESULTS.footerLinks.push(result);
      } else if (result.isExternal) {
        AUDIT_RESULTS.externalLinks.push(result);
      } else {
        AUDIT_RESULTS.internalLinks.push(result);
      }
      
      // Status tracking
      if (result.status === 'working') {
        AUDIT_RESULTS.workingLinks.push(result);
        AUDIT_RESULTS.summary.working++;
      } else if (result.status === 'crashing') {
        AUDIT_RESULTS.crashingLinks.push(result);
        AUDIT_RESULTS.summary.crashing++;
      } else if (result.status === 'broken' || result.status === 'error' || result.status === 'timeout') {
        AUDIT_RESULTS.brokenLinks.push(result);
        AUDIT_RESULTS.summary.broken++;
      }
      
      if (result.isExternal) {
        AUDIT_RESULTS.summary.external++;
      }
      
      // Progress report
      console.log(`✅ ${result.url} - ${result.status}${result.error ? ` (${result.error})` : ''}`);
    }
    
    // Test the specific problematic link mentioned
    console.log('\n🎯 Testing specific problematic link...');
    const problematicLink = {
      url: '/architecture/api-design/',
      type: 'specific',
      source: 'user_reported'
    };
    
    const problematicResult = await testLink(page, problematicLink, BASE_URL);
    AUDIT_RESULTS.crashingLinks.push(problematicResult);
    
    // Generate comprehensive report
    const reportPath = path.join(__dirname, 'comprehensive-link-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(AUDIT_RESULTS, null, 2));
    
    console.log('\n📊 COMPREHENSIVE AUDIT SUMMARY');
    console.log('================================');
    console.log(`Total Links Tested: ${AUDIT_RESULTS.totalLinks}`);
    console.log(`Working Links: ${AUDIT_RESULTS.summary.working}`);
    console.log(`Broken Links: ${AUDIT_RESULTS.summary.broken}`);
    console.log(`Crashing Links: ${AUDIT_RESULTS.summary.crashing}`);
    console.log(`External Links: ${AUDIT_RESULTS.summary.external}`);
    
    if (AUDIT_RESULTS.brokenLinks.length > 0) {
      console.log('\n❌ BROKEN LINKS:');
      AUDIT_RESULTS.brokenLinks.forEach(link => {
        console.log(`  - ${link.url} (${link.source}) - ${link.error}`);
      });
    }
    
    if (AUDIT_RESULTS.crashingLinks.length > 0) {
      console.log('\n💥 CRASHING LINKS:');
      AUDIT_RESULTS.crashingLinks.forEach(link => {
        console.log(`  - ${link.url} (${link.source}) - ${link.error}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the audit
if (require.main === module) {
  runComprehensiveAudit().catch(console.error);
}

module.exports = { runComprehensiveAudit };