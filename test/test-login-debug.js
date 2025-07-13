#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testLoginDebug() {
  let browser;
  
  try {
    console.log('🚀 Debugging login flow...\n');
    
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture all requests and responses
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/auth/')) {
        console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/auth/')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`📱 CONSOLE [${msg.type()}]: ${msg.text()}`);
    });
    
    // Navigate to login page
    console.log('📍 Step 1: Loading login page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log(`✅ Login page loaded: ${page.url()}`);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-01-login-page.png' });
    
    // Wait for page to be fully rendered
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check form elements
    const formInfo = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      const form = document.querySelector('form');
      
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        hasForm: !!form,
        formAction: form ? form.action : 'no form',
        formMethod: form ? form.method : 'no form',
        emailValue: emailInput ? emailInput.value : 'not found',
        passwordValue: passwordInput ? passwordInput.value : 'not found',
        submitButtonText: submitButton ? submitButton.textContent : 'not found'
      };
    });
    
    console.log('🔍 Form Analysis:');
    console.log(`   📧 Email Input: ${formInfo.hasEmailInput ? 'Found' : 'Missing'}`);
    console.log(`   🔒 Password Input: ${formInfo.hasPasswordInput ? 'Found' : 'Missing'}`);
    console.log(`   🚀 Submit Button: ${formInfo.hasSubmitButton ? 'Found' : 'Missing'} (Text: "${formInfo.submitButtonText}")`);
    console.log(`   📝 Form Element: ${formInfo.hasForm ? 'Found' : 'Missing'}`);
    console.log(`   🎯 Form Action: ${formInfo.formAction}`);
    console.log(`   🏃 Form Method: ${formInfo.formMethod}`);
    
    if (!formInfo.hasEmailInput || !formInfo.hasPasswordInput) {
      console.log('❌ Missing form elements, cannot proceed');
      return;
    }
    
    // Fill the form
    console.log('📝 Step 2: Filling login form...');
    
    await page.type('input[type="email"]', '1@1.com', { delay: 50 });
    await page.type('input[type="password"]', 'Admin123!', { delay: 50 });
    
    // Check form values after typing
    const filledValues = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      return {
        email: emailInput ? emailInput.value : 'not found',
        password: passwordInput ? passwordInput.value : 'not found'
      };
    });
    
    console.log(`✅ Form filled - Email: "${filledValues.email}", Password: "${filledValues.password}"`);
    
    // Take screenshot after filling
    await page.screenshot({ path: 'screenshots/debug-02-form-filled.png' });
    
    // Submit the form
    console.log('🚀 Step 3: Submitting form...');
    
    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle0',
      timeout: 20000 
    }).catch(err => {
      console.log('⚠️ Navigation promise failed:', err.message);
      return null;
    });
    
    // Click submit button
    await page.click('button[type="submit"]');
    console.log('✅ Submit button clicked');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check what happened
    const currentUrl = page.url();
    console.log(`📍 Current URL after submit: ${currentUrl}`);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-03-after-submit.png' });
    
    // Check for any error messages or success indicators
    const pageState = await page.evaluate(() => {
      const errorMessages = Array.from(document.querySelectorAll('.error, .alert-error, [role="alert"]'))
        .map(el => el.textContent.trim())
        .filter(text => text);
      
      const successMessages = Array.from(document.querySelectorAll('.success, .alert-success'))
        .map(el => el.textContent.trim())
        .filter(text => text);
      
      return {
        title: document.title,
        url: window.location.href,
        errors: errorMessages,
        success: successMessages,
        bodyText: document.body.innerText.substring(0, 1000)
      };
    });
    
    console.log('📊 Page State After Submit:');
    console.log(`   📄 Title: ${pageState.title}`);
    console.log(`   🔗 URL: ${pageState.url}`);
    
    if (pageState.errors.length > 0) {
      console.log('❌ Error Messages:');
      pageState.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (pageState.success.length > 0) {
      console.log('✅ Success Messages:');
      pageState.success.forEach(success => console.log(`   - ${success}`));
    }
    
    // Try to access admin after a moment
    console.log('🏛️ Step 4: Testing admin access...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.goto('http://localhost:3000/admin', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    const adminUrl = page.url();
    console.log(`🏛️ Admin URL: ${adminUrl}`);
    
    if (adminUrl.includes('/admin') && !adminUrl.includes('/auth/signin')) {
      console.log('🎉 SUCCESS: Admin access granted!');
    } else {
      console.log('❌ FAILED: Admin access denied, redirected to login');
    }
    
    await page.screenshot({ path: 'screenshots/debug-04-admin-access.png' });
    
    console.log('\n🏁 Login debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testLoginDebug().catch(console.error);