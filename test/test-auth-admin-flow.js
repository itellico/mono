#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testAuthAndAdminFlow() {
    console.log('🚀 Starting comprehensive auth and admin interface test...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
        console.log(`📝 Console [${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('❌ Page Error:', error.message);
    });
    
    page.on('response', response => {
        if (!response.ok()) {
            console.log(`⚠️  Failed request: ${response.status()} ${response.url()}`);
        }
    });

    try {
        // ==========================================
        // STEP 1: LOGIN TEST
        // ==========================================
        console.log('\n1️⃣ Testing Login Flow...');
        
        await page.goto('http://localhost:3000/auth/signin', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Take screenshot of login page
        await page.screenshot({ 
            path: path.join(screenshotsDir, '01-login-page.png'),
            fullPage: true 
        });
        
        console.log('   ✅ Navigated to login page');
        
        // Wait for form elements to be present
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
        
        // Fill in login credentials
        const emailSelector = 'input[type="email"], input[name="email"]';
        const passwordSelector = 'input[type="password"], input[name="password"]';
        
        await page.focus(emailSelector);
        await page.type(emailSelector, '1@1.com');
        console.log('   ✅ Entered email: 1@1.com');
        
        await page.focus(passwordSelector);
        await page.type(passwordSelector, 'Admin123!');
        console.log('   ✅ Entered password');
        
        // Take screenshot before submitting
        await page.screenshot({ 
            path: path.join(screenshotsDir, '02-login-filled.png'),
            fullPage: true 
        });
        
        // Find and click submit button
        const submitButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Sign in"), button:contains("Login")');
        if (!submitButton) {
            // Try alternative selectors
            const buttons = await page.$$('button');
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text && (text.toLowerCase().includes('sign') || text.toLowerCase().includes('login'))) {
                    await button.click();
                    console.log('   ✅ Clicked login button:', text);
                    break;
                }
            }
        } else {
            await submitButton.click();
            console.log('   ✅ Clicked submit button');
        }
        
        // Wait for navigation after login
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
            console.log('   ✅ Navigation completed after login');
        } catch (navError) {
            console.log('   ⚠️  No navigation detected, checking current URL...');
        }
        
        const currentUrl = page.url();
        console.log(`   📍 Current URL after login: ${currentUrl}`);
        
        // Take screenshot after login attempt
        await page.screenshot({ 
            path: path.join(screenshotsDir, '03-after-login.png'),
            fullPage: true 
        });
        
        // Check if login was successful
        const isLoggedIn = !currentUrl.includes('/auth/signin');
        console.log(`   ${isLoggedIn ? '✅' : '❌'} Login ${isLoggedIn ? 'successful' : 'failed'}`);
        
        if (!isLoggedIn) {
            // Check for error messages
            const errorElements = await page.$$('.error, .alert-error, [role="alert"]');
            for (const errorEl of errorElements) {
                const errorText = await page.evaluate(el => el.textContent, errorEl);
                console.log(`   ❌ Error message: ${errorText}`);
            }
        }

        // ==========================================
        // STEP 2: ADMIN INTERFACE TEST
        // ==========================================
        if (isLoggedIn) {
            console.log('\n2️⃣ Testing Admin Interface...');
            
            const adminPages = [
                { path: '/admin', name: 'Dashboard' },
                { path: '/admin/tenants', name: 'Tenants' },
                { path: '/admin/categories', name: 'Categories' },
                { path: '/admin/tags', name: 'Tags' },
                { path: '/admin/permissions', name: 'Permissions' },
                { path: '/admin/subscriptions', name: 'Subscriptions' },
                { path: '/admin/settings', name: 'Settings' },
                { path: '/admin/monitoring', name: 'Monitoring' }
            ];
            
            const pageResults = [];
            
            for (const adminPage of adminPages) {
                console.log(`\n   📄 Testing ${adminPage.name} (${adminPage.path})...`);
                
                try {
                    const startTime = Date.now();
                    await page.goto(`http://localhost:3000${adminPage.path}`, { 
                        waitUntil: 'networkidle2',
                        timeout: 20000 
                    });
                    const loadTime = Date.now() - startTime;
                    
                    // Wait a moment for dynamic content
                    await page.waitForTimeout(2000);
                    
                    // Take screenshot
                    const screenshotName = `04-admin-${adminPage.path.replace(/\//g, '-').replace('--', '-')}.png`;
                    await page.screenshot({ 
                        path: path.join(screenshotsDir, screenshotName),
                        fullPage: true 
                    });
                    
                    // Check for error states
                    const hasErrors = await page.$('.error, .alert-error, [role="alert"]') !== null;
                    const hasContent = await page.$('table, .grid, .list, .card, .data-item') !== null;
                    const hasLoadingStates = await page.$('.loading, .spinner, .skeleton') !== null;
                    
                    // Check for specific data indicators
                    const dataIndicators = await page.evaluate(() => {
                        const tables = document.querySelectorAll('table tbody tr');
                        const lists = document.querySelectorAll('.list-item, .grid-item, .card');
                        const emptyStates = document.querySelectorAll('.empty, .no-data, .no-results');
                        
                        return {
                            tableRows: tables.length,
                            listItems: lists.length,
                            emptyStates: emptyStates.length,
                            hasHeadings: document.querySelectorAll('h1, h2, h3').length > 0,
                            hasButtons: document.querySelectorAll('button').length > 0
                        };
                    });
                    
                    const result = {
                        page: adminPage.name,
                        path: adminPage.path,
                        loadTime,
                        loaded: true,
                        hasErrors,
                        hasContent,
                        hasLoadingStates,
                        dataIndicators,
                        screenshot: screenshotName
                    };
                    
                    pageResults.push(result);
                    
                    console.log(`      ✅ Loaded in ${loadTime}ms`);
                    console.log(`      📊 Content: ${hasContent ? 'Found' : 'None'}`);
                    console.log(`      ⚠️  Errors: ${hasErrors ? 'Yes' : 'No'}`);
                    console.log(`      📈 Data: ${dataIndicators.tableRows} rows, ${dataIndicators.listItems} items`);
                    
                } catch (error) {
                    console.log(`      ❌ Failed to load: ${error.message}`);
                    pageResults.push({
                        page: adminPage.name,
                        path: adminPage.path,
                        loaded: false,
                        error: error.message
                    });
                }
            }
            
            // ==========================================
            // STEP 3: SUMMARY REPORT
            // ==========================================
            console.log('\n3️⃣ Summary Report');
            console.log('==========================================');
            
            const workingPages = pageResults.filter(p => p.loaded && !p.hasErrors);
            const brokenPages = pageResults.filter(p => !p.loaded || p.hasErrors);
            const emptyPages = pageResults.filter(p => p.loaded && !p.hasContent && p.dataIndicators?.emptyStates > 0);
            
            console.log(`\n✅ Working Pages (${workingPages.length}):`);
            workingPages.forEach(p => {
                console.log(`   • ${p.page} - ${p.dataIndicators?.tableRows || 0} data rows`);
            });
            
            console.log(`\n❌ Broken Pages (${brokenPages.length}):`);
            brokenPages.forEach(p => {
                console.log(`   • ${p.page} - ${p.error || 'Has errors'}`);
            });
            
            console.log(`\n📭 Empty Pages (${emptyPages.length}):`);
            emptyPages.forEach(p => {
                console.log(`   • ${p.page} - No data found`);
            });
            
            // ==========================================
            // STEP 4: DATA SEEDING RECOMMENDATIONS
            // ==========================================
            console.log('\n4️⃣ Data Seeding Recommendations');
            console.log('==========================================');
            
            if (emptyPages.length > 0) {
                console.log('\n📥 Suggested seeding commands:');
                
                if (emptyPages.find(p => p.page === 'Tenants')) {
                    console.log('   pnpm tsx scripts/create-admin-user.ts');
                }
                if (emptyPages.find(p => p.page === 'Categories')) {
                    console.log('   pnpm tsx scripts/seed-categories.ts');
                }
                if (emptyPages.find(p => p.page === 'Tags')) {
                    console.log('   pnpm tsx scripts/seed-tags.ts');
                }
                console.log('   pnpm tsx scripts/comprehensive-seeder.ts  # Complete dataset');
            }
            
            // Save detailed results
            const reportData = {
                timestamp: new Date().toISOString(),
                loginSuccessful: isLoggedIn,
                pageResults,
                consoleMessages: consoleMessages.slice(-50), // Last 50 messages
                errors: errors.slice(-20), // Last 20 errors
                summary: {
                    working: workingPages.length,
                    broken: brokenPages.length,
                    empty: emptyPages.length,
                    total: pageResults.length
                }
            };
            
            fs.writeFileSync(
                path.join(__dirname, 'test-results.json'),
                JSON.stringify(reportData, null, 2)
            );
            
            console.log('\n📊 Detailed results saved to test-results.json');
            console.log(`📸 Screenshots saved to ${screenshotsDir}/`);
            
        } else {
            console.log('\n❌ Cannot test admin interface - login failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        // Take error screenshot
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'error-state.png'),
            fullPage: true 
        });
        
    } finally {
        await browser.close();
        console.log('\n🏁 Test completed');
    }
}

// Run the test
testAuthAndAdminFlow().catch(console.error);