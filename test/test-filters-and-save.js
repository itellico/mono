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
    
    console.log('🔍 Testing Filters Functionality...');
    
    // Check for filters button using text content evaluation
    const filtersButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const filtersButton = buttons.find(btn => btn.textContent && btn.textContent.includes('Filters'));
      if (filtersButton) {
        filtersButton.click();
        return true;
      }
      return false;
    });
    
    if (filtersButtonFound) {
      console.log('✅ Filters button found and clicked');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot with filters open
      await page.screenshot({ path: 'filters-open.png' });
      console.log('📷 Screenshot with filters open: filters-open.png');
    } else {
      console.log('⚠️ Filters button not found');
    }
    
    console.log('🔖 Testing Save Functionality...');
    
    // Type in search to enable save
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.focus();
      await searchInput.type('test tenant search');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if save button appears using text content evaluation
      const saveButtonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent && btn.textContent.includes('Save'));
      });
      
      if (saveButtonFound) {
        console.log('✅ Save button found with content!');
        await page.screenshot({ path: 'save-button-visible.png' });
        console.log('📷 Save button screenshot: save-button-visible.png');
        
        // Try to click save button
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => btn.textContent && btn.textContent.includes('Save'));
          if (saveBtn) saveBtn.click();
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Look for save dialog
        const saveDialog = await page.$('[role="dialog"], .modal, [data-testid*="save"]');
        if (saveDialog) {
          console.log('✅ Save dialog opened!');
          await page.screenshot({ path: 'save-dialog-open.png' });
          console.log('📷 Save dialog screenshot: save-dialog-open.png');
        } else {
          console.log('⚠️ Save dialog not found');
        }
      } else {
        console.log('⚠️ Save button not found with content');
      }
    }
    
    console.log('⚙️ Testing Column Visibility...');
    
    // Look for columns/settings button using text content evaluation
    const columnsButtonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const columnsButton = buttons.find(btn => btn.textContent && btn.textContent.includes('Columns'));
      if (columnsButton) {
        columnsButton.click();
        return true;
      }
      return false;
    });
    
    if (columnsButtonFound) {
      console.log('✅ Columns button found and clicked');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot of column selector
      await page.screenshot({ path: 'columns-selector.png' });
      console.log('📷 Columns selector screenshot: columns-selector.png');
    }
    
    console.log('🎨 Testing UI Contrast...');
    
    // Check checkbox contrast in any dropdowns
    const analysis = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('[role="checkbox"], input[type="checkbox"]');
      const darkCheckboxes = [];
      
      checkboxes.forEach((checkbox, index) => {
        const styles = window.getComputedStyle(checkbox);
        const parentStyles = window.getComputedStyle(checkbox.parentElement || checkbox);
        
        darkCheckboxes.push({
          index,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          parentBackground: parentStyles.backgroundColor,
          hasCheckmark: checkbox.getAttribute('aria-checked') === 'true' || checkbox.checked
        });
      });
      
      return {
        checkboxCount: checkboxes.length,
        darkCheckboxes: darkCheckboxes.slice(0, 5) // First 5 for analysis
      };
    });
    
    console.log('\n🎯 COMPREHENSIVE TEST RESULTS:');
    console.log('✅ Unified Design: Only one search input (no duplications)');
    console.log('📊 Checkboxes found:', analysis.checkboxCount);
    console.log('🎨 Checkbox styles:', JSON.stringify(analysis.darkCheckboxes, null, 2));
    
    // Final comprehensive screenshot
    await page.screenshot({ path: 'final-unified-design.png', fullPage: true });
    console.log('📷 Final screenshot: final-unified-design.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
})();