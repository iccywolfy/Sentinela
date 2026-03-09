import { Controller, Get, Post, Param, Query, Body, Headers, Put } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CorrelationService } from './correlation.service';

@ApiTags('correlations')
@Controller('correlations')
export class CorrelationController {
  constructor(private readonly service: CorrelationService) {}

  @Get()
  @ApiOperation({ summary: 'List correlations' })
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

  @Put(':id/review')
  review(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.service.review(id, body.status, tenantId || 'default', userId || 'system');
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Manually trigger correlation job' })
  trigger(@Headers('x-tenant-id') tenantId: string) {
    return this.service.runCorrelationJob();
  }
}
