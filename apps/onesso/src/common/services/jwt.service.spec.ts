import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let service: JwtService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Default mock values
    mockConfigService.get.mockImplementation((key: string) => {
      const values = {
        'JWT_SECRET': 'test-secret',
        'JWT_EXPIRATION': '1d',
        'JWT_EXPIRATION_SECONDS': '86400',
      };
      return values[key];
    });

    // Mock jwt functions
    (jwt.sign as jest.Mock).mockImplementation((payload, secret, options) => {
      return 'mocked-jwt-token';
    });

    (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
      if (token === 'valid-token') {
        return { sub: 'user-id' };
      }
      throw new Error('Invalid token');
    });

    (jwt.decode as jest.Mock).mockImplementation((token) => {
      return { sub: 'user-id' };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT access token', () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        isSuperAdmin: false,
        tenant_id: 'tenant-1',
      };

      const token = service.generateAccessToken(user);

      expect(token).toBe('mocked-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
          tenant_id: user.tenant_id,
        },
        'test-secret',
        { expiresIn: '1d' },
      );
    });

    it('should handle missing user properties', () => {
      const user = {
        id: 'user-id',
        email: 'user@example.com',
      };

      const token = service.generateAccessToken(user);

      expect(token).toBe('mocked-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: undefined,
          isSuperAdmin: false,
          tenant_id: undefined,
        },
        'test-secret',
        { expiresIn: '1d' },
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a JWT refresh token', () => {
      const user = {
        id: 'user-id',
      };

      const token = service.generateRefreshToken(user);

      expect(token).toBe('mocked-jwt-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: user.id },
        'test-secret',
        { expiresIn: '7d' },
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = 'valid-token';
      const result = service.verifyToken(token);

      expect(result).toEqual({ sub: 'user-id' });
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should return null for an invalid token', () => {
      const token = 'invalid-token';
      const result = service.verifyToken(token);

      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });
  });

  describe('decodeToken', () => {
    it('should decode a token', () => {
      const token = 'any-token';
      const result = service.decodeToken(token);

      expect(result).toEqual({ sub: 'user-id' });
      expect(jwt.decode).toHaveBeenCalledWith(token);
    });
  });

  describe('convertKeycloakToken', () => {
    it('should convert a Keycloak token to a compatible format', () => {
      const keycloakToken = {
        access_token: 'keycloak-access-token',
        refresh_token: 'keycloak-refresh-token',
        expires_in: 300,
      };

      const keycloakUser = {
        sub: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        realm_access: {
          roles: ['user', 'admin'],
        },
        tenant_id: 'tenant-1',
      };

      // Mock the generateAccessToken method
      jest.spyOn(service, 'generateAccessToken').mockReturnValue('compatible-jwt-token');

      const result = service.convertKeycloakToken(keycloakToken, keycloakUser);

      expect(result).toEqual({
        accessToken: 'compatible-jwt-token',
        refreshToken: 'keycloak-refresh-token',
        expiresIn: 86400,
      });

      expect(service.generateAccessToken).toHaveBeenCalledWith({
        id: keycloakUser.sub,
        email: keycloakUser.email,
        name: keycloakUser.name,
        isSuperAdmin: true, // Because user has admin role
        tenant_id: keycloakUser.tenant_id,
      });
    });

    it('should handle missing roles in Keycloak user', () => {
      const keycloakToken = {
        access_token: 'keycloak-access-token',
        refresh_token: 'keycloak-refresh-token',
        expires_in: 300,
      };

      const keycloakUser = {
        sub: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        tenant_id: 'tenant-1',
      };

      // Mock the generateAccessToken method
      jest.spyOn(service, 'generateAccessToken').mockReturnValue('compatible-jwt-token');

      const result = service.convertKeycloakToken(keycloakToken, keycloakUser);

      expect(service.generateAccessToken).toHaveBeenCalledWith({
        id: keycloakUser.sub,
        email: keycloakUser.email,
        name: keycloakUser.name,
        isSuperAdmin: false,
        tenant_id: keycloakUser.tenant_id,
      });
    });
  });
});
