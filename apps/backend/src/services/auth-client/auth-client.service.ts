import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthClientService {
  private authServiceUrl: string;

  constructor(private httpService: HttpService) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001/api/auth';
  }

  async validateToken(token: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  async login(email: string, password: string, provider: Provider = Provider.LOCAL) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/login`, {
          email,
          password,
          provider,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData: any, ip: string, userAgent: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/register`,
          userData,
          {
            headers: {
              'x-real-ip': ip,
              'user-agent': userAgent,
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/forgot-password`, {
          email,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Forgot password request failed');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/reset-password`, {
          token,
          newPassword,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async activateAccount(token: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/activate/${token}`, {})
      );
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getProviderAuthLink(provider: Provider, query?: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/provider/${provider}`, {
          params: query,
        })
      );
      return response.data.link;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get provider auth link');
    }
  }

  async handleProviderCallback(provider: Provider, code: string, ip: string, userAgent: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/provider/${provider}/callback`,
          { code },
          {
            headers: {
              'x-real-ip': ip,
              'user-agent': userAgent,
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Provider authentication failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/refresh`, {
          refreshToken,
        })
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }
}
