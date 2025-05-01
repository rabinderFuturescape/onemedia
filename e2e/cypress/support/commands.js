// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to login via API
Cypress.Commands.add('loginViaApi', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    // Store the token in localStorage
    localStorage.setItem('accessToken', response.body.accessToken);
    localStorage.setItem('refreshToken', response.body.refreshToken);
    
    // Calculate token expiry time (current time + expiresIn)
    const expiryTime = Math.floor(Date.now() / 1000) + response.body.expiresIn;
    localStorage.setItem('tokenExpiry', expiryTime);
    
    // Set the cookie for NextAuth.js session
    cy.setCookie('next-auth.session-token', response.body.accessToken);
  });
});

// Custom command to check if user is logged in
Cypress.Commands.add('isLoggedIn', () => {
  const accessToken = localStorage.getItem('accessToken');
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  const now = Math.floor(Date.now() / 1000);
  
  return accessToken && tokenExpiry && parseInt(tokenExpiry) > now;
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  // Clear localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  
  // Clear cookies
  cy.clearCookies();
  
  // Visit the login page
  cy.visit('/auth/login');
});
