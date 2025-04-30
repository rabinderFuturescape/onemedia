import { Module, CacheModule as NestCacheModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useRedis = configService.get('CACHE_REDIS_ENABLED') === 'true';
        
        if (useRedis) {
          return {
            store: redisStore,
            host: configService.get('CACHE_REDIS_HOST', 'localhost'),
            port: configService.get('CACHE_REDIS_PORT', 6379),
            ttl: configService.get('CACHE_TTL', 300), // 5 minutes
            max: configService.get('CACHE_MAX_ITEMS', 100),
          };
        }
        
        return {
          ttl: configService.get('CACHE_TTL', 300), // 5 minutes
          max: configService.get('CACHE_MAX_ITEMS', 100),
        };
      },
    }),
    LoggingModule,
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
