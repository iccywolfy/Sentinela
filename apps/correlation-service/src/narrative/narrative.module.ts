import { Module } from '@nestjs/common';
import { NarrativeController } from './narrative.controller';
import { NarrativeService } from './narrative.service';
import { FramingAnalyzer } from './framing.analyzer';

@Module({
  controllers: [NarrativeController],
  providers: [NarrativeService, FramingAnalyzer],
  exports: [NarrativeService],
})
export class NarrativeModule {}
