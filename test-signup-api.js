const fetch = require('node-fetch');

async function testSignupAPI() {
  console.log('Testing signup API at https://ezeditapp.fly.dev/api/auth/signup');

  try {
    const response = await fetch('https://ezeditapp.fly.dev/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`, // Unique email to avoid conflicts
        password: 'TestPassword123!',
        company: 'Test Company',
        plan: 'FREE'
      })
    });

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Status Text: ${response.statusText}`);

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Signup test PASSED - API is working correctly');
      return true;
    } else {
      console.log('❌ Signup test FAILED - API returned error');
      return false;
    }

  } catch (error) {
    console.log('❌ Signup test FAILED with network error:', error.message);
    return false;
  }
}

// Run the test
testSignupAPI().then(success => {
  process.exit(success ? 0 : 1);
});