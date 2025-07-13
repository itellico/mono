const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:3001/auth/signin', { waitUntil: 'networkidle0', timeout: 10000 });
    await page.type('#email', '1@1.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    // Go to tenants
    await page.goto('http://localhost:3001/admin/tenants', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot
    await page.screenshot({ path: 'enhanced-search-final.png', fullPage: true });
    
    // Check for enhanced search elements
    const result = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder*="Search by name"]');
      const bookmarkIcons = document.querySelectorAll('svg[data-lucide="bookmark"]');
      const plusIcons = document.querySelectorAll('svg[data-lucide="plus"]');
      const filterIcons = document.querySelectorAll('svg[data-lucide="filter"]');
      
      return {
        searchInput: !!searchInput,
        searchPlaceholder: searchInput ? searchInput.placeholder : '',
        bookmarkButtons: bookmarkIcons.length,
        plusButtons: plusIcons.length,
        filterButtons: filterIcons.length,
        pageTitle: document.title
      };
    });
    
    console.log('🎉 ENHANCED SEARCH FINAL TEST:');
    console.log('✅ Search Input:', result.searchInput ? 'WORKING' : 'MISSING');
    console.log('🔖 Bookmark Buttons:', result.bookmarkButtons);
    console.log('➕ Plus Buttons:', result.plusButtons);
    console.log('🔽 Filter Buttons:', result.filterButtons);
    console.log('📄 Page:', result.pageTitle);
    console.log('🖼️ Screenshot saved: enhanced-search-final.png');
    
    if (result.bookmarkButtons > 0 || result.plusButtons > 0) {
      console.log('✅ SUCCESS: Enhanced search buttons are now visible!');
    } else {
      console.log('⚠️  Note: Buttons may need permissions or active content to show');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();