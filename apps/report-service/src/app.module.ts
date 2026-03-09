import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportModule } from './report/report.module';
import { TemplateModule } from './template/template.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StorageModule,
    TemplateModule,
    ReportModule,
  ],
})
export class AppModule {}
