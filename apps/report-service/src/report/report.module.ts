import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { PdfRenderer } from './pdf.renderer';
import { ReportFactory } from './report.factory';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [TemplateModule],
  controllers: [ReportController],
  providers: [ReportService, PdfRenderer, ReportFactory],
  exports: [ReportService],
})
export class ReportModule {}
