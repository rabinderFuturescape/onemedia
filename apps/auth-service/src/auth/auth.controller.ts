import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Headers,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Provider } from '@prisma/client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Headers('x-real-ip') ip: string,
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (!user.activated) {
      throw new UnauthorizedException('Account not activated');
    }
    
    const token = await this.authService.login(user);
    
    // Set cookies
    this.setCookies(res, token.accessToken);
    
    return {
      login: true,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresIn: token.expiresIn,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Headers('x-real-ip') ip: string,
  ) {
    try {
      const user = await this.authService.register(
        {
          email: registerDto.email,
          password: registerDto.password,
          name: registerDto.name,
          lastName: registerDto.lastName,
          providerName: registerDto.provider,
        },
        ip || req.ip,
        userAgent,
      );
      
      // For non-LOCAL providers, login immediately
      if (registerDto.provider !== Provider.LOCAL) {
        const token = await this.authService.login(user);
        this.setCookies(res, token.accessToken);
        
        return {
          register: true,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresIn: token.expiresIn,
        };
      }
      
      // For LOCAL provider, require activation
      res.header('activate', 'true');
      
      return {
        register: true,
        activate: true,
      };
    } catch (error) {
      return {
        register: false,
        error: error.message,
      };
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    
    return {
      forgot: true,
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const success = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    
    if (!success) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    
    return {
      reset: true,
    };
  }

  @Post('activate/:token')
  @ApiOperation({ summary: 'Activate user account' })
  @ApiResponse({ status: 200, description: 'Account activated' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async activate(
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const newToken = await this.authService.activateAccount(token);
    
    if (!newToken) {
      return { can: false };
    }
    
    this.setCookies(res, newToken);
    res.header('onboarding', 'true');
    
    return { can: true };
  }

  @Get('provider/:provider')
  @ApiOperation({ summary: 'Get OAuth provider auth link' })
  @ApiResponse({ status: 200, description: 'Auth link generated' })
  getProviderAuthLink(
    @Param('provider') provider: Provider,
    @Query() query: any,
  ) {
    const link = this.authService.generateProviderAuthLink(provider, query);
    
    return {
      link,
    };
  }

  @Post('provider/:provider/callback')
  @ApiOperation({ summary: 'Handle OAuth provider callback' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async handleProviderCallback(
    @Param('provider') provider: Provider,
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent: string,
    @Headers('x-real-ip') ip: string,
  ) {
    const user = await this.authService.validateProviderAuth(provider, code);
    
    if (!user) {
      throw new UnauthorizedException('Authentication failed');
    }
    
    const token = await this.authService.login(user);
    
    this.setCookies(res, token.accessToken);
    
    return {
      login: true,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresIn: token.expiresIn,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any) {
    return {
      user: req.user,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.refreshToken(refreshToken);
    
    this.setCookies(res, token.accessToken);
    
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresIn: token.expiresIn,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearCookies(res);
    
    return {
      logout: true,
    };
  }

  private setCookies(res: Response, token: string) {
    const cookieDomain = this.getCookieDomain(process.env.FRONTEND_URL);
    const secure = !process.env.NOT_SECURED;
    
    res.cookie('auth', token, {
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
      res.header('auth', token);
    }
  }

  private clearCookies(res: Response) {
    const cookieDomain = this.getCookieDomain(process.env.FRONTEND_URL);
    const secure = !process.env.NOT_SECURED;
    
    res.cookie('auth', '', {
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
    
    res.header('logout', 'true');
  }

  private getCookieDomain(url: string): string {
    if (!url) return '';
    
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      
      if (parts.length <= 2) {
        return hostname;
      }
      
      return parts.slice(parts.length - 2).join('.');
    } catch (error) {
      return '';
    }
  }
}
