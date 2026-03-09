import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @Roles('viewer', 'analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Search and filter events' })
  search(
    @CurrentUser() user: JwtUser,
    @Query('q') q: string,
    @Query('domains') domains: string,
    @Query('countries') countries: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('minImpact') minImpact: string,
    @Query('tags') tags: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    const filters = {
      domains: domains ? domains.split(',') : undefined,
      countries: countries ? countries.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      dateFrom,
      dateTo,
      minImpact,
    };
    return this.service.search(
      q || '',
      filters,
      user.tenantId,
      parseInt(page || '1', 10),
      Math.min(parseInt(pageSize || '20', 10), 100),
    );
  }

  @Get(':id')
  @Roles('viewer', 'analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.tenantId);
  }

  @Get(':id/related')
  @Roles('viewer', 'analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Get related events' })
  findRelated(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findRelated(id, user.tenantId);
  }
}
