import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Define custom metrics
const authFailures = new Counter('auth_failures');
const successRate = new Rate('success_rate');
const apiLatency = new Trend('api_latency');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://staging.postiz.app';
const API_URL = `${BASE_URL}/api`;

// Test users data
const users = new SharedArray('users', function() {
  return [
    { username: 'test-user1@example.com', password: 'Password123!' },
    { username: 'test-user2@example.com', password: 'Password123!' },
    { username: 'test-user3@example.com', password: 'Password123!' },
  ];
});

// Test data
const testPosts = [
  { title: 'Test Post 1', content: 'This is a test post content 1' },
  { title: 'Test Post 2', content: 'This is a test post content 2' },
  { title: 'Test Post 3', content: 'This is a test post content 3' },
];

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },
    // Load test
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 users over 2 minutes
        { duration: '5m', target: 50 },  // Stay at 50 users for 5 minutes
        { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
      ],
      tags: { test_type: 'load' },
    },
    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
        { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
        { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
        { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
      ],
      tags: { test_type: 'stress' },
    },
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },    // 0 users for 10 seconds
        { duration: '1m', target: 200 },   // Spike to 200 users over 1 minute
        { duration: '3m', target: 200 },   // Stay at 200 users for 3 minutes
        { duration: '1m', target: 0 },     // Ramp down to 0 users over 1 minute
      ],
      tags: { test_type: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    'success_rate': ['rate>0.95'],    // Success rate should be above 95%
    'api_latency': ['p(95)<300'],     // 95% of API requests should be below 300ms
  },
};

// Setup function - runs once per VU
export function setup() {
  // Create test data if needed
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once at the end of the test
export function teardown(data) {
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test ended at: ${new Date().toISOString()}`);
}

// Default function - main test logic
export default function() {
  // Select a random user
  const user = randomItem(users);
  
  // Login and get token
  const loginRes = login(user);
  
  // If login successful, perform user actions
  if (loginRes.token) {
    // Perform a series of actions with authentication
    const token = loginRes.token;
    
    // Get user profile
    getUserProfile(token);
    sleep(1);
    
    // Get posts
    const posts = getPosts(token);
    sleep(1);
    
    // Create a post
    if (Math.random() < 0.3) { // 30% chance to create a post
      const postData = randomItem(testPosts);
      const postId = createPost(token, postData);
      
      if (postId) {
        // Get post details
        getPostDetails(token, postId);
        sleep(1);
        
        // Update post
        if (Math.random() < 0.5) { // 50% chance to update the post
          updatePost(token, postId, { ...postData, title: `Updated: ${postData.title}` });
          sleep(1);
        }
        
        // Delete post
        if (Math.random() < 0.2) { // 20% chance to delete the post
          deletePost(token, postId);
        }
      }
    }
    
    // Logout
    logout(token);
  }
  
  // Sleep between iterations
  sleep(3);
}

// Helper functions
function login(user) {
  const url = `${API_URL}/auth/login`;
  const payload = JSON.stringify({
    email: user.username,
    password: user.password,
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const startTime = new Date();
  const res = http.post(url, payload, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });
  
  successRate.add(success);
  
  if (!success) {
    authFailures.add(1);
    console.log(`Login failed: ${res.status} ${res.body}`);
    return { token: null };
  }
  
  return { token: res.json('token') };
}

function getUserProfile(token) {
  const url = `${API_URL}/user/self`;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.get(url, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'get profile status is 200': (r) => r.status === 200,
    'profile has id': (r) => r.json('id') !== undefined,
  });
  
  successRate.add(success);
  
  return success ? res.json() : null;
}

function getPosts(token) {
  const url = `${API_URL}/posts`;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.get(url, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'get posts status is 200': (r) => r.status === 200,
    'posts is an array': (r) => Array.isArray(r.json()),
  });
  
  successRate.add(success);
  
  return success ? res.json() : [];
}

function createPost(token, postData) {
  const url = `${API_URL}/posts`;
  const payload = JSON.stringify(postData);
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.post(url, payload, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'create post status is 201': (r) => r.status === 201,
    'created post has id': (r) => r.json('id') !== undefined,
  });
  
  successRate.add(success);
  
  return success ? res.json('id') : null;
}

function getPostDetails(token, postId) {
  const url = `${API_URL}/posts/${postId}`;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.get(url, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'get post details status is 200': (r) => r.status === 200,
    'post details has id': (r) => r.json('id') === postId,
  });
  
  successRate.add(success);
  
  return success ? res.json() : null;
}

function updatePost(token, postId, postData) {
  const url = `${API_URL}/posts/${postId}`;
  const payload = JSON.stringify(postData);
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.put(url, payload, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'update post status is 200': (r) => r.status === 200,
    'updated post has id': (r) => r.json('id') === postId,
  });
  
  successRate.add(success);
  
  return success;
}

function deletePost(token, postId) {
  const url = `${API_URL}/posts/${postId}`;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.del(url, null, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'delete post status is 204': (r) => r.status === 204,
  });
  
  successRate.add(success);
  
  return success;
}

function logout(token) {
  const url = `${API_URL}/auth/logout`;
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const startTime = new Date();
  const res = http.post(url, null, params);
  const endTime = new Date();
  
  apiLatency.add(endTime - startTime);
  
  const success = check(res, {
    'logout status is 200': (r) => r.status === 200,
  });
  
  successRate.add(success);
  
  return success;
}
