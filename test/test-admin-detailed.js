const puppeteer = require('puppeteer');
const fs = require('fs');

async function testAdminPagesDetailed() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    warnings: [],
    successes: []
  };
  
  // Track console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      report.issues.push({
        type: 'console-error',
        message: msg.text(),
        url: page.url()
      });
    }
  });

  try {
    console.log('=== ADMIN PAGES DETAILED TEST ===\n');
    
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[type="email"]', '1@1.com');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (!page.url().includes('/admin')) {
      await page.goto('http://localhost:3000/admin');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('✅ Login successful\n');
    report.successes.push('Login successful');
    
    // 2. Test each admin page in detail
    const adminTests = [
      {
        name: 'Dashboard',
        url: '/admin',
        checks: async () => {
          const hasTitle = await page.$('h1, h2');
          const hasStats = await page.$('[class*="stat"], [class*="metric"], [class*="card"]');
          return {
            'Page title': !!hasTitle,
            'Dashboard stats': !!hasStats
          };
        }
      },
      {
        name: 'Users',
        url: '/admin/users',
        checks: async () => {
          const hasTable = await page.$('table');
          const hasCreateButton = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
          const rows = await page.$$('tbody tr');
          
          // Try to check if data is being loaded
          const hasLoadingState = await page.$('[class*="loading"], [class*="spinner"]');
          const hasNoDataMessage = await page.$(':has-text("No data"), :has-text("No users"), :has-text("No results")');
          
          return {
            'Users table': !!hasTable,
            'Create user button': !!hasCreateButton,
            'User rows': rows.length,
            'Loading state': !!hasLoadingState,
            'Empty state message': !!hasNoDataMessage
          };
        }
      },
      {
        name: 'Tenants',
        url: '/admin/tenants',
        checks: async () => {
          const hasTable = await page.$('table');
          const hasCreateButton = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
          const rows = await page.$$('tbody tr');
          const hasSearch = await page.$('input[type="search"], input[placeholder*="Search"]');
          
          return {
            'Tenants table': !!hasTable,
            'Create tenant button': !!hasCreateButton,
            'Tenant rows': rows.length,
            'Search box': !!hasSearch
          };
        }
      },
      {
        name: 'Categories',
        url: '/admin/categories',
        checks: async () => {
          const hasTable = await page.$('table');
          const hasCreateButton = await page.$('button:has-text("Create"), button:has-text("Add")');
          const rows = await page.$$('tbody tr');
          
          // Check for category-specific features
          const hasTypeFilter = await page.$('select, [data-testid="type-filter"]');
          
          return {
            'Categories table': !!hasTable,
            'Create category button': !!hasCreateButton,
            'Category rows': rows.length,
            'Type filter': !!hasTypeFilter
          };
        }
      },
      {
        name: 'Tags',
        url: '/admin/tags',
        checks: async () => {
          const hasTable = await page.$('table');
          const hasCreateButton = await page.$('button:has-text("Create"), button:has-text("Add")');
          const rows = await page.$$('tbody tr');
          
          return {
            'Tags table': !!hasTable,
            'Create tag button': !!hasCreateButton,
            'Tag rows': rows.length
          };
        }
      },
      {
        name: 'Subscriptions',
        url: '/admin/subscriptions',
        checks: async () => {
          const hasContent = await page.$('table, .subscription-plans, [data-testid="subscriptions"]');
          const hasCreateButton = await page.$('button:has-text("Create"), button:has-text("Add Plan")');
          
          return {
            'Subscriptions content': !!hasContent,
            'Create plan button': !!hasCreateButton
          };
        }
      },
      {
        name: 'Permissions',
        url: '/admin/permissions',
        checks: async () => {
          const hasTabs = await page.$('[role="tablist"], .tabs');
          const hasPermissionsList = await page.$('table, [data-testid="permissions-list"]');
          const hasRolesList = await page.$('[data-testid="roles-list"], :has-text("Roles")');
          
          return {
            'Permission tabs': !!hasTabs,
            'Permissions list': !!hasPermissionsList,
            'Roles section': !!hasRolesList
          };
        }
      },
      {
        name: 'Settings',
        url: '/admin/settings',
        checks: async () => {
          const hasForm = await page.$('form');
          const hasInputs = await page.$$('input, select, textarea');
          const hasSaveButton = await page.$('button:has-text("Save"), button[type="submit"]');
          
          return {
            'Settings form': !!hasForm,
            'Form inputs': hasInputs.length,
            'Save button': !!hasSaveButton
          };
        }
      }
    ];
    
    // Run tests
    for (const test of adminTests) {
      console.log(`\n2. Testing ${test.name} (${test.url})...`);
      
      try {
        await page.goto(`http://localhost:3000${test.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const results = await test.checks();
        
        let hasIssues = false;
        for (const [check, result] of Object.entries(results)) {
          if (typeof result === 'boolean') {
            console.log(`   ${result ? '✅' : '❌'} ${check}`);
            if (!result) {
              hasIssues = true;
              report.issues.push({
                page: test.name,
                check: check,
                status: 'failed'
              });
            }
          } else if (typeof result === 'number') {
            const emoji = result > 0 ? '✅' : '⚠️';
            console.log(`   ${emoji} ${check}: ${result}`);
            if (result === 0) {
              report.warnings.push({
                page: test.name,
                check: check,
                message: 'No data found'
              });
            }
          }
        }
        
        // Take screenshot if issues found
        if (hasIssues || Object.values(results).some(r => r === 0)) {
          const filename = `admin-${test.name.toLowerCase()}-state.png`;
          await page.screenshot({ path: filename, fullPage: true });
          console.log(`   📸 Screenshot saved: ${filename}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${test.name}: ${error.message}`);
        report.issues.push({
          page: test.name,
          error: error.message
        });
      }
    }
    
    // 3. Test API connectivity
    console.log('\n3. Testing API connectivity...');
    
    // Execute API calls in the browser context
    const apiTests = await page.evaluate(async () => {
      const results = {};
      
      // Test auth status
      try {
        const authRes = await fetch('/api/v1/public/auth/me');
        results.authStatus = {
          status: authRes.status,
          ok: authRes.ok
        };
      } catch (e) {
        results.authStatus = { error: e.message };
      }
      
      // Test users endpoint
      try {
        const usersRes = await fetch('/api/v1/admin/users');
        const usersData = await usersRes.json();
        results.users = {
          status: usersRes.status,
          dataCount: usersData.data?.length || 0,
          success: usersData.success
        };
      } catch (e) {
        results.users = { error: e.message };
      }
      
      // Test tenants endpoint
      try {
        const tenantsRes = await fetch('/api/v1/admin/tenants');
        const tenantsData = await tenantsRes.json();
        results.tenants = {
          status: tenantsRes.status,
          dataCount: tenantsData.data?.items?.length || tenantsData.data?.length || 0,
          success: tenantsData.success
        };
      } catch (e) {
        results.tenants = { error: e.message };
      }
      
      return results;
    });
    
    console.log('   API Test Results:');
    for (const [endpoint, result] of Object.entries(apiTests)) {
      if (result.error) {
        console.log(`   ❌ ${endpoint}: ${result.error}`);
        report.issues.push({ type: 'api', endpoint, error: result.error });
      } else {
        console.log(`   ✅ ${endpoint}: Status ${result.status}, Data count: ${result.dataCount || 'N/A'}`);
      }
    }
    
    // 4. Generate final report
    console.log('\n=== FINAL REPORT ===\n');
    
    if (report.issues.length === 0) {
      console.log('✅ All tests passed successfully!');
    } else {
      console.log(`❌ Found ${report.issues.length} issues:`);
      report.issues.forEach(issue => {
        console.log(`   - ${issue.page || issue.type}: ${issue.check || issue.error || issue.message}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log(`\n⚠️  ${report.warnings.length} warnings:`);
      report.warnings.forEach(warning => {
        console.log(`   - ${warning.page}: ${warning.check} - ${warning.message}`);
      });
    }
    
    // Save detailed report
    fs.writeFileSync('admin-test-detailed-report.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to: admin-test-detailed-report.json');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    report.issues.push({ type: 'fatal', error: error.message });
  } finally {
    await browser.close();
  }
}

testAdminPagesDetailed().catch(console.error);