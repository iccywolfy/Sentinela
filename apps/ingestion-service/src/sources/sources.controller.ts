import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SourcesService } from './sources.service';

@ApiTags('sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new data source' })
  create(@Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.sourcesService.create(body, tenantId || 'default');
  }

  @Get()
  @ApiOperation({ summary: 'List all sources' })
  findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
  ) {
    return this.sourcesService.findAll(tenantId || 'default', {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      category,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.sourcesService.findOne(id, tenantId || 'default');
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.sourcesService.update(id, body, tenantId || 'default');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.sourcesService.remove(id, tenantId || 'default');
  }
}
