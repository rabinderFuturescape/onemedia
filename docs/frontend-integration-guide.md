# onesso Frontend Integration Guide

This guide explains how to integrate the onesso authentication service with a Next.js frontend application using NextAuth.js.

## Overview

The onesso service provides a centralized authentication system built on Keycloak with NextAuth.js integration. This guide will show you how to:

1. Set up the necessary dependencies
2. Configure NextAuth.js in your Next.js application
3. Implement login, logout, and token refresh flows
4. Protect routes that require authentication
5. Access user information in your components

## Installation

First, install the required dependencies:

```bash
npm install next-auth@latest jose cookies-next
```

## Configuration

### 1. Create Auth Provider

Create a file at `src/lib/auth.ts` with the following content:

```typescript
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

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
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.profile = profile;
        token.tenant_id = profile.tenant_id;
        token.roles = profile.realm_access?.roles || [];
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.tenant_id = token.tenant_id;
        session.user.roles = token.roles;
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
};

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch(`${process.env.ONESSO_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expiresIn,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
```

### 2. Set Up NextAuth API Route

For Next.js 13+ with App Router, create a file at `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

For Next.js with Pages Router, create a file at `src/pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export default NextAuth(authOptions);
```

### 3. Create Auth Context Provider

Create a file at `src/contexts/auth-context.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasTenant: (tenantId: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  hasTenant: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

  const login = (redirectUrl?: string) => {
    signIn('onesso', { callbackUrl: redirectUrl || '/' });
  };

  const logout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const hasRole = (role: string) => {
    if (!user?.roles) return false;
    return user.roles.includes(role);
  };

  const hasTenant = (tenantId: string) => {
    if (!user?.tenant_id) return false;
    return user.tenant_id === tenantId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        hasTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 4. Add Auth Provider to Layout

For Next.js 13+ with App Router, update your root layout file (`src/app/layout.tsx`):

```typescript
import { AuthProvider } from '@/contexts/auth-context';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AuthProvider>{children}</AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

For Next.js with Pages Router, update your `_app.tsx` file:

```typescript
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/auth-context';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SessionProvider>
  );
}
```

### 5. Create Auth Middleware

Create a file at `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedPath = !pathname.startsWith('/auth') &&
                          !pathname.startsWith('/api/auth') &&
                          !pathname.startsWith('/_next') &&
                          !pathname.startsWith('/static');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Get the token from the session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // If there's no token and the path is protected, redirect to login
  if (!token && isProtectedPath) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If there's a token and the user is trying to access auth pages, redirect to home
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Usage Examples

### Login Page

Create a file at `src/app/auth/login/page.tsx` (App Router) or `src/pages/auth/login.tsx` (Pages Router):

```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (!isAuthenticated) {
      login(callbackUrl);
    }
  }, [isAuthenticated, login, callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Redirecting to login...</h1>
        <p className="mt-2">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  );
}
```

### Protected Component

Example of a component that requires authentication:

```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedComponent() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Protected Component</h1>
      <p>Welcome, {user.name}!</p>
      {hasRole('admin') && <p>You have admin privileges.</p>}
    </div>
  );
}
```

### API Request with Authentication

Example of making an authenticated API request:

```typescript
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DataFetchingComponent() {
  const { user, isAuthenticated } = useAuth();
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && session?.accessToken) {
      fetchData();
    }
  }, [isAuthenticated, session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected-data', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to view this content.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### Server-Side Authentication

For server components or API routes, you can use the `getServerSession` function:

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// In a Server Component (App Router)
export default async function ProtectedServerComponent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Handle unauthenticated state
    return <div>Please log in to view this content.</div>;
  }

  return (
    <div>
      <h1>Protected Server Component</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}

// In an API Route (Pages Router)
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Process the authenticated request
  return res.status(200).json({ data: 'Protected data' });
}
```

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Required for NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-chars

# onesso Configuration
ONESSO_URL=http://localhost:3002
ONESSO_CLIENT_ID=onesso-public
ONESSO_CLIENT_SECRET=
```

## Conclusion

This guide provides a comprehensive integration of the onesso authentication service with a Next.js application using NextAuth.js. The integration leverages the security and flexibility of Keycloak while providing a seamless authentication experience for your users.

You can extend this implementation to fit your specific requirements, such as:
- Adding custom login forms
- Implementing role-based access control
- Supporting multi-tenancy
- Adding social login providers

For more information, refer to:
- [onesso API documentation](docs/onesso-api-docs.md)
- [NextAuth.js documentation](https://next-auth.js.org/getting-started/introduction)
- [Keycloak documentation](https://www.keycloak.org/documentation)
