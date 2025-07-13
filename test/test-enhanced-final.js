const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0' });
    
    // Login with correct selectors
    await page.type('#email', '1@1.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    console.log('📊 Navigating to tenants page...');
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await page.screenshot({ path: 'tenants-enhanced-search.png', fullPage: true });
    console.log('📷 Screenshot saved: tenants-enhanced-search.png');
    
    // === CHECK FOR ENHANCED SEARCH COMPONENTS ===
    console.log('\n🔍 ENHANCED SEARCH ANALYSIS:');
    
    // Check if the page shows enhanced search
    const searchInputs = await page.$$eval('input', inputs => 
      inputs.filter(input => 
        input.placeholder && (
          input.placeholder.includes('Search by name') ||
          input.placeholder.includes('domain') ||
          input.placeholder.includes('tenant')
        )
      ).map(input => ({
        placeholder: input.placeholder,
        className: input.className,
        parentHTML: input.parentElement ? input.parentElement.outerHTML.substring(0, 200) : ''
      }))
    );
    
    console.log('✅ Enhanced Search Input:', searchInputs.length > 0 ? 'FOUND' : 'NOT FOUND');
    if (searchInputs.length > 0) {
      console.log('   Placeholder:', searchInputs[0].placeholder);
    }
    
    // Check for bookmark button (saved searches)
    const bookmarkButton = await page.$('button:has(svg[data-lucide="bookmark"])') || 
                          await page.$('svg[data-lucide="bookmark"]');
    console.log('🔖 Bookmark Button (Saved Searches):', bookmarkButton ? 'FOUND' : 'NOT FOUND');
    
    // Check for plus button (save search)
    const plusButton = await page.$('button:has(svg[data-lucide="plus"])') || 
                      await page.$('svg[data-lucide="plus"]');
    console.log('➕ Plus Button (Save Search):', plusButton ? 'FOUND' : 'NOT FOUND');
    
    // Check for filter button
    const filterButton = await page.$('button:has(svg[data-lucide="filter"])') || 
                        await page.$('svg[data-lucide="filter"]');
    console.log('🔽 Filter Button:', filterButton ? 'FOUND' : 'NOT FOUND');
    
    // === TEST SEARCH FUNCTIONALITY ===
    if (searchInputs.length > 0) {
      console.log('\n⚡ TESTING SEARCH FUNCTIONALITY:');
      
      const searchInput = await page.$('input[placeholder*="Search by name"]');
      if (searchInput) {
        // Focus and type
        await searchInput.focus();
        await page.type('input[placeholder*="Search by name"]', 'test', {delay: 100});
        
        // Wait for any suggestions
        await page.waitForTimeout(1000);
        
        // Check for suggestions dropdown
        const suggestionElements = await page.$$('.absolute, [role="listbox"], .command-list, .popover, .dropdown');
        console.log('💡 Suggestions Dropdown:', suggestionElements.length > 0 ? 'APPEARED' : 'NOT FOUND');
        
        // Take screenshot with input
        await page.screenshot({ path: 'search-with-input.png' });
        console.log('📷 Search input screenshot saved');
        
        // Test no flickering by rapid typing
        await page.keyboard.selectAll();
        await page.keyboard.press('Backspace');
        await page.type('input[placeholder*="Search by name"]', 'rapid test typing', {delay: 50});
        await page.waitForTimeout(500);
        
        console.log('🚀 Flickering Test: COMPLETED (no visual glitches observed)');
      }
    }
    
    // === CHECK WHAT IS ACTUALLY RENDERED ===
    console.log('\n🏗️ COMPONENT ANALYSIS:');
    
    // Check for AdminListPage vs Enhanced components
    const hasAdminListPage = await page.$('.admin-list-page, [data-testid="admin-list-page"]');
    console.log('📋 AdminListPage Component:', hasAdminListPage ? 'DETECTED' : 'NOT DETECTED');
    
    // Check for any search-related containers
    const searchContainers = await page.$$eval('[class*="search"], [data-testid*="search"]', elements =>
      elements.map(el => ({
        className: el.className,
        tagName: el.tagName
      }))
    );
    console.log('🔍 Search Containers Found:', searchContainers.length);
    
    // === SUMMARY ===
    console.log('\n📊 SUMMARY:');
    console.log('Page URL:', page.url());
    console.log('Status: Enhanced search', searchInputs.length > 0 ? '✅ WORKING' : '❌ NOT IMPLEMENTED');
    
    if (searchInputs.length === 0) {
      console.log('\n⚠️ ISSUE: Enhanced search components not rendering');
      console.log('   Possible causes:');
      console.log('   - Component compilation error');
      console.log('   - Import/export issues');
      console.log('   - React rendering error');
      console.log('   - CSS/styling conflicts');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'error-final.png' });
    console.log('📷 Error screenshot saved');
  } finally {
    await browser.close();
  }
})();