const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to sign-in page...');
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Fill and submit login form
    console.log('Logging in...');
    await page.type('input[name="email"]', '1@1.com');
    await page.type('input[name="password"]', '123');
    
    // Click the Sign in button
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    console.log('Navigating to tenants page...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Take full page screenshot
    await page.screenshot({ path: 'tenants-page-full.png', fullPage: true });
    console.log('Full page screenshot saved as tenants-page-full.png');
    
    // Get page HTML for analysis
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    
    // Check if EnhancedSearchBar is in the HTML
    const hasEnhancedSearch = bodyHTML.includes('EnhancedSearchBar') || bodyHTML.includes('enhanced-search');
    console.log('EnhancedSearchBar component detected:', hasEnhancedSearch ? 'YES' : 'NO');
    
    // Look for search inputs
    const searchInputs = await page.$$eval('input', inputs => 
      inputs.filter(input => 
        input.placeholder && input.placeholder.toLowerCase().includes('search')
      ).map(input => ({
        placeholder: input.placeholder,
        type: input.type,
        className: input.className
      }))
    );
    
    console.log('\nSearch inputs found:', searchInputs.length);
    searchInputs.forEach((input, i) => {
      console.log(`  ${i+1}. Placeholder: "${input.placeholder}"`);
      console.log(`     Class: "${input.className}"`);
    });
    
    // Check for specific buttons with icons
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent.trim(),
        innerHTML: btn.innerHTML.includes('svg') ? 'HAS_SVG' : 'NO_SVG',
        className: btn.className
      })).filter(btn => 
        btn.text.toLowerCase().includes('save') || 
        btn.text.toLowerCase().includes('filter') ||
        btn.innerHTML.includes('HAS_SVG')
      )
    );
    
    console.log('\nRelevant buttons found:', buttons.length);
    buttons.forEach((btn, i) => {
      console.log(`  ${i+1}. Text: "${btn.text}" | SVG: ${btn.innerHTML}`);
    });
    
    // Check for errors in console
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    if (consoleMessages.length > 0) {
      console.log('\nConsole errors:');
      consoleMessages.forEach(msg => console.log('  ERROR:', msg));
    }
    
    console.log('\nPage URL:', page.url());
    console.log('Page Title:', await page.title());
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();