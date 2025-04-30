import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['auth'];
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // This method is called after the JWT has been verified
    // The payload is the decoded JWT
    
    // For additional validation, we can check if the user still exists in Keycloak
    const userInfo = await this.authService.validateToken(payload.sub);
    
    if (!userInfo) {
      throw new UnauthorizedException('User not found or token is invalid');
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      isSuperAdmin: payload.isSuperAdmin,
      tenant_id: payload.tenant_id,
    };
  }
}
