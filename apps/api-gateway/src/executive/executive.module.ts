import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CrisisRoomController } from './crisis-room.controller';
import { CrisisRoomService } from './crisis-room.service';

@Module({
  controllers: [DashboardController, CrisisRoomController],
  providers: [DashboardService, CrisisRoomService],
  exports: [DashboardService],
})
export class ExecutiveModule {}
