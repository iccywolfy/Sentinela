import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('workspace/collections')
@ApiBearerAuth()
@Controller('workspace/collections')
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  @Post()
  @Roles('analyst')
  create(@Body() body: any, @CurrentUser() user: JwtUser) {
    return this.service.create(body, user.tenantId, user.id);
  }

  @Get()
  @Roles('viewer')
  findAll(@CurrentUser() user: JwtUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('viewer')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post(':id/events')
  @Roles('analyst')
  addEvent(@Param('id') id: string, @Body() body: { eventId: string }) {
    return this.service.addEvent(id, body.eventId);
  }

  @Delete(':id/events/:eventId')
  @Roles('analyst')
  removeEvent(@Param('id') id: string, @Param('eventId') eventId: string) {
    return this.service.removeEvent(id, eventId);
  }
}
