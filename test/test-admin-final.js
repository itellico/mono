const puppeteer = require('puppeteer');
const fs = require('fs');

async function testAdminPagesFinal() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: 0,
      successfulPages: 0,
      pagesWithErrors: 0,
      pagesWithNoData: 0
    },
    pages: []
  };

  try {
    console.log('=== ADMIN PAGES COMPREHENSIVE TEST ===\n');
    
    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth/signin', { 
      waitUntil: 'domcontentloaded'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.type('input[type="email"]', '1@1.com');
    await page.type('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Login submitted\n');
    
    // Admin pages to test
    const adminPages = [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Users', path: '/admin/users' },
      { name: 'Tenants', path: '/admin/tenants' },
      { name: 'Categories', path: '/admin/categories' },
      { name: 'Tags', path: '/admin/tags' },
      { name: 'Subscriptions', path: '/admin/subscriptions' },
      { name: 'Permissions', path: '/admin/permissions' },
      { name: 'Settings', path: '/admin/settings' },
      { name: 'Search', path: '/admin/search' },
      { name: 'Monitoring', path: '/admin/monitoring' },
      { name: 'Email Templates', path: '/admin/email/react-templates' },
      { name: 'Saved Searches', path: '/admin/saved-searches' },
      { name: 'Schema Seeder', path: '/admin/schema-seeder' },
      { name: 'Tenant Data Management', path: '/admin/tenant-data-management' }
    ];
    
    report.summary.totalPages = adminPages.length;
    
    // Test each page
    for (const pageInfo of adminPages) {
      console.log(`Testing ${pageInfo.name} (${pageInfo.path})...`);
      const pageReport = {
        name: pageInfo.name,
        path: pageInfo.path,
        status: 'unknown',
        errors: [],
        warnings: [],
        data: {}
      };
      
      try {
        await page.goto(`http://localhost:3000${pageInfo.path}`, {
          waitUntil: 'networkidle0',
          timeout: 15000
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get page content for analysis
        const pageContent = await page.content();
        const pageTitle = await page.title();
        
        // Check for authentication issues
        if (page.url().includes('/auth/signin')) {
          pageReport.status = 'auth-required';
          pageReport.errors.push('Redirected to login - authentication issue');
          console.log('  ❌ Authentication required');
        } else {
          // Check for basic page elements
          const hasHeading = await page.$('h1, h2, h3');
          const hasTable = await page.$('table');
          const hasForm = await page.$('form');
          const hasCards = await page.$$('.card, [class*="card"]');
          const hasButtons = await page.$$('button');
          
          // Check for data
          const tableRows = hasTable ? await page.$$('tbody tr') : [];
          const hasEmptyState = pageContent.includes('No data') || 
                               pageContent.includes('No results') || 
                               pageContent.includes('No items') ||
                               pageContent.includes('Empty');
          
          // Check for errors
          const errorElements = await page.$$('[class*="error"], [class*="Error"], .alert-danger');
          const hasErrors = errorElements.length > 0;
          
          // Compile results
          pageReport.data = {
            hasHeading: !!hasHeading,
            hasTable: !!hasTable,
            hasForm: !!hasForm,
            cardCount: hasCards.length,
            buttonCount: hasButtons.length,
            tableRowCount: tableRows.length,
            hasEmptyState: hasEmptyState,
            hasErrors: hasErrors
          };
          
          // Determine status
          if (hasErrors) {
            pageReport.status = 'error';
            pageReport.errors.push('Page contains error messages');
            console.log('  ❌ Page has errors');
          } else if (hasEmptyState || tableRows.length === 0) {
            pageReport.status = 'no-data';
            pageReport.warnings.push('Page shows empty state or no data');
            console.log('  ⚠️  No data displayed');
            report.summary.pagesWithNoData++;
          } else {
            pageReport.status = 'success';
            console.log('  ✅ Page loaded successfully');
            report.summary.successfulPages++;
          }
          
          // Take screenshot for pages with issues
          if (pageReport.status !== 'success') {
            const screenshotPath = `screenshots/admin-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            pageReport.screenshotPath = screenshotPath;
            console.log(`  📸 Screenshot: ${screenshotPath}`);
          }
        }
        
      } catch (error) {
        pageReport.status = 'error';
        pageReport.errors.push(error.message);
        console.log(`  ❌ Error: ${error.message}`);
        report.summary.pagesWithErrors++;
      }
      
      report.pages.push(pageReport);
      console.log('');
    }
    
    // Generate summary
    console.log('=== TEST SUMMARY ===\n');
    console.log(`Total pages tested: ${report.summary.totalPages}`);
    console.log(`✅ Successful: ${report.summary.successfulPages}`);
    console.log(`⚠️  No data: ${report.summary.pagesWithNoData}`);
    console.log(`❌ Errors: ${report.summary.pagesWithErrors}`);
    
    // List problematic pages
    const problematicPages = report.pages.filter(p => p.status !== 'success');
    if (problematicPages.length > 0) {
      console.log('\nProblematic pages:');
      problematicPages.forEach(page => {
        console.log(`\n${page.name} (${page.path}):`);
        console.log(`  Status: ${page.status}`);
        if (page.errors.length > 0) {
          console.log('  Errors:', page.errors.join(', '));
        }
        if (page.warnings.length > 0) {
          console.log('  Warnings:', page.warnings.join(', '));
        }
        if (page.data.hasEmptyState) {
          console.log('  Data: Shows empty state');
        }
      });
    }
    
    // Save detailed report
    fs.writeFileSync('admin-pages-final-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: admin-pages-final-report.json');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminPagesFinal().catch(console.error);