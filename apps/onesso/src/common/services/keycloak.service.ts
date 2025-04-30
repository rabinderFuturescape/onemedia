import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as KeycloakConnect from 'keycloak-connect';

@Injectable()
export class KeycloakService {
  private keycloak: KeycloakConnect.Keycloak;

  constructor(private configService: ConfigService) {
    const keycloakConfig = {
      realm: this.configService.get<string>('KEYCLOAK_REALM'),
      'auth-server-url': this.configService.get<string>('KEYCLOAK_URL'),
      resource: this.configService.get<string>('KEYCLOAK_CLIENT_ID'),
      'bearer-only': false,
      'confidential-port': 0,
      'ssl-required': 'external',
      credentials: {
        secret: this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'),
      },
    };

    this.keycloak = new KeycloakConnect({}, keycloakConfig);
  }

  getKeycloakInstance(): KeycloakConnect.Keycloak {
    return this.keycloak;
  }

  getLoginUrl(redirectUri: string): string {
    return `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/auth?client_id=${this.configService.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID')}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;
  }

  getLogoutUrl(redirectUri: string): string {
    return `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', this.configService.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID'));
    params.append('client_secret', this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'));
    params.append('redirect_uri', redirectUri);

    const response = await fetch(
      `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', this.configService.get<string>('KEYCLOAK_PUBLIC_CLIENT_ID'));
    params.append('client_secret', this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'));

    const response = await fetch(
      `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    return response.json();
  }

  async validateToken(token: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/userinfo`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  }

  async introspectToken(token: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('client_id', this.configService.get<string>('KEYCLOAK_CLIENT_ID'));
    params.append('client_secret', this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'));

    const response = await fetch(
      `${this.configService.get<string>('KEYCLOAK_URL')}/realms/${this.configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/token/introspect`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to introspect token: ${response.statusText}`);
    }

    return response.json();
  }
}
