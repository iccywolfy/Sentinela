import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('executive/dashboard')
@Controller('executive/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get global intelligence overview' })
  getOverview(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getGlobalOverview(tenantId || 'default');
  }

  @Get('top-risks')
  getTopRisks(@Headers('x-tenant-id') tenantId: string, @Query('limit') limit: string) {
    return this.service.getTopRisks(tenantId || 'default', parseInt(limit || '10'));
  }

  @Get('heatmap')
  getHeatmap(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getCountryRiskHeatmap(tenantId || 'default', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  }

  @Get('daily-brief')
  getDailyBrief(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getDailyBrief(tenantId || 'default');
  }

  @Get('domain/:domain')
  getTopByDomain(
    @Headers('x-tenant-id') tenantId: string,
    @Query('domain') domain: string,
    @Query('limit') limit: string,
  ) {
    return this.service.getTopEventsByDomain(tenantId || 'default', domain, parseInt(limit || '10'));
  }
}
