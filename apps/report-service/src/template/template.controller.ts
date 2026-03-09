import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('report-templates')
@UseGuards(ServiceAuthGuard)
@Controller('report-templates')
export class TemplateController {
  constructor(private readonly service: TemplateService) {}

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
    return this.service.create(body, body.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body, body.tenantId);
  }
}
