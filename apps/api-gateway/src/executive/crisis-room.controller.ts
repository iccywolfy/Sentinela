import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CrisisRoomService } from './crisis-room.service';

@ApiTags('executive/crisis-room')
@Controller('executive/crisis-room')
export class CrisisRoomController {
  constructor(private readonly service: CrisisRoomService) {}

  @Get()
  getCrisisStatus(@Headers('x-tenant-id') tenantId: string) {
    return this.service.getCrisisStatus(tenantId || 'default');
  }

  @Get('scenarios/:eventId')
  getScenarios(@Param('eventId') eventId: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.getScenarioProjections(eventId, tenantId || 'default');
  }
}
