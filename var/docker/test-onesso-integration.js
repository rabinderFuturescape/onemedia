const axios = require('axios');

async function testOnessoIntegration() {
  try {
    console.log('Testing onesso integration...');
    
    // Step 1: Check if the mock onesso service is running
    console.log('\nStep 1: Checking if the mock onesso service is running...');
    const healthResponse = await axios.get('http://localhost:3002/api/health');
    console.log('Health check response:', healthResponse.data);
    
    // Step 2: Test the login endpoint
    console.log('\nStep 2: Testing the login endpoint...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    console.log('Login response:', loginResponse.data);
    
    // Step 3: Test the user info endpoint
    console.log('\nStep 3: Testing the user info endpoint...');
    const userInfoResponse = await axios.get('http://localhost:3002/api/auth/me', {
      headers: {
        Authorization: `Bearer ${loginResponse.data.access_token}`
      }
    });
    console.log('User info response:', userInfoResponse.data);
    
    // Step 4: Test the onesso login flow
    console.log('\nStep 4: Testing the onesso login flow...');
    const onessoLoginResponse = await axios.get('http://localhost:3002/api/auth/login/onesso', {
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    }).catch(error => {
      if (error.response && error.response.status === 302) {
        return error.response;
      }
      throw error;
    });
    
    console.log('onesso login redirect URL:', onessoLoginResponse.headers.location);
    
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Error testing onesso integration:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testOnessoIntegration();
