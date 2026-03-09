import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('workspace/search')
@ApiBearerAuth()
@Controller('workspace/search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @Roles('viewer')
  search(
    @Query('q') q: string,
    @Query('domains') domains: string,
    @Query('countries') countries: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.semanticSearch(
      q || '',
      { domains: domains?.split(','), countries: countries?.split(',') },
      user.tenantId,
      parseInt(page || '1'),
      parseInt(pageSize || '20'),
    );
  }

  @Get('entity/:name')
  @Roles('viewer')
  entityPivot(@Param('name') name: string, @CurrentUser() user: JwtUser) {
    return this.service.entityPivot(name, user.tenantId);
  }
}
