import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrisisRoomService } from './crisis-room.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('executive/crisis-room')
@ApiBearerAuth()
@Controller('executive/crisis-room')
export class CrisisRoomController {
  constructor(private readonly service: CrisisRoomService) {}

  @Get()
  @Roles('analyst')
  getCrisisStatus(@CurrentUser() user: JwtUser) {
    return this.service.getCrisisStatus(user.tenantId);
  }

  @Get('scenarios/:eventId')
  @Roles('analyst')
  getScenarios(@Param('eventId') eventId: string, @CurrentUser() user: JwtUser) {
    return this.service.getScenarioProjections(eventId, user.tenantId);
  }
}
