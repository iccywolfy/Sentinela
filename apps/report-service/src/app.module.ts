import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ReportModule } from './report/report.module';
import { TemplateModule } from './template/template.module';
import { StorageModule } from './storage/storage.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TerminusModule,
    StorageModule,
    TemplateModule,
    ReportModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
