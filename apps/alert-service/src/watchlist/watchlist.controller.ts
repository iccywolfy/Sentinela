import { Controller, Get, Post, Delete, Param, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';

@ApiTags('watchlists')
@Controller('watchlists')
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Post()
  create(@Body() body: any, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.create(body, tenantId || 'default', userId || 'system');
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string) {
    return this.service.findAll(tenantId || 'default');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.service.addItem(id, body, tenantId || 'default');
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(id, itemId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.remove(id, tenantId || 'default');
  }
}
