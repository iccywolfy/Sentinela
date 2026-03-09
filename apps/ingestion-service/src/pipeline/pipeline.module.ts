import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PipelineService } from './pipeline.service';
import { PipelineProcessor } from './pipeline.processor';
import { PipelineController } from './pipeline.controller';
import { NormalizationModule } from '../normalization/normalization.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ingestion-pipeline' }),
    NormalizationModule,
  ],
  providers: [PipelineService, PipelineProcessor],
  controllers: [PipelineController],
  exports: [PipelineService],
})
export class PipelineModule {}
