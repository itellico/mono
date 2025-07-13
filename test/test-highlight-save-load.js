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
    
    console.log('🔍 Highlighting Save/Load Components...');
    
    // Inject CSS to highlight save/load elements
    await page.evaluate(() => {
      // Find all buttons with save/load functionality
      const savedSearchButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.includes('Saved Searches')
      );
      
      const saveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent.trim() === 'Save'
      );
      
      // Highlight saved search buttons in green
      savedSearchButtons.forEach(btn => {
        btn.style.border = '3px solid #00FF00';
        btn.style.boxShadow = '0 0 10px #00FF00';
        btn.style.backgroundColor = '#E6FFE6';
        
        // Add label above button
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '0';
        label.style.background = '#00FF00';
        label.style.color = 'black';
        label.style.padding = '2px 8px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.whiteSpace = 'nowrap';
        label.style.zIndex = '9999';
        label.textContent = 'LOAD SAVED SEARCHES HERE';
        
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
      });
      
      // Highlight save buttons in blue
      saveButtons.forEach(btn => {
        btn.style.border = '3px solid #0066FF';
        btn.style.boxShadow = '0 0 10px #0066FF';
        btn.style.backgroundColor = '#E6F0FF';
        
        // Add label above button
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '0';
        label.style.background = '#0066FF';
        label.style.color = 'white';
        label.style.padding = '2px 8px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.whiteSpace = 'nowrap';
        label.style.zIndex = '9999';
        label.textContent = 'SAVE SEARCH HERE';
        
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        btn.parentNode.insertBefore(wrapper, btn);
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
      });
      
      // Find the data table card and highlight it
      const dataTableCard = Array.from(document.querySelectorAll('.rounded-lg.border, [class*="card"]'))
        .find(card => card.querySelector('table') || card.querySelector('[role="grid"]'));
      
      if (dataTableCard) {
        dataTableCard.style.border = '3px solid #FF00FF';
        dataTableCard.style.boxShadow = '0 0 20px #FF00FF';
      }
      
      return {
        savedSearchButtonsCount: savedSearchButtons.length,
        saveButtonsCount: saveButtons.length,
        foundDataTable: !!dataTableCard
      };
    });
    
    console.log('\n✅ Elements Highlighted!');
    console.log('  - Saved Search buttons: GREEN border + label');
    console.log('  - Save buttons: BLUE border + label');
    console.log('  - Data Table Card: PURPLE border');
    
    // Take screenshot
    await page.screenshot({ path: 'highlighted-save-load.png', fullPage: true });
    console.log('\n📷 Screenshot saved: highlighted-save-load.png');
    console.log('📍 Check the screenshot to see the exact location of save/load functionality!');
    
    // Test clicking on saved searches
    console.log('\n🔍 Testing Saved Searches dropdown...');
    const savedSearchClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Saved Searches')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (savedSearchClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'saved-searches-open.png' });
      console.log('📷 Saved searches dropdown screenshot: saved-searches-open.png');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'highlight-error.png' });
  } finally {
    await browser.close();
  }
})();