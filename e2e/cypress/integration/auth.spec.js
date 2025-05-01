/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Visit the home page
    cy.visit('/');
  });

  it('should redirect unauthenticated user to login page', () => {
    // Check that we're redirected to the login page
    cy.url().should('include', '/auth/login');
    
    // Verify login page elements
    cy.get('h1').should('contain', 'Sign in to your account');
    cy.get('button').should('contain', 'Sign in with OneSSO');
  });

  it('should allow user to sign in with email and password', () => {
    // Go to login page
    cy.visit('/auth/login');
    
    // Fill in login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Check that we're redirected to the dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('should show error message for invalid credentials', () => {
    // Go to login page
    cy.visit('/auth/login');
    
    // Fill in login form with invalid credentials
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('wrong-password');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Check that error message is displayed
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
    
    // Verify we're still on the login page
    cy.url().should('include', '/auth/login');
  });

  it('should allow user to sign in with OneSSO', () => {
    // Go to login page
    cy.visit('/auth/login');
    
    // Click on "Sign in with OneSSO" button
    cy.get('button').contains('Sign in with OneSSO').click();
    
    // We should be redirected to OneSSO login page
    cy.url().should('include', '/auth/oauth');
    
    // Mock the OAuth flow (since we can't test the actual OneSSO login in E2E tests)
    // This is a simplified version - in a real test, you'd need to intercept the OAuth redirect
    cy.window().then((win) => {
      win.postMessage(
        {
          type: 'OAUTH_CALLBACK',
          payload: {
            code: 'mock-auth-code',
            state: 'mock-state',
          },
        },
        '*'
      );
    });
    
    // Check that we're redirected to the dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('should allow user to sign out', () => {
    // First, log in
    cy.login('test@example.com', 'password123');
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard');
    
    // Click on user menu
    cy.get('[data-testid="user-menu"]').click();
    
    // Click on sign out button
    cy.get('[data-testid="sign-out"]').click();
    
    // Check that we're redirected to the login page
    cy.url().should('include', '/auth/login');
    
    // Verify login page elements
    cy.get('h1').should('contain', 'Sign in to your account');
  });

  it('should maintain authentication state across page reloads', () => {
    // First, log in
    cy.login('test@example.com', 'password123');
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard');
    
    // Reload the page
    cy.reload();
    
    // Verify we're still on the dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user is still logged in
    cy.get('[data-testid="user-menu"]').should('exist');
  });

  it('should redirect to the original URL after login', () => {
    // Try to access a protected page
    cy.visit('/settings');
    
    // We should be redirected to login
    cy.url().should('include', '/auth/login');
    
    // Log in
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // We should be redirected back to the original URL
    cy.url().should('include', '/settings');
  });

  it('should handle token refresh', () => {
    // First, log in
    cy.login('test@example.com', 'password123');
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard');
    
    // Mock an expired token
    cy.window().then((win) => {
      // Get the current time in seconds
      const now = Math.floor(Date.now() / 1000);
      
      // Set the token expiry to a time in the past
      win.localStorage.setItem('tokenExpiry', now - 3600);
    });
    
    // Make a request that would trigger a token refresh
    cy.visit('/api/user/profile');
    
    // Verify the token was refreshed
    cy.window().then((win) => {
      const tokenExpiry = win.localStorage.getItem('tokenExpiry');
      const now = Math.floor(Date.now() / 1000);
      
      // The new token expiry should be in the future
      expect(parseInt(tokenExpiry)).to.be.greaterThan(now);
    });
  });
});

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/auth/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});
