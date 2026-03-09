import { Controller, Get, Post, Delete, Param, Body, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CollectionService } from './collection.service';

@ApiTags('workspace/collections')
@Controller('workspace/collections')
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

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

  @Post(':id/events')
  addEvent(@Param('id') id: string, @Body() body: { eventId: string }) {
    return this.service.addEvent(id, body.eventId);
  }

  @Delete(':id/events/:eventId')
  removeEvent(@Param('id') id: string, @Param('eventId') eventId: string) {
    return this.service.removeEvent(id, eventId);
  }
}
