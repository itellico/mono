#!/usr/bin/env node

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

async function testAuthFlow() {
    console.log('🔍 Testing Authentication and Admin Interface Flow\n');
    
    try {
        // Step 1: Test login page access
        console.log('1️⃣ Testing Login Page Access...');
        const loginPageResponse = await fetch('http://localhost:3000/auth/signin');
        console.log(`   Status: ${loginPageResponse.status}`);
        console.log(`   URL: ${loginPageResponse.url}`);
        
        if (loginPageResponse.ok) {
            const loginPageHtml = await loginPageResponse.text();
            const loginDom = new JSDOM(loginPageHtml);
            const emailInput = loginDom.window.document.querySelector('input[type="email"], input[name="email"]');
            const passwordInput = loginDom.window.document.querySelector('input[type="password"], input[name="password"]');
            const submitButton = loginDom.window.document.querySelector('button[type="submit"]');
            
            console.log(`   ✅ Login page loaded`);
            console.log(`   📝 Email input: ${emailInput ? 'Found' : 'Not found'}`);
            console.log(`   📝 Password input: ${passwordInput ? 'Found' : 'Not found'}`);
            console.log(`   📝 Submit button: ${submitButton ? 'Found' : 'Not found'}`);
        } else {
            console.log(`   ❌ Failed to load login page`);
            return;
        }
        
        // Step 2: Test API login endpoint
        console.log('\n2️⃣ Testing API Login Endpoint...');
        const loginData = {
            email: '1@1.com',
            password: 'Admin123!'
        };
        
        const apiLoginResponse = await fetch('http://localhost:3001/api/v1/public/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log(`   Status: ${apiLoginResponse.status}`);
        const apiResult = await apiLoginResponse.text();
        console.log(`   Response: ${apiResult}`);
        
        let loginSuccessful = false;
        let cookies = '';
        
        try {
            const parsedResult = JSON.parse(apiResult);
            loginSuccessful = parsedResult.success;
            if (loginSuccessful) {
                cookies = apiLoginResponse.headers.get('set-cookie') || '';
                console.log(`   ✅ Login successful`);
                console.log(`   🍪 Cookies: ${cookies ? 'Set' : 'None'}`);
            } else {
                console.log(`   ❌ Login failed: ${parsedResult.message || parsedResult.error}`);
            }
        } catch (parseError) {
            console.log(`   ⚠️  Could not parse API response: ${parseError.message}`);
        }
        
        // Step 3: Test admin pages
        if (loginSuccessful && cookies) {
            console.log('\n3️⃣ Testing Admin Pages...');
            
            const adminPages = [
                '/admin',
                '/admin/tenants', 
                '/admin/categories',
                '/admin/tags',
                '/admin/permissions',
                '/admin/subscriptions',
                '/admin/settings',
                '/admin/monitoring'
            ];
            
            for (const page of adminPages) {
                try {
                    const pageResponse = await fetch(`http://localhost:3000${page}`, {
                        headers: {
                            'Cookie': cookies
                        }
                    });
                    
                    console.log(`   📄 ${page}: ${pageResponse.status} ${pageResponse.statusText}`);
                    
                    if (pageResponse.ok) {
                        const pageHtml = await pageResponse.text();
                        const pageDom = new JSDOM(pageHtml);
                        const hasError = pageDom.window.document.querySelector('.error, .alert-error, [role="alert"]');
                        const hasContent = pageDom.window.document.querySelector('table, .grid, .list, .card, .data-item');
                        const hasHeadings = pageDom.window.document.querySelectorAll('h1, h2, h3').length > 0;
                        
                        console.log(`      ${hasError ? '❌ Has errors' : '✅ No errors'}`);
                        console.log(`      ${hasContent ? '📊 Has data content' : '📭 No data content'}`);
                        console.log(`      ${hasHeadings ? '📝 Has headings' : '📝 No headings'}`);
                    }
                } catch (pageError) {
                    console.log(`   ❌ ${page}: Failed to load - ${pageError.message}`);
                }
            }
        } else {
            console.log('\n⚠️  Skipping admin page tests - login required');
        }
        
        // Step 4: Direct API endpoint tests
        console.log('\n4️⃣ Testing API Endpoints...');
        const apiEndpoints = [
            '/api/v1/admin/tenants',
            '/api/v1/admin/categories', 
            '/api/v1/admin/tags',
            '/api/v1/admin/permissions'
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const endpointResponse = await fetch(`http://localhost:3001${endpoint}`, {
                    headers: {
                        'Cookie': cookies
                    }
                });
                
                console.log(`   🔌 ${endpoint}: ${endpointResponse.status}`);
                
                if (endpointResponse.ok) {
                    const data = await endpointResponse.text();
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`      ${parsed.success ? '✅ Success' : '❌ Failed'}`);
                        if (parsed.data && Array.isArray(parsed.data)) {
                            console.log(`      📊 ${parsed.data.length} items returned`);
                        }
                    } catch (parseError) {
                        console.log(`      ⚠️  Non-JSON response`);
                    }
                }
            } catch (apiError) {
                console.log(`   ❌ ${endpoint}: ${apiError.message}`);
            }
        }
        
        // Step 5: Summary and recommendations
        console.log('\n5️⃣ Summary and Recommendations');
        console.log('==========================================');
        
        if (!loginSuccessful) {
            console.log('❌ CRITICAL: Login functionality is broken');
            console.log('   🔧 Check: API server configuration');
            console.log('   🔧 Check: Database user data');
            console.log('   🔧 Check: Authentication system');
        } else {
            console.log('✅ Authentication working');
        }
        
        console.log('\n💡 Next Steps:');
        console.log('   1. Check database for existing users and permissions');
        console.log('   2. Run comprehensive seeder: pnpm tsx scripts/comprehensive-seeder.ts');
        console.log('   3. Verify admin user permissions');
        console.log('   4. Test frontend authentication state management');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Check if required dependencies are available
async function checkDependencies() {
    try {
        await Promise.resolve(require('node-fetch'));
        await Promise.resolve(require('jsdom'));
        return true;
    } catch (error) {
        console.log('⚠️  Missing dependencies. Installing...');
        return false;
    }
}

// Run the test
checkDependencies().then(hasAll => {
    if (hasAll) {
        testAuthFlow();
    } else {
        console.log('❌ Please install dependencies first:');
        console.log('   npm install node-fetch jsdom');
    }
}).catch(console.error);