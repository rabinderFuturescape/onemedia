# onesso Backend Integration Guide

This guide explains how to integrate the onesso authentication service with a NestJS backend application.

## Overview

The onesso service provides a centralized authentication system built on Keycloak. This guide will show you how to:

1. Set up the necessary dependencies
2. Configure authentication in your NestJS application
3. Implement JWT validation
4. Create guards for protecting routes
5. Access user information in your controllers and services

## Installation

First, install the required dependencies:

```bash
npm install @nestjs/passport passport passport-jwt jsonwebtoken
```

## Configuration

### 1. Create Auth Module

Create a new module for authentication:

```bash
nest g module auth
nest g service auth
```

### 2. Create JWT Strategy

Create a file at `src/auth/strategies/jwt.strategy.ts`:

```typescript
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
    // Validate the token with onesso service
    const user = await this.authService.validateToken(payload);
    
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return user;
  }
}
```

### 3. Create Auth Service

Update the auth service at `src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateToken(payload: any): Promise<any> {
    try {
      // First, try to validate with local JWT verification
      if (payload && payload.sub) {
        // Then, validate with onesso service
        const response = await axios.get(
          `${this.configService.get<string>('ONESSO_URL')}/api/auth/validate`,
          {
            params: {
              token: this.jwtService.sign(payload),
            },
          },
        );

        if (response.data.valid) {
          return response.data.user;
        }
      }

      return null;
    } catch (error) {
      console.error('Token validation error:', error.message);
      return null;
    }
  }

  async getUserInfo(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.configService.get<string>('ONESSO_URL')}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data.user;
    } catch (error) {
      console.error('Get user info error:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 4. Update Auth Module

Update the auth module at `src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
```

### 5. Create JWT Auth Guard

Create a file at `src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // If not public, proceed with JWT validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
```

### 6. Create Roles Guard

Create a file at `src/auth/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role
    if (user.isSuperAdmin) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### 7. Create Decorators

Create a file at `src/auth/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

Create a file at `src/auth/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### 8. Create Tenant Guard

Create a file at `src/auth/guards/tenant.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTenant = this.reflector.getAllAndOverride<string>('tenant', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTenant) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has the required tenant
    if (user.tenant_id !== requiredTenant) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }

    return true;
  }
}
```

Create a file at `src/auth/decorators/tenant.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const Tenant = (tenant: string) => SetMetadata('tenant', tenant);
```

### 9. Update App Module

Update your app module to use the global guards:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TenantGuard } from './auth/guards/tenant.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    // Other modules...
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}
```

## Usage Examples

### Public Endpoint

Example of a public endpoint that doesn't require authentication:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
```

### Protected Endpoint

Example of a protected endpoint that requires authentication:

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@Req() req: Request): any {
    // The user object is attached to the request by the JwtAuthGuard
    return req.user;
  }
}
```

### Role-Based Access Control

Example of an endpoint that requires a specific role:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Roles } from './auth/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Get()
  @Roles('admin')
  getAdminDashboard(): string {
    return 'Admin Dashboard';
  }
}
```

### Tenant-Based Access Control

Example of an endpoint that requires a specific tenant:

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { Tenant } from './auth/decorators/tenant.decorator';

@Controller('tenants')
export class TenantsController {
  @Get(':tenantId/data')
  @Tenant(':tenantId') // This will be replaced with the actual tenant ID from the URL
  getTenantData(@Param('tenantId') tenantId: string): string {
    return `Data for tenant ${tenantId}`;
  }
}
```

## Environment Variables

Add the following environment variables to your `.env` file:

```
JWT_SECRET=your-jwt-secret
ONESSO_URL=http://localhost:3002
```

## Middleware for Tenant Isolation

For multi-tenant applications, you might want to add a middleware that ensures data isolation between tenants:

```typescript
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as any;
    const tenantId = req.params.tenantId || req.query.tenantId;

    if (tenantId && user && user.tenant_id !== tenantId && !user.isSuperAdmin) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }

    next();
  }
}
```

Register the middleware in your module:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  // ...
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('tenants/:tenantId/*');
  }
}
```

## Conclusion

This guide provides a basic integration of the onesso authentication service with a NestJS application. You can extend this implementation to fit your specific requirements, such as adding custom authentication flows, handling multi-tenancy, or implementing more complex authorization rules.

For more information, refer to the onesso API documentation and the NestJS authentication documentation.
