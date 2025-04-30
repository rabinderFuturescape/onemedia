import { Module } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimitGuard } from './rate-limit.guard';
import { SuspiciousActivityService } from './suspicious-activity.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [
    RateLimiterService,
    RateLimitGuard,
    SuspiciousActivityService,
  ],
  exports: [
    RateLimiterService,
    RateLimitGuard,
    SuspiciousActivityService,
  ],
})
export class SecurityModule {}
