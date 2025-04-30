import { Injectable } from '@nestjs/common';
import { sign, verify, decode } from 'jsonwebtoken';
import { User } from '../../domain/models/user.model';
import { TokenServicePort } from '../../domain/ports/token-service.port';

@Injectable()
export class TokenService implements TokenServicePort {
  generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    };

    return sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || '1d',
    });
  }

  generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
    };

    return sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
  }

  verifyToken(token: string): any {
    try {
      return verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  decodeToken(token: string): any {
    return decode(token);
  }
}
