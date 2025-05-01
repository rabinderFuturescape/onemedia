import { Module } from '@nestjs/common';
import { QueryOptimizerService } from './query-optimizer.service';

@Module({
  providers: [QueryOptimizerService],
  exports: [QueryOptimizerService],
})
export class QueryOptimizerModule {}
