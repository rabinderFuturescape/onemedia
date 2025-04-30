# Developer's Guide: Configuring Existing Keycloak Server with onesso

This guide provides step-by-step instructions for integrating an existing Keycloak server with the onesso authentication service in your project.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Keycloak Server Configuration](#keycloak-server-configuration)
   - [Realm Setup](#realm-setup)
   - [Client Configuration](#client-configuration)
   - [Identity Providers](#identity-providers)
   - [User Federation](#user-federation)
4. [onesso Service Configuration](#onesso-service-configuration)
   - [Environment Variables](#environment-variables)
   - [Connection Testing](#connection-testing)
5. [Frontend Integration](#frontend-integration)
6. [Backend Integration](#backend-integration)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Overview

The onesso authentication service is built on top of Keycloak and provides a centralized authentication solution for all applications in your ecosystem. This guide focuses on connecting onesso to an existing Keycloak server rather than setting up a new one.

## Prerequisites

- An existing Keycloak server (version 15.0.0 or later recommended)
- Administrative access to the Keycloak server
- Node.js 18 or later
- Docker and Docker Compose (for local development)

## Keycloak Server Configuration

### Realm Setup

1. **Create a New Realm** (or use an existing one):
   - Log in to your Keycloak Admin Console
   - Click on the dropdown in the top-left corner and select "Add realm"
   - Name it `onesso` (or your preferred name)
   - Click "Create"

2. **Configure Realm Settings**:
   - Go to "Realm Settings" > "General"
   - Set "Display name" to "onesso Authentication" (or your preferred name)
   - Enable "User registration" if you want users to be able to register themselves
   - Enable "Email as username" if you want users to log in with their email
   - Enable "Verify email" if you want to require email verification
   - Save changes

3. **Configure Email Settings** (if using email verification):
   - Go to "Realm Settings" > "Email"
   - Configure your SMTP server settings
   - Save changes

4. **Configure Authentication Flows** (optional):
   - Go to "Authentication" > "Flows"
   - You can customize the authentication flows as needed

### Client Configuration

You need to create two clients in Keycloak:

1. **Admin Client** (for the onesso service):
   - Go to "Clients" > "Create"
   - Set "Client ID" to `onesso-admin`
   - Set "Client Protocol" to "openid-connect"
   - Set "Access Type" to "confidential"
   - Set "Valid Redirect URIs" to `http://localhost:3002/*` (or your onesso service URL)
   - Set "Web Origins" to `http://localhost:3002` (or your onesso service URL)
   - Enable "Service Accounts Enabled"
   - Save the client
   - Go to the "Credentials" tab and note the "Secret" value

2. **Public Client** (for frontend applications):
   - Go to "Clients" > "Create"
   - Set "Client ID" to `onesso-public`
   - Set "Client Protocol" to "openid-connect"
   - Set "Access Type" to "public"
   - Set "Valid Redirect URIs" to `http://localhost:3000/*` (or your frontend URL)
   - Set "Web Origins" to `http://localhost:3000` (or your frontend URL)
   - Save the client

3. **Configure Client Scopes** (optional):
   - Go to "Clients" > [your client] > "Client Scopes"
   - Add any additional scopes needed for your application

### Identity Providers

If you want to enable social login:

1. **Configure Identity Providers**:
   - Go to "Identity Providers"
   - Click on the provider you want to add (e.g., Google, GitHub, Facebook)
   - Configure the provider with your client ID and secret
   - Set the redirect URI to `http://[your-keycloak-url]/auth/realms/onesso/broker/[provider]/endpoint`
   - Save the provider

### User Federation

If you want to connect to an existing user database:

1. **Configure User Federation**:
   - Go to "User Federation"
   - Select the provider type (LDAP, Kerberos, etc.)
   - Configure the connection details
   - Save the provider

## onesso Service Configuration

### Environment Variables

Update the `.env` file in the `apps/onesso` directory with your Keycloak server details:

```
# Server Configuration
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:4200

# Keycloak Configuration
KEYCLOAK_URL=http://your-keycloak-server:8080/auth
KEYCLOAK_REALM=onesso
KEYCLOAK_CLIENT_ID=onesso-admin
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_PUBLIC_CLIENT_ID=onesso-public

# Frontend URL
FRONTEND_URL=http://localhost:4200

# JWT Configuration (for compatibility with existing systems)
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=1d
JWT_EXPIRATION_SECONDS=86400

# Security
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=30

# Logging
LOG_LEVEL=info
```

Replace the following values:
- `KEYCLOAK_URL`: The URL of your Keycloak server
- `KEYCLOAK_REALM`: The name of your Keycloak realm
- `KEYCLOAK_CLIENT_SECRET`: The secret from the onesso-admin client
- `FRONTEND_URL`: The URL of your frontend application
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS

### Connection Testing

1. Start the onesso service:
   ```bash
   cd apps/onesso
   npm install
   npm run start:dev
   ```

2. Test the connection:
   ```bash
   curl http://localhost:3002/api/health
   ```

   You should see a response indicating that the service is healthy and connected to Keycloak.

## Frontend Integration

To integrate with a Next.js frontend using NextAuth.js:

1. Update the `.env.local` file in your Next.js application:
   ```
   # NextAuth.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-chars

   # onesso Configuration
   ONESSO_URL=http://localhost:3002
   ONESSO_CLIENT_ID=onesso-public
   ONESSO_CLIENT_SECRET=
   ```

2. Configure NextAuth.js in your application:
   ```typescript
   // src/lib/auth.ts
   import { NextAuthOptions } from 'next-auth';

   export const authOptions: NextAuthOptions = {
     providers: [
       {
         id: 'onesso',
         name: 'onesso',
         type: 'oauth',
         wellKnown: `${process.env.ONESSO_URL}/api/nextauth/.well-known/openid-configuration`,
         authorization: { params: { scope: 'openid email profile' } },
         clientId: process.env.ONESSO_CLIENT_ID,
         clientSecret: process.env.ONESSO_CLIENT_SECRET || '',
         idToken: true,
         profile(profile) {
           return {
             id: profile.sub,
             name: profile.name,
             email: profile.email,
             image: profile.picture,
             tenant_id: profile.tenant_id,
             roles: profile.realm_access?.roles || [],
           };
         },
       },
     ],
     callbacks: {
       async jwt({ token, account, profile }) {
         if (account && profile) {
           token.accessToken = account.access_token;
           token.refreshToken = account.refresh_token;
           token.expiresAt = account.expires_at;
           token.roles = profile.realm_access?.roles || [];
           token.tenant_id = profile.tenant_id;
         }
         return token;
       },
       async session({ session, token }) {
         session.accessToken = token.accessToken;
         session.user.roles = token.roles;
         session.user.tenant_id = token.tenant_id;
         return session;
       },
     },
     pages: {
       signIn: '/auth/signin',
       error: '/auth/error',
     },
   };
   ```

3. Create an API route for NextAuth.js:
   ```typescript
   // src/app/api/auth/[...nextauth]/route.ts
   import NextAuth from 'next-auth';
   import { authOptions } from '@/lib/auth';

   const handler = NextAuth(authOptions);

   export { handler as GET, handler as POST };
   ```

## Backend Integration

To integrate with a NestJS backend:

1. Install the required dependencies:
   ```bash
   npm install @nestjs/passport passport passport-jwt jsonwebtoken
   ```

2. Create a JWT strategy:
   ```typescript
   // src/auth/strategies/jwt.strategy.ts
   import { Injectable } from '@nestjs/common';
   import { PassportStrategy } from '@nestjs/passport';
   import { ExtractJwt, Strategy } from 'passport-jwt';
   import { ConfigService } from '@nestjs/config';

   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy) {
     constructor(private configService: ConfigService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: configService.get<string>('JWT_SECRET'),
       });
     }

     async validate(payload: any) {
       return {
         id: payload.sub,
         email: payload.email,
         roles: payload.realm_access?.roles || [],
         tenant_id: payload.tenant_id,
       };
     }
   }
   ```

3. Create an auth module:
   ```typescript
   // src/auth/auth.module.ts
   import { Module } from '@nestjs/common';
   import { PassportModule } from '@nestjs/passport';
   import { JwtModule } from '@nestjs/jwt';
   import { ConfigModule, ConfigService } from '@nestjs/config';
   import { JwtStrategy } from './strategies/jwt.strategy';

   @Module({
     imports: [
       PassportModule.register({ defaultStrategy: 'jwt' }),
       JwtModule.registerAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (configService: ConfigService) => ({
           secret: configService.get<string>('JWT_SECRET'),
           signOptions: {
             expiresIn: configService.get<string>('JWT_EXPIRATION', '1d'),
           },
         }),
       }),
     ],
     providers: [JwtStrategy],
     exports: [PassportModule, JwtModule],
   })
   export class AuthModule {}
   ```

4. Create a JWT guard:
   ```typescript
   // src/auth/guards/jwt-auth.guard.ts
   import { Injectable } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';

   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {}
   ```

5. Use the guard to protect routes:
   ```typescript
   // src/users/users.controller.ts
   import { Controller, Get, UseGuards } from '@nestjs/common';
   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
   import { UsersService } from './users.service';

   @Controller('users')
   export class UsersController {
     constructor(private usersService: UsersService) {}

     @UseGuards(JwtAuthGuard)
     @Get('profile')
     getProfile() {
       return this.usersService.getProfile();
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure your Keycloak server is running and accessible
   - Check the `KEYCLOAK_URL` in your `.env` file
   - Verify network connectivity between the onesso service and Keycloak

2. **Invalid Client Secret**:
   - Double-check the client secret in the Keycloak admin console
   - Ensure the `KEYCLOAK_CLIENT_SECRET` in your `.env` file matches

3. **CORS Errors**:
   - Add your frontend URL to the `ALLOWED_ORIGINS` in your `.env` file
   - Add your frontend URL to the "Web Origins" in the Keycloak client settings

4. **Invalid Redirect URI**:
   - Ensure the redirect URI in your frontend matches the one configured in Keycloak
   - Add the redirect URI to the "Valid Redirect URIs" in the Keycloak client settings

### Debugging

1. Set `LOG_LEVEL=debug` in your `.env` file to get more detailed logs
2. Check the Keycloak server logs for any errors
3. Use the Keycloak admin console to monitor login attempts and events

## Security Considerations

1. **Use HTTPS in Production**:
   - Always use HTTPS for all communication between services in production
   - Update the `KEYCLOAK_URL`, `FRONTEND_URL`, and other URLs to use HTTPS

2. **Secure Client Secrets**:
   - Never commit client secrets to version control
   - Use environment variables or a secrets management solution

3. **Token Validation**:
   - Always validate tokens on the server side
   - Check token expiration and signature

4. **Role-Based Access Control**:
   - Define appropriate roles in Keycloak
   - Use role-based guards in your application

5. **Regular Updates**:
   - Keep Keycloak and all dependencies up to date
   - Monitor security advisories for Keycloak and related packages

---

By following this guide, you should have successfully integrated your existing Keycloak server with the onesso authentication service. This provides a centralized authentication solution for all applications in your ecosystem, with support for various authentication methods and multi-tenancy.
