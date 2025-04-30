import { Module } from '@nestjs/common';
import { NextAuthController } from './nextauth.controller';
import { NextAuthService } from './nextauth.service';
import { TokenCacheService } from './token-cache.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [NextAuthController],
  providers: [NextAuthService, TokenCacheService],
  exports: [NextAuthService, TokenCacheService],
})
export class NextAuthModule {}
