import { Controller, Get, Post, Put, Param, Body, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new intelligence report' })
  generate(@Body() body: any, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.generate(body, tenantId || 'default', userId || 'system');
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() filters: any) {
    return this.service.findAll(tenantId || 'default', filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get presigned download URL for PDF' })
  getDownloadUrl(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.getDownloadUrl(id, tenantId || 'default');
  }

  @Put(':id/approve')
  approve(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.approve(id, userId || 'system', tenantId || 'default');
  }

  @Put(':id/publish')
  publish(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.publish(id, tenantId || 'default');
  }
}
