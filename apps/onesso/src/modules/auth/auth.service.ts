import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from '../../common/services/keycloak.service';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';
import { JwtService } from '../../common/services/jwt.service';
import { LoggingService } from '../../common/services/logging.service';
import { TokenCacheService } from '../nextauth/token-cache.service';

@Injectable()
export class AuthService {
  constructor(
    private keycloakService: KeycloakService,
    private keycloakAdminService: KeycloakAdminService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loggingService: LoggingService,
    private tokenCacheService: TokenCacheService,
  ) {
    this.loggingService.setContext('AuthService');
  }

  getLoginUrl(redirectUri: string): string {
    return this.keycloakService.getLoginUrl(redirectUri);
  }

  getLogoutUrl(redirectUri: string): string {
    return this.keycloakService.getLogoutUrl(redirectUri);
  }

  async handleCallback(code: string, redirectUri: string): Promise<any> {
    try {
      const tokenResponse = await this.keycloakService.exchangeCodeForToken(code, redirectUri);

      // Get user info from the token
      const userInfo = await this.keycloakService.validateToken(tokenResponse.access_token);

      // Convert to format compatible with existing system
      const compatibleToken = this.jwtService.convertKeycloakToken(tokenResponse, userInfo);

      // Cache the token
      if (userInfo && userInfo.sub) {
        this.tokenCacheService.storeToken(
          userInfo.sub,
          {
            accessToken: compatibleToken.accessToken,
            refreshToken: compatibleToken.refreshToken,
            keycloakToken: tokenResponse,
          },
          compatibleToken.expiresIn
        );
      }

      this.loggingService.logAuthEvent(userInfo.sub, 'login', true);

      return {
        login: true,
        accessToken: compatibleToken.accessToken,
        refreshToken: compatibleToken.refreshToken,
        expiresIn: compatibleToken.expiresIn,
        keycloakToken: tokenResponse,
      };
    } catch (error) {
      this.loggingService.error(`Error in handleCallback: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'login', false, { error: error.message });
      throw new UnauthorizedException('Failed to authenticate with Keycloak');
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Extract user ID from refresh token if possible
      let userId = 'unknown';
      try {
        const decodedToken = this.jwtService.decodeToken(refreshToken);
        if (decodedToken && decodedToken.sub) {
          userId = decodedToken.sub;

          // Check if we have a cached token for this user
          const cachedToken = this.tokenCacheService.getToken(userId);
          if (cachedToken && cachedToken.refreshToken === refreshToken) {
            this.loggingService.debug(`Using cached token for user ${userId}`);
            return {
              accessToken: cachedToken.accessToken,
              refreshToken: cachedToken.refreshToken,
              expiresIn: Math.floor((cachedToken.expiresAt - Date.now()) / 1000),
              keycloakToken: cachedToken.keycloakToken,
            };
          }
        }
      } catch (decodeError) {
        // If we can't decode the token, just proceed with the refresh
        this.loggingService.debug(`Could not decode refresh token: ${decodeError.message}`);
      }

      // If no cached token or cache miss, refresh from Keycloak
      const tokenResponse = await this.keycloakService.refreshToken(refreshToken);

      // Get user info from the token
      const userInfo = await this.keycloakService.validateToken(tokenResponse.access_token);

      // Convert to format compatible with existing system
      const compatibleToken = this.jwtService.convertKeycloakToken(tokenResponse, userInfo);

      // Cache the token
      if (userInfo && userInfo.sub) {
        this.tokenCacheService.storeToken(
          userInfo.sub,
          {
            accessToken: compatibleToken.accessToken,
            refreshToken: compatibleToken.refreshToken,
            keycloakToken: tokenResponse,
          },
          compatibleToken.expiresIn
        );
      }

      this.loggingService.logAuthEvent(userInfo.sub, 'token_refresh', true);

      return {
        accessToken: compatibleToken.accessToken,
        refreshToken: compatibleToken.refreshToken,
        expiresIn: compatibleToken.expiresIn,
        keycloakToken: tokenResponse,
      };
    } catch (error) {
      this.loggingService.error(`Error in refreshToken: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'token_refresh', false, { error: error.message });
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      // First try to validate with Keycloak
      const userInfo = await this.keycloakService.validateToken(token);

      if (userInfo) {
        this.loggingService.logAuthEvent(userInfo.sub, 'token_validation', true);
        return userInfo;
      }

      // If Keycloak validation fails, try with the legacy JWT service
      const payload = this.jwtService.verifyToken(token);

      if (payload) {
        this.loggingService.logAuthEvent(payload.sub, 'token_validation_legacy', true);
        return payload;
      }

      return null;
    } catch (error) {
      this.loggingService.error(`Error in validateToken: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'token_validation', false, { error: error.message });
      return null;
    }
  }

  async getUserInfo(token: string): Promise<any> {
    const userInfo = await this.validateToken(token);

    if (!userInfo) {
      throw new UnauthorizedException('Invalid token');
    }

    return userInfo;
  }

  async register(userData: any): Promise<any> {
    try {
      // Check if user already exists
      const existingUsers = await this.keycloakAdminService.getUserByEmail(userData.email);

      if (existingUsers && existingUsers.length > 0) {
        this.loggingService.logAuthEvent('unknown', 'register', false, { email: userData.email, reason: 'User already exists' });
        throw new Error('User with this email already exists');
      }

      // Create user in Keycloak
      const userId = await this.keycloakAdminService.createUser({
        username: userData.email,
        email: userData.email,
        firstName: userData.name,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: false,
        credentials: userData.password ? [
          {
            type: 'password',
            value: userData.password,
            temporary: false,
          },
        ] : undefined,
        attributes: {
          provider: [userData.provider || 'LOCAL'],
          providerId: userData.providerId ? [userData.providerId] : undefined,
        },
      });

      // Assign default role
      await this.keycloakAdminService.assignRoleToUser(userId, 'user');

      // If tenant is specified, assign user to tenant
      if (userData.tenant_id) {
        await this.keycloakAdminService.assignUserToTenant(userId, userData.tenant_id);
      }

      this.loggingService.logAuthEvent(userId, 'register', true);

      return {
        id: userId,
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        provider: userData.provider || 'LOCAL',
        tenant_id: userData.tenant_id,
      };
    } catch (error) {
      this.loggingService.error(`Error in register: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'register', false, { error: error.message });
      throw error;
    }
  }

