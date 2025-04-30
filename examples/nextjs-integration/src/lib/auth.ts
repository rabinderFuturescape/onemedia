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
