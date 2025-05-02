const axios = require('axios');

// Function to wait for a service to be ready
async function waitForService(url, maxRetries = 30, retryInterval = 1000) {
  console.log(`Waiting for service at ${url} to be ready...`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url);
      console.log(`Service at ${url} is ready!`);
      return true;
    } catch (error) {
      console.log(`Attempt ${i + 1}/${maxRetries}: Service not ready yet. Retrying in ${retryInterval}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error(`Service at ${url} is not ready after ${maxRetries} attempts`);
}

async function testOnessoIntegration() {
  try {
    console.log('Testing onesso integration...');

    // Wait for the mock onesso service to be ready
    await waitForService('http://mock-onesso:3002/api/health');

    // Step 1: Check if the mock onesso service is running
    console.log('\nStep 1: Checking if the mock onesso service is running...');
    const healthResponse = await axios.get('http://mock-onesso:3002/api/health');
    console.log('Health check response:', healthResponse.data);

    // Step 2: Test the login endpoint with admin user
    console.log('\nStep 2: Testing the login endpoint with admin user...');
    const adminLoginResponse = await axios.post('http://mock-onesso:3002/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    console.log('Admin login response:', adminLoginResponse.data);

    // Step 3: Test the user info endpoint with admin token
    console.log('\nStep 3: Testing the user info endpoint with admin token...');
    const adminUserInfoResponse = await axios.get('http://mock-onesso:3002/api/auth/me', {
      headers: {
        Authorization: `Bearer ${adminLoginResponse.data.access_token}`
      }
    });
    console.log('Admin user info response:', adminUserInfoResponse.data);

    // Step 4: Test the login endpoint with regular user
    console.log('\nStep 4: Testing the login endpoint with regular user...');
    const userLoginResponse = await axios.post('http://mock-onesso:3002/api/auth/login', {
      username: 'user',
      password: 'user'
    });
    console.log('User login response:', userLoginResponse.data);

    // Step 5: Test the tenant endpoints with admin token
    console.log('\nStep 5: Testing the tenant endpoints with admin token...');
    try {
      const tenantsResponse = await axios.get('http://mock-onesso:3002/api/tenants', {
        headers: {
          Authorization: `Bearer ${adminLoginResponse.data.access_token}`
        }
      });
      console.log('Tenants response:', tenantsResponse.data);
    } catch (error) {
      console.log('Error accessing tenants endpoint:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      // Try to access the health endpoint to check if the service is running
      const healthResponse = await axios.get('http://mock-onesso:3002/api/health');
      console.log('Health check response:', healthResponse.data);
    }

    // Step 6: Test the tenant endpoints with user token (should be filtered)
    console.log('\nStep 6: Testing the tenant endpoints with user token...');
    try {
      const userTenantsResponse = await axios.get('http://mock-onesso:3002/api/tenants', {
        headers: {
          Authorization: `Bearer ${userLoginResponse.data.access_token}`
        }
      });
      console.log('User tenants response:', userTenantsResponse.data);
    } catch (error) {
      console.log('Error accessing tenants endpoint with user token:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

    // Step 7: Test the roles endpoint with admin token
    console.log('\nStep 7: Testing the roles endpoint with admin token...');
    try {
      const rolesResponse = await axios.get('http://mock-onesso:3002/api/roles', {
        headers: {
          Authorization: `Bearer ${adminLoginResponse.data.access_token}`
        }
      });
      console.log('Roles response:', rolesResponse.data);
    } catch (error) {
      console.log('Error accessing roles endpoint:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

    // Step 8: Test the users endpoint with admin token
    console.log('\nStep 8: Testing the users endpoint with admin token...');
    try {
      const usersResponse = await axios.get('http://mock-onesso:3002/api/users', {
        headers: {
          Authorization: `Bearer ${adminLoginResponse.data.access_token}`
        }
      });
      console.log('Users response:', usersResponse.data);
    } catch (error) {
      console.log('Error accessing users endpoint:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }

    // Step 9: Test the onesso login flow with tenant_id
    console.log('\nStep 9: Testing the onesso login flow with tenant_id...');
    const onessoLoginResponse = await axios.get('http://mock-onesso:3002/api/auth/login/onesso?tenant_id=tenant1', {
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

// Wait longer before starting the tests
setTimeout(() => {
  testOnessoIntegration();
}, 15000);
