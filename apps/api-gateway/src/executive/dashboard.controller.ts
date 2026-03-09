import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('executive/dashboard')
@ApiBearerAuth()
@Controller('executive/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @Roles('viewer')
  @ApiOperation({ summary: 'Get global intelligence overview' })
  getOverview(@CurrentUser() user: JwtUser) {
    return this.service.getGlobalOverview(user.tenantId);
  }

  @Get('top-risks')
  @Roles('viewer')
  getTopRisks(@CurrentUser() user: JwtUser, @Query('limit') limit: string) {
    return this.service.getTopRisks(user.tenantId, parseInt(limit || '10'));
  }

  @Get('heatmap')
  @Roles('viewer')
  getHeatmap(@CurrentUser() user: JwtUser) {
    return this.service.getCountryRiskHeatmap(
      user.tenantId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
  }

  @Get('daily-brief')
  @Roles('analyst')
  getDailyBrief(@CurrentUser() user: JwtUser) {
    return this.service.getDailyBrief(user.tenantId);
  }

  @Get('domain/:domain')
  @Roles('viewer')
  getTopByDomain(
    @CurrentUser() user: JwtUser,
    @Query('domain') domain: string,
    @Query('limit') limit: string,
  ) {
    return this.service.getTopEventsByDomain(user.tenantId, domain, parseInt(limit || '10'));
  }
}
