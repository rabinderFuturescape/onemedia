import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NextAuthService } from './nextauth.service';

@ApiTags('NextAuth')
@Controller('nextauth')
export class NextAuthController {
  constructor(private readonly nextAuthService: NextAuthService) {}

  @Get('/.well-known/openid-configuration')
  @ApiOperation({ summary: 'Get OpenID Connect configuration for NextAuth.js' })
  @ApiResponse({ status: 200, description: 'OIDC configuration' })
  async getOidcConfiguration() {
    return this.nextAuthService.getOidcConfiguration();
  }

  @Get('/jwks')
  @ApiOperation({ summary: 'Get JWKS (JSON Web Key Set) for NextAuth.js' })
  @ApiResponse({ status: 200, description: 'JWKS' })
  async getJwks() {
    return this.nextAuthService.getJwks();
  }

  @Get('/providers')
  @ApiOperation({ summary: 'Get available providers for NextAuth.js' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async getProviders() {
    return this.nextAuthService.getProviders();
  }
}
