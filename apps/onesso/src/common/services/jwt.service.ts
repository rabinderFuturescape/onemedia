import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify, decode } from 'jsonwebtoken';

/**
 * This service provides JWT functionality for compatibility with the existing system.
 * It allows the onesso service to generate and validate JWTs that are compatible with
 * the current authentication system, enabling a smooth transition.
 */
@Injectable()
export class JwtService {
  constructor(private configService: ConfigService) {}

  generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin || false,
      tenant_id: user.tenant_id,
    };

    return sign(payload, this.configService.get<string>('JWT_SECRET'), {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1d',
    });
  }

  generateRefreshToken(user: any): string {
    const payload = {
      sub: user.id,
    };

    return sign(payload, this.configService.get<string>('JWT_SECRET'), {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): any {
    try {
      return verify(token, this.configService.get<string>('JWT_SECRET'));
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    return decode(token);
  }

  /**
   * Converts a Keycloak token to a format compatible with the existing system
   */
  convertKeycloakToken(keycloakToken: any, keycloakUser: any): any {
    return {
      accessToken: this.generateAccessToken({
        id: keycloakUser.sub,
        email: keycloakUser.email,
        name: keycloakUser.name,
        isSuperAdmin: keycloakUser.realm_access?.roles?.includes('admin') || false,
        tenant_id: keycloakUser.tenant_id,
      }),
      refreshToken: keycloakToken.refresh_token,
      expiresIn: parseInt(this.configService.get<string>('JWT_EXPIRATION_SECONDS') || '86400'),
    };
  }
}
