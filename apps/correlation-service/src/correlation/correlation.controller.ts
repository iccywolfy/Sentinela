import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CorrelationService } from './correlation.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('correlations')
@UseGuards(ServiceAuthGuard)
@Controller('correlations')
export class CorrelationController {
  constructor(private readonly service: CorrelationService) {}

  @Get()
  findAll(@Body() body: { tenantId: string }) {
    return this.service.findAll(body.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.findOne(id, body.tenantId);
  }

  @Post('compute')
  compute(@Body() body: { eventId: string; tenantId: string }) {
    return this.service.computeCorrelations(body.eventId, body.tenantId);
  }

  @Get('event/:eventId')
  getByEvent(@Param('eventId') eventId: string, @Body() body: { tenantId: string }) {
    return this.service.getByEvent(eventId, body.tenantId);
  }

  @Post('cross-domain')
  analyzeCrossDomain(@Body() body: { eventIds: string[]; tenantId: string }) {
    return this.service.analyzeCrossDomain(body.eventIds, body.tenantId);
  }
}
