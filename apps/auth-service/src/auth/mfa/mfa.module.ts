import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { LoggingModule } from '../../infrastructure/logging/logging.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

@Module({
  imports: [LoggingModule, PrismaModule],
  controllers: [MfaController],
  providers: [MfaService, UserRepository],
  exports: [MfaService],
})
export class MfaModule {}
