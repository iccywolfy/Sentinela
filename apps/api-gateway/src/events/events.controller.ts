import { Controller, Get, Param, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter events' })
  search(
    @Headers('x-tenant-id') tenantId: string,
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
    return this.service.search(q || '', filters, tenantId || 'default', parseInt(page || '1'), parseInt(pageSize || '20'));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Get(':id/related')
  findRelated(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findRelated(id, tenantId || 'default');
  }
}
