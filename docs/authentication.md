# Authentication System Documentation

## Authentication Flow Chart
![Authentication Flow Chart](auth-flow-chart.mmd)

The above flow chart illustrates the complete authentication process including:
- Local authentication (email/password)
- Social authentication (OAuth providers)
- Wallet authentication (Web3)
- API key authentication
- Middleware processing
- Permission checking
- Error handling

### Key Components

1. **Entry Points**
   - Local authentication (email/password)
   - Social OAuth (Multiple providers)
   - Wallet connection
   - API key validation

2. **Validation Layer**
   - Credential verification
   - OAuth token validation
   - Signature verification
   - API key verification

3. **Token Management**
   - JWT generation
   - Session creation
   - Cookie management
   - Token refresh

4. **Security Layer**
   - Permission checking
   - Rate limiting
   - Error handling
   - Audit logging

5. **Response Handling**
   - Success responses
   - Error responses
   - Session management
   - Cookie setting

### Flow Description

1. **Authentication Initiation**
   - User selects authentication method
   - System routes to appropriate handler
   - Initial validation performed

2. **Provider-Specific Processing**
   - Local: Password verification
   - Social: OAuth flow
   - Wallet: Challenge-response
   - API: Key validation

3. **Common Processing**
   - User record creation/update
   - Session establishment
   - Token generation
   - Cookie setting

4. **Security Checks**
   - Middleware validation
   - Permission verification
   - Rate limit checking
   - Scope validation

5. **Response Handling**
   - Success response formatting
   - Error handling
   - Audit logging
   - Session management

## Overview
This document outlines the authentication system implemented in the Postiz/Gitroom platform, including available providers, libraries used, and implementation details.

## Authentication Libraries & Dependencies

### Core Authentication
- `jsonwebtoken` - JWT handling and verification
- `bcrypt` - Password hashing
- `crypto` - Encryption utilities

### Social Authentication SDKs
- `@atproto/api` - Bluesky authentication
- `@neynar/nodejs-sdk` - Farcaster authentication
- `twitter-api-v2` - X/Twitter authentication
- `@solana/wallet-adapter-react-ui` - Wallet authentication
- `@solana/web3.js` - Solana web3
- `googleapis` - Google OAuth

### NestJS Authentication
- `@nestjs/common` - Guards, Middleware
- `@nestjs/core` - APP_GUARD
- `@casl/ability` - RBAC/permissions system

## Authentication Providers

### Social Media Providers
- Bluesky
- Discord
- Dribbble
- Farcaster
- LinkedIn Page
- Lemmy
- Nostr
- Slack
- Threads
- TikTok
- X/Twitter
- Google (new addition)

### Core Components

#### Middleware
```typescript
- AuthMiddleware
- PublicAuthMiddleware
- PoliciesGuard
```

#### Services
```typescript
- AuthService // Core authentication
- PermissionsService // RBAC/ACL
```

## Security Features

### Authentication
- JWT-based token system
- Password hashing with bcrypt
- Fixed encryption for sensitive data
- Cookie-based auth sessions
- API key authentication
- Rate limiting on auth endpoints

### Authorization
- Role-Based Access Control (RBAC)
- Policy-based authorization
- Middleware-based auth checks
- Subscription-based access control

## Implementation Guidelines

### Adding New OAuth Provider
1. Create provider class implementing ProvidersInterface
2. Add OAuth credentials to environment variables
3. Create frontend provider component
4. Register provider in ProvidersFactory
5. Add callback handler in auth controller

Example Google Provider Implementation:
```typescript
export class GoogleProvider implements ProvidersInterface {
  generateLink() {
    // OAuth URL generation
  }

  async getToken(code: string): Promise<string> {
    // Token retrieval
  }

  async getUser(providerToken: string) {
    // User info fetching
  }
}
```

### Security Best Practices
1. Validate all OAuth state parameters
2. Secure storage of refresh tokens
3. Implement rate limiting
4. Log authentication attempts
5. Use HTTPS in production
6. Implement proper error handling
7. Regular security audits

## Environment Variables
Required environment variables for authentication:
```env
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=your_frontend_url
```

## Authentication Flow
1. User initiates auth via provider
2. Provider redirects to OAuth service
3. Service redirects back with auth code
4. Backend exchanges code for tokens
5. User info retrieved and account created/updated
6. JWT issued to user
7. Subsequent requests use JWT for authentication

## Error Handling
- Invalid credentials
- Expired tokens
- Rate limiting exceeded
- Provider API failures
- Network issues
- Invalid OAuth state

## Monitoring & Logging
- Authentication attempts
- Failed logins
- Token issues
- Provider API status
- Rate limit hits

## Future Improvements
1. Multi-factor authentication
2. Biometric authentication
3. Hardware key support
4. Enhanced session management
5. Advanced audit logging

## Related Documentation
- [Quick Start Guide](https://docs.postiz.com/quickstart)
- [API Documentation](https://docs.postiz.com)
- [Security Guidelines](https://docs.postiz.com/security)

## Support
For authentication-related issues:
- GitHub Issues
- [Discord Community](https://discord.postiz.com)
- [Documentation](https://docs.postiz.com)
