import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('stats')
  getStats() {
    return this.pipelineService.getStats();
  }

  @Post('trigger')
  triggerManual() {
    return this.pipelineService.enqueuePendingContent();
  }
}
