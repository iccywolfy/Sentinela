import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { AlertModule } from './alert/alert.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    AlertModule,
    WatchlistModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
