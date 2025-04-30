import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenService } from '../../infrastructure/services/token.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private tokenService: TokenService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add custom token extraction logic
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    
    if (token) {
      request.headers.authorization = `Bearer ${token}`;
    }
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }

  private extractTokenFromRequest(request): string | null {
    // Try to extract from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try to extract from auth header (for compatibility)
    if (request.headers.auth) {
      return request.headers.auth;
    }
    
    // Try to extract from cookies
    if (request.cookies && request.cookies.auth) {
      return request.cookies.auth;
    }
    
    return null;
  }
}
