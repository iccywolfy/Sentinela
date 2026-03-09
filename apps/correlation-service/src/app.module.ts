import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { CorrelationModule } from './correlation/correlation.module';
import { NarrativeModule } from './narrative/narrative.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    CorrelationModule,
    NarrativeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
