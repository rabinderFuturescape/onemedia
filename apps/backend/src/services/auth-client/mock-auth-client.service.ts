import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';

@Injectable()
export class AuthClientService {
  async validateToken(token: string) {
    // Mock implementation that always returns a valid user
    return {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin'],
      tenants: ['default']
    };
  }

  async login(email: string, password: string, provider: Provider = Provider.LOCAL) {
    // Mock implementation that always returns a successful login
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        tenants: ['default']
      }
    };
  }

  async register(userData: any, ip: string, userAgent: string) {
    // Mock implementation that always returns a successful registration
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: userData.email || 'admin@example.com',
        name: userData.name || 'Admin User',
        roles: ['admin'],
        tenants: ['default']
      }
    };
  }

  async forgotPassword(email: string) {
    // Mock implementation that always returns a successful forgot password request
    return {
      success: true,
      message: 'Password reset email sent'
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Mock implementation that always returns a successful password reset
    return {
      success: true,
      message: 'Password reset successful'
    };
  }

  async activateAccount(token: string) {
    // Mock implementation that always returns a successful account activation
    return {
      success: true,
      message: 'Account activated successfully'
    };
  }

  async getProviderAuthLink(provider: Provider, query?: any) {
    // Mock implementation that always returns a valid auth link
    return `http://localhost:3002/api/auth/login/${provider.toLowerCase()}`;
  }

  async handleProviderCallback(provider: Provider, code: string, ip: string, userAgent: string) {
    // Mock implementation that always returns a successful provider authentication
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        tenants: ['default']
      }
    };
  }

  async refreshToken(refreshToken: string) {
    // Mock implementation that always returns a successful token refresh
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    };
  }
}
