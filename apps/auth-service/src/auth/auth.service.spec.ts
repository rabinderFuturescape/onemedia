import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Provider } from '@prisma/client';
import { CryptoService } from '../infrastructure/services/crypto.service';
import { User } from '../domain/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository;
  let mockTokenService;
  let mockCryptoService;

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByProvider: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      activateUser: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
      decodeToken: jest.fn(),
    };

    mockCryptoService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      fixedEncryption: jest.fn(),
      fixedDecryption: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepositoryPort',
          useValue: mockUserRepository,
        },
        {
          provide: 'TokenServicePort',
          useValue: mockTokenService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com', Provider.LOCAL);
    });

    it('should return null if password is invalid', async () => {
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        providerName: Provider.LOCAL,
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockCryptoService.comparePassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
      expect(mockCryptoService.comparePassword).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('should return user if credentials are valid', async () => {
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        providerName: Provider.LOCAL,
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockCryptoService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should generate tokens and return them', async () => {
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
        providerName: Provider.LOCAL,
      });
      
      mockTokenService.generateAccessToken.mockReturnValue('access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('refresh-token');
      
      process.env.JWT_EXPIRATION_SECONDS = '3600';

      const result = await service.login(mockUser);
      
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
      });
      
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('register', () => {
    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        providerName: Provider.LOCAL,
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(new User({ id: '1' }));

      await expect(service.register(userData, '127.0.0.1', 'test-agent')).rejects.toThrow('User already exists');
    });

    it('should hash password for LOCAL provider', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        providerName: Provider.LOCAL,
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockCryptoService.hashPassword.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(new User({ id: '1', ...userData, password: 'hashed-password' }));

      await service.register(userData, '127.0.0.1', 'test-agent');
      
      expect(mockCryptoService.hashPassword).toHaveBeenCalledWith('password');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: 'hashed-password',
        activated: false,
        ip: '127.0.0.1',
        agent: 'test-agent',
      });
    });

    it('should set activated to true for non-LOCAL providers', async () => {
      const userData = {
        email: 'test@example.com',
        providerName: Provider.GOOGLE,
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(new User({ id: '1', ...userData, activated: true }));

      await service.register(userData, '127.0.0.1', 'test-agent');
      
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        activated: true,
        ip: '127.0.0.1',
        agent: 'test-agent',
      });
    });
  });

  describe('validateToken', () => {
    it('should return null if token is invalid', async () => {
      mockTokenService.verifyToken.mockReturnValue(null);

      const result = await service.validateToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return user if token is valid', async () => {
      const mockUser = new User({ id: '1', email: 'test@example.com' });
      
      mockTokenService.verifyToken.mockReturnValue({ sub: '1' });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateToken('valid-token');
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('activateAccount', () => {
    it('should return null if token is invalid', async () => {
      mockTokenService.verifyToken.mockReturnValue(null);

      const result = await service.activateAccount('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockTokenService.verifyToken.mockReturnValue({ sub: '1' });
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.activateAccount('valid-token');
      expect(result).toBeNull();
    });

    it('should activate user and return new token', async () => {
      const mockUser = new User({ id: '1', email: 'test@example.com' });
      
      mockTokenService.verifyToken.mockReturnValue({ sub: '1' });
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.activateUser.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue('new-token');

      const result = await service.activateAccount('valid-token');
      
      expect(result).toEqual('new-token');
      expect(mockUserRepository.activateUser).toHaveBeenCalledWith('1');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
    });
  });
});
