/**
 * Security Testing Script for onesso Authentication Service
 * 
 * This script performs basic security tests on the onesso service.
 * It checks for common vulnerabilities such as:
 * - Missing security headers
 * - Insecure cookie settings
 * - CSRF vulnerabilities
 * - Rate limiting bypass
 * - Token leakage
 * - Insecure redirects
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ONESSO_URL = process.env.ONESSO_URL || 'http://localhost:3002';
const LOG_FILE = path.join(__dirname, 'security-test-results.log');

// Initialize log file
fs.writeFileSync(LOG_FILE, `Security Test Results - ${new Date().toISOString()}\n\n`);

// Helper functions
function log(message, isError = false) {
  const logMessage = `[${new Date().toISOString()}] ${isError ? 'ERROR: ' : ''}${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

async function runTest(name, testFn) {
  log(`Running test: ${name}`);
  try {
    await testFn();
    log(`✅ Test passed: ${name}`);
  } catch (error) {
    log(`❌ Test failed: ${name} - ${error.message}`, true);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  log('---');
}

// Security Tests
async function testSecurityHeaders() {
  const response = await axios.get(`${ONESSO_URL}/api/auth/login/oauth`);
  
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'content-security-policy',
    'strict-transport-security',
    'x-xss-protection',
  ];
  
  const missingHeaders = requiredHeaders.filter(header => !response.headers[header]);
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
  }
}

async function testCookieSettings() {
  // We need to trigger a response that sets cookies
  try {
    await axios.post(`${ONESSO_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password',
    });
  } catch (error) {
    // We expect this to fail with 401, but we want to check the cookie settings
    if (error.response && error.response.headers['set-cookie']) {
      const cookies = error.response.headers['set-cookie'];
      
      // Check for secure flag
      if (!cookies.some(cookie => cookie.includes('Secure'))) {
        throw new Error('Cookie does not have Secure flag');
      }
      
      // Check for HttpOnly flag
      if (!cookies.some(cookie => cookie.includes('HttpOnly'))) {
        throw new Error('Cookie does not have HttpOnly flag');
      }
      
      // Check for SameSite attribute
      if (!cookies.some(cookie => cookie.includes('SameSite'))) {
        throw new Error('Cookie does not have SameSite attribute');
      }
    } else {
      throw new Error('Could not test cookie settings - no cookies set');
    }
  }
}

async function testRateLimiting() {
  const MAX_REQUESTS = 35; // Slightly more than the default rate limit
  const ENDPOINT = `${ONESSO_URL}/api/auth/login`;
  const requests = [];
  
  for (let i = 0; i < MAX_REQUESTS; i++) {
    requests.push(
      axios.post(ENDPOINT, {
        email: 'test@example.com',
        password: 'wrong-password',
      }).catch(error => error.response)
    );
  }
  
  const responses = await Promise.all(requests);
  
  // Check if any of the later requests were rate limited (status 429)
  const rateLimited = responses.some(response => response && response.status === 429);
  
  if (!rateLimited) {
    throw new Error('Rate limiting not properly enforced');
  }
}

async function testCSRFProtection() {
  // Test CSRF protection by making a POST request without CSRF token
  try {
    const response = await axios.post(
      `${ONESSO_URL}/api/auth/login`,
      {
        email: 'test@example.com',
        password: 'password',
      },
      {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Referer': 'https://malicious-site.com',
        },
      }
    );
    
    // If the request succeeds without CSRF protection, it's a vulnerability
    throw new Error('CSRF protection not properly enforced');
  } catch (error) {
    // We expect this to fail with 401 (Unauthorized) or 403 (Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // This is expected behavior
      return;
    }
    
    throw error;
  }
}

async function testOpenRedirects() {
  // Test for open redirect vulnerabilities
  try {
    const response = await axios.get(
      `${ONESSO_URL}/api/auth/login/oauth?redirect_uri=https://malicious-site.com`
    );
    
    if (response.data && response.data.url && response.data.url.includes('malicious-site.com')) {
      throw new Error('Open redirect vulnerability detected');
    }
  } catch (error) {
    // If the request fails with 400 Bad Request, it's properly validating redirects
    if (error.response && error.response.status === 400) {
      // This is expected behavior
      return;
    }
    
    throw error;
  }
}

async function testTokenLeakage() {
  // Test for token leakage in error responses
  try {
    await axios.get(`${ONESSO_URL}/api/auth/validate?token=invalid-token`);
  } catch (error) {
    if (error.response && error.response.data) {
      const responseData = JSON.stringify(error.response.data);
      
      // Check for common token patterns in error responses
      const tokenPatterns = [
        /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWT pattern
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, // UUID pattern
        /[a-zA-Z0-9]{32,}/g, // Long random string
      ];
      
      for (const pattern of tokenPatterns) {
        if (pattern.test(responseData)) {
          throw new Error('Potential token leakage in error response');
        }
      }
    }
  }
}

async function testDependencyVulnerabilities() {
  try {
    // Run npm audit to check for vulnerabilities
    const auditOutput = execSync('cd ../apps/onesso && npm audit --json', { encoding: 'utf8' });
    const auditResult = JSON.parse(auditOutput);
    
    if (auditResult.metadata.vulnerabilities.high > 0 || auditResult.metadata.vulnerabilities.critical > 0) {
      throw new Error(`Found ${auditResult.metadata.vulnerabilities.high} high and ${auditResult.metadata.vulnerabilities.critical} critical vulnerabilities`);
    }
  } catch (error) {
    if (error.stdout) {
      try {
        const auditResult = JSON.parse(error.stdout);
        throw new Error(`npm audit found vulnerabilities: ${JSON.stringify(auditResult.metadata.vulnerabilities)}`);
      } catch (parseError) {
        throw new Error(`Failed to parse npm audit output: ${error.message}`);
      }
    } else {
      throw new Error(`Failed to run npm audit: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  log('Starting security tests...');
  
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Cookie Settings', testCookieSettings);
  await runTest('Rate Limiting', testRateLimiting);
  await runTest('CSRF Protection', testCSRFProtection);
  await runTest('Open Redirects', testOpenRedirects);
  await runTest('Token Leakage', testTokenLeakage);
  await runTest('Dependency Vulnerabilities', testDependencyVulnerabilities);
  
  log('Security tests completed.');
}

// Run the tests
runAllTests().catch(error => {
  log(`Error running tests: ${error.message}`, true);
  process.exit(1);
});
