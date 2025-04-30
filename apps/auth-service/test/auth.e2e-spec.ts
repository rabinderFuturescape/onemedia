import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { Provider } from '@prisma/client';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user with LOCAL provider', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test-register@example.com',
          password: 'password123',
          name: 'Test User',
          lastName: 'Register',
          provider: Provider.LOCAL,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('register', true);
          expect(res.body).toHaveProperty('activate', true);
          expect(res.header).toHaveProperty('activate', 'true');
        });
    });

    it('should return 400 if email is already registered', async () => {
      // Create a user first
      await prismaService.user.create({
        data: {
          email: 'test-duplicate@example.com',
          password: 'hashedPassword',
          providerName: Provider.LOCAL,
          activated: true,
        },
      });

      // Try to register with the same email
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test-duplicate@example.com',
          password: 'password123',
          name: 'Test User',
          lastName: 'Duplicate',
          provider: Provider.LOCAL,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('register', false);
          expect(res.body).toHaveProperty('error', 'User already exists');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      await prismaService.user.create({
        data: {
          email: 'test-login@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: true,
        },
      });
    });

    it('should login a user with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'password123',
          provider: Provider.LOCAL,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('login', true);
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.header).toHaveProperty('set-cookie');
        });
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-login@example.com',
          password: 'wrongpassword',
          provider: Provider.LOCAL,
        })
        .expect(401);
    });

    it('should return 401 if user is not activated', async () => {
      // Create an inactive user
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      await prismaService.user.create({
        data: {
          email: 'test-inactive@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: false,
        },
      });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test-inactive@example.com',
          password: 'password123',
          provider: Provider.LOCAL,
        })
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create a test user and get a token
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      const user = await prismaService.user.create({
        data: {
          email: 'test-me@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: true,
        },
      });

      const { generateAccessToken } = app.get('TokenServicePort');
      accessToken = generateAccessToken(user);
    });

    it('should return user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user).toHaveProperty('email', 'test-me@example.com');
        });
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      await prismaService.user.create({
        data: {
          email: 'test-forgot@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: true,
        },
      });
    });

    it('should process forgot password request', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'test-forgot@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('forgot', true);
        });
    });

    it('should return success even if email does not exist (security)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('forgot', true);
        });
    });
  });

  describe('/auth/activate/:token (POST)', () => {
    let activationToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create an inactive test user
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      const user = await prismaService.user.create({
        data: {
          email: 'test-activate@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: false,
        },
      });
      
      userId = user.id;

      const { generateAccessToken } = app.get('TokenServicePort');
      activationToken = generateAccessToken(user);
    });

    it('should activate a user account', () => {
      return request(app.getHttpServer())
        .post(`/api/auth/activate/${activationToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('can', true);
          expect(res.header).toHaveProperty('set-cookie');
          expect(res.header).toHaveProperty('onboarding', 'true');
        });
    });

    it('should verify the user is activated in the database', async () => {
      await request(app.getHttpServer())
        .post(`/api/auth/activate/${activationToken}`)
        .expect(200);
      
      const user = await prismaService.user.findUnique({
        where: { id: userId },
      });
      
      expect(user.activated).toBe(true);
    });

    it('should return error with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/activate/invalid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('can', false);
        });
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create a test user
      const { hashPassword } = app.get('CryptoService');
      const hashedPassword = await hashPassword('password123');
      
      const user = await prismaService.user.create({
        data: {
          email: 'test-refresh@example.com',
          password: hashedPassword,
          providerName: Provider.LOCAL,
          activated: true,
        },
      });

      const { generateRefreshToken } = app.get('TokenServicePort');
      refreshToken = generateRefreshToken(user);
    });

    it('should refresh access token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.header).toHaveProperty('set-cookie');
        });
    });

    it('should return 401 with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should clear auth cookie', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('logout', true);
          expect(res.header).toHaveProperty('set-cookie');
          expect(res.header).toHaveProperty('logout', 'true');
          
          // Verify cookie is cleared (expires in the past)
          const cookies = res.header['set-cookie'][0];
          expect(cookies).toContain('auth=;');
          expect(cookies).toContain('Expires=');
        });
    });
  });
});
