import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemplateService } from './template.service';

@ApiTags('templates')
@Controller('templates')
export class TemplateController {
  constructor(private readonly service: TemplateService) {}

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.service.findAll(tenantId || 'default');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Post()
  create(@Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.service.create(body, tenantId || 'default');
  }

  @Post('seed')
  seed(@Headers('x-tenant-id') tenantId: string) {
    return this.service.seedDefaults(tenantId || 'default');
  }
}
