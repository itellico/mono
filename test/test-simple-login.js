#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testSimpleLogin() {
  let browser;
  
  try {
    console.log('🚀 Starting simple login test...\n');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Error:`, msg.text());
      }
    });
    
    // Step 1: Navigate to login page with longer timeout
    console.log('📍 Step 1: Navigating to login page...');
    try {
      await page.goto('http://localhost:3000/auth/signin', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      console.log('✅ Page loaded successfully');
    } catch (error) {
      console.log('❌ Failed to load page:', error.message);
      return;
    }
    
    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-form.png' });
    console.log('✅ Screenshot saved: 01-login-form.png');
    
    // Step 2: Wait for page to be fully loaded
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check if login form is present
    console.log('🔍 Step 2: Looking for login form...');
    
    // Try different selectors for email input
    let emailInput = null;
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      '#email',
      '.email-input'
    ];
    
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) {
        console.log(`✅ Found email input with selector: ${selector}`);
        break;
      }
    }
    
    // Try different selectors for password input
    let passwordInput = null;
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '#password',
      '.password-input'
    ];
    
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) {
        console.log(`✅ Found password input with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Login form elements not found. Checking page content...');
      
      // Get page title and URL
      const title = await page.title();
      const url = page.url();
      console.log(`📄 Page title: ${title}`);
      console.log(`🔗 Current URL: ${url}`);
      
      // Check for specific elements on the page
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log(`📝 Page content preview: ${bodyText.substring(0, 500)}...`);
      
      return;
    }
    
    // Step 4: Fill in login credentials
    console.log('✏️ Step 3: Filling in login credentials...');
    
    await emailInput.click();
    await emailInput.type('1@1.com', { delay: 100 });
    
    await passwordInput.click();
    await passwordInput.type('Admin123!', { delay: 100 });
    
    // Take screenshot after filling
    await page.screenshot({ path: 'screenshots/02-form-filled.png' });
    console.log('✅ Screenshot saved: 02-form-filled.png');
    
    // Step 5: Look for submit button
    console.log('🔍 Looking for submit button...');
    
    let submitButton = null;
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Sign In")',
      'button:contains("Login")',
      '.login-button',
      '.submit-button'
    ];
    
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.$(selector);
        if (submitButton) {
          console.log(`✅ Found submit button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Contains selector might not work, continue
      }
    }
    
    // Try to find button with text content
    if (!submitButton) {
      submitButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.toLowerCase().includes('sign in') ||
          btn.textContent.toLowerCase().includes('login') ||
          btn.textContent.toLowerCase().includes('submit')
        );
      });
      
      if (submitButton.asElement()) {
        console.log('✅ Found submit button by text content');
        submitButton = submitButton.asElement();
      } else {
        submitButton = null;
      }
    }
    
    // Step 6: Submit the form
    console.log('🚀 Step 4: Submitting login form...');
    
    if (submitButton) {
      // Wait for navigation after clicking submit
      const navigationPromise = page.waitForNavigation({ 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      await submitButton.click();
      
      try {
        await navigationPromise;
        console.log('✅ Navigation completed');
      } catch (error) {
        console.log('⚠️ Navigation timeout or error:', error.message);
      }
    } else {
      console.log('⌨️ No submit button found, trying Enter key...');
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 7: Check current URL and page content
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'screenshots/03-after-login.png' });
    console.log('✅ Screenshot saved: 03-after-login.png');
    
    // Check what happened
    if (currentUrl.includes('/admin')) {
      console.log('🎉 SUCCESS: Redirected to admin area!');
      
      // Get page title
      const title = await page.title();
      console.log(`📄 Admin page title: ${title}`);
      
      // Check for admin sidebar
      const hasSidebar = await page.$('.sidebar, .admin-sidebar, [data-testid="sidebar"]');
      console.log(`🧭 Admin sidebar found: ${hasSidebar ? 'Yes' : 'No'}`);
      
      // List available admin links
      const adminLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/admin"]'));
        return links.map(link => ({
          text: link.textContent.trim(),
          href: link.href
        })).filter(link => link.text);
      });
      
      console.log('🔗 Available admin links:');
      adminLinks.forEach(link => {
        console.log(`   - ${link.text}: ${link.href}`);
      });
      
    } else if (currentUrl.includes('/auth/signin')) {
      console.log('❌ FAILED: Still on login page');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorSelectors = [
          '.error', '.alert', '[role="alert"]', '.error-message',
          '.text-red-500', '.text-danger', '.invalid-feedback'
        ];
        
        for (const selector of errorSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
        return null;
      });
      
      if (errorText) {
        console.log(`❌ Error message: ${errorText}`);
      } else {
        console.log('❌ No error message found - check credentials or server status');
      }
      
    } else {
      console.log(`🤔 UNEXPECTED: Redirected to: ${currentUrl}`);
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);
    }
    
    console.log('\n🏁 Simple login test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testSimpleLogin().catch(console.error);