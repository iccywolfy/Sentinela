import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlertService } from './alert.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('alerts')
@UseGuards(ServiceAuthGuard)
@Controller('alerts')
export class AlertController {
  constructor(private readonly service: AlertService) {}

  @Get()
  findAll(@Body() body: { tenantId: string }) {
    return this.service.findAll(body.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.findOne(id, body.tenantId);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Body() body: { tenantId: string; userId: string }) {
    return this.service.acknowledge(id, body.tenantId, body.userId);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Body() body: any) {
    return this.service.resolve(id, body);
  }
}
