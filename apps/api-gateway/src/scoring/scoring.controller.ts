import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { ExplainabilityService } from './explainability.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('scoring')
@ApiBearerAuth()
@Controller('scoring')
export class ScoringController {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly explainabilityService: ExplainabilityService,
  ) {}

  @Get('country-scoreboard')
  @Roles('viewer')
  getCountryScoreboard(@CurrentUser() user: JwtUser) {
    return this.scoringService.getCountryScoreboard(user.tenantId);
  }

  @Get('models')
  @Roles('viewer')
  getModels(@CurrentUser() user: JwtUser) {
    return this.scoringService.getModels(user.tenantId);
  }

  @Get('event/:eventId')
  @Roles('viewer')
  getEventScores(@Param('eventId') id: string, @CurrentUser() user: JwtUser) {
    return this.scoringService.getEventScores(id, user.tenantId);
  }

  @Get('event/:eventId/explain')
  @Roles('viewer')
  @ApiOperation({ summary: 'Get explainability breakdown for event scores' })
  explainScore(@Param('eventId') id: string, @CurrentUser() user: JwtUser) {
    return this.explainabilityService.explainScore(id, user.tenantId);
  }

  @Post('event/:eventId/compute')
  @Roles('analyst')
  scoreEvent(@Param('eventId') id: string, @CurrentUser() user: JwtUser) {
    return this.scoringService.scoreEvent(id, user.tenantId);
  }
}
