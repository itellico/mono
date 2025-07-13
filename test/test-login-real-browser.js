const puppeteer = require('puppeteer');

(async () => {
  let browser;
  
  try {
    console.log('🚀 Starting browser test...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logs
    page.on('console', (msg) => {
      console.log(`📝 CONSOLE: ${msg.text()}`);
    });
    
    // Monitor network requests
    page.on('response', (response) => {
      if (response.url().includes('auth') || response.url().includes('api') || response.url().includes('signin')) {
        console.log(`🌐 NETWORK: ${response.status()} ${response.url()}`);
      }
    });
    
    // Monitor failed requests
    page.on('requestfailed', (request) => {
      console.log(`❌ FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    console.log('2. Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    console.log('3. Taking screenshot of login page...');
    await page.screenshot({ path: 'login-page-real.png', fullPage: true });
    
    console.log('4. Looking for form elements...');
    
    // Try different selectors for email input
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        emailInput = selector;
        console.log(`✅ Found email input: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Email selector not found: ${selector}`);
      }
    }
    
    // Try different selectors for password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id="password"]',
      'input[placeholder*="password"]',
      'input[placeholder*="Password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        passwordInput = selector;
        console.log(`✅ Found password input: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Password selector not found: ${selector}`);
      }
    }
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Could not find login form inputs');
      
      // Get page content to debug
      const content = await page.content();
      console.log('📄 Page title:', await page.title());
      console.log('📄 Page URL:', page.url());
      
      // Look for any input elements
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className
        }))
      );
      console.log('📝 Found inputs:', inputs);
      
      return;
    }
    
    console.log('5. Filling in credentials...');
    await page.type(emailInput, '1@1.com');
    await page.type(passwordInput, 'Admin123!');
    
    console.log('6. Looking for submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:contains("Sign In")',
      'button:contains("Login")',
      'input[type="submit"]',
      'form button',
      '[role="button"]:contains("Sign In")'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        submitButton = selector;
        console.log(`✅ Found submit button: ${selector}`);
        break;
      } catch (e) {
        console.log(`❌ Submit selector not found: ${selector}`);
      }
    }
    
    if (!submitButton) {
      // Try to find any button
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(button => ({
          type: button.type,
          textContent: button.textContent.trim(),
          className: button.className,
          id: button.id
        }))
      );
      console.log('📝 Found buttons:', buttons);
      
      // Try the first button
      if (buttons.length > 0) {
        submitButton = 'button';
        console.log('⚠️  Using first button found');
      }
    }
    
    if (!submitButton) {
      console.log('❌ Could not find submit button');
      return;
    }
    
    console.log('7. Clicking submit button...');
    await page.click(submitButton);
    
    console.log('8. Waiting for navigation...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`9. Current URL: ${currentUrl}`);
    
    console.log('10. Taking screenshot of result...');
    await page.screenshot({ path: 'login-result-real.png', fullPage: true });
    
    // Check for error messages
    const errorSelectors = [
      '.error',
      '.alert',
      '.text-red-500',
      '.text-destructive',
      '[role="alert"]',
      '.alert-error'
    ];
    
    let errorMessages = [];
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const text = await element.evaluate(el => el.textContent.trim());
          if (text) errorMessages.push(text);
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
    
    if (errorMessages.length > 0) {
      console.log('❌ Error messages found:', errorMessages);
    } else {
      console.log('✅ No error messages visible');
    }
    
    // Check final state
    if (currentUrl.includes('/admin')) {
      console.log('🎉 SUCCESS: Redirected to admin page');
    } else if (currentUrl.includes('/auth/signin')) {
      console.log('⚠️  Still on login page - checking for errors or loading states');
    } else {
      console.log(`🤔 Redirected to unexpected page: ${currentUrl}`);
    }
    
    // Wait a bit more to see final state
    await page.waitForTimeout(2000);
    
    console.log('11. Final screenshot...');
    await page.screenshot({ path: 'login-final-real.png', fullPage: true });
    
    console.log('✅ Test complete!');
    console.log('📸 Screenshots saved:');
    console.log('   - login-page-real.png');
    console.log('   - login-result-real.png');
    console.log('   - login-final-real.png');
    
    // Keep browser open for 5 seconds for manual inspection
    console.log('🔍 Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    if (browser) {
      await browser.close();
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();