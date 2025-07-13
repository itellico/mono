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
    
    console.log('🔍 Analyzing Save/Load Components...');
    
    const analysis = await page.evaluate(() => {
      // Look for any elements with save/load functionality
      const bookmarkIcons = document.querySelectorAll('svg[data-lucide="bookmark"]');
      const bookmarkButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.innerHTML.includes('bookmark') || 
        btn.textContent.includes('Save') || 
        btn.textContent.includes('Saved')
      );
      
      // Look for LoadSavedSearchDropdown specifically
      const savedSearchButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Saved Searches')
      );
      
      // Check for columns buttons
      const columnsButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Columns')
      );
      
      // Check for filters
      const filterButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Filters')
      );
      
      // Get all buttons with their text
      const allButtons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        classes: btn.className,
        hasBookmark: btn.innerHTML.includes('bookmark'),
        hasFilter: btn.innerHTML.includes('filter'),
        hasColumns: btn.innerHTML.includes('settings-2')
      }));
      
      return {
        bookmarkIconsCount: bookmarkIcons.length,
        bookmarkButtonsCount: bookmarkButtons.length,
        savedSearchButtonsCount: savedSearchButtons.length,
        columnsButtonsCount: columnsButtons.length,
        filterButtonsCount: filterButtons.length,
        allButtons: allButtons.filter(btn => btn.text.length > 0)
      };
    });
    
    console.log('\n🎯 SAVE/LOAD VISIBILITY ANALYSIS:');
    console.log('🔖 Bookmark Icons Found:', analysis.bookmarkIconsCount);
    console.log('💾 Save/Bookmark Buttons:', analysis.bookmarkButtonsCount);
    console.log('📂 Saved Search Buttons:', analysis.savedSearchButtonsCount);
    console.log('📊 Columns Buttons:', analysis.columnsButtonsCount);
    console.log('🔽 Filter Buttons:', analysis.filterButtonsCount);
    
    console.log('\n📋 ALL BUTTONS FOUND:');
    analysis.allButtons.forEach((btn, idx) => {
      console.log(`${idx + 1}. "${btn.text}" - Bookmark: ${btn.hasBookmark}, Filter: ${btn.hasFilter}, Columns: ${btn.hasColumns}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'save-load-visibility.png', fullPage: true });
    console.log('\n📷 Screenshot saved: save-load-visibility.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'save-load-error.png' });
  } finally {
    await browser.close();
  }
})();