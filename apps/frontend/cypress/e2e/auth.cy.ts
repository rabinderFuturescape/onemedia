describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('redirects to login page when accessing protected route', () => {
    // Visit a protected route
    cy.visit('/dashboard');

    // Should be redirected to login page
    cy.url().should('include', '/auth/login');
    cy.contains('Sign in to your account').should('be.visible');
  });

  it('shows error message for invalid credentials', () => {
    // Mock the onesso authentication endpoint to return an error
    cy.intercept('POST', '**/api/auth/callback/onesso', {
      statusCode: 401,
      body: {
        error: 'Invalid credentials',
      },
    }).as('loginRequest');

    // Visit login page
    cy.visit('/auth/login');

    // Click login button
    cy.contains('Sign in with onesso').click();

    // Wait for the login request to complete
    cy.wait('@loginRequest');

    // Should show error message
    cy.contains('Authentication failed').should('be.visible');
  });

  it('successfully logs in and redirects to dashboard', () => {
    // Mock the onesso authentication endpoint to return success
    cy.intercept('POST', '**/api/auth/callback/onesso', {
      statusCode: 200,
      body: {
        user: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'USER',
        },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
      },
    }).as('loginRequest');

    // Mock the user profile endpoint
    cy.intercept('GET', '**/api/user/self', {
      statusCode: 200,
      body: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        tier: 'PRO',
      },
    }).as('profileRequest');

    // Visit login page
    cy.visit('/auth/login');

    // Click login button
    cy.contains('Sign in with onesso').click();

    // Wait for the login request to complete
    cy.wait('@loginRequest');

    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard');

    // Wait for the profile request to complete
    cy.wait('@profileRequest');

    // Should show user name in the header
    cy.contains('Test User').should('be.visible');
  });

  it('logs out successfully', () => {
    // Mock the authentication state
    cy.window().then((win) => {
      win.localStorage.setItem('next-auth.session-token', 'mock-token');
    });

    // Mock the user profile endpoint
    cy.intercept('GET', '**/api/user/self', {
      statusCode: 200,
      body: {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        tier: 'PRO',
      },
    }).as('profileRequest');

    // Mock the logout endpoint
    cy.intercept('POST', '**/api/auth/signout', {
      statusCode: 200,
      body: {
        success: true,
      },
    }).as('logoutRequest');

    // Visit dashboard
    cy.visit('/dashboard');

    // Wait for the profile request to complete
    cy.wait('@profileRequest');

    // Click user menu
    cy.get('[data-testid="user-menu"]').click();

    // Click logout button
    cy.contains('Sign out').click();

    // Wait for the logout request to complete
    cy.wait('@logoutRequest');

    // Should be redirected to login page
    cy.url().should('include', '/auth/login');
  });

  it('refreshes token when expired', () => {
    // Mock the authentication state with expired token
    cy.window().then((win) => {
      win.localStorage.setItem('next-auth.session-token', 'expired-token');
    });

    // Mock the token refresh endpoint
    cy.intercept('POST', '**/api/auth/refresh-token', {
      statusCode: 200,
      body: {
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      },
    }).as('refreshRequest');

    // Mock the user profile endpoint to first return 401, then success after refresh
    cy.intercept('GET', '**/api/user/self', (req) => {
      if (req.headers.authorization === 'Bearer expired-token') {
        req.reply({
          statusCode: 401,
          body: {
            error: 'Token expired',
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
            tier: 'PRO',
          },
        });
      }
    }).as('profileRequest');

    // Visit dashboard
    cy.visit('/dashboard');

    // Wait for the profile request to fail and trigger token refresh
    cy.wait('@profileRequest');
    cy.wait('@refreshRequest');

    // Wait for the profile request to succeed with new token
    cy.wait('@profileRequest');

    // Should show user name in the header
    cy.contains('Test User').should('be.visible');
  });
});
