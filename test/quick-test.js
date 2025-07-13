const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Go directly to the page first to check if it loads
    console.log('Testing page accessibility...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'domcontentloaded', timeout: 5000 });
    
    const title = await page.title();
    const url = page.url();
    
    console.log('Page Title:', title);
    console.log('Final URL:', url);
    console.log('Status: Page', url.includes('/admin/tenants') ? 'LOADED CORRECTLY' : 'REDIRECTED');
    
    if (url.includes('/auth/signin')) {
      console.log('\n⚠️  Page redirects to login - authentication required');
      console.log('   This is why enhanced search components are not visible');
      console.log('   The TenantsClientPage only renders after successful authentication');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();