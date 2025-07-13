// Simple login test with detailed error logging
async function testLogin() {
  try {
    console.log('🔍 Testing login with 1@1.com...');
    
    const response = await fetch('http://localhost:3001/api/v1/public/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: '1@1.com',
        password: 'Admin123!'
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    const result = await response.text();
    console.log(`Response: ${result}`);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testLogin();