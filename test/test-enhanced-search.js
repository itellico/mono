const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to tenants page...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'enhanced-search-initial.png', fullPage: true });
    console.log('Screenshot saved as enhanced-search-initial.png');
    
    // Check for enhanced search components
    const searchInput = await page.$('input[placeholder*="Search by name"]');
    const bookmarkButton = await page.$('button svg[data-lucide="bookmark"]');
    const plusButton = await page.$('button svg[data-lucide="plus"]');
    const filterButton = await page.$('button svg[data-lucide="filter"]');
    
    console.log('\n=== Search Components Found ===');
    console.log('✓ Search Input:', searchInput ? 'YES' : 'NO');
    console.log('✓ Bookmark Button (Saved Searches):', bookmarkButton ? 'YES' : 'NO');
    console.log('✓ Plus Button (Save Search):', plusButton ? 'YES' : 'NO');
    console.log('✓ Filter Button:', filterButton ? 'YES' : 'NO');
    
    // Test search input interaction
    if (searchInput) {
      console.log('\n=== Testing Search Input ===');
      await searchInput.click();
      await page.type('input[placeholder*="Search by name"]', 'test');
      await page.waitForTimeout(1000);
      
      // Take screenshot with text input
      await page.screenshot({ path: 'enhanced-search-with-input.png' });
      console.log('Screenshot with input saved as enhanced-search-with-input.png');
      
      // Check for suggestions dropdown
      const suggestionsDropdown = await page.$('.absolute.top-full, [role="listbox"], .command-list');
      console.log('✓ Search Suggestions Dropdown:', suggestionsDropdown ? 'YES' : 'NO');
      
      if (suggestionsDropdown) {
        await page.screenshot({ path: 'enhanced-search-suggestions.png' });
        console.log('Suggestions screenshot saved as enhanced-search-suggestions.png');
      }
    }
    
    // Test bookmark button if exists
    if (bookmarkButton) {
      console.log('\n=== Testing Bookmark Button ===');
      const bookmarkButtonParent = await page.$('button:has(svg[data-lucide="bookmark"])');
      if (bookmarkButtonParent) {
        await bookmarkButtonParent.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'enhanced-search-bookmark-clicked.png' });
        console.log('Bookmark dropdown screenshot saved');
      }
    }
    
    // Check browser console for errors
    const logs = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      return errors;
    });
    
    console.log('\n=== Page Info ===');
    console.log('Page Title:', await page.title());
    console.log('Page URL:', page.url());
    
    if (logs.length > 0) {
      console.log('\n=== Console Errors ===');
      logs.forEach(log => console.log('ERROR:', log));
    } else {
      console.log('\n✓ No console errors detected');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✓ Browser closed');
  }
})();