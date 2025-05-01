import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimiterService } from './rate-limiter.service';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Default: 60 seconds
      limit: 100, // Default: 100 requests per ttl
    }),
  ],
  providers: [
    RateLimiterService,
    {
      provide: APP_GUARD,
      useClass: RateLimiterService,
    },
  ],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
