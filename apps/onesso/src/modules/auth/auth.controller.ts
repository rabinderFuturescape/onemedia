import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../common/services/logging.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext('AuthController');
  }

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
    const result = await this.authService.validateCredentials(loginDto.email, loginDto.password);
    
    if (!result) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    this.setCookies(res, result.accessToken);
    
    return {
      login: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
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
      const user = await this.authService.register({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        lastName: registerDto.lastName,
        provider: registerDto.provider,
        providerId: registerDto.providerId,
        ip: ip || req.ip,
        agent: userAgent,
      });
      
      // For non-LOCAL providers, login immediately
      if (registerDto.provider !== 'LOCAL') {
        const loginResult = await this.authService.validateCredentials(registerDto.email, registerDto.password);
        
        if (loginResult) {
          this.setCookies(res, loginResult.accessToken);
          
          return {
            register: true,
            accessToken: loginResult.accessToken,
            refreshToken: loginResult.refreshToken,
            expiresIn: loginResult.expiresIn,
          };
        }
      }
      
      // For LOCAL provider, require activation
      res.header('activate', 'true');
      
      return {
        register: true,
        activate: true,
      };
    } catch (error) {
      this.loggingService.error(`Error in register endpoint: ${error.message}`, error.stack);
      
      return {
        register: false,
        error: error.message,
      };
    }
  }

  @Get('login/oauth')
  @ApiOperation({ summary: 'Get OAuth login URL' })
  @ApiResponse({ status: 200, description: 'Login URL generated' })
  async getOAuthLoginUrl(@Query('redirect_uri') redirectUri: string) {
    const loginUrl = this.authService.getLoginUrl(redirectUri || this.configService.get<string>('FRONTEND_URL'));
    
    return {
      url: loginUrl,
    };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  @ApiResponse({ status: 401, description: 'Invalid callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('redirect_uri') redirectUri: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code) {
      throw new UnauthorizedException('No authorization code provided');
    }
    
    const result = await this.authService.handleCallback(
      code,
      redirectUri || this.configService.get<string>('FRONTEND_URL'),
    );
    
    this.setCookies(res, result.accessToken);
    
    return {
      login: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
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
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    
    const result = await this.authService.refreshToken(refreshToken);
    
    this.setCookies(res, result.accessToken);
    
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Query('redirect_uri') redirectUri: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.removeCookies(res);
    
    const logoutUrl = this.authService.getLogoutUrl(redirectUri || this.configService.get<string>('FRONTEND_URL'));
    
    return {
      logout: true,
      redirectUrl: logoutUrl,
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

  @Get('validate')
  @ApiOperation({ summary: 'Validate token' })
  @ApiResponse({ status: 200, description: 'Token validated' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async validateToken(@Query('token') token: string) {
    const userInfo = await this.authService.validateToken(token);
    
    if (!userInfo) {
      throw new UnauthorizedException('Invalid token');
    }
    
    return {
      valid: true,
      user: userInfo,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto.email);
    
    return {
      success: result,
      message: result
        ? 'Password reset instructions sent to your email'
        : 'If an account with this email exists, password reset instructions will be sent',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    
    if (!result) {
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    }
    
    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  private setCookies(res: Response, token: string) {
    res.cookie('auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(this.configService.get<string>('JWT_EXPIRATION_SECONDS') || '86400') * 1000,
    });
  }

  private removeCookies(res: Response) {
    res.cookie('auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    });
  }
}
