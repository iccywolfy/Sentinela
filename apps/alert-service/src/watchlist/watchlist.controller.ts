import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';

@ApiTags('watchlists')
@UseGuards(ServiceAuthGuard)
@Controller('watchlists')
export class WatchlistController {
  constructor(private readonly service: WatchlistService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body, body.tenantId, body.userId);
  }

  @Get()
  findAll(@Body() body: { tenantId: string }) {
    return this.service.findAll(body.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.findOne(id, body.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body, body.tenantId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Body() body: { tenantId: string }) {
    return this.service.delete(id, body.tenantId);
  }
}
