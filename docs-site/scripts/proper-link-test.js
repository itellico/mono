const http = require('http');
const { execSync } = require('child_process');

// Test specific links with proper content checking
const testLinks = [
  'http://localhost:3005/api/README.md',
  'http://localhost:3005/docs/development/deployment/docker/',
  'http://localhost:3005/docs/architecture/security/authentication',
  'http://localhost:3005/docs/platform/',
  'http://localhost:3005/docs/tenant/',
  'http://localhost:3005/docs/account/',
  'http://localhost:3005/docs/user/',
  'http://localhost:3005/docs/public/',
  'http://localhost:3005/docs/architecture/',
  'http://localhost:3005/docs/development/',
  'http://localhost:3005/docs/reference/'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Check for actual page not found content
        const hasPageNotFound = data.includes('Page Not Found') || 
                               data.includes('could not find what you were looking for') ||
                               data.includes('404');
        
        // Check if it's a valid docusaurus page
        const isDocusaurusPage = data.includes('docusaurus') && data.includes('<!DOCTYPE html>');
        
        // Check if it has actual content (not just empty page)
        const hasContent = data.length > 2000; // Reasonable threshold
        
        resolve({
          url,
          statusCode: res.statusCode,
          hasPageNotFound,
          isDocusaurusPage,
          hasContent,
          contentLength: data.length,
          working: res.statusCode === 200 && !hasPageNotFound && isDocusaurusPage
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        statusCode: 'ERROR',
        hasPageNotFound: false,
        isDocusaurusPage: false,
        hasContent: false,
        contentLength: 0,
        working: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        url,
        statusCode: 'TIMEOUT',
        hasPageNotFound: false,
        isDocusaurusPage: false,
        hasContent: false,
        contentLength: 0,
        working: false,
        error: 'Timeout'
      });
    });
  });
}

async function testAllLinks() {
  console.log('🔍 TESTING SPECIFIC LINKS...\n');
  
  const results = [];
  
  for (const url of testLinks) {
    const result = await testUrl(url);
    results.push(result);
    
    const status = result.working ? '✅ WORKING' : '❌ BROKEN';
    const details = result.working ? 
      `(${result.contentLength} bytes)` : 
      `(Status: ${result.statusCode}, PageNotFound: ${result.hasPageNotFound}, Content: ${result.contentLength} bytes)`;
    
    console.log(`${status} ${result.url} ${details}`);
  }
  
  // Summary
  const working = results.filter(r => r.working).length;
  const broken = results.filter(r => !r.working).length;
  
  console.log(`\n📊 RESULTS:`);
  console.log(`✅ Working: ${working}/${results.length}`);
  console.log(`❌ Broken: ${broken}/${results.length}`);
  console.log(`📈 Success Rate: ${(working/results.length*100).toFixed(1)}%`);
  
  // Show broken details
  const brokenLinks = results.filter(r => !r.working);
  if (brokenLinks.length > 0) {
    console.log(`\n❌ BROKEN LINKS:`);
    brokenLinks.forEach(link => {
      console.log(`   ${link.url} - Status: ${link.statusCode}, Content: ${link.contentLength} bytes`);
    });
  }
}

testAllLinks().catch(console.error);