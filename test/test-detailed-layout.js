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
    
    console.log('🔍 Analyzing Layout Structure...');
    
    const layoutAnalysis = await page.evaluate(() => {
      // Find main content area
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
      
      // Find all cards
      const cards = Array.from(document.querySelectorAll('.rounded-lg.border, [class*="card"]'));
      
      // Analyze each card
      const cardAnalysis = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        const buttons = Array.from(card.querySelectorAll('button')).map(btn => btn.textContent.trim());
        const inputs = Array.from(card.querySelectorAll('input')).map(input => ({
          type: input.type,
          placeholder: input.placeholder
        }));
        
        // Check if this is the data table
        const hasTable = card.querySelector('table') !== null;
        const hasDataGrid = card.querySelector('[role="grid"]') !== null;
        
        return {
          index,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          buttons: buttons,
          inputs: inputs,
          hasTable: hasTable || hasDataGrid,
          className: card.className,
          isVisible: rect.width > 0 && rect.height > 0
        };
      });
      
      // Find elements outside cards
      const searchInputsOutsideCards = Array.from(document.querySelectorAll('input[type="search"], input[placeholder*="Search"]')).filter(input => {
        let parent = input.parentElement;
        while (parent) {
          if (parent.matches('.rounded-lg.border, [class*="card"]')) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      });
      
      const buttonsOutsideCards = Array.from(document.querySelectorAll('button')).filter(button => {
        let parent = button.parentElement;
        while (parent) {
          if (parent.matches('.rounded-lg.border, [class*="card"]')) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      }).map(btn => btn.textContent.trim());
      
      return {
        totalCards: cards.length,
        visibleCards: cardAnalysis.filter(c => c.isVisible),
        dataTableCard: cardAnalysis.find(c => c.hasTable),
        searchInputsOutside: searchInputsOutsideCards.length,
        buttonsOutside: buttonsOutsideCards
      };
    });
    
    console.log('\n🎯 LAYOUT STRUCTURE ANALYSIS:');
    console.log('📦 Total Cards:', layoutAnalysis.totalCards);
    console.log('👁️ Visible Cards:', layoutAnalysis.visibleCards.length);
    
    console.log('\n📊 DATA TABLE CARD:');
    if (layoutAnalysis.dataTableCard) {
      console.log('  - Width:', layoutAnalysis.dataTableCard.width);
      console.log('  - Height:', layoutAnalysis.dataTableCard.height);
      console.log('  - Buttons:', layoutAnalysis.dataTableCard.buttons);
      console.log('  - Inputs:', layoutAnalysis.dataTableCard.inputs);
    } else {
      console.log('  ❌ No data table card found');
    }
    
    console.log('\n🔍 ELEMENTS OUTSIDE CARDS:');
    console.log('  - Search Inputs Outside:', layoutAnalysis.searchInputsOutside);
    console.log('  - Buttons Outside:', layoutAnalysis.buttonsOutside.length);
    if (layoutAnalysis.buttonsOutside.length > 0) {
      console.log('  - Button List:', layoutAnalysis.buttonsOutside.slice(0, 10).join(', '));
    }
    
    console.log('\n📋 ALL CARDS:');
    layoutAnalysis.visibleCards.forEach((card, idx) => {
      console.log(`\n  Card ${idx + 1}:`);
      console.log(`    - Size: ${card.width}x${card.height}`);
      console.log(`    - Has Table: ${card.hasTable}`);
      console.log(`    - Buttons: ${card.buttons.join(', ') || 'none'}`);
    });
    
    // Take screenshot
    await page.screenshot({ path: 'detailed-layout.png', fullPage: true });
    console.log('\n📷 Screenshot saved: detailed-layout.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'layout-error.png' });
  } finally {
    await browser.close();
  }
})();