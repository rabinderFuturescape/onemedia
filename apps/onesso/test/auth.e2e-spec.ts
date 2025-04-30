import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  // Mock auth service methods
  const mockAuthService = {
    validateCredentials: jest.fn(),
    register: jest.fn(),
    getLoginUrl: jest.fn(),
    handleCallback: jest.fn(),
    refreshToken: jest.fn(),
    getLogoutUrl: jest.fn(),
    validateToken: jest.fn(),
    getUserInfo: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    authService = moduleFixture.get<AuthService>(AuthService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/login (POST)', () => {
    it('should return 401 for invalid credentials', async () => {
      mockAuthService.validateCredentials.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should return tokens for valid credentials', async () => {
      const mockAuthResult = {
        login: true,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthService.validateCredentials.mockResolvedValue(mockAuthResult);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'correct-password',
        })
        .expect(201);

      expect(response.body).toEqual(mockAuthResult);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('auth=access-token');
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          // Missing password
        })
        .expect(400);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        lastName: 'Test',
      };

      const mockRegisterResult = {
        register: true,
        id: 'new-user-id',
        email: registerDto.email,
        name: registerDto.name,
      };

      mockAuthService.register.mockResolvedValue(mockRegisterResult);

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({
        register: true,
        activate: true,
      });
      expect(response.headers['activate']).toBe('true');
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'short', // Too short
          name: 'New User',
        })
        .expect(400);
    });

    it('should handle registration errors', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      };

      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201); // Still returns 201 but with error info

      expect(response.body).toEqual({
        register: false,
        error: 'User already exists',
      });
    });
  });

  describe('/auth/login/oauth (GET)', () => {
    it('should return OAuth login URL', async () => {
      const loginUrl = 'http://keycloak/auth/login';
      mockAuthService.getLoginUrl.mockReturnValue(loginUrl);

      const response = await request(app.getHttpServer())
        .get('/api/auth/login/oauth')
        .query({ redirect_uri: 'http://localhost:3000/callback' })
        .expect(200);

      expect(response.body).toEqual({ url: loginUrl });
      expect(mockAuthService.getLoginUrl).toHaveBeenCalledWith('http://localhost:3000/callback');
    });

    it('should use default redirect URI if not provided', async () => {
      const loginUrl = 'http://keycloak/auth/login';
      mockAuthService.getLoginUrl.mockReturnValue(loginUrl);

      await request(app.getHttpServer())
        .get('/api/auth/login/oauth')
        .expect(200);

      // Should use the default frontend URL from config
      expect(mockAuthService.getLoginUrl).toHaveBeenCalled();
    });
  });

  describe('/auth/callback (GET)', () => {
    it('should handle OAuth callback', async () => {
      const mockCallbackResult = {
        login: true,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      };

      mockAuthService.handleCallback.mockResolvedValue(mockCallbackResult);

      const response = await request(app.getHttpServer())
        .get('/api/auth/callback')
        .query({
          code: 'auth-code',
          redirect_uri: 'http://localhost:3000/callback',
        })
        .expect(200);

      expect(response.body).toEqual(mockCallbackResult);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('auth=access-token');
      expect(mockAuthService.handleCallback).toHaveBeenCalledWith(
        'auth-code',
        'http://localhost:3000/callback',
      );
    });

    it('should return 401 if no code is provided', async () => {
      return request(app.getHttpServer())
        .get('/api/auth/callback')
        .query({ redirect_uri: 'http://localhost:3000/callback' })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens', async () => {
      const mockRefreshResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResult);

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'old-refresh-token' })
        .expect(201);

      expect(response.body).toEqual(mockRefreshResult);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('auth=new-access-token');
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });

    it('should return 401 if no refresh token is provided', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user', async () => {
      const logoutUrl = 'http://keycloak/auth/logout';
      mockAuthService.getLogoutUrl.mockReturnValue(logoutUrl);

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .query({ redirect_uri: 'http://localhost:3000' })
        .expect(201);

      expect(response.body).toEqual({
        logout: true,
        redirectUrl: logoutUrl,
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('auth=;');
      expect(mockAuthService.getLogoutUrl).toHaveBeenCalledWith('http://localhost:3000');
    });
  });

  describe('/auth/validate (GET)', () => {
    it('should validate token', async () => {
      const userInfo = {
        sub: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
      };

      mockAuthService.validateToken.mockResolvedValue(userInfo);

      const response = await request(app.getHttpServer())
        .get('/api/auth/validate')
        .query({ token: 'valid-token' })
        .expect(200);

      expect(response.body).toEqual({
        valid: true,
        user: userInfo,
      });
      expect(mockAuthService.validateToken).toHaveBeenCalledWith('valid-token');
    });

    it('should return 401 for invalid token', async () => {
      mockAuthService.validateToken.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/auth/validate')
        .query({ token: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should initiate password reset', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'user@example.com' })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Password reset instructions sent to your email',
      });
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    it('should handle non-existent user gracefully', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(201);

      expect(response.body).toEqual({
        success: false,
        message: 'If an account with this email exists, password reset instructions will be sent',
      });
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'reset-token',
          password: 'NewPassword123!',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Password reset successful',
      });
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPassword123!');
    });

    it('should handle invalid reset token', async () => {
      mockAuthService.resetPassword.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired token',
      });
    });

    it('should validate request body', async () => {
      return request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'reset-token',
          password: 'short', // Too short
        })
        .expect(400);
    });
  });
});
