// Using built-in fetch (Node.js 18+)

async function testLogin() {
    console.log('🔍 Testing login flow with current state...\n');
    
    try {
        // Step 1: Check if frontend is accessible
        console.log('1. Checking frontend accessibility...');
        const frontendResponse = await fetch('http://localhost:3000/auth/signin', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        console.log(`Frontend status: ${frontendResponse.status}`);
        if (frontendResponse.status !== 200) {
            console.log('❌ Frontend not accessible');
            return;
        }
        
        const frontendHtml = await frontendResponse.text();
        console.log(`Frontend HTML length: ${frontendHtml.length} characters`);
        
        // Check if it contains login form elements
        const hasEmailInput = frontendHtml.includes('name="email"') || frontendHtml.includes('type="email"');
        const hasPasswordInput = frontendHtml.includes('name="password"') || frontendHtml.includes('type="password"');
        const hasLoginForm = frontendHtml.includes('<form') && (frontendHtml.includes('signin') || frontendHtml.includes('login'));
        
        console.log(`Has email input: ${hasEmailInput}`);
        console.log(`Has password input: ${hasPasswordInput}`);
        console.log(`Has login form: ${hasLoginForm}`);
        
        if (!hasEmailInput || !hasPasswordInput) {
            console.log('❌ Login form elements not found in HTML');
            console.log('First 500 characters of HTML:');
            console.log(frontendHtml.substring(0, 500));
            return;
        }
        
        // Step 2: Check API accessibility
        console.log('\n2. Checking API accessibility...');
        const apiResponse = await fetch('http://localhost:3001/api/v1/public/health', {
            method: 'GET'
        });
        
        console.log(`API status: ${apiResponse.status}`);
        if (apiResponse.status !== 200) {
            console.log('❌ API not accessible');
            return;
        }
        
        const apiData = await apiResponse.json();
        console.log('API health check:', apiData);
        
        // Step 3: Test login endpoint
        console.log('\n3. Testing login endpoint...');
        const loginResponse = await fetch('http://localhost:3001/api/v1/public/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: '1@1.com',
                password: 'Admin123!'
            })
        });
        
        console.log(`Login API status: ${loginResponse.status}`);
        
        const loginData = await loginResponse.text();
        console.log('Login response:', loginData);
        
        if (loginResponse.status === 200) {
            console.log('✅ Login API is working');
            
            // Check for Set-Cookie headers
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                console.log('🍪 Cookies set:', cookies);
            } else {
                console.log('⚠️  No cookies set in response');
            }
        } else {
            console.log('❌ Login API failed');
        }
        
        // Step 4: Test /me endpoint
        console.log('\n4. Testing /me endpoint...');
        const meResponse = await fetch('http://localhost:3001/api/v1/user/me', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log(`/me endpoint status: ${meResponse.status}`);
        const meData = await meResponse.text();
        console.log('/me response:', meData);
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
    }
}

testLogin();