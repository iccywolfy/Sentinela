import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('reports')
@UseGuards(ServiceAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.createReport(body, body.tenantId, body.userId);
  }

  @Get()
  findAll(@Body() body: { tenantId: string }) {
    return this.service.findAll(body.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.findOne(id, body.tenantId);
  }

  @Get(':id/download')
  download(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.getDownloadUrl(id, body.tenantId);
  }

  @Post(':id/regenerate')
  regenerate(@Param('id') id: string, @Body() body: { tenantId: string; userId: string }) {
    return this.service.regenerate(id, body.tenantId, body.userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.delete(id, body.tenantId);
  }
}
