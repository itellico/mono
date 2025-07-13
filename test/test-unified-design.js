const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.type('#email', '1@1.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log('📊 Loading tenants page...');
    await page.goto('http://localhost:3000/admin/tenants', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'unified-design-test.png', fullPage: true });
    console.log('📷 Screenshot saved: unified-design-test.png');
    
    // Check for elements
    const analysis = await page.evaluate(() => {
      // Count search inputs
      const searchInputs = document.querySelectorAll('input[placeholder*="Search"]');
      
      // Check for buttons
      const bookmarkButtons = document.querySelectorAll('svg[data-lucide="bookmark"]');
      const plusButtons = document.querySelectorAll('svg[data-lucide="plus"]');
      const filterButtons = document.querySelectorAll('svg[data-lucide="filter"]');
      const settingsButtons = document.querySelectorAll('svg[data-lucide="settings-2"]');
      
      // Check for duplicates
      const filtersText = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('Filters')
      );
      
      return {
        searchInputsCount: searchInputs.length,
        bookmarkButtons: bookmarkButtons.length,
        plusButtons: plusButtons.length,
        filterButtons: filterButtons.length,
        settingsButtons: settingsButtons.length,
        filtersTextCount: filtersText.length,
        pageTitle: document.title
      };
    });
    
    console.log('\\n🎯 UNIFIED DESIGN ANALYSIS:');
    console.log('📝 Search Inputs Found:', analysis.searchInputsCount);
    console.log('🔖 Bookmark Buttons:', analysis.bookmarkButtons);
    console.log('➕ Plus Buttons:', analysis.plusButtons);
    console.log('🔽 Filter Buttons:', analysis.filterButtons);
    console.log('⚙️  Settings Buttons:', analysis.settingsButtons);
    console.log('📊 "Filters" Text Count:', analysis.filtersTextCount);
    
    // Test save functionality
    if (analysis.searchInputsCount === 1) {
      console.log('\\n⚡ Testing Save Functionality...');
      
      // Type in search
      const searchInput = await page.$('input[placeholder*="Search"]');
      await searchInput.focus();
      await page.type('input[placeholder*="Search"]', 'test search');
      
      // Wait and check if save button appears
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const saveButtonAppeared = await page.evaluate(() => {
        const plusButtons = document.querySelectorAll('button:has(svg[data-lucide="plus"])');
        return Array.from(plusButtons).some(btn => 
          btn.textContent && btn.textContent.includes('Save')
        );
      });
      
      console.log('💾 Save Button Appears:', saveButtonAppeared ? 'YES' : 'NO');
      
      // Take screenshot with content
      await page.screenshot({ path: 'unified-design-with-content.png' });
    }
    
    console.log('\\n📊 SUMMARY:');
    if (analysis.searchInputsCount === 1) {
      console.log('✅ SUCCESS: Only ONE search input (no duplications)');
    } else {
      console.log(`❌ ISSUE: ${analysis.searchInputsCount} search inputs found (duplications still exist)`);
    }
    
    if (analysis.bookmarkButtons > 0 || analysis.plusButtons > 0) {
      console.log('✅ SUCCESS: Save/Load functionality is visible');
    } else {
      console.log('⚠️  NOTE: Save/Load buttons may need content or permissions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'unified-design-error.png' });
  } finally {
    await browser.close();
  }
})();