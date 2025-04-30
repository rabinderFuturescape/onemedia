import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { User } from '../../domain/models/user.model';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('TokenService', () => {
  let service: TokenService;
  const mockJwtSecret = 'test-secret';
  const mockJwtRefreshSecret = 'test-refresh-secret';

  beforeEach(async () => {
    process.env.JWT_SECRET = mockJwtSecret;
    process.env.JWT_REFRESH_SECRET = mockJwtRefreshSecret;
    process.env.JWT_EXPIRATION = '1h';
    process.env.JWT_REFRESH_EXPIRATION = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should call sign with correct parameters', () => {
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
        isSuperAdmin: false,
      });

      (jwt.sign as jest.Mock).mockReturnValue('access-token');

      const result = service.generateAccessToken(mockUser);

      expect(result).toEqual('access-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: '1',
          email: 'test@example.com',
          isSuperAdmin: false,
        },
        mockJwtSecret,
        { expiresIn: '1h' }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should call sign with correct parameters', () => {
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
      });

      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');

      const result = service.generateRefreshToken(mockUser);

      expect(result).toEqual('refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: '1' },
        mockJwtRefreshSecret,
        { expiresIn: '7d' }
      );
    });

    it('should use JWT_SECRET if JWT_REFRESH_SECRET is not set', () => {
      process.env.JWT_REFRESH_SECRET = '';
      
      const mockUser = new User({
        id: '1',
        email: 'test@example.com',
      });

      (jwt.sign as jest.Mock).mockReturnValue('refresh-token');

      const result = service.generateRefreshToken(mockUser);

      expect(result).toEqual('refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: '1' },
        mockJwtSecret,
        { expiresIn: '7d' }
      );
    });
  });

  describe('verifyToken', () => {
    it('should return payload if token is valid', () => {
      const mockPayload = { sub: '1', email: 'test@example.com' };
      
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', mockJwtSecret);
    });

    it('should return null if token verification throws error', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = service.verifyToken('invalid-token');

      expect(result).toBeNull();
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', mockJwtSecret);
    });
  });

  describe('decodeToken', () => {
    it('should call decode with correct parameters', () => {
      const mockPayload = { sub: '1', email: 'test@example.com' };
      
      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);

      const result = service.decodeToken('token');

      expect(result).toEqual(mockPayload);
      expect(jwt.decode).toHaveBeenCalledWith('token');
    });
  });
});
