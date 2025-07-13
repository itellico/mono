/**
 * Focused Link Audit - Testing key links efficiently
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3005';
const TIMEOUT = 10000;

// Key links to test systematically
const KEY_LINKS = [
  // Navigation links
  { url: '/dev-environment', type: 'navigation', description: 'Dev Environment' },
  { url: '/claude-instructions', type: 'navigation', description: 'AI Instructions' },
  { url: 'http://localhost:3001/docs', type: 'navigation', description: 'API Reference', external: true },
  { url: 'http://localhost:3000', type: 'navigation', description: 'Main App', external: true },
  { url: 'http://localhost:4040/kanboard/?controller=BoardViewController&action=show&project_id=1', type: 'navigation', description: 'Kanboard', external: true },
  { url: 'https://github.com/itellico/mono', type: 'navigation', description: 'GitHub', external: true },
  
  // Footer 5-tier links
  { url: '/platform/', type: 'footer', description: 'Platform Tier' },
  { url: '/tenant/', type: 'footer', description: 'Tenant Tier' },
  { url: '/account/', type: 'footer', description: 'Account Tier' },
  { url: '/user/', type: 'footer', description: 'User Tier' },
  { url: '/public/', type: 'footer', description: 'Public Tier' },
  
  // Footer documentation links
  { url: '/architecture/', type: 'footer', description: 'Architecture' },
  { url: '/development/', type: 'footer', description: 'Development' },
  { url: '/reference/', type: 'footer', description: 'Quick Reference' },
  
  // Problematic links
  { url: '/architecture/api-design/', type: 'problematic', description: 'API Design (Known to crash)' },
  
  // Service links
  { url: 'http://localhost:3000', type: 'service', description: 'Main App', external: true },
  { url: 'http://localhost:3001/docs', type: 'service', description: 'API Docs', external: true },
  { url: 'http://localhost:5005', type: 'service', description: 'Monitoring', external: true },
];

// Test a single link efficiently
async function testLink(page, linkInfo) {
  const result = {
    ...linkInfo,
    status: 'unknown',
    error: null,
    responseCode: null,
    loadTime: null,
    screenshot: null
  };
  
  try {
    const startTime = Date.now();
    let fullUrl = linkInfo.url;
    
    if (!linkInfo.external && !linkInfo.url.startsWith('http')) {
      fullUrl = BASE_URL + linkInfo.url;
    }
    
    console.log(`Testing: ${linkInfo.description} (${fullUrl})`);
    
    const response = await page.goto(fullUrl, {
      waitUntil: 'networkidle0',
      timeout: TIMEOUT
    });
    
    result.loadTime = Date.now() - startTime;
    result.responseCode = response.status();
    result.fullUrl = fullUrl;
    
    if (response.ok()) {
      // Check for crash indicators
      const pageContent = await page.content();
      const title = await page.title();
      
      if (title.includes('crashed') || pageContent.includes('This page crashed') || pageContent.includes('id is not defined')) {
        result.status = 'crashing';
        result.error = 'Page crashed with JavaScript error';
        result.screenshot = `crash_${linkInfo.url.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      } else if (pageContent.includes('404') || title.includes('Not Found')) {
        result.status = 'not_found';
        result.error = 'Page not found';
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
    
    if (error.message.includes('timeout')) {
      result.status = 'timeout';
    } else if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      result.status = 'connection_refused';
    }
  }
  
  return result;
}

async function runFocusedAudit() {
  console.log('🎯 Starting Focused Link Audit...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  const results = {
    working: [],
    broken: [],
    crashing: [],
    timeout: [],
    connection_refused: [],
    summary: {
      total: KEY_LINKS.length,
      working: 0,
      broken: 0,
      crashing: 0,
      timeout: 0,
      connection_refused: 0
    }
  };
  
  for (const linkInfo of KEY_LINKS) {
    const result = await testLink(page, linkInfo);
    
    // Take screenshot if page crashed
    if (result.status === 'crashing') {
      try {
        await page.screenshot({ 
          path: `crash_screenshots/${result.screenshot}`,
          fullPage: true
        });
      } catch (e) {
        console.log('Failed to take screenshot:', e.message);
      }
    }
    
    results[result.status].push(result);
    results.summary[result.status]++;
    
    console.log(`  ${result.status.toUpperCase()}: ${result.description}${result.error ? ` (${result.error})` : ''}`);
  }
  
  await browser.close();
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results: results
  };
  
  fs.writeFileSync('focused-link-audit-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📊 FOCUSED AUDIT SUMMARY');
  console.log('========================');
  console.log(`Total Links Tested: ${results.summary.total}`);
  console.log(`Working Links: ${results.summary.working}`);
  console.log(`Broken Links: ${results.summary.broken}`);
  console.log(`Crashing Links: ${results.summary.crashing}`);
  console.log(`Timeout Links: ${results.summary.timeout}`);
  console.log(`Connection Refused: ${results.summary.connection_refused}`);
  
  if (results.crashing.length > 0) {
    console.log('\n💥 CRASHING LINKS:');
    results.crashing.forEach(link => {
      console.log(`  - ${link.description} (${link.fullUrl})`);
      console.log(`    Error: ${link.error}`);
    });
  }
  
  if (results.broken.length > 0) {
    console.log('\n❌ BROKEN LINKS:');
    results.broken.forEach(link => {
      console.log(`  - ${link.description} (${link.fullUrl})`);
      console.log(`    Error: ${link.error}`);
    });
  }
  
  if (results.connection_refused.length > 0) {
    console.log('\n🔌 CONNECTION REFUSED (Services not running):');
    results.connection_refused.forEach(link => {
      console.log(`  - ${link.description} (${link.fullUrl})`);
    });
  }
  
  console.log('\n📄 Detailed report saved to: focused-link-audit-report.json');
  
  return report;
}

if (require.main === module) {
  runFocusedAudit().catch(console.error);
}

module.exports = { runFocusedAudit };