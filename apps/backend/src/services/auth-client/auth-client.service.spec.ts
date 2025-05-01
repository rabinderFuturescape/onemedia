import { Test, TestingModule } from '@nestjs/testing';
import { AuthClientService } from './auth-client.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Provider } from '@prisma/client';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('AuthClientService', () => {
  let service: AuthClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [AuthClientService],
    }).compile();

    service = module.get<AuthClientService>(AuthClientService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateToken', () => {
    it('should return user data if token is valid', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockResponse: AxiosResponse = {
        data: { user: mockUser },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/me' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.validateToken('valid-token');
      expect(result).toEqual(mockUser);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );
    });

    it('should return null if token validation fails', async () => {
      jest.spyOn(httpService, 'get').mockImplementation(() =>
        throwError(() => new Error('Unauthorized'))
      );

      const result = await service.validateToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return login data on successful login', async () => {
      const mockLoginResponse = {
        login: true,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      const mockResponse: AxiosResponse = {
        data: mockLoginResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/login' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.login('test@example.com', 'password', Provider.LOCAL);
      expect(result).toEqual(mockLoginResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        {
          email: 'test@example.com',
          password: 'password',
          provider: Provider.LOCAL,
        }
      );
    });

    it('should throw error if login fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid email or password',
            },
          },
        }))
      );

      await expect(service.login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    it('should return registration data on successful registration', async () => {
      const mockRegisterResponse = {
        register: true,
        activate: true,
      };

      const mockResponse: AxiosResponse = {
        data: mockRegisterResponse,
        status: 201,
        statusText: 'Created',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/register' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const userData = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
        provider: Provider.LOCAL,
      };

      const result = await service.register(userData, '127.0.0.1', 'test-agent');
      expect(result).toEqual(mockRegisterResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        userData,
        {
          headers: {
            'x-real-ip': '127.0.0.1',
            'user-agent': 'test-agent',
          },
        }
      );
    });
  });

  describe('activateAccount', () => {
    it('should return activation data on successful activation', async () => {
      const mockActivationResponse = {
        can: true,
      };

      const mockResponse: AxiosResponse = {
        data: mockActivationResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/activate/token' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.activateAccount('token');
      expect(result).toEqual(mockActivationResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/activate/token'),
        {}
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on successful refresh', async () => {
      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      const mockResponse: AxiosResponse = {
        data: mockRefreshResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/refresh' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.refreshToken('refresh-token');
      expect(result).toEqual(mockRefreshResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/refresh'),
        {
          refreshToken: 'refresh-token',
        }
      );
    });

    it('should throw error if refresh token fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid refresh token',
            },
          },
        }))
      );

      await expect(service.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('forgotPassword', () => {
    it('should return success response on forgot password request', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/forgot-password' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.forgotPassword('test@example.com');
      expect(result).toEqual({ success: true });
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/forgot-password'),
        {
          email: 'test@example.com',
        }
      );
    });

    it('should throw error if forgot password request fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Email not found',
            },
          },
        }))
      );

      await expect(service.forgotPassword('nonexistent@example.com')).rejects.toThrow('Email not found');
    });
  });

  describe('resetPassword', () => {
    it('should return success response on password reset', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/reset-password' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.resetPassword('reset-token', 'newPassword123');
      expect(result).toEqual({ success: true });
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/reset-password'),
        {
          token: 'reset-token',
          newPassword: 'newPassword123',
        }
      );
    });

    it('should throw error if password reset fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid or expired token',
            },
          },
        }))
      );

      await expect(service.resetPassword('invalid-token', 'newPassword123')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('getProviderAuthLink', () => {
    it('should return provider auth link', async () => {
      const mockResponse: AxiosResponse = {
        data: { link: 'https://provider.com/auth' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/provider/GOOGLE' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      const result = await service.getProviderAuthLink(Provider.GOOGLE, { redirect: 'http://localhost:4200/callback' });
      expect(result).toEqual('https://provider.com/auth');
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/provider/GOOGLE'),
        {
          params: { redirect: 'http://localhost:4200/callback' },
        }
      );
    });

    it('should throw error if getting provider auth link fails', async () => {
      jest.spyOn(httpService, 'get').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Provider not supported',
            },
          },
        }))
      );

      await expect(service.getProviderAuthLink(Provider.GOOGLE)).rejects.toThrow('Provider not supported');
    });
  });

  describe('handleProviderCallback', () => {
    it('should handle provider callback successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', email: 'test@example.com' }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/provider/GOOGLE/callback' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      const result = await service.handleProviderCallback(Provider.GOOGLE, 'auth-code', '127.0.0.1', 'test-agent');
      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/provider/GOOGLE/callback'),
        { code: 'auth-code' },
        {
          headers: {
            'x-real-ip': '127.0.0.1',
            'user-agent': 'test-agent',
          },
        }
      );
    });

    it('should throw error if provider callback fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid authorization code',
            },
          },
        }))
      );

      await expect(service.handleProviderCallback(Provider.GOOGLE, 'invalid-code', '127.0.0.1', 'test-agent')).rejects.toThrow('Invalid authorization code');
    });
  });
});
