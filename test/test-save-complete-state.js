const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.text().includes('SAVING SEARCH WITH COMPLETE STATE:')) {
      console.log('\n📾 CAPTURED SAVE DATA:');
      console.log(msg.text());
    }
  });
  
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
    
    console.log('🔧 Setting up test state...');
    
    // 1. Add search term
    console.log('  1️⃣ Adding search term...');
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.focus();
      await searchInput.type('test search');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 2. Click on a filter (e.g., Status)
    console.log('  2️⃣ Setting filter...');
    const statusFilterClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const statusBtn = buttons.find(btn => btn.textContent.trim() === 'Status');
      if (statusBtn) {
        statusBtn.click();
        return true;
      }
      return false;
    });
    
    if (statusFilterClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Select an option
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"]'));
        if (items.length > 0) {
          items[0].click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Hide a column
    console.log('  3️⃣ Hiding a column...');
    const columnsClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const columnsBtn = buttons.find(btn => btn.textContent.trim() === 'Columns');
      if (columnsBtn) {
        columnsBtn.click();
        return true;
      }
      return false;
    });
    
    if (columnsClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncheck a column
      await page.evaluate(() => {
        const checkboxes = Array.from(document.querySelectorAll('[role="menuitemcheckbox"]'));
        if (checkboxes.length > 2) {
          checkboxes[2].click(); // Hide the third column
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close dropdown
      await page.click('body');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 4. Click save button
    console.log('  4️⃣ Clicking Save button...');
    const saveClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Save');
      if (saveBtn) {
        saveBtn.click();
        return true;
      }
      return false;
    });
    
    if (saveClicked) {
      console.log('✅ Save dialog should be open');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill in the save form
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) {
        await nameInput.type('Test Complete State ' + Date.now());
      }
      
      const descInput = await page.$('textarea[name="description"]');
      if (descInput) {
        await descInput.type('Testing if all state is saved: search, filters, columns, sort');
      }
      
      // Submit the form
      console.log('  5️⃣ Submitting save form...');
      const submitClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(btn => 
          btn.textContent.includes('Save') && 
          btn.type === 'submit'
        );
        if (submitBtn) {
          submitBtn.click();
          return true;
        }
        return false;
      });
      
      if (submitClicked) {
        console.log('✅ Form submitted!');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('Check the console output above for "CAPTURED SAVE DATA" to see what was saved.');
    console.log('The saved search should include:');
    console.log('  - Search term: "test search"');
    console.log('  - Active filters');
    console.log('  - Hidden columns');
    console.log('  - Sort configuration');
    console.log('  - Pagination limit');
    
    // Take final screenshot
    await page.screenshot({ path: 'save-complete-state.png', fullPage: true });
    console.log('\n📷 Screenshot saved: save-complete-state.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'save-state-error.png' });
  } finally {
    await browser.close();
  }
})();