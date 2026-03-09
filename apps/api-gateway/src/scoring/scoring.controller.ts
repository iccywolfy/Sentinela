import { Controller, Get, Post, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { ExplainabilityService } from './explainability.service';

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly explainabilityService: ExplainabilityService,
  ) {}

  @Get('country-scoreboard')
  getCountryScoreboard(@Headers('x-tenant-id') tenantId: string) {
    return this.scoringService.getCountryScoreboard(tenantId || 'default');
  }

  @Get('models')
  getModels(@Headers('x-tenant-id') tenantId: string) {
    return this.scoringService.getModels(tenantId || 'default');
  }

  @Get('event/:eventId')
  getEventScores(@Param('eventId') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.scoringService.getEventScores(id, tenantId || 'default');
  }

  @Get('event/:eventId/explain')
  @ApiOperation({ summary: 'Get explainability breakdown for event scores' })
  explainScore(@Param('eventId') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.explainabilityService.explainScore(id, tenantId || 'default');
  }

  @Post('event/:eventId/compute')
  scoreEvent(@Param('eventId') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.scoringService.scoreEvent(id, tenantId || 'default');
  }
}
