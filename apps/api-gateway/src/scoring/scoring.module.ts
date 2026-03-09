import { Module } from '@nestjs/common';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { ExplainabilityService } from './explainability.service';

@Module({
  controllers: [ScoringController],
  providers: [ScoringService, ExplainabilityService],
  exports: [ScoringService],
})
export class ScoringModule {}
