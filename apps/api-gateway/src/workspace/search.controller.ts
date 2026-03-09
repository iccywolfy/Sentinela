import { Controller, Get, Query, Headers, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('workspace/search')
@Controller('workspace/search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  search(
    @Query('q') q: string,
    @Query('domains') domains: string,
    @Query('countries') countries: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.service.semanticSearch(
      q || '',
      { domains: domains?.split(','), countries: countries?.split(',') },
      tenantId || 'default',
      parseInt(page || '1'),
      parseInt(pageSize || '20'),
    );
  }

  @Get('entity/:name')
  entityPivot(@Param('name') name: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.entityPivot(name, tenantId || 'default');
  }
}
