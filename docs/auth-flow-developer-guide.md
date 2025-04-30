# Authentication Flow Developer Guide

This guide provides detailed information about the authentication flow in the application, including how to integrate with the auth microservice, handle tokens, and implement authentication in your components.

## Architecture Overview

The authentication system is implemented as a microservice that handles all authentication-related functionality. The main application communicates with the auth microservice through a client service.

### Components

1. **Auth Microservice**: Handles user authentication, token generation, and validation
2. **Auth Client**: Communicates with the auth microservice from the main application
3. **Auth Middleware**: Validates tokens and attaches user information to requests
4. **Frontend Auth Components**: Handle user authentication UI and token storage

## Integration with Auth Microservice

### Backend Integration

To integrate with the auth microservice in your backend service, follow these steps:

1. Import the `AuthClientModule` in your module:

```typescript
import { Module } from '@nestjs/common';
import { AuthClientModule } from '@gitroom/backend/services/auth-client/auth-client.module';

@Module({
  imports: [AuthClientModule],
  // ...
})
export class YourModule {}
```

2. Inject the `AuthClientService` in your service:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthClientService } from '@gitroom/backend/services/auth-client/auth-client.service';

@Injectable()
export class YourService {
  constructor(private authClientService: AuthClientService) {}

  async someMethod() {
    // Use auth client service
    const user = await this.authClientService.validateToken(token);
    // ...
  }
}
```

3. Use the auth middleware to protect your routes:

```typescript
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from '@gitroom/backend/services/auth/auth.middleware';

@Module({
  // ...
})
export class YourModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'your-protected-route', method: RequestMethod.ALL });
  }
}
```

### Frontend Integration

To integrate with the auth microservice in your frontend application, follow these steps:

1. Import the auth service in your component:

```typescript
import { AuthService } from '@/services/auth.service';

export class YourComponent {
  constructor(private authService: AuthService) {}

  async login(email: string, password: string) {
    try {
      const result = await this.authService.login(email, password);
      // Handle successful login
    } catch (error) {
      // Handle login error
    }
  }
}
```

2. Use the auth guard to protect your routes:

```typescript
import { AuthGuard } from '@/guards/auth.guard';

