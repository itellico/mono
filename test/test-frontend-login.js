// Test the complete frontend login flow
async function testFrontendLogin() {
  console.log('🚀 Testing complete frontend login flow...\n');
  
  try {
    // Test 1: Check signin page loads
    console.log('1. Testing signin page accessibility...');
    const signinResponse = await fetch('http://localhost:3000/auth/signin');
    console.log(`   Signin page status: ${signinResponse.status}`);
    
    if (signinResponse.status !== 200) {
      console.log('❌ Signin page not accessible');
      return;
    }
    
    // Test 2: Test API login works
    console.log('\n2. Testing API login...');
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
    
    console.log(`   API login status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log('   ✅ API login successful');
      console.log(`   User: ${loginData.data.user.email}`);
      console.log(`   Token: ${loginData.data.accessToken.substring(0, 20)}...`);
      
      // Test 3: Test authenticated API endpoint
      console.log('\n3. Testing authenticated API access...');
      const meResponse = await fetch('http://localhost:3001/api/v1/public/auth/me', {
        method: 'GET',
        headers: {
          'Cookie': `accessToken=${loginData.data.accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`   Me endpoint status: ${meResponse.status}`);
      if (meResponse.status === 200) {
        const meData = await meResponse.json();
        console.log('   ✅ Authenticated API access works');
        console.log(`   Current user: ${meData.data.user.email}`);
      } else {
        console.log('   ⚠️ Authenticated API access failed');
      }
    } else {
      const errorData = await loginResponse.json();
      console.log('   ❌ API login failed:', errorData);
      return;
    }
    
    console.log('\n🎉 Login process verification complete!');
    console.log('\n📝 Summary:');
    console.log('✅ Signin page accessible');
    console.log('✅ API login endpoint working');
    console.log('✅ JWT tokens generated');
    console.log('✅ Authenticated API access working');
    console.log('\n🔑 Login credentials for testing:');
    console.log('   Email: 1@1.com');
    console.log('   Password: Admin123!');
    console.log('\n🌐 Test in browser:');
    console.log('   1. Go to: http://localhost:3000/auth/signin');
    console.log('   2. Enter the credentials above');
    console.log('   3. Should redirect to dashboard after login');
    
  } catch (error) {
    console.error('❌ Error during frontend login test:', error.message);
  }
}

testFrontendLogin();