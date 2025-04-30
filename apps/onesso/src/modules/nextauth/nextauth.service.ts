import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from '../../common/services/keycloak.service';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';
import { LoggingService } from '../../common/services/logging.service';
import { TokenCacheService } from './token-cache.service';

@Injectable()
export class NextAuthService {
  private oidcConfigCache: any = null;
  private oidcConfigCacheTime: number = 0;
  private readonly oidcConfigCacheTTL: number;

  constructor(
    private keycloakService: KeycloakService,
    private keycloakAdminService: KeycloakAdminService,
    private configService: ConfigService,
    private loggingService: LoggingService,
    private tokenCacheService: TokenCacheService,
  ) {
    this.loggingService.setContext('NextAuthService');
    this.oidcConfigCacheTTL = parseInt(this.configService.get<string>('OIDC_CONFIG_CACHE_TTL') || '3600') * 1000; // Default: 1 hour
  }

  /**
   * Get the OpenID Connect configuration for NextAuth.js
   */
  async getOidcConfiguration() {
    // Check if we have a cached configuration that's still valid
    if (this.oidcConfigCache && (Date.now() - this.oidcConfigCacheTime < this.oidcConfigCacheTTL)) {
      this.loggingService.debug('Using cached OIDC configuration');
      return this.oidcConfigCache;
    }

    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    try {
      this.loggingService.debug('Fetching OIDC configuration from Keycloak');
      const response = await fetch(
        `${keycloakUrl}/realms/${realm}/.well-known/openid-configuration`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch OIDC configuration: ${response.statusText}`);
      }

      const oidcConfig = await response.json();

      // Cache the configuration
      this.oidcConfigCache = oidcConfig;
      this.oidcConfigCacheTime = Date.now();

      return oidcConfig;
    } catch (error) {
      this.loggingService.error(`Error fetching OIDC configuration: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the JWKS (JSON Web Key Set) for NextAuth.js
   */
  async getJwks() {
    // Check if we have a cached JWKS
    const cachedJwks = this.tokenCacheService.getJwks();
    if (cachedJwks) {
      return cachedJwks;
    }

    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    try {
      this.loggingService.debug('Fetching JWKS from Keycloak');
      const response = await fetch(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`,
        {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
      }

      const jwks = await response.json();

      // Cache the JWKS
      this.tokenCacheService.storeJwks(jwks);

      return jwks;
    } catch (error) {
      this.loggingService.error(`Error fetching JWKS: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get the list of available providers for NextAuth.js
   */
  async getProviders() {
    // Get the list of identity providers from Keycloak
    try {
      const identityProviders = await this.keycloakAdminService.getClient().identityProviders.find();

      // Map to NextAuth.js provider format
      const providers = [];

      // Process each identity provider
      for (const provider of identityProviders) {
        // Create a base provider configuration
        const baseProvider = {
          id: provider.alias,
          name: provider.displayName || provider.alias,
          type: 'oauth',
        };

        // Add provider-specific configuration based on provider type
        switch (provider.providerId) {
          case 'google':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
              clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
              authorization: { params: { scope: 'openid email profile' } },
              profile: (profile: any) => ({
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          case 'github':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('GITHUB_CLIENT_ID'),
              clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
              authorization: { params: { scope: 'user:email' } },
              profile: (profile: any) => ({
                id: profile.id,
                name: profile.name || profile.login,
                email: profile.email,
                image: profile.avatar_url,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          case 'facebook':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('FACEBOOK_CLIENT_ID'),
              clientSecret: this.configService.get<string>('FACEBOOK_CLIENT_SECRET'),
              authorization: { params: { scope: 'email public_profile' } },
              profile: (profile: any) => ({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                image: `https://graph.facebook.com/${profile.id}/picture?type=large`,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          case 'twitter':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('TWITTER_CLIENT_ID'),
              clientSecret: this.configService.get<string>('TWITTER_CLIENT_SECRET'),
              version: '2.0',
              profile: (profile: any) => ({
                id: profile.data.id,
                name: profile.data.name,
                email: profile.data.email,
                image: profile.data.profile_image_url,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          case 'discord':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('DISCORD_CLIENT_ID'),
              clientSecret: this.configService.get<string>('DISCORD_CLIENT_SECRET'),
              authorization: { params: { scope: 'identify email' } },
              profile: (profile: any) => ({
                id: profile.id,
                name: profile.username,
                email: profile.email,
                image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          case 'linkedin':
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>('LINKEDIN_CLIENT_ID'),
              clientSecret: this.configService.get<string>('LINKEDIN_CLIENT_SECRET'),
              authorization: {
                params: { scope: 'r_emailaddress r_liteprofile' },
              },
              profile: (profile: any) => ({
                id: profile.id,
                name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
                email: profile.emailAddress,
                image: profile.profilePicture?.displayImage?.elements[0]?.identifiers[0]?.identifier,
                tenant_id: profile.tenant_id,
              }),
            });
            break;

          default:
            // For custom or unknown providers, use a generic configuration
            providers.push({
              ...baseProvider,
              clientId: this.configService.get<string>(`${provider.alias.toUpperCase()}_CLIENT_ID`),
              clientSecret: this.configService.get<string>(`${provider.alias.toUpperCase()}_CLIENT_SECRET`),
              authorization: { params: { scope: 'openid email profile' } },
              profile: (profile: any) => ({
                id: profile.sub || profile.id,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                tenant_id: profile.tenant_id,
              }),
            });
            break;
        }
      }

      // Add the default onesso provider
      providers.push({
        id: 'onesso',
        name: 'onesso',
        type: 'oauth',
        wellKnown: `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/.well-known/openid-configuration`,
        authorization: { params: { scope: 'openid email profile' } },
        clientId: this.configService.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID'),
        clientSecret: this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || '',
        idToken: true,
        profile: (profile: any) => ({
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          tenant_id: profile.tenant_id,
          roles: profile.realm_access?.roles || [],
        }),
      });

      return providers;
    } catch (error) {
      this.loggingService.error(`Error getting providers: ${error.message}`, error.stack);
      return [{
        id: 'onesso',
        name: 'onesso',
        type: 'oauth',
        wellKnown: `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/.well-known/openid-configuration`,
        authorization: { params: { scope: 'openid email profile' } },
        clientId: this.configService.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID'),
        clientSecret: this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || '',
        idToken: true,
        profile: (profile: any) => ({
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          tenant_id: profile.tenant_id,
          roles: profile.realm_access?.roles || [],
        }),
      }];
    }
  }
}
