import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { getCookieUrlFromDomain } from '@gitroom/helpers/subdomain/subdomain.management';
import { RealIP } from 'nestjs-real-ip';
import { UserAgent } from '@gitroom/nestjs-libraries/user/user.agent';
import { AuthClientService } from '@gitroom/backend/services/auth-client/auth-client.service';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { Provider } from '@prisma/client';

@ApiTags('Auth')
@Controller('/auth')
export class AuthProxyController {
  constructor(
    private _authClientService: AuthClientService,
    private _organizationService: OrganizationService,
  ) {}

  @Get('/can-register')
  async canRegister() {
    return { register: await this._organizationService.canRegister() };
  }

  @Post('/register')
  async register(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) response: Response,
    @RealIP() ip: string,
    @UserAgent() userAgent: string
  ) {
    try {
      // Handle organization cookie if needed
      const orgCookie = req?.cookies?.org;
      let addToOrg = false;
      
      if (orgCookie) {
        // Logic to handle org cookie would go here
      }
      
      // Call auth microservice
      const result = await this._authClientService.register(
        {
          email: body.email,
          password: body.password,
          name: body.name,
          lastName: body.lastName,
          provider: body.provider,
        },
        ip,
        userAgent
      );
      
      if (result.activate) {
        response.header('activate', 'true');
        response.status(200).json({ activate: true });
        return;
      }
      
      // Set cookies if login was successful
      if (result.accessToken) {
        this.setCookies(response, result.accessToken);
        
        // Handle organization if needed
        if (addToOrg) {
          // Logic to add user to org would go here
        }
        
        response.header('onboarding', 'true');
      }
      
      response.status(200).json({
        register: true,
      });
    } catch (e) {
      response.status(400).send(e.message || 'Registration failed');
    }
  }

  @Post('/login')
  async login(
    @Req() req: Request,
    @Body() body: any,
    @Res({ passthrough: true }) response: Response,
    @RealIP() ip: string,
    @UserAgent() userAgent: string
  ) {
    try {
      // Handle organization cookie if needed
      const orgCookie = req?.cookies?.org;
      
      // Call auth microservice
      const result = await this._authClientService.login(
        body.email,
        body.password,
        body.provider
      );
      
      if (result.accessToken) {
        this.setCookies(response, result.accessToken);
        
        // Handle organization if needed
        if (orgCookie) {
          // Logic to handle org cookie would go here
        }
        
        response.header('reload', 'true');
      }
      
      response.status(200).json({
        login: true,
      });
    } catch (e) {
      response.status(400).send(e.message || 'Login failed');
    }
  }

  @Post('/forgot-password')
  async forgot(@Body() body: { email: string }) {
    try {
      const result = await this._authClientService.forgotPassword(body.email);
      return {
        forgot: true,
      };
    } catch (e) {
      return {
        forgot: false,
      };
    }
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: { token: string, newPassword: string }) {
    try {
      const result = await this._authClientService.resetPassword(
        body.token,
        body.newPassword
      );
      return {
        reset: true,
      };
    } catch (e) {
      return {
        reset: false,
      };
    }
  }

  @Get('/provider/:provider')
  async getProviderAuthLink(
    @Param('provider') provider: Provider,
    @Query() query: any
  ) {
    const link = await this._authClientService.getProviderAuthLink(provider, query);
    return { link };
  }

  @Post('/provider/:provider/callback')
  async handleProviderCallback(
    @Param('provider') provider: Provider,
    @Body('code') code: string,
    @Res({ passthrough: true }) response: Response,
    @RealIP() ip: string,
    @UserAgent() userAgent: string
  ) {
    try {
      const result = await this._authClientService.handleProviderCallback(
        provider,
        code,
        ip,
        userAgent
      );
      
      if (result.accessToken) {
        this.setCookies(response, result.accessToken);
        response.header('reload', 'true');
      }
      
      response.status(200).json({
        login: true,
      });
    } catch (e) {
      response.status(400).send(e.message || 'Authentication failed');
    }
  }

  @Post('/activate/:token')
  async activate(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      const result = await this._authClientService.activateAccount(token);
      
      if (!result || !result.can) {
        return response.status(200).send({ can: false });
      }
      
      // Set cookies
      this.setCookies(response, result.accessToken || token);
      response.header('onboarding', 'true');
      
      return response.status(200).send({ can: true });
    } catch (e) {
      return response.status(200).send({ can: false });
    }
  }

  @Post('/refresh')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response
  ) {
    try {
      const result = await this._authClientService.refreshToken(refreshToken);
      
      if (result.accessToken) {
        this.setCookies(response, result.accessToken);
      }
      
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (e) {
      response.status(401).send('Invalid refresh token');
    }
  }

  @Post('/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearCookies(response);
    
    return {
      logout: true,
    };
  }

  private setCookies(response: Response, token: string) {
    const cookieDomain = getCookieUrlFromDomain(process.env.FRONTEND_URL);
    const secure = !process.env.NOT_SECURED;
    
    response.cookie('auth', token, {
      domain: cookieDomain,
      ...(secure
        ? {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
          }
        : {}),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });
    
    if (!secure) {
      response.header('auth', token);
    }
  }

  private clearCookies(response: Response) {
    const cookieDomain = getCookieUrlFromDomain(process.env.FRONTEND_URL);
    const secure = !process.env.NOT_SECURED;
    
    response.cookie('auth', '', {
      domain: cookieDomain,
      ...(secure
        ? {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
          }
        : {}),
      expires: new Date(0),
      maxAge: -1,
    });
    
    response.header('logout', 'true');
  }
}
