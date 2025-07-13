const puppeteer = require('puppeteer');

async function testAdminPages() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const issues = [];
  
  // Ignore certificate errors
  page.on('error', err => {
    console.log('Page error:', err.message);
  });

  try {
    console.log('1. Testing login...');
    
    // Navigate with shorter timeout
    try {
      await page.goto('http://localhost:3000/auth/signin', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
    } catch (e) {
      console.log('Navigation warning:', e.message);
    }
    
    // Give page time to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png' });
    console.log('Login page screenshot saved');
    
    // Fill login form
    try {
      await page.type('input[type="email"]', '1@1.com');
      await page.type('input[type="password"]', 'Admin123!');
      await page.click('button[type="submit"]');
      console.log('Login form submitted');
    } catch (e) {
      console.log('Error filling login form:', e.message);
      await browser.close();
      return;
    }
    
    // Wait for redirect
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Current URL after login:', page.url());
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if we're logged in by trying to access admin pages
    const adminPages = [
      '/admin',
      '/admin/users', 
      '/admin/tenants',
      '/admin/categories',
      '/admin/tags',
      '/admin/subscriptions',
      '/admin/permissions',
      '/admin/settings'
    ];
    
    console.log('\n2. Testing admin pages...\n');
    
    for (const pagePath of adminPages) {
      console.log(`Testing ${pagePath}...`);
      
      try {
        await page.goto(`http://localhost:3000${pagePath}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
      } catch (e) {
        console.log(`  ❌ Navigation error: ${e.message}`);
        issues.push({ page: pagePath, error: 'Navigation failed' });
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for common issues
      const pageContent = await page.content();
      const pageTitle = await page.title();
      
      // Check for error indicators
      if (pageContent.includes('error') || pageContent.includes('Error')) {
        const errors = await page.$$eval('[class*="error"], [class*="Error"]', 
          elements => elements.map(el => el.textContent).filter(t => t.trim())
        );
        if (errors.length > 0) {
          console.log(`  ❌ Errors found: ${errors.join(', ')}`);
          issues.push({ page: pagePath, error: errors });
        }
      }
      
      // Check for empty data
      if (pageContent.includes('No data') || pageContent.includes('No results')) {
        console.log(`  ⚠️  Empty data state`);
      }
      
      // Check if page loaded successfully
      const hasContent = await page.$('table, form, [data-testid], .card, .panel');
      if (hasContent) {
        console.log(`  ✅ Page loaded with content`);
      } else {
        console.log(`  ❌ Page appears empty`);
        issues.push({ page: pagePath, error: 'No content found' });
      }
      
      // Take screenshot for pages with issues
      if (issues.some(i => i.page === pagePath)) {
        const filename = `admin${pagePath.replace(/\//g, '-')}-error.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`  📸 Screenshot saved: ${filename}`);
      }
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===\n');
    if (issues.length === 0) {
      console.log('✅ All pages tested successfully!');
    } else {
      console.log(`❌ Found ${issues.length} issues:\n`);
      issues.forEach(issue => {
        console.log(`- ${issue.page}: ${JSON.stringify(issue.error)}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminPages().catch(console.error);