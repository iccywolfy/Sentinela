import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NarrativeService } from './narrative.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('narratives')
@UseGuards(ServiceAuthGuard)
@Controller('narratives')
export class NarrativeController {
  constructor(private readonly service: NarrativeService) {}

  @Get()
  getGlobal(@Body() body: { tenantId: string }) {
    return this.service.getGlobalNarrativeProfile(body.tenantId);
  }

  @Post('analyze')
  analyze(@Body() body: { tenantId: string }) {
    return this.service.analyzeNarrativeDivergence(body.tenantId);
  }

  @Get('event/:eventId/framing')
  getFraming(@Param('eventId') eventId: string, @Body() body: { tenantId: string }) {
    return this.service.getEventFramingByBloc(eventId, body.tenantId);
  }

  @Get('event/:eventId/divergence')
  getDivergence(@Param('eventId') eventId: string, @Body() body: { tenantId: string }) {
    return this.service.getEventDivergenceIndex(eventId, body.tenantId);
  }
}
