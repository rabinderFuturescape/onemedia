import { Test, TestingModule } from '@nestjs/testing';
import { NextAuthService } from './nextauth.service';
import { ConfigService } from '@nestjs/config';
import { KeycloakService } from '../../common/services/keycloak.service';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';
import { LoggingService } from '../../common/services/logging.service';

describe('NextAuthService', () => {
  let service: NextAuthService;
  let configService: ConfigService;
  let keycloakService: KeycloakService;
  let keycloakAdminService: KeycloakAdminService;
  let loggingService: LoggingService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockKeycloakService = {
    getKeycloakInstance: jest.fn(),
  };

  const mockKeycloakAdminService = {
    getClient: jest.fn().mockReturnValue({
      identityProviders: {
        find: jest.fn(),
      },
    }),
  };

  const mockLoggingService = {
    setContext: jest.fn().mockReturnThis(),
    error: jest.fn(),
  };

  beforeEach(async () => {
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

    // Mock global fetch
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NextAuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: KeycloakService,
          useValue: mockKeycloakService,
        },
        {
          provide: KeycloakAdminService,
          useValue: mockKeycloakAdminService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<NextAuthService>(NextAuthService);
    configService = module.get<ConfigService>(ConfigService);
    keycloakService = module.get<KeycloakService>(KeycloakService);
    keycloakAdminService = module.get<KeycloakAdminService>(KeycloakAdminService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOidcConfiguration', () => {
    it('should fetch OIDC configuration from Keycloak', async () => {
      const mockOidcConfig = {
        issuer: 'http://localhost:8080/auth/realms/onesso',
        authorization_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/auth',
        token_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/token',
        userinfo_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/userinfo',
        jwks_uri: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/certs',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOidcConfig),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getOidcConfiguration();

      expect(result).toEqual(mockOidcConfig);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/.well-known/openid-configuration',
      );
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getOidcConfiguration()).rejects.toThrow(
        'Failed to fetch OIDC configuration: Not Found',
      );
      expect(loggingService.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getOidcConfiguration()).rejects.toThrow('Network error');
      expect(loggingService.error).toHaveBeenCalled();
    });
  });

  describe('getJwks', () => {
    it('should fetch JWKS from Keycloak', async () => {
      const mockJwks = {
        keys: [
          {
            kid: 'key-id',
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            n: 'base64-encoded-modulus',
            e: 'AQAB',
          },
        ],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockJwks),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getJwks();

      expect(result).toEqual(mockJwks);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/certs',
      );
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.getJwks()).rejects.toThrow(
        'Failed to fetch JWKS: Not Found',
      );
      expect(loggingService.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getJwks()).rejects.toThrow('Network error');
      expect(loggingService.error).toHaveBeenCalled();
    });
  });

  describe('getProviders', () => {
    it('should return providers from Keycloak', async () => {
      const mockIdentityProviders = [
        {
          alias: 'google',
          displayName: 'Google',
        },
        {
          alias: 'github',
          displayName: 'GitHub',
        },
      ];

      mockKeycloakAdminService.getClient().identityProviders.find.mockResolvedValue(mockIdentityProviders);

      const result = await service.getProviders();

      // Should include the identity providers plus the default onesso provider
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('google');
      expect(result[1].id).toBe('github');
      expect(result[2].id).toBe('onesso');
    });

    it('should handle errors and return default provider', async () => {
      mockKeycloakAdminService.getClient().identityProviders.find.mockRejectedValue(new Error('Failed to get providers'));

      const result = await service.getProviders();

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('onesso');
      expect(loggingService.error).toHaveBeenCalled();
    });
  });
});
