import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakService } from './keycloak.service';
import { ConfigService } from '@nestjs/config';
import * as KeycloakConnect from 'keycloak-connect';

jest.mock('keycloak-connect');

describe('KeycloakService', () => {
  let service: KeycloakService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockKeycloakInstance = {
    // Add any Keycloak methods that are used in the service
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock ConfigService values
    mockConfigService.get.mockImplementation((key: string) => {
      const values = {
        'KEYCLOAK_REALM': 'onesso',
        'KEYCLOAK_URL': 'http://localhost:8080/auth',
        'KEYCLOAK_CLIENT_ID': 'onesso-admin',
        'KEYCLOAK_CLIENT_SECRET': 'client-secret',
        'KEYCLOAK_PUBLIC_CLIENT_ID': 'onesso-public',
      };
      return values[key];
    });

    // Mock KeycloakConnect constructor
    (KeycloakConnect as any).mockImplementation(() => mockKeycloakInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeycloakService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KeycloakService>(KeycloakService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Keycloak with correct config', () => {
    expect(KeycloakConnect).toHaveBeenCalledWith({}, {
      realm: 'onesso',
      'auth-server-url': 'http://localhost:8080/auth',
      resource: 'onesso-admin',
      'bearer-only': false,
      'confidential-port': 0,
      'ssl-required': 'external',
      credentials: {
        secret: 'client-secret',
      },
    });
  });

  describe('getKeycloakInstance', () => {
    it('should return the Keycloak instance', () => {
      const instance = service.getKeycloakInstance();
      expect(instance).toBe(mockKeycloakInstance);
    });
  });

  describe('getLoginUrl', () => {
    it('should return the correct login URL', () => {
      const redirectUri = 'http://localhost:3000/callback';
      const expectedUrl = 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/auth?client_id=onesso-public&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&response_type=code&scope=openid';
      
      const url = service.getLoginUrl(redirectUri);
      
      expect(url).toBe(expectedUrl);
    });
  });

  describe('getLogoutUrl', () => {
    it('should return the correct logout URL', () => {
      const redirectUri = 'http://localhost:3000';
      const expectedUrl = 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/logout?redirect_uri=http%3A%2F%2Flocalhost%3A3000';
      
      const url = service.getLogoutUrl(redirectUri);
      
      expect(url).toBe(expectedUrl);
    });
  });

  describe('exchangeCodeForToken', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should exchange code for token successfully', async () => {
      const code = 'auth_code';
      const redirectUri = 'http://localhost:3000/callback';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'access_token',
          refresh_token: 'refresh_token',
          expires_in: 300,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await service.exchangeCodeForToken(code, redirectUri);
      
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 300,
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }),
      );
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const bodyParams = new URLSearchParams(fetchCall[1].body);
      
      expect(bodyParams.get('grant_type')).toBe('authorization_code');
      expect(bodyParams.get('code')).toBe(code);
      expect(bodyParams.get('client_id')).toBe('onesso-public');
      expect(bodyParams.get('client_secret')).toBe('client-secret');
      expect(bodyParams.get('redirect_uri')).toBe(redirectUri);
    });

    it('should throw error when exchange fails', async () => {
      const code = 'invalid_code';
      const redirectUri = 'http://localhost:3000/callback';
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request',
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(service.exchangeCodeForToken(code, redirectUri)).rejects.toThrow(
        'Failed to exchange code for token: Bad Request'
      );
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should refresh token successfully', async () => {
      const refreshToken = 'refresh_token';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 300,
        }),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await service.refreshToken(refreshToken);
      
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 300,
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }),
      );
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const bodyParams = new URLSearchParams(fetchCall[1].body);
      
      expect(bodyParams.get('grant_type')).toBe('refresh_token');
      expect(bodyParams.get('refresh_token')).toBe(refreshToken);
      expect(bodyParams.get('client_id')).toBe('onesso-public');
      expect(bodyParams.get('client_secret')).toBe('client-secret');
    });

    it('should throw error when refresh fails', async () => {
      const refreshToken = 'invalid_refresh_token';
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized',
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        'Failed to refresh token: Unauthorized'
      );
    });
  });

  describe('validateToken', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should validate token successfully', async () => {
      const token = 'valid_token';
      const userInfo = {
        sub: 'user_id',
        email: 'user@example.com',
        name: 'Test User',
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(userInfo),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await service.validateToken(token);
      
      expect(result).toEqual(userInfo);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/userinfo',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    });

    it('should return null for invalid token', async () => {
      const token = 'invalid_token';
      const mockResponse = {
        ok: false,
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await service.validateToken(token);
      
      expect(result).toBeNull();
    });

    it('should return null when fetch throws an error', async () => {
      const token = 'error_token';
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await service.validateToken(token);
      
      expect(result).toBeNull();
    });
  });

  describe('introspectToken', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should introspect token successfully', async () => {
      const token = 'valid_token';
      const introspectionResult = {
        active: true,
        sub: 'user_id',
        exp: Math.floor(Date.now() / 1000) + 300,
      };
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(introspectionResult),
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await service.introspectToken(token);
      
      expect(result).toEqual(introspectionResult);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/token/introspect',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }),
      );
      
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const bodyParams = new URLSearchParams(fetchCall[1].body);
      
      expect(bodyParams.get('token')).toBe(token);
      expect(bodyParams.get('client_id')).toBe('onesso-admin');
      expect(bodyParams.get('client_secret')).toBe('client-secret');
    });

    it('should throw error when introspection fails', async () => {
      const token = 'invalid_token';
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request',
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      await expect(service.introspectToken(token)).rejects.toThrow(
        'Failed to introspect token: Bad Request'
      );
    });
  });
});
