import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { KeycloakService } from '../../common/services/keycloak.service';
import { KeycloakAdminService } from '../../common/services/keycloak-admin.service';
import { JwtService } from '../../common/services/jwt.service';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../common/services/logging.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let keycloakService: KeycloakService;
  let keycloakAdminService: KeycloakAdminService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let loggingService: LoggingService;

  const mockKeycloakService = {
    getLoginUrl: jest.fn(),
    getLogoutUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    refreshToken: jest.fn(),
    validateToken: jest.fn(),
    introspectToken: jest.fn(),
  };

  const mockKeycloakAdminService = {
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    assignRoleToUser: jest.fn(),
    assignUserToTenant: jest.fn(),
    getClient: jest.fn().mockReturnValue({
      users: {
        executeActionsEmail: jest.fn(),
      },
    }),
  };

  const mockJwtService = {
    convertKeycloakToken: jest.fn(),
    verifyToken: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockLoggingService = {
    setContext: jest.fn().mockReturnThis(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logAuthEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: KeycloakService,
          useValue: mockKeycloakService,
        },
        {
          provide: KeycloakAdminService,
          useValue: mockKeycloakAdminService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    keycloakService = module.get<KeycloakService>(KeycloakService);
    keycloakAdminService = module.get<KeycloakAdminService>(KeycloakAdminService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLoginUrl', () => {
    it('should return login URL from keycloak service', () => {
      const redirectUri = 'http://localhost:3000/callback';
      const expectedUrl = 'http://keycloak/auth/login';
      
      mockKeycloakService.getLoginUrl.mockReturnValue(expectedUrl);
      
      const result = service.getLoginUrl(redirectUri);
      
      expect(result).toBe(expectedUrl);
      expect(mockKeycloakService.getLoginUrl).toHaveBeenCalledWith(redirectUri);
    });
  });

  describe('getLogoutUrl', () => {
    it('should return logout URL from keycloak service', () => {
      const redirectUri = 'http://localhost:3000';
      const expectedUrl = 'http://keycloak/auth/logout';
      
      mockKeycloakService.getLogoutUrl.mockReturnValue(expectedUrl);
      
      const result = service.getLogoutUrl(redirectUri);
      
      expect(result).toBe(expectedUrl);
      expect(mockKeycloakService.getLogoutUrl).toHaveBeenCalledWith(redirectUri);
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for token and return login result', async () => {
      const code = 'auth_code';
      const redirectUri = 'http://localhost:3000/callback';
      const tokenResponse = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        expires_in: 300,
      };
      const userInfo = {
        sub: 'user_id',
        email: 'user@example.com',
        name: 'Test User',
      };
      const compatibleToken = {
        accessToken: 'jwt_token',
        refreshToken: 'refresh_token',
        expiresIn: 300,
      };
      
      mockKeycloakService.exchangeCodeForToken.mockResolvedValue(tokenResponse);
      mockKeycloakService.validateToken.mockResolvedValue(userInfo);
      mockJwtService.convertKeycloakToken.mockReturnValue(compatibleToken);
      
      const result = await service.handleCallback(code, redirectUri);
      
      expect(result).toEqual({
        login: true,
        accessToken: compatibleToken.accessToken,
        refreshToken: compatibleToken.refreshToken,
        expiresIn: compatibleToken.expiresIn,
        keycloakToken: tokenResponse,
      });
      
      expect(mockKeycloakService.exchangeCodeForToken).toHaveBeenCalledWith(code, redirectUri);
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith(tokenResponse.access_token);
      expect(mockJwtService.convertKeycloakToken).toHaveBeenCalledWith(tokenResponse, userInfo);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(userInfo.sub, 'login', true);
    });

    it('should throw UnauthorizedException when exchange fails', async () => {
      const code = 'invalid_code';
      const redirectUri = 'http://localhost:3000/callback';
      
      mockKeycloakService.exchangeCodeForToken.mockRejectedValue(new Error('Exchange failed'));
      
      await expect(service.handleCallback(code, redirectUri)).rejects.toThrow(UnauthorizedException);
      
      expect(mockLoggingService.error).toHaveBeenCalled();
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('unknown', 'login', false, expect.any(Object));
    });
  });

  describe('refreshToken', () => {
    it('should refresh token and return new tokens', async () => {
      const refreshToken = 'refresh_token';
      const tokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 300,
      };
      const userInfo = {
        sub: 'user_id',
        email: 'user@example.com',
        name: 'Test User',
      };
      const compatibleToken = {
        accessToken: 'new_jwt_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 300,
      };
      
      mockKeycloakService.refreshToken.mockResolvedValue(tokenResponse);
      mockKeycloakService.validateToken.mockResolvedValue(userInfo);
      mockJwtService.convertKeycloakToken.mockReturnValue(compatibleToken);
      
      const result = await service.refreshToken(refreshToken);
      
      expect(result).toEqual({
        accessToken: compatibleToken.accessToken,
        refreshToken: compatibleToken.refreshToken,
        expiresIn: compatibleToken.expiresIn,
        keycloakToken: tokenResponse,
      });
      
      expect(mockKeycloakService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith(tokenResponse.access_token);
      expect(mockJwtService.convertKeycloakToken).toHaveBeenCalledWith(tokenResponse, userInfo);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(userInfo.sub, 'token_refresh', true);
    });

    it('should throw UnauthorizedException when refresh fails', async () => {
      const refreshToken = 'invalid_refresh_token';
      
      mockKeycloakService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      
      expect(mockLoggingService.error).toHaveBeenCalled();
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('unknown', 'token_refresh', false, expect.any(Object));
    });
  });

  describe('validateToken', () => {
    it('should validate token with Keycloak and return user info', async () => {
      const token = 'valid_token';
      const userInfo = {
        sub: 'user_id',
        email: 'user@example.com',
        name: 'Test User',
      };
      
      mockKeycloakService.validateToken.mockResolvedValue(userInfo);
      
      const result = await service.validateToken(token);
      
      expect(result).toEqual(userInfo);
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith(token);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(userInfo.sub, 'token_validation', true);
    });

    it('should try legacy JWT validation if Keycloak validation fails', async () => {
      const token = 'legacy_token';
      const payload = {
        sub: 'user_id',
        email: 'user@example.com',
        name: 'Test User',
      };
      
      mockKeycloakService.validateToken.mockResolvedValue(null);
      mockJwtService.verifyToken.mockReturnValue(payload);
      
      const result = await service.validateToken(token);
      
      expect(result).toEqual(payload);
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith(token);
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(token);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(payload.sub, 'token_validation_legacy', true);
    });

    it('should return null if both validations fail', async () => {
      const token = 'invalid_token';
      
      mockKeycloakService.validateToken.mockResolvedValue(null);
      mockJwtService.verifyToken.mockReturnValue(null);
      
      const result = await service.validateToken(token);
      
      expect(result).toBeNull();
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith(token);
      expect(mockJwtService.verifyToken).toHaveBeenCalledWith(token);
    });
  });

  describe('register', () => {
    it('should create a new user and return user data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        lastName: 'Test',
        provider: 'LOCAL',
      };
      const userId = 'new_user_id';
      
      mockKeycloakAdminService.getUserByEmail.mockResolvedValue([]);
      mockKeycloakAdminService.createUser.mockResolvedValue(userId);
      
      const result = await service.register(userData);
      
      expect(result).toEqual({
        id: userId,
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        provider: 'LOCAL',
        tenant_id: undefined,
      });
      
      expect(mockKeycloakAdminService.getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockKeycloakAdminService.createUser).toHaveBeenCalled();
      expect(mockKeycloakAdminService.assignRoleToUser).toHaveBeenCalledWith(userId, 'user');
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(userId, 'register', true);
    });

    it('should assign user to tenant if tenant_id is provided', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        lastName: 'Test',
        provider: 'LOCAL',
        tenant_id: 'tenant1',
      };
      const userId = 'new_user_id';
      
      mockKeycloakAdminService.getUserByEmail.mockResolvedValue([]);
      mockKeycloakAdminService.createUser.mockResolvedValue(userId);
      
      const result = await service.register(userData);
      
      expect(result.tenant_id).toBe(userData.tenant_id);
      expect(mockKeycloakAdminService.assignUserToTenant).toHaveBeenCalledWith(userId, userData.tenant_id);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };
      
      mockKeycloakAdminService.getUserByEmail.mockResolvedValue([{ id: 'existing_id' }]);
      
      await expect(service.register(userData)).rejects.toThrow('User with this email already exists');
      
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('unknown', 'register', false, expect.any(Object));
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset for existing user', async () => {
      const email = 'user@example.com';
      const user = { id: 'user_id' };
      const frontendUrl = 'http://localhost:3000';
      
      mockKeycloakAdminService.getUserByEmail.mockResolvedValue([user]);
      mockConfigService.get.mockReturnValue(frontendUrl);
      
      const result = await service.forgotPassword(email);
      
      expect(result).toBe(true);
      expect(mockKeycloakAdminService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockKeycloakAdminService.getClient().users.executeActionsEmail).toHaveBeenCalledWith({
        id: user.id,
        actions: ['UPDATE_PASSWORD'],
        redirectUri: frontendUrl,
      });
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith(user.id, 'forgot_password', true);
    });

    it('should return false if user does not exist', async () => {
      const email = 'nonexistent@example.com';
      
      mockKeycloakAdminService.getUserByEmail.mockResolvedValue([]);
      
      const result = await service.forgotPassword(email);
      
      expect(result).toBe(false);
      expect(mockLoggingService.logAuthEvent).toHaveBeenCalledWith('unknown', 'forgot_password', false, expect.any(Object));
    });
  });
});
