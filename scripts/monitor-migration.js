/**
 * Migration Monitoring Script
 * 
 * This script monitors the authentication system after migration to ensure everything is working correctly.
 * It tracks authentication success/failure rates and reports any issues.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Auth service URL
const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000/api';

// Monitoring log file
const logFile = path.join(__dirname, 'monitoring.log');
const alertLogFile = path.join(__dirname, 'alerts.log');

// Monitoring configuration
const config = {
  interval: process.env.MONITOR_INTERVAL || 60000, // 1 minute
  duration: process.env.MONITOR_DURATION || 86400000, // 24 hours
  alertThreshold: process.env.ALERT_THRESHOLD || 0.1, // 10% failure rate
};

// Monitoring metrics
const metrics = {
  authAttempts: 0,
  authSuccess: 0,
  authFailure: 0,
  tokenValidations: 0,
  tokenValidationSuccess: 0,
  tokenValidationFailure: 0,
  startTime: Date.now(),
};

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

// Helper function to log alerts
function logAlert(message) {
  const timestamp = new Date().toISOString();
  const alertMessage = `[${timestamp}] ALERT: ${message}\n`;
  console.error(alertMessage);
  fs.appendFileSync(alertLogFile, alertMessage);
  
  // Send alert (e.g., email, Slack, etc.)
  // This is a placeholder for actual alert implementation
  console.error('ALERT:', message);
}

// Fetch metrics from auth service
async function fetchAuthServiceMetrics() {
  try {
    const response = await axios.get(`${authServiceUrl}/metrics`, {
      headers: {
        'x-api-key': process.env.METRICS_API_KEY,
      },
    });
    
    return response.data;
  } catch (error) {
    log(`Error fetching auth service metrics: ${error.message}`);
    return null;
  }
}

// Check authentication success rate
function checkAuthSuccessRate() {
  if (metrics.authAttempts === 0) {
    return;
  }
  
  const successRate = metrics.authSuccess / metrics.authAttempts;
  const failureRate = metrics.authFailure / metrics.authAttempts;
  
  log(`Authentication success rate: ${(successRate * 100).toFixed(2)}%`);
  log(`Authentication failure rate: ${(failureRate * 100).toFixed(2)}%`);
  
  if (failureRate > config.alertThreshold) {
    logAlert(`High authentication failure rate: ${(failureRate * 100).toFixed(2)}%`);
  }
}

// Check token validation success rate
function checkTokenValidationRate() {
  if (metrics.tokenValidations === 0) {
    return;
  }
  
  const successRate = metrics.tokenValidationSuccess / metrics.tokenValidations;
  const failureRate = metrics.tokenValidationFailure / metrics.tokenValidations;
  
  log(`Token validation success rate: ${(successRate * 100).toFixed(2)}%`);
  log(`Token validation failure rate: ${(failureRate * 100).toFixed(2)}%`);
  
  if (failureRate > config.alertThreshold) {
    logAlert(`High token validation failure rate: ${(failureRate * 100).toFixed(2)}%`);
  }
}

// Update metrics from Prometheus data
function updateMetricsFromPrometheus(prometheusData) {
  if (!prometheusData) {
    return;
  }
  
  // Parse Prometheus metrics (simplified)
  const lines = prometheusData.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    
    if (line.startsWith('auth_attempts_total')) {
      const match = line.match(/auth_attempts_total{[^}]*}\s+(\d+)/);
      if (match) {
        metrics.authAttempts = parseInt(match[1], 10);
      }
    }
    
    if (line.startsWith('auth_success_total')) {
      const match = line.match(/auth_success_total{[^}]*}\s+(\d+)/);
      if (match) {
        metrics.authSuccess = parseInt(match[1], 10);
      }
    }
    
    if (line.startsWith('auth_failure_total')) {
      const match = line.match(/auth_failure_total{[^}]*}\s+(\d+)/);
      if (match) {
        metrics.authFailure = parseInt(match[1], 10);
      }
    }
    
    if (line.startsWith('token_validations_total{result="valid"}')) {
      const match = line.match(/token_validations_total{[^}]*}\s+(\d+)/);
      if (match) {
        metrics.tokenValidationSuccess = parseInt(match[1], 10);
      }
    }
    
    if (line.startsWith('token_validations_total{result="invalid"}')) {
      const match = line.match(/token_validations_total{[^}]*}\s+(\d+)/);
      if (match) {
        metrics.tokenValidationFailure = parseInt(match[1], 10);
      }
    }
  }
  
  metrics.tokenValidations = metrics.tokenValidationSuccess + metrics.tokenValidationFailure;
}

// Test authentication with test user
async function testAuthentication() {
  try {
    const response = await axios.post(`${authServiceUrl}/auth/login`, {
      email: process.env.TEST_USER_EMAIL,
      password: process.env.TEST_USER_PASSWORD,
      provider: 'LOCAL',
    });
    
    if (response.status === 200 && response.data.login === true) {
      log('Test authentication successful');
      return true;
    } else {
      log('Test authentication failed: Unexpected response');
      return false;
    }
  } catch (error) {
    log(`Test authentication failed: ${error.message}`);
    return false;
  }
}

// Test token validation
async function testTokenValidation(token) {
  try {
    const response = await axios.get(`${authServiceUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.status === 200 && response.data.user) {
      log('Test token validation successful');
      return true;
    } else {
      log('Test token validation failed: Unexpected response');
      return false;
    }
  } catch (error) {
    log(`Test token validation failed: ${error.message}`);
    return false;
  }
}

// Main monitoring function
async function monitor() {
  log('Starting migration monitoring...');
  
  const endTime = Date.now() + config.duration;
  let interval;
  
  try {
    interval = setInterval(async () => {
      log('Running monitoring check...');
      
      // Fetch metrics from auth service
      const prometheusData = await fetchAuthServiceMetrics();
      updateMetricsFromPrometheus(prometheusData);
      
      // Check metrics
      checkAuthSuccessRate();
      checkTokenValidationRate();
      
      // Run test authentication
      if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
        const authSuccess = await testAuthentication();
        
        if (authSuccess) {
          // Get token from response
          const token = authSuccess.accessToken;
          
          // Test token validation
          if (token) {
            await testTokenValidation(token);
          }
        }
      }
      
      // Check if monitoring duration has elapsed
      if (Date.now() >= endTime) {
        clearInterval(interval);
        log('Monitoring completed!');
        
        // Final report
        const duration = (Date.now() - metrics.startTime) / 1000 / 60; // minutes
        log(`Monitoring duration: ${duration.toFixed(2)} minutes`);
        log(`Total authentication attempts: ${metrics.authAttempts}`);
        log(`Authentication success rate: ${((metrics.authSuccess / metrics.authAttempts) * 100).toFixed(2)}%`);
        log(`Token validation success rate: ${((metrics.tokenValidationSuccess / metrics.tokenValidations) * 100).toFixed(2)}%`);
        
        process.exit(0);
      }
    }, config.interval);
  } catch (error) {
    log(`Error during monitoring: ${error.message}`);
    clearInterval(interval);
    process.exit(1);
  }
}

// Run the monitoring
monitor().catch((error) => {
  console.error('Unhandled error during monitoring:', error);
  process.exit(1);
});
