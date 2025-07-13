import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();