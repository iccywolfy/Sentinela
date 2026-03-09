import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bull';
import { SourcesModule } from './sources/sources.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { NormalizationModule } from './normalization/normalization.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    SourcesModule,
    PipelineModule,
    NormalizationModule,
    ElasticsearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
