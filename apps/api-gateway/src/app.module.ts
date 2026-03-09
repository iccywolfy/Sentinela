import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { EventsModule } from './events/events.module';
import { ScoringModule } from './scoring/scoring.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ExecutiveModule } from './executive/executive.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    AuthModule,
    EventsModule,
    ScoringModule,
    WorkspaceModule,
    ExecutiveModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
