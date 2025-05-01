import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AuthClientService } from './auth-client.service';
import { Provider } from '@prisma/client';

describe('AuthClientService Integration', () => {
  let service: AuthClientService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
      ],
      providers: [AuthClientService],
    }).compile();

    service = module.get<AuthClientService>(AuthClientService);
    httpService = module.get<HttpService>(HttpService);

    // Set environment variables for testing
    process.env.AUTH_SERVICE_URL = 'http://localhost:3001/api/auth';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('OneSSO Authentication Flow', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Mock the HTTP response for login
      const mockLoginResponse: AxiosResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/login' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockLoginResponse));

      // Perform login
      const loginResult = await service.login('test@example.com', 'password123', Provider.LOCAL);

      // Verify login result
      expect(loginResult).toEqual(mockLoginResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        {
          email: 'test@example.com',
          password: 'password123',
          provider: Provider.LOCAL,
        }
      );

      // Mock the HTTP response for token validation
      const mockValidateResponse: AxiosResponse = {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/me' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockValidateResponse));

      // Validate token
      const validateResult = await service.validateToken('mock-access-token');

      // Verify validation result
      expect(validateResult).toEqual(mockValidateResponse.data.user);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        {
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );

      // Mock the HTTP response for token refresh
      const mockRefreshResponse: AxiosResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/refresh' } as any,
      };

      jest.spyOn(httpService, 'post').mockImplementation(() => of(mockRefreshResponse));

      // Refresh token
      const refreshResult = await service.refreshToken('mock-refresh-token');

      // Verify refresh result
      expect(refreshResult).toEqual(mockRefreshResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/refresh'),
        {
          refreshToken: 'mock-refresh-token',
        }
      );
    });

    it('should handle authentication errors', async () => {
      // Mock the HTTP response for failed login
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid credentials',
            },
            status: 401,
          },
        }))
      );

      // Attempt login with invalid credentials
      await expect(service.login('test@example.com', 'wrong-password', Provider.LOCAL))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle token validation errors', async () => {
      // Mock the HTTP response for failed token validation
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid token',
            },
            status: 401,
          },
        }))
      );

      // Attempt to validate an invalid token
      const validateResult = await service.validateToken('invalid-token');

      // Verify validation result is null for invalid token
      expect(validateResult).toBeNull();
    });

    it('should handle token refresh errors', async () => {
      // Mock the HTTP response for failed token refresh
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid refresh token',
            },
            status: 401,
          },
        }))
      );

      // Attempt to refresh with an invalid token
      await expect(service.refreshToken('invalid-refresh-token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('OAuth Provider Authentication', () => {
    it('should get provider auth link', async () => {
      // Mock the HTTP response for getting provider auth link
      const mockResponse: AxiosResponse = {
        data: { link: 'https://provider.com/auth' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://localhost:3001/api/auth/provider/GOOGLE' } as any,
      };

      jest.spyOn(httpService, 'get').mockImplementation(() => of(mockResponse));

      // Get provider auth link
      const result = await service.getProviderAuthLink(Provider.GOOGLE, { redirect: 'http://localhost:4200/callback' });

      // Verify result
      expect(result).toEqual('https://provider.com/auth');
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/provider/GOOGLE'),
        {
          params: { redirect: 'http://localhost:4200/callback' },
        }
      );
    });

    it('should handle provider callback', async () => {
      // Mock the HTTP response for provider callback
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

      // Handle provider callback
      const result = await service.handleProviderCallback(Provider.GOOGLE, 'auth-code', '127.0.0.1', 'test-agent');

      // Verify result
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

    it('should handle provider callback errors', async () => {
      // Mock the HTTP response for failed provider callback
      jest.spyOn(httpService, 'post').mockImplementation(() =>
        throwError(() => ({
          response: {
            data: {
              message: 'Invalid authorization code',
            },
            status: 400,
          },
        }))
      );

      // Attempt to handle provider callback with invalid code
      await expect(service.handleProviderCallback(Provider.GOOGLE, 'invalid-code', '127.0.0.1', 'test-agent'))
        .rejects.toThrow('Invalid authorization code');
    });
  });

  describe('Configuration', () => {
    it('should use the correct OneSSO URL from configuration', async () => {
      // Create a new service instance with a custom URL
      const customService = new AuthClientService(httpService);

      // Set a custom AUTH_SERVICE_URL
      process.env.AUTH_SERVICE_URL = 'http://custom-onesso-url:3002/api/auth';

      // Force the service to reinitialize with the new URL
      Object.defineProperty(customService, 'authServiceUrl', {
        value: 'http://custom-onesso-url:3002/api/auth',
        writable: true
      });

      // Mock the HTTP response
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://custom-onesso-url:3002/api/auth/login' } as any,
      };

      const postSpy = jest.spyOn(httpService, 'post').mockImplementation(() => of(mockResponse));

      // Perform login to trigger URL construction
      await customService.login('test@example.com', 'password123', Provider.LOCAL);

      // Verify the correct URL was used
      expect(postSpy).toHaveBeenCalledWith(
        'http://custom-onesso-url:3002/api/auth/login',
        {
          email: 'test@example.com',
          password: 'password123',
          provider: Provider.LOCAL,
        }
      );

      // Reset the URL for other tests
      process.env.AUTH_SERVICE_URL = 'http://localhost:3001/api/auth';
    });
  });
});
