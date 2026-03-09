import { Controller, Get, Post, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NarrativeService } from './narrative.service';

@ApiTags('narrative')
@Controller('narrative')
export class NarrativeController {
  constructor(private readonly service: NarrativeService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.service.findAll(tenantId || 'default');
  }

  @Get('high-divergence')
  getHighDivergence(
    @Headers('x-tenant-id') tenantId: string,
    @Query('minIndex') minIndex?: string,
  ) {
    return this.service.getHighDivergence(tenantId || 'default', minIndex ? parseFloat(minIndex) : 0.5);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId') eventId: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findByEvent(eventId, tenantId || 'default');
  }

  @Post('event/:eventId/analyze')
  @ApiOperation({ summary: 'Trigger narrative analysis for an event' })
  analyze(@Param('eventId') eventId: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.analyzeEvent(eventId, tenantId || 'default');
  }
}
