#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testAdminNavigation() {
  let browser;
  
  try {
    console.log('🚀 Testing admin navigation after login...\n');
    
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
    
    // Step 1: Go to login page and authenticate
    console.log('📍 Step 1: Logging in...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Fill login form
    await page.type('input[type="email"]', '1@1.com');
    await page.type('input[type="password"]', 'Admin123!');
    
    // Submit form and wait for navigation
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    await page.click('button[type="submit"]');
    await navigationPromise;
    
    console.log(`✅ Logged in, current URL: ${page.url()}`);
    
    // Step 2: Try to navigate to admin area
    console.log('📍 Step 2: Navigating to admin area...');
    
    await page.goto('http://localhost:3000/admin', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log(`📍 Admin URL: ${page.url()}`);
    
    // Take screenshot of admin page
    await page.screenshot({ path: 'screenshots/04-admin-dashboard.png' });
    console.log('✅ Screenshot saved: 04-admin-dashboard.png');
    
    // Check for admin elements
    const adminElements = await page.evaluate(() => {
      return {
        title: document.title,
        hasAdminSidebar: !!document.querySelector('.sidebar, .admin-sidebar, [data-testid="sidebar"]'),
        hasAdminContent: !!document.querySelector('.admin-content, [data-testid="admin-content"]'),
        adminLinks: Array.from(document.querySelectorAll('a[href*="/admin"]')).map(link => ({
          text: link.textContent.trim(),
          href: link.href
        })).filter(link => link.text).slice(0, 10), // First 10 links
        hasDataTables: !!document.querySelector('table, .data-table'),
        pageContent: document.body.innerText.substring(0, 500)
      };
    });
    
    console.log('🏠 Admin Dashboard Analysis:');
    console.log(`   📄 Page Title: ${adminElements.title}`);
    console.log(`   🧭 Has Sidebar: ${adminElements.hasAdminSidebar ? 'Yes' : 'No'}`);
    console.log(`   📊 Has Content: ${adminElements.hasAdminContent ? 'Yes' : 'No'}`);
    console.log(`   📋 Has Tables: ${adminElements.hasDataTables ? 'Yes' : 'No'}`);
    
    if (adminElements.adminLinks.length > 0) {
      console.log('🔗 Available Admin Links:');
      adminElements.adminLinks.forEach(link => {
        console.log(`   - ${link.text}: ${link.href}`);
      });
    }
    
    // Step 3: Test specific admin pages
    const adminPages = [
      { name: 'Tenants', path: '/admin/tenants' },
      { name: 'Categories', path: '/admin/categories' },
      { name: 'Tags', path: '/admin/tags' },
      { name: 'Permissions', path: '/admin/permissions' },
      { name: 'Monitoring', path: '/admin/monitoring' }
    ];
    
    console.log('\n📍 Step 3: Testing specific admin pages...');
    
    for (const adminPage of adminPages) {
      try {
        console.log(`🔗 Testing ${adminPage.name} (${adminPage.path})...`);
        
        await page.goto(`http://localhost:3000${adminPage.path}`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for data to load
        
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            hasLoadingIndicator: !!document.querySelector('.loading, .spinner, [data-testid="loading"]'),
            hasErrorMessage: !!document.querySelector('.error, .alert-error, [role="alert"]'),
            hasDataTable: !!document.querySelector('table tbody tr'),
            hasEmptyState: !!document.querySelector('.empty-state, .no-data'),
            contentPreview: document.body.innerText.substring(0, 200)
          };
        });
        
        await page.screenshot({ path: `screenshots/05-${adminPage.name.toLowerCase()}-page.png` });
        
        let status = 'Unknown';
        if (pageInfo.hasLoadingIndicator) {
          status = 'Loading';
        } else if (pageInfo.hasErrorMessage) {
          status = 'Error';
        } else if (pageInfo.hasDataTable) {
          status = 'Has Data';
        } else if (pageInfo.hasEmptyState) {
          status = 'Empty State';
        } else {
          status = 'Loaded';
        }
        
        console.log(`   ✅ ${adminPage.name}: ${status} - ${pageInfo.title}`);
        
        if (pageInfo.hasErrorMessage) {
          console.log(`   ❌ Error content: ${pageInfo.contentPreview}`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${adminPage.name}: Failed - ${error.message}`);
      }
    }
    
    console.log('\n🏁 Admin navigation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testAdminNavigation().catch(console.error);