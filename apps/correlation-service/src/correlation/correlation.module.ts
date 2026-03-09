import { Module } from '@nestjs/common';
import { CorrelationController } from './correlation.controller';
import { CorrelationService } from './correlation.service';
import { CorrelationEngine } from './correlation.engine';

@Module({
  controllers: [CorrelationController],
  providers: [CorrelationService, CorrelationEngine],
  exports: [CorrelationService],
})
export class CorrelationModule {}
