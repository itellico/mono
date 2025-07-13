const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots', 'admin-test');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testAdminPages() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const issues = [];
  
  // Set up console error tracking
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Set up network error tracking
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Network error: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Take screenshot of login page
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'login-page.png'),
      fullPage: true 
    });
    
    // Wait for login form and fill credentials
    console.log('Logging in...');
    
    // Try different selectors for the login form
    let emailSelector = null;
    const possibleEmailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[id="email"]',
      '#email',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]'
    ];
    
    for (const selector of possibleEmailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        emailSelector = selector;
        console.log(`Found email input with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue trying
      }
    }
    
    if (!emailSelector) {
      throw new Error('Could not find email input field');
    }
    
    await page.type(emailSelector, '1@1.com');
    
    // Find password field
    let passwordSelector = null;
    const possiblePasswordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id="password"]',
      '#password'
    ];
    
    for (const selector of possiblePasswordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        passwordSelector = selector;
        console.log(`Found password input with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue trying
      }
    }
    
    if (!passwordSelector) {
      throw new Error('Could not find password input field');
    }
    
    await page.type(passwordSelector, 'Admin123!');
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Log in")',
      'input[type="submit"]'
    ];
    
    let clicked = false;
    for (const selector of submitSelectors) {
      try {
        await page.click(selector);
        clicked = true;
        console.log(`Clicked submit button with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue trying
      }
    }
    
    if (!clicked) {
      // Try to find any button that might be the submit button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.match(/sign in|login|log in/i)) {
          await button.click();
          clicked = true;
          console.log(`Clicked button with text: ${text}`);
          break;
        }
      }
    }
    
    if (!clicked) {
      throw new Error('Could not find submit button');
    }
    
    // Wait for either navigation or admin elements to appear
    console.log('Waiting for login to complete...');
    
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        page.waitForSelector('[data-testid="admin-sidebar"], aside, nav, .admin-layout', { timeout: 10000 }),
        page.waitForFunction(() => window.location.pathname.includes('/admin'), { timeout: 10000 })
      ]);
    } catch (e) {
      console.log('Initial wait failed, checking current state...');
      // Take a screenshot to see what's happening
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'after-login-attempt.png'),
        fullPage: true 
      });
      
      // Check if we're on an error page or still on login
      const currentUrl = page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Check for error messages
      const errorElement = await page.$('[class*="error"], [class*="Error"], .error-message, .alert-danger');
      if (errorElement) {
        const errorText = await errorElement.evaluate(el => el.textContent);
        console.log('Login error:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }
      
      // If still on login page, try to check for validation errors
      if (currentUrl.includes('/auth/signin') || currentUrl.includes('/signin')) {
        console.log('Still on login page, checking for issues...');
        
        // Take another screenshot
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'login-error-state.png'),
          fullPage: true 
        });
        
        throw new Error('Login failed - still on login page after submit');
      }
    }
    
    console.log('Login successful, current URL:', page.url());
    
    // Double-check we're in admin area
    const finalUrl = page.url();
    if (!finalUrl.includes('/admin')) {
      console.log('Not redirected to admin area, navigating manually...');
      await page.goto('http://localhost:3000/admin', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
    }
    
    // Define admin pages to test
    const adminPages = [
      { name: 'Dashboard', url: '/admin', selector: 'h1, h2' },
      { name: 'Users', url: '/admin/users', selector: 'table, [data-testid="no-data"]' },
      { name: 'Tenants', url: '/admin/tenants', selector: 'table, [data-testid="no-data"]' },
      { name: 'Categories', url: '/admin/categories', selector: 'table, [data-testid="no-data"]' },
      { name: 'Tags', url: '/admin/tags', selector: 'table, [data-testid="no-data"]' },
      { name: 'Subscriptions', url: '/admin/subscriptions', selector: 'table, [data-testid="no-data"]' },
      { name: 'Permissions', url: '/admin/permissions', selector: 'table, [data-testid="no-data"]' },
      { name: 'Settings', url: '/admin/settings', selector: 'form, [data-testid="settings-panel"]' },
      { name: 'Search', url: '/admin/search', selector: 'form, input[type="search"]' },
      { name: 'Monitoring', url: '/admin/monitoring', selector: '[data-testid="monitoring-panel"], h1' },
      { name: 'Email Templates', url: '/admin/email/react-templates', selector: 'h1, [data-testid="email-templates"]' },
      { name: 'Saved Searches', url: '/admin/saved-searches', selector: 'table, [data-testid="no-data"]' },
      { name: 'Schema Seeder', url: '/admin/schema-seeder', selector: 'form, [data-testid="schema-generator"]' },
      { name: 'Tenant Data Management', url: '/admin/tenant-data-management', selector: 'h1, form' },
    ];

    // Test each admin page
    for (const pageInfo of adminPages) {
      console.log(`\nTesting ${pageInfo.name} page...`);
      const pageIssues = [];
      
      try {
        // Navigate to the page
        await page.goto(`http://localhost:3000${pageInfo.url}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);
        
        // Check for error messages
        const errorElements = await page.$$('[class*="error"], [class*="Error"], [data-testid="error-message"]');
        if (errorElements.length > 0) {
          const errorTexts = await Promise.all(
            errorElements.map(el => el.evaluate(node => node.textContent))
          );
          pageIssues.push(`Error messages found: ${errorTexts.join(', ')}`);
        }
        
        // Check for "No data" or empty states
        const noDataElement = await page.$('[data-testid="no-data"], [class*="empty"], [class*="no-data"]');
        if (noDataElement) {
          const noDataText = await noDataElement.evaluate(el => el.textContent);
          pageIssues.push(`Empty state: ${noDataText}`);
        }
        
        // Check if expected content selector exists
        try {
          await page.waitForSelector(pageInfo.selector, { timeout: 5000 });
        } catch (e) {
          pageIssues.push(`Expected content not found (selector: ${pageInfo.selector})`);
        }
        
        // Check for loading states that never resolve
        const loadingElement = await page.$('[class*="loading"], [class*="Loading"], [data-testid="loading"]');
        if (loadingElement) {
          await page.waitForTimeout(3000); // Wait to see if loading resolves
          const stillLoading = await page.$('[class*="loading"], [class*="Loading"], [data-testid="loading"]');
          if (stillLoading) {
            pageIssues.push('Page stuck in loading state');
          }
        }
        
        // Take screenshot if there are issues or always for documentation
        const screenshotName = `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-${pageIssues.length > 0 ? 'error' : 'ok'}.png`;
        await page.screenshot({ 
          path: path.join(screenshotsDir, screenshotName),
          fullPage: true 
        });
        
        // Collect console errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        if (consoleErrors.length > 0) {
          pageIssues.push(`Console errors: ${consoleErrors.join('; ')}`);
        }
        
        // Record issues for this page
        if (pageIssues.length > 0) {
          issues.push({
            page: pageInfo.name,
            url: pageInfo.url,
            issues: pageIssues
          });
        }
        
        console.log(`${pageInfo.name}: ${pageIssues.length > 0 ? '❌ Issues found' : '✅ OK'}`);
        if (pageIssues.length > 0) {
          pageIssues.forEach(issue => console.log(`  - ${issue}`));
        }
        
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
        issues.push({
          page: pageInfo.name,
          url: pageInfo.url,
          issues: [`Failed to test page: ${error.message}`]
        });
        
        // Try to take error screenshot
        try {
          await page.screenshot({ 
            path: path.join(screenshotsDir, `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}-error.png`),
            fullPage: true 
          });
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError.message);
        }
      }
    }
    
    // Generate report
    console.log('\n=== ADMIN PAGES TEST REPORT ===\n');
    
    if (issues.length === 0) {
      console.log('✅ All admin pages are working correctly!');
    } else {
      console.log(`❌ Found issues on ${issues.length} pages:\n`);
      issues.forEach(({ page, url, issues }) => {
        console.log(`📄 ${page} (${url}):`);
        issues.forEach(issue => console.log(`   - ${issue}`));
        console.log('');
      });
    }
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      totalPages: adminPages.length,
      pagesWithIssues: issues.length,
      issues: issues,
      screenshotsPath: screenshotsDir
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'admin-pages-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
    console.log('Full report saved to: admin-pages-test-report.json');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminPages().catch(console.error);