# Auth Microservice API Documentation

This document provides detailed information about the Auth Microservice API endpoints, request/response formats, and authentication flows.

## Base URL

The base URL for all API endpoints is:

```
https://api.example.com/api/auth
```

## Authentication

Most endpoints require authentication using a JWT token. The token should be included in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

## Error Handling

All API endpoints return standard HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Error responses have the following format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse. The rate limits are:

- Login: 5 requests per minute
- Register: 3 requests per minute
- Forgot password: 3 requests per minute
- Reset password: 3 requests per 5 minutes

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with a `Retry-After` header indicating the number of seconds to wait before retrying.

## API Endpoints

### Authentication

#### Register

Creates a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John",
  "lastName": "Doe",
  "provider": "LOCAL"
}
```

**Response**:

```json
{
  "register": true,
  "activate": true
}
```

#### Login

Authenticates a user and returns a JWT token.

- **URL**: `/login`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "provider": "LOCAL"
}
```

**Response**:

```json
{
  "login": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

#### Forgot Password

Sends a password reset email to the user.

- **URL**: `/forgot-password`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "forgot": true
}
```

#### Reset Password

Resets a user's password using a reset token.

- **URL**: `/reset-password`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "token": "reset-token",
  "newPassword": "new-password123"
}
```

**Response**:

```json
{
  "reset": true
}
```

#### Activate Account

Activates a user account using an activation token.

- **URL**: `/activate/:token`
- **Method**: `POST`
- **Auth required**: No

**Response**:

```json
{
  "can": true
}
```

#### Refresh Token

Refreshes an access token using a refresh token.

- **URL**: `/refresh`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

#### Logout

Logs out a user by invalidating their token.

- **URL**: `/logout`
- **Method**: `POST`
- **Auth required**: Yes

**Response**:

```json
{
  "logout": true
}
```

#### Get Current User

Returns information about the currently authenticated user.

- **URL**: `/me`
- **Method**: `GET`
- **Auth required**: Yes

**Response**:

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "isSuperAdmin": false
  }
}
```

### OAuth Providers

#### Get Provider Auth Link

Returns a URL for OAuth authentication with a provider.

- **URL**: `/provider/:provider`
- **Method**: `GET`
- **Auth required**: No

**Parameters**:
- `provider`: The OAuth provider (GOOGLE, GITHUB, FACEBOOK, etc.)

**Response**:

```json
{
  "link": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

#### Handle Provider Callback

Handles the OAuth callback from a provider.

- **URL**: `/provider/:provider/callback`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "code": "oauth-code"
}
```

**Response**:

```json
{
  "login": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Wallet Authentication

#### Generate Challenge

Generates a challenge for wallet authentication.

- **URL**: `/wallet/challenge`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
}
```

**Response**:

```json
{
  "challenge": "Sign this message to authenticate with our service: a1b2c3d4..."
}
```

#### Verify Signature

Verifies a signed challenge for wallet authentication.

- **URL**: `/wallet/verify`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "signature": "0x5d99b6f7f6d1f73d1a26497f2b1c89b24c0993913f86e9a2d02cd69887d9c94f3c880358579d811b21dd1b7fd9bb01c1d81d10e69f0384e675c32b39643be89200"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### Multi-Factor Authentication

#### Generate MFA Secret

Generates an MFA secret and QR code for a user.

- **URL**: `/mfa/generate`
- **Method**: `POST`
- **Auth required**: Yes

**Response**:

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,..."
}
```

#### Verify and Enable MFA

Verifies an MFA token and enables MFA for a user.

- **URL**: `/mfa/verify`
- **Method**: `POST`
- **Auth required**: Yes

**Request Body**:

```json
{
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

**Response**:

```json
{
  "enabled": true,
  "backupCodes": [
    "a1b2c3d4",
    "e5f6g7h8",
    "i9j0k1l2",
    "m3n4o5p6",
    "q7r8s9t0",
    "u1v2w3x4",
    "y5z6a7b8",
    "c9d0e1f2",
    "g3h4i5j6",
    "k7l8m9n0"
  ]
}
```

#### Disable MFA

Disables MFA for a user.

- **URL**: `/mfa/disable`
- **Method**: `POST`
- **Auth required**: Yes

**Request Body**:

```json
{
  "token": "123456"
}
```

or

```json
{
  "backupCode": "a1b2c3d4"
}
```

**Response**:

```json
{
  "disabled": true
}
```

#### Verify Backup Code

Verifies a backup code during login.

- **URL**: `/mfa/verify-backup`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "backupCode": "a1b2c3d4"
}
```

**Response**:

```json
{
  "verified": true
}
```

## Authentication Flows

### Local Authentication Flow

1. User registers with email and password
2. User receives activation email
3. User activates account by clicking link in email
4. User logs in with email and password
5. If MFA is enabled, user is prompted for MFA token
6. User receives access and refresh tokens
7. User includes access token in subsequent API requests
8. When access token expires, user uses refresh token to get a new access token

### OAuth Authentication Flow

1. User requests OAuth provider auth link
2. User is redirected to OAuth provider
3. User authenticates with OAuth provider
4. OAuth provider redirects back to application with auth code
5. Application exchanges auth code for OAuth token
6. Application verifies OAuth token and creates or retrieves user account
7. User receives access and refresh tokens
8. User includes access token in subsequent API requests
9. When access token expires, user uses refresh token to get a new access token

### Wallet Authentication Flow

1. User requests challenge for wallet address
2. User signs challenge with wallet
3. User submits signed challenge
4. Application verifies signature and creates or retrieves user account
5. User receives access and refresh tokens
6. User includes access token in subsequent API requests
7. When access token expires, user uses refresh token to get a new access token

## Security Considerations

- All API endpoints are served over HTTPS
- Passwords are hashed using bcrypt
- JWT tokens are signed with a secure secret
- Access tokens have a short expiration time (1 day by default)
- Refresh tokens have a longer expiration time (7 days by default)
- Rate limiting is implemented to prevent brute force attacks
- IP-based blocking is implemented for suspicious activity
- Multi-factor authentication is available for additional security
