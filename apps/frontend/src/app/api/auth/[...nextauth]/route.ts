import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// Define the NextAuth options
export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'onesso',
      name: 'onesso',
      type: 'oauth',
      wellKnown: `${process.env.NEXT_PUBLIC_ONESSO_URL}/api/nextauth/.well-known/openid-configuration`,
      authorization: { params: { scope: 'openid email profile' } },
      clientId: process.env.ONESSO_CLIENT_ID || 'account',
      clientSecret: process.env.ONESSO_CLIENT_SECRET || '',
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          roles: profile.realm_access?.roles || [],
          tenant_id: profile.tenant_id,
          // Store additional claims that might be useful
          preferred_username: profile.preferred_username,
          email_verified: profile.email_verified,
          given_name: profile.given_name,
          family_name: profile.family_name,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Initial sign in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          profile,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      const now = Math.floor(Date.now() / 1000);
      const tokenExpiration = token.expiresAt as number;

      // If token is still valid for more than 5 minutes, return it
      if (tokenExpiration && tokenExpiration > now + 300) {
        return token;
      }

      // Access token has expired or will expire soon, try to refresh it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        // Add token information to the session
        session.accessToken = token.accessToken;
        session.error = token.error;

        // Add user information to the session
        session.user = {
          ...session.user,
          id: token.sub,
          roles: token.profile?.realm_access?.roles || [],
          tenant_id: token.profile?.tenant_id,
          // Add any additional user information from the token
          preferred_username: token.profile?.preferred_username,
          email_verified: token.profile?.email_verified,
        };

        // Add token expiration information
        if (token.expiresAt) {
          session.expires = new Date((token.expiresAt as number) * 1000).toISOString();
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  // Add events for logging
  events: {
    async signIn(message) {
      console.log('User signed in:', message);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    },
    async error(message) {
      console.error('Auth error:', message);
    },
  },
};

/**
 * Refresh the access token using the refresh token
 * Implements exponential backoff for retries and better error handling
 *
 * @param token The JWT token containing the refresh token
 * @returns A new JWT token with refreshed credentials or error information
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  // Don't attempt to refresh if no refresh token is available
  if (!token.refreshToken) {
    console.error('No refresh token available');
    return {
      ...token,
      error: 'NoRefreshTokenError',
    };
  }

  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      // Attempt to refresh the token
      const response = await fetch(`${process.env.NEXT_PUBLIC_ONESSO_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: token.refreshToken,
        }),
      });

      // Parse the response
      const refreshedTokens = await response.json();

      // Handle unsuccessful responses
      if (!response.ok) {
        const errorMessage = refreshedTokens.message || response.statusText;
        console.warn(`Token refresh failed: ${errorMessage} (Attempt ${retries + 1}/${maxRetries + 1})`);

        // Check if we should retry based on error type
        if (response.status === 429 || response.status >= 500) {
          // Server is busy or experiencing issues, retry with backoff
          retries++;
          if (retries <= maxRetries) {
            // Exponential backoff with jitter to prevent thundering herd
            const delay = Math.min(Math.pow(2, retries) * 1000 + Math.random() * 1000, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (response.status === 401 || response.status === 400) {
          // Invalid or expired refresh token, don't retry
          return {
            ...token,
            error: 'InvalidRefreshToken',
            errorMessage: errorMessage,
          };
        }

        throw new Error(errorMessage);
      }

      // Token refresh successful
      console.log('Token refreshed successfully');

      // Return the updated token
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Use new refresh token if provided
        expiresAt: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
        error: undefined, // Clear any previous errors
      };
    } catch (error) {
      // Handle errors during the refresh process
      retries++;

      if (retries <= maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(Math.pow(2, retries) * 1000 + Math.random() * 1000, 10000);
        console.warn(`Retrying token refresh in ${delay}ms (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Maximum retries reached, return error
        console.error('Error refreshing access token after multiple attempts', error);
        return {
          ...token,
          error: 'RefreshAccessTokenError',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }

  // This should not be reached due to the return in the catch block
  return {
    ...token,
    error: 'RefreshAccessTokenError',
    errorMessage: 'Maximum retry attempts reached',
  };
}

// Create the NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
