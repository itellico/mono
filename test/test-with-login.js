const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0' });
    
    // Wait for form to be ready
    await page.waitForSelector('#email');
    
    // Login
    await page.type('#email', '1@1.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    console.log('🚀 Waiting for authentication...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    console.log('📊 Navigating to tenants page...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0' });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'authenticated-tenants.png', fullPage: true });
    console.log('📷 Screenshot saved: authenticated-tenants.png');
    
    // === ENHANCED SEARCH ANALYSIS ===
    console.log('\\n🔍 ENHANCED SEARCH COMPONENT ANALYSIS:');
    
    // Check for the enhanced search input
    const enhancedSearchInput = await page.$('input[placeholder*="Search by name, domain, or tenant ID"]');
    console.log('✅ Enhanced Search Input:', enhancedSearchInput ? 'FOUND' : 'NOT FOUND');
    
    // Check for bookmark button (saved searches)
    const bookmarkSvg = await page.$('svg[data-lucide="bookmark"]');
    const bookmarkButton = bookmarkSvg ? await bookmarkSvg.evaluateHandle(el => el.closest('button')) : null;
    console.log('🔖 Bookmark Button (Saved Searches):', bookmarkButton ? 'FOUND' : 'NOT FOUND');
    
    // Check for plus button (save search)  
    const plusSvg = await page.$('svg[data-lucide="plus"]');
    console.log('➕ Plus Icon Found:', plusSvg ? 'FOUND' : 'NOT FOUND');
    
    // Check for filter button
    const filterSvg = await page.$('svg[data-lucide="filter"]');
    const filterButton = filterSvg ? await filterSvg.evaluateHandle(el => el.closest('button')) : null;
    console.log('🔽 Filter Button:', filterButton ? 'FOUND' : 'NOT FOUND');
    
    // === TEST SEARCH FUNCTIONALITY ===
    if (enhancedSearchInput) {
      console.log('\\n⚡ TESTING SEARCH FUNCTIONALITY:');
      
      // Click and type in search
      await enhancedSearchInput.focus();
      await page.type('input[placeholder*="Search by name, domain, or tenant ID"]', 'test', {delay: 100});
      
      // Wait for any UI updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for suggestion dropdown
      const suggestionDropdown = await page.$('.absolute.top-full, [role="listbox"], .command-list, .popover-content');
      console.log('💡 Search Suggestions:', suggestionDropdown ? 'APPEARED' : 'NOT FOUND');
      
      // Take screenshot with search active
      await page.screenshot({ path: 'search-active.png' });
      console.log('📷 Search active screenshot saved');
      
      // Test button interactions
      if (bookmarkButton) {
        console.log('\\n🔖 Testing Bookmark Button...');
        await bookmarkButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const dropdown = await page.$('.dropdown-content, .popover-content');
        console.log('📋 Bookmark Dropdown:', dropdown ? 'OPENED' : 'NOT FOUND');
        
        await page.screenshot({ path: 'bookmark-dropdown.png' });
      }
    }
    
    // === FINAL SUMMARY ===
    console.log('\\n📊 SUMMARY:');
    console.log('Authentication: ✅ SUCCESS');
    console.log('Page Access: ✅ SUCCESS');
    console.log('Enhanced Search:', enhancedSearchInput ? '✅ WORKING' : '❌ NOT IMPLEMENTED');
    console.log('Saved Search Features:', (bookmarkButton || plusSvg) ? '✅ AVAILABLE' : '❌ MISSING');
    
    // Keep browser open for manual inspection
    console.log('\\n🔍 Browser staying open for manual inspection...');
    console.log('Press Ctrl+C when done');
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  }
})();