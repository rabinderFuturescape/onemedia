import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from '../infrastructure/repositories/user.repository';
import { TokenService } from '../infrastructure/services/token.service';
import { CryptoService } from '../infrastructure/services/crypto.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { WalletModule } from './wallet/wallet.module';
import { MfaModule } from './mfa/mfa.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoggingModule } from '../infrastructure/logging/logging.module';
import { SecurityModule } from '../infrastructure/security/security.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '../infrastructure/security/rate-limit.guard';

@Module({
  imports: [
    PrismaModule,
    ProvidersModule,
    WalletModule,
    MfaModule,
    LoggingModule,
    SecurityModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    TokenService,
    CryptoService,
    JwtStrategy,
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
    {
      provide: 'TokenServicePort',
      useClass: TokenService,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
