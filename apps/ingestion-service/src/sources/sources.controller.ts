import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SourceService } from './source.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('sources')
@UseGuards(ServiceAuthGuard)
@Controller('sources')
export class SourcesController {
  constructor(private readonly service: SourceService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body, body.tenantId);
  }

  @Get()
  findAll(@Body() body: { tenantId: string }) {
    return this.service.findAll(body.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.findOne(id, body.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body, body.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.remove(id, body.tenantId);
  }
}
