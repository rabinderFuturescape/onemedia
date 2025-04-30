import { Injectable } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../domain/models/user.model';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { CacheService } from '../cache/cache.service';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  // Cache TTL values (in seconds)
  private readonly USER_CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private logger: LoggerService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:id:${id}`;

    return this.cacheService.getOrSet<User | null>(
      cacheKey,
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { id },
        });
        return user ? new User(user) : null;
      },
      this.USER_CACHE_TTL,
    );
  }

  async findByEmail(email: string, provider: Provider): Promise<User | null> {
    const cacheKey = `user:email:${email}:provider:${provider}`;

    return this.cacheService.getOrSet<User | null>(
      cacheKey,
      async () => {
        const user = await this.prisma.user.findFirst({
          where: {
            email,
            providerName: provider,
          },
        });
        return user ? new User(user) : null;
      },
      this.USER_CACHE_TTL,
    );
  }

  async findByProvider(providerId: string, provider: Provider): Promise<User | null> {
    const cacheKey = `user:providerId:${providerId}:provider:${provider}`;

    return this.cacheService.getOrSet<User | null>(
      cacheKey,
      async () => {
        const user = await this.prisma.user.findFirst({
          where: {
            providerId,
            providerName: provider,
          },
        });
        return user ? new User(user) : null;
      },
      this.USER_CACHE_TTL,
    );
  }

  async create(userData: Partial<User>): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          providerName: userData.providerName,
          name: userData.name,
          lastName: userData.lastName,
          providerId: userData.providerId,
          activated: userData.activated ?? true,
          isSuperAdmin: userData.isSuperAdmin ?? false,
          pictureId: userData.pictureId,
          ip: userData['ip'],
          agent: userData['agent'],
          mfaEnabled: userData.mfaEnabled ?? false,
          mfaSecret: userData.mfaSecret,
          mfaBackupCodes: userData.mfaBackupCodes || [],
        },
      });

      const userModel = new User(user);

      // Cache the new user
      await this.cacheUser(userModel);

      return userModel;
    } catch (error) {
      this.logger.error(
        `Error creating user: ${error.message}`,
        error.stack,
        'UserRepository',
      );
      throw error;
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: userData,
      });

      const userModel = new User(user);

      // Update cache
      await this.cacheUser(userModel);

      return userModel;
    } catch (error) {
      this.logger.error(
        `Error updating user: ${error.message}`,
        error.stack,
        'UserRepository',
      );
      throw error;
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { activated: true },
      });

      const userModel = new User(user);

      // Update cache
      await this.cacheUser(userModel);

      return userModel;
    } catch (error) {
      this.logger.error(
        `Error activating user: ${error.message}`,
        error.stack,
        'UserRepository',
      );
      throw error;
    }
  }

  /**
   * Cache a user in multiple cache keys for different lookup patterns
   * @param user User to cache
   */
  private async cacheUser(user: User): Promise<void> {
    try {
      const cachePromises = [
        // Cache by ID
        this.cacheService.set(`user:id:${user.id}`, user, this.USER_CACHE_TTL),
      ];

      // Cache by email and provider
      if (user.email && user.providerName) {
        cachePromises.push(
          this.cacheService.set(
            `user:email:${user.email}:provider:${user.providerName}`,
            user,
            this.USER_CACHE_TTL,
          ),
        );
      }

      // Cache by provider ID and provider
      if (user.providerId && user.providerName) {
        cachePromises.push(
          this.cacheService.set(
            `user:providerId:${user.providerId}:provider:${user.providerName}`,
            user,
            this.USER_CACHE_TTL,
          ),
        );
      }

      await Promise.all(cachePromises);
    } catch (error) {
      this.logger.error(
        `Error caching user: ${error.message}`,
        error.stack,
        'UserRepository',
      );
    }
  }

  /**
   * Clear cache for a user
   * @param user User to clear from cache
   */
  async clearUserCache(user: User): Promise<void> {
    try {
      const cachePromises = [
        // Clear by ID
        this.cacheService.delete(`user:id:${user.id}`),
      ];

      // Clear by email and provider
      if (user.email && user.providerName) {
        cachePromises.push(
          this.cacheService.delete(`user:email:${user.email}:provider:${user.providerName}`),
        );
      }

      // Clear by provider ID and provider
      if (user.providerId && user.providerName) {
        cachePromises.push(
          this.cacheService.delete(`user:providerId:${user.providerId}:provider:${user.providerName}`),
        );
      }

      await Promise.all(cachePromises);
    } catch (error) {
      this.logger.error(
        `Error clearing user cache: ${error.message}`,
        error.stack,
        'UserRepository',
      );
    }
  }
}
