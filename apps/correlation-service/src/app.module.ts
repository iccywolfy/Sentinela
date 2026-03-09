import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CorrelationModule } from './correlation/correlation.module';
import { NarrativeModule } from './narrative/narrative.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CorrelationModule,
    NarrativeModule,
  ],
})
export class AppModule {}
