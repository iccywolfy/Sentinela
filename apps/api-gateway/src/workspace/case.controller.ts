import { Controller, Get, Post, Put, Param, Body, Query, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CaseService } from './case.service';

@ApiTags('workspace/cases')
@Controller('workspace/cases')
export class CaseController {
  constructor(private readonly service: CaseService) {}

  @Post()
  create(@Body() body: any, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.create(body, tenantId || 'default', userId || 'system');
  }

  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() filters: any) {
    return this.service.findAll(tenantId || 'default', filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.findOne(id, tenantId || 'default');
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.service.update(id, body, tenantId || 'default');
  }

  @Post(':id/events')
  addEvent(@Param('id') id: string, @Body() body: { eventId: string }, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.addEvent(id, body.eventId, userId || 'system', tenantId || 'default');
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() body: { content: string; isAnalytical?: boolean }, @Headers('x-tenant-id') tenantId: string, @Headers('x-user-id') userId: string) {
    return this.service.addNote(id, body.content, body.isAnalytical || false, userId || 'system', tenantId || 'default');
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.getTimeline(id, tenantId || 'default');
  }

  @Post(':id/timeline')
  createTimeline(@Param('id') id: string, @Body() body: any, @Headers('x-tenant-id') tenantId: string) {
    return this.service.createTimeline(id, body, tenantId || 'default');
  }
}
