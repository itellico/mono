const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to sign-in page...');
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Fill in login form with test credentials (from CLAUDE.md: 1@1.com / 123)
    console.log('Filling login form...');
    await page.type('input[name="email"], input[type="email"]', '1@1.com');
    await page.type('input[name="password"], input[type="password"]', '123');
    
    // Submit form
    const submitButton = await page.$('button[type="submit"], button:contains("Sign In")');
    if (submitButton) {
      await submitButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    }
    
    console.log('Navigating to tenants page...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'enhanced-search-initial.png', fullPage: true });
    console.log('Screenshot saved as enhanced-search-initial.png');
    
    // Check for enhanced search components with more specific selectors
    const searchInput = await page.$('input[placeholder*="Search"]');
    const allButtons = await page.$$('button');
    
    // Look for bookmark and plus icons
    let bookmarkButton = null;
    let plusButton = null;
    let filterButton = null;
    
    for (const button of allButtons) {
      const buttonHTML = await button.evaluate(el => el.innerHTML);
      if (buttonHTML.includes('bookmark') || buttonHTML.includes('Bookmark')) {
        bookmarkButton = button;
      }
      if (buttonHTML.includes('plus') || buttonHTML.includes('Plus')) {
        plusButton = button;
      }
      if (buttonHTML.includes('filter') || buttonHTML.includes('Filter')) {
        filterButton = button;
      }
    }
    
    console.log('\n=== Search Components Found ===');
    console.log('✓ Search Input:', searchInput ? 'YES' : 'NO');
    console.log('✓ Bookmark Button (Saved Searches):', bookmarkButton ? 'YES' : 'NO');
    console.log('✓ Plus Button (Save Search):', plusButton ? 'YES' : 'NO');
    console.log('✓ Filter Button:', filterButton ? 'YES' : 'NO');
    
    // Get all input elements for debugging
    const allInputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        name: input.name,
        id: input.id
      }))
    );
    
    console.log('\n=== All Input Elements ===');
    allInputs.forEach((input, i) => {
      console.log(`Input ${i+1}:`, input);
    });
    
    // Check for any search-related elements
    const searchElements = await page.$$eval('[class*="search"], [placeholder*="search"], [id*="search"]', elements => 
      elements.map(el => ({
        tagName: el.tagName,
        className: el.className,
        placeholder: el.placeholder,
        id: el.id
      }))
    );
    
    console.log('\n=== Search-related Elements ===');
    searchElements.forEach((el, i) => {
      console.log(`Element ${i+1}:`, el);
    });
    
    // Test search input if found
    if (searchInput) {
      console.log('\n=== Testing Search Input ===');
      await searchInput.click();
      await page.type('input[placeholder*="Search"]', 'test');
      await page.waitForTimeout(1000);
      
      // Take screenshot with text input
      await page.screenshot({ path: 'enhanced-search-with-input.png' });
      console.log('Screenshot with input saved');
      
      // Check for any dropdowns or suggestion elements
      const dropdowns = await page.$$('[role="listbox"], .dropdown, [class*="suggest"], [class*="command"]');
      console.log('✓ Dropdown/Suggestion elements found:', dropdowns.length);
    }
    
    console.log('\n=== Page Info ===');
    console.log('Page Title:', await page.title());
    console.log('Page URL:', page.url());
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    // Take error screenshot
    await page.screenshot({ path: 'enhanced-search-error.png' });
    console.log('Error screenshot saved as enhanced-search-error.png');
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
})();