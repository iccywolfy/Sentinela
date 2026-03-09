import { Controller, Get, Post, Put, Param, Body, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertService } from './alert.service';

@ApiTags('alerts')
@Controller('alerts')
export class AlertController {
  constructor(private readonly service: AlertService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() filters: any) {
    return this.service.findAll(tenantId || 'default', filters);
  }

  @Get('stats')
  getStats(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getStats(tenantId || 'default');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.service.updateStatus(id, body.status, tenantId || 'default');
  }

  @Post(':id/feedback')
  feedback(@Param('id') id: string, @Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.service.submitFeedback(id, body, tenantId || 'default');
  }
}
