const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,  // Keep visible to see what happens
    devtools: true,   // Open DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logs
  page.on('console', (msg) => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Enable network monitoring
  page.on('response', (response) => {
    if (response.url().includes('auth') || response.url().includes('api')) {
      console.log(`NETWORK: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle2' });
    
    console.log('2. Taking screenshot of login page...');
    await page.screenshot({ path: 'login-page-test.png' });
    
    console.log('3. Waiting for login form...');
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    
    console.log('4. Filling credentials...');
    await page.type('input[name="email"]', '1@1.com');
    await page.type('input[name="password"]', 'Admin123!');
    
    console.log('5. Clicking Sign In button...');
    await page.click('button[type="submit"]');
    
    console.log('6. Waiting for navigation or response...');
    await page.waitForTimeout(3000); // Wait 3 seconds
    
    const currentUrl = page.url();
    console.log('7. Current URL after login attempt:', currentUrl);
    
    console.log('8. Taking screenshot of result...');
    await page.screenshot({ path: 'login-result-test.png' });
    
    // Check for error messages
    const errorElements = await page.$$eval('[class*="error"], [class*="alert"], .text-red-500, .text-destructive', 
      elements => elements.map(el => el.textContent.trim())
    );
    
    if (errorElements.length > 0) {
      console.log('9. Error messages found:', errorElements);
    } else {
      console.log('9. No error messages visible');
    }
    
    // Check if redirected to admin
    if (currentUrl.includes('/admin')) {
      console.log('✅ SUCCESS: Redirected to admin page');
    } else if (currentUrl.includes('/auth/signin')) {
      console.log('❌ FAILED: Still on login page');
    } else {
      console.log('⚠️  UNKNOWN: Redirected to unexpected page:', currentUrl);
    }
    
    // Wait a bit longer to see the final state
    await page.waitForTimeout(2000);
    
    console.log('10. Final screenshot...');
    await page.screenshot({ path: 'login-final-test.png' });
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'login-error-test.png' });
  } finally {
    // Keep browser open for manual inspection
    console.log('Test complete. Browser staying open for manual inspection...');
    console.log('Screenshots saved: login-page-test.png, login-result-test.png, login-final-test.png');
    // await browser.close();
  }
})();