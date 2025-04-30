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
 * Improved with better error handling and retry mechanism
 */
async function refreshAccessToken(token: JWT) {
  try {
    // Don't attempt to refresh if no refresh token is available
    if (!token.refreshToken) {
      console.error('No refresh token available');
      return {
        ...token,
        error: 'NoRefreshTokenError',
      };
    }

    // Add retry logic with exponential backoff
    const MAX_RETRIES = 2;
    let retries = 0;
    let lastError = null;

    while (retries <= MAX_RETRIES) {
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

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));

          // If unauthorized, the refresh token is invalid or expired
          if (response.status === 401) {
            console.error('Refresh token is invalid or expired');
            throw new Error('InvalidRefreshToken');
          }

          // For server errors, we can retry
          if (response.status >= 500) {
            throw new Error(`Server error: ${errorData.message || response.statusText}`);
          }

          // For other errors, throw with details
          throw new Error(`Error refreshing token: ${errorData.message || response.statusText}`);
        }

        const refreshedTokens = await response.json();

        // Validate the response contains the expected tokens
        if (!refreshedTokens.accessToken || !refreshedTokens.refreshToken) {
          throw new Error('Invalid token response format');
        }

        console.log('Token refreshed successfully');

        return {
          ...token,
          accessToken: refreshedTokens.accessToken,
          refreshToken: refreshedTokens.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expiresIn,
          error: undefined, // Clear any previous errors
        };
      } catch (error) {
        lastError = error;

        // Don't retry for invalid refresh token errors
        if (error.message === 'InvalidRefreshToken') {
          break;
        }

        retries++;

        if (retries <= MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.pow(2, retries - 1) * 1000;
          console.log(`Retrying token refresh in ${delay}ms (attempt ${retries}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, all retries failed
    console.error('Failed to refresh token after multiple attempts', lastError);

    return {
      ...token,
      error: lastError?.message || 'RefreshAccessTokenError',
    };
  } catch (error) {
    console.error('Unexpected error during token refresh:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