const routes: Routes = [
  {
    path: 'protected',
    component: ProtectedComponent,
    canActivate: [AuthGuard],
  },
];
```

## Authentication Flows

### Local Authentication

The local authentication flow uses email and password for authentication:

1. User enters email and password in the login form
2. Frontend sends login request to backend
3. Backend forwards request to auth microservice
4. Auth microservice validates credentials and generates tokens
5. Tokens are returned to frontend
6. Frontend stores tokens and redirects user to protected area

```typescript
// Frontend login example
async login(email: string, password: string) {
  try {
    const response = await this.http.post('/api/auth/login', {
      email,
      password,
    });
    
    if (response.data.login) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Redirect to protected area
      this.router.navigate(['/dashboard']);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

### OAuth Authentication

The OAuth authentication flow uses third-party providers for authentication:

1. User clicks on OAuth provider button
2. Frontend requests OAuth provider auth link from backend
3. Frontend redirects user to OAuth provider
4. User authenticates with OAuth provider
5. OAuth provider redirects back to application with auth code
6. Frontend sends auth code to backend
7. Backend forwards auth code to auth microservice
8. Auth microservice exchanges auth code for OAuth token
9. Auth microservice validates OAuth token and creates or retrieves user account
10. Tokens are returned to frontend
11. Frontend stores tokens and redirects user to protected area

```typescript
// Frontend OAuth login example
async loginWithGoogle() {
  try {
    // Get OAuth provider auth link
    const response = await this.http.get('/api/auth/provider/GOOGLE');
    
    // Redirect to OAuth provider
    window.location.href = response.data.link;
  } catch (error) {
    console.error('OAuth login failed:', error);
  }
}

// Handle OAuth callback
async handleOAuthCallback(code: string, provider: string) {
  try {
    const response = await this.http.post(`/api/auth/provider/${provider}/callback`, {
      code,
    });
    
    if (response.data.login) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Redirect to protected area
      this.router.navigate(['/dashboard']);
    }
  } catch (error) {
    console.error('OAuth callback failed:', error);
  }
}
```

### Wallet Authentication

The wallet authentication flow uses cryptocurrency wallets for authentication:

1. User clicks on wallet login button
2. Frontend requests challenge from backend
3. Frontend prompts user to sign challenge with wallet
4. User signs challenge with wallet
5. Frontend sends signed challenge to backend
6. Backend forwards signed challenge to auth microservice
7. Auth microservice verifies signature and creates or retrieves user account
8. Tokens are returned to frontend
9. Frontend stores tokens and redirects user to protected area

```typescript
// Frontend wallet login example
async loginWithWallet() {
  try {
    // Connect to wallet
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    
    // Get challenge
    const challengeResponse = await this.http.post('/api/auth/wallet/challenge', {
      address,
    });
    
    // Sign challenge
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [challengeResponse.data.challenge, address],
    });
    
    // Verify signature
    const verifyResponse = await this.http.post('/api/auth/wallet/verify', {
      address,
      signature,
    });
    
    if (verifyResponse.data.accessToken) {
      // Store tokens
      localStorage.setItem('accessToken', verifyResponse.data.accessToken);
      localStorage.setItem('refreshToken', verifyResponse.data.refreshToken);
      
      // Redirect to protected area
      this.router.navigate(['/dashboard']);
    }
  } catch (error) {
    console.error('Wallet login failed:', error);
  }
}
```

## Token Management

### Token Storage

Tokens should be stored securely in the frontend application. For web applications, there are several options:

1. **HTTP-only cookies**: Most secure option, but requires server-side rendering
2. **Local storage**: Convenient but vulnerable to XSS attacks
3. **Session storage**: Similar to local storage but cleared when the browser is closed
4. **In-memory storage**: Secure but lost on page refresh

Example of token storage using local storage:

```typescript
// Store tokens
function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

// Get access token
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

// Get refresh token
function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

// Clear tokens
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

### Token Refresh

Access tokens have a limited lifetime and need to be refreshed when they expire. The refresh flow is as follows:

1. Frontend detects that access token has expired (e.g., 401 response from API)
2. Frontend sends refresh request with refresh token
3. Backend forwards request to auth microservice
4. Auth microservice validates refresh token and generates new tokens
5. New tokens are returned to frontend
6. Frontend stores new tokens and retries the original request

```typescript
// Frontend token refresh example
async refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      // No refresh token, redirect to login
      this.router.navigate(['/login']);
      return null;
    }
    
    const response = await this.http.post('/api/auth/refresh', {
      refreshToken,
    });
    
    if (response.data.accessToken) {
      // Store new tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Clear tokens and redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
    
    return null;
  }
}
```

## Multi-Factor Authentication

### Enabling MFA

To enable MFA for a user, follow these steps:

1. User navigates to MFA settings
2. Backend requests MFA secret from auth microservice
3. Backend returns MFA secret and QR code to frontend
4. Frontend displays QR code to user
5. User scans QR code with authenticator app
6. User enters token from authenticator app
7. Frontend sends token and secret to backend
8. Backend forwards request to auth microservice
9. Auth microservice verifies token and enables MFA for user
10. Backend returns backup codes to frontend
11. Frontend displays backup codes to user

```typescript
// Frontend MFA setup example
async setupMFA() {
  try {
    // Generate MFA secret
    const generateResponse = await this.http.post('/api/auth/mfa/generate', {}, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
    
    // Display QR code to user
    this.qrCodeUrl = generateResponse.data.qrCodeUrl;
    this.secret = generateResponse.data.secret;
    
    // User scans QR code and enters token
    // ...
    
    // Verify token and enable MFA
    const verifyResponse = await this.http.post('/api/auth/mfa/verify', {
      token: this.token,
      secret: this.secret,
    }, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
    
    if (verifyResponse.data.enabled) {
      // Display backup codes to user
      this.backupCodes = verifyResponse.data.backupCodes;
    }
  } catch (error) {
    console.error('MFA setup failed:', error);
  }
}
```

### MFA Login Flow

When MFA is enabled, the login flow is modified as follows:

1. User enters email and password in the login form
2. Frontend sends login request to backend
3. Backend forwards request to auth microservice
4. Auth microservice validates credentials and checks if MFA is enabled
5. If MFA is enabled, auth microservice returns a temporary token
6. Frontend prompts user for MFA token
7. User enters token from authenticator app
8. Frontend sends token and temporary token to backend
9. Backend forwards request to auth microservice
10. Auth microservice verifies token and generates tokens
11. Tokens are returned to frontend
12. Frontend stores tokens and redirects user to protected area

```typescript
// Frontend MFA login example
async login(email: string, password: string) {
  try {
    const response = await this.http.post('/api/auth/login', {
      email,
      password,
    });
    
    if (response.data.mfaRequired) {
      // Store temporary token
      this.tempToken = response.data.tempToken;
      
      // Show MFA input
      this.showMfaInput = true;
    } else if (response.data.login) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Redirect to protected area
      this.router.navigate(['/dashboard']);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

async verifyMfa(token: string) {
  try {
    const response = await this.http.post('/api/auth/mfa/verify-login', {
      token,
      tempToken: this.tempToken,
    });
    
    if (response.data.login) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Redirect to protected area
      this.router.navigate(['/dashboard']);
    }
  } catch (error) {
    console.error('MFA verification failed:', error);
  }
}
```

## Security Best Practices

### HTTPS

All communication with the auth microservice should be over HTTPS to prevent man-in-the-middle attacks.

### Token Security

- Access tokens should have a short lifetime (e.g., 1 day)
- Refresh tokens should have a longer lifetime (e.g., 7 days)
- Tokens should be stored securely (e.g., HTTP-only cookies or secure local storage)
- Tokens should be invalidated on logout

### Password Security

- Passwords should be hashed using a strong algorithm (e.g., bcrypt)
- Password requirements should be enforced (e.g., minimum length, complexity)
- Password reset should use a secure token with a short lifetime

### Rate Limiting

- Authentication endpoints should be rate-limited to prevent brute force attacks
- Failed login attempts should be tracked and suspicious activity should be blocked

### Error Messages

- Error messages should be generic to prevent information leakage
- Detailed error information should be logged for debugging but not exposed to users

## Troubleshooting

### Common Issues

1. **Token expired**: Access tokens have a limited lifetime and need to be refreshed
2. **Invalid token**: Token may be malformed or tampered with
3. **User not found**: User account may have been deleted or deactivated
4. **Rate limit exceeded**: Too many requests in a short period of time

### Debugging

1. Check the auth microservice logs for detailed error information
2. Verify that the correct tokens are being sent in requests
3. Check that the auth microservice is running and accessible
4. Verify that the environment variables are correctly configured

## Conclusion

This guide provides a comprehensive overview of the authentication flow in the application. By following these guidelines, you can integrate with the auth microservice and implement secure authentication in your components.
