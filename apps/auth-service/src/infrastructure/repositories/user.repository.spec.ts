import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Provider } from '@prisma/client';
import { User } from '../../domain/models/user.model';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        providerName: Provider.LOCAL,
      };
      
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findById('1');
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockUser));
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      const result = await repository.findById('1');
      
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        providerName: Provider.LOCAL,
      };
      
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com', Provider.LOCAL);
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockUser));
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'test@example.com',
          providerName: Provider.LOCAL,
        },
      });
    });

    it('should return null if user not found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      const result = await repository.findByEmail('test@example.com', Provider.LOCAL);
      
      expect(result).toBeNull();
    });
  });

  describe('findByProvider', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        providerName: Provider.GOOGLE,
        providerId: 'google-id',
      };
      
      prismaService.user.findFirst = jest.fn().mockResolvedValue(mockUser);

      const result = await repository.findByProvider('google-id', Provider.GOOGLE);
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockUser));
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          providerId: 'google-id',
          providerName: Provider.GOOGLE,
        },
      });
    });

    it('should return null if user not found', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      const result = await repository.findByProvider('google-id', Provider.GOOGLE);
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashed-password',
        providerName: Provider.LOCAL,
        name: 'Test User',
        ip: '127.0.0.1',
        agent: 'test-agent',
      };
      
      const mockCreatedUser = {
        id: '1',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      prismaService.user.create = jest.fn().mockResolvedValue(mockCreatedUser);

      const result = await repository.create(userData);
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockCreatedUser));
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updateData = {
        name: 'Updated Name',
        lastName: 'Updated Last Name',
      };
      
      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        ...updateData,
        updatedAt: new Date(),
      };
      
      prismaService.user.update = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await repository.update('1', updateData);
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockUpdatedUser));
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });

  describe('activateUser', () => {
    it('should activate and return the user', async () => {
      const mockActivatedUser = {
        id: '1',
        email: 'test@example.com',
        activated: true,
        updatedAt: new Date(),
      };
      
      prismaService.user.update = jest.fn().mockResolvedValue(mockActivatedUser);

      const result = await repository.activateUser('1');
      
      expect(result).toBeInstanceOf(User);
      expect(result).toEqual(expect.objectContaining(mockActivatedUser));
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { activated: true },
      });
    });
  });
});
