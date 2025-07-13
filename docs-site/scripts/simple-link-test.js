const http = require('http');

const testLinks = [
  'http://localhost:3005/docs/platform/',
  'http://localhost:3005/docs/tenant/',
  'http://localhost:3005/docs/account/',
  'http://localhost:3005/docs/user/',
  'http://localhost:3005/docs/public/',
  'http://localhost:3005/docs/architecture/',
  'http://localhost:3005/docs/development/',
  'http://localhost:3005/docs/reference/',
  'http://localhost:3005/docs/architecture/security/authentication',
  'http://localhost:3005/docs/development/deployment/docker/',
  'http://localhost:3005/api/README.md',
  'http://localhost:3005/docs/api/',
  'http://localhost:3005/docs/api-endpoints-5-tier'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentLength: data.length,
          hasDocusaurus: data.includes('docusaurus'),
          working: res.statusCode === 200 && data.length > 1000
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        contentLength: 0,
        hasDocusaurus: false,
        working: false,
        error: err.message
      });
    });
    
    req.setTimeout(3000, () => {
      req.abort();
      resolve({
        url,
        status: 'TIMEOUT',
        contentLength: 0,
        hasDocusaurus: false,
        working: false,
        error: 'Timeout'
      });
    });
  });
}

async function testAllLinks() {
  console.log('🔍 SIMPLE LINK TEST...\n');
  
  for (const url of testLinks) {
    const result = await testUrl(url);
    const status = result.working ? '✅ WORKING' : '❌ BROKEN';
    const details = `(${result.status}, ${result.contentLength} bytes, docusaurus: ${result.hasDocusaurus})`;
    console.log(`${status} ${url} ${details}`);
  }
}

testAllLinks().catch(console.error);