  async validateCredentials(email: string, password: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', this.configService.get<string>('KEYCLOAK_CLIENT_ID'));
      params.append('client_secret', this.configService.get<string>('KEYCLOAK_CLIENT_SECRET'));
      params.append('username', email);
      params.append('password', password);

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
        this.loggingService.logAuthEvent('unknown', 'login_credentials', false, { email });
        return null;
      }

      const tokenResponse = await response.json();

      // Get user info from the token
      const userInfo = await this.keycloakService.validateToken(tokenResponse.access_token);

      this.loggingService.logAuthEvent(userInfo.sub, 'login_credentials', true);

      // Convert to format compatible with existing system
      const compatibleToken = this.jwtService.convertKeycloakToken(tokenResponse, userInfo);

      return {
        login: true,
        accessToken: compatibleToken.accessToken,
        refreshToken: compatibleToken.refreshToken,
        expiresIn: compatibleToken.expiresIn,
        keycloakToken: tokenResponse,
      };
    } catch (error) {
      this.loggingService.error(`Error in validateCredentials: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'login_credentials', false, { email, error: error.message });
      return null;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const users = await this.keycloakAdminService.getUserByEmail(email);

      if (!users || users.length === 0) {
        this.loggingService.logAuthEvent('unknown', 'forgot_password', false, { email, reason: 'User not found' });
        return false;
      }

      const user = users[0];

      // Initiate forgot password flow in Keycloak
      await this.keycloakAdminService.getClient().users.executeActionsEmail({
        id: user.id,
        actions: ['UPDATE_PASSWORD' as any],
        redirectUri: this.configService.get<string>('FRONTEND_URL'),
      });

      this.loggingService.logAuthEvent(user.id, 'forgot_password', true);

      return true;
    } catch (error) {
      this.loggingService.error(`Error in forgotPassword: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'forgot_password', false, { email, error: error.message });
      return false;
    }
  }

  async resetPassword(token: string, password: string): Promise<boolean> {
    try {
      // This is a placeholder - in Keycloak, password reset is handled via the Keycloak UI
      // This method would be used if you're implementing a custom password reset flow
      this.loggingService.warn('resetPassword method called, but Keycloak handles password reset via its own UI');
      return false;
    } catch (error) {
      this.loggingService.error(`Error in resetPassword: ${error.message}`, error.stack);
      this.loggingService.logAuthEvent('unknown', 'reset_password', false, { error: error.message });
      return false;
    }
  }
}
