import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { createConnectionPool } from './database.config';
import { LoggingModule } from '../logging/logging.module';
import { LoggerService } from '../logging/logger.service';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: 'DATABASE_POOL',
      inject: [LoggerService],
      useFactory: (logger: LoggerService) => {
        return createConnectionPool(logger);
      },
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
