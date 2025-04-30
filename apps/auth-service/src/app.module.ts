import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MonitoringModule } from './infrastructure/monitoring/monitoring.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggingInterceptor } from './infrastructure/interceptors/logging.interceptor';
import { MonitoringInterceptor } from './infrastructure/interceptors/monitoring.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggingModule,
    DatabaseModule,
    PrismaModule,
    MonitoringModule,
    CacheModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringInterceptor,
    },
  ],
})
export class AppModule {}
