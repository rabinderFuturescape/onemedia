import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { NextAuthService } from '../src/modules/nextauth/nextauth.service';
import * as cookieParser from 'cookie-parser';

describe('NextAuthController (e2e)', () => {
  let app: INestApplication;
  let nextAuthService: NextAuthService;

  // Mock NextAuth service methods
  const mockNextAuthService = {
    getOidcConfiguration: jest.fn(),
    getJwks: jest.fn(),
    getProviders: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NextAuthService)
      .useValue(mockNextAuthService)
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
    
    nextAuthService = moduleFixture.get<NextAuthService>(NextAuthService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/nextauth/.well-known/openid-configuration (GET)', () => {
    it('should return OIDC configuration', async () => {
      const mockOidcConfig = {
        issuer: 'http://localhost:8080/auth/realms/onesso',
        authorization_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/auth',
        token_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/token',
        userinfo_endpoint: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/userinfo',
        jwks_uri: 'http://localhost:8080/auth/realms/onesso/protocol/openid-connect/certs',
        response_types_supported: ['code', 'id_token', 'token'],
        subject_types_supported: ['public', 'pairwise'],
        id_token_signing_alg_values_supported: ['RS256'],
      };

      mockNextAuthService.getOidcConfiguration.mockResolvedValue(mockOidcConfig);

      const response = await request(app.getHttpServer())
        .get('/api/nextauth/.well-known/openid-configuration')
        .expect(200);

      expect(response.body).toEqual(mockOidcConfig);
      expect(mockNextAuthService.getOidcConfiguration).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockNextAuthService.getOidcConfiguration.mockRejectedValue(new Error('Failed to fetch OIDC configuration'));

      return request(app.getHttpServer())
        .get('/api/nextauth/.well-known/openid-configuration')
        .expect(500);
    });
  });

  describe('/api/nextauth/jwks (GET)', () => {
    it('should return JWKS', async () => {
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

      mockNextAuthService.getJwks.mockResolvedValue(mockJwks);

      const response = await request(app.getHttpServer())
        .get('/api/nextauth/jwks')
        .expect(200);

      expect(response.body).toEqual(mockJwks);
      expect(mockNextAuthService.getJwks).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockNextAuthService.getJwks.mockRejectedValue(new Error('Failed to fetch JWKS'));

      return request(app.getHttpServer())
        .get('/api/nextauth/jwks')
        .expect(500);
    });
  });

  describe('/api/nextauth/providers (GET)', () => {
    it('should return providers', async () => {
      const mockProviders = [
        {
          id: 'google',
          name: 'Google',
          type: 'oauth',
        },
        {
          id: 'github',
          name: 'GitHub',
          type: 'oauth',
        },
        {
          id: 'onesso',
          name: 'onesso',
          type: 'oauth',
          wellKnown: 'http://localhost:8080/auth/realms/onesso/.well-known/openid-configuration',
        },
      ];

      mockNextAuthService.getProviders.mockResolvedValue(mockProviders);

      const response = await request(app.getHttpServer())
        .get('/api/nextauth/providers')
        .expect(200);

      expect(response.body).toEqual(mockProviders);
      expect(mockNextAuthService.getProviders).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockNextAuthService.getProviders.mockRejectedValue(new Error('Failed to fetch providers'));

      return request(app.getHttpServer())
        .get('/api/nextauth/providers')
        .expect(500);
    });
  });
});
