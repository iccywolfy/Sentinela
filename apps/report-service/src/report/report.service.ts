import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ReportFactory } from './report.factory';
import { PdfRenderer } from './pdf.renderer';
import { StorageService } from '../storage/storage.service';
import { TemplateService } from '../template/template.service';

const prisma = new PrismaClient();

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly factory: ReportFactory,
    private readonly pdfRenderer: PdfRenderer,
    private readonly storage: StorageService,
    private readonly templateService: TemplateService,
  ) {}

  async generate(data: any, tenantId: string, userId: string) {
    await this.templateService.seedDefaults(tenantId);

    const template = data.templateId
      ? await this.templateService.findOne(data.templateId, tenantId)
      : await this.templateService.findByType(data.type, tenantId);

    const events = await this.getEventsForReport(data, tenantId);

    const reportContent = this.factory.build(data.type, data, events, template);

    const report = await prisma.report.create({
      data: {
        id: uuidv4(),
        type: data.type,
        title: reportContent.title,
        status: 'draft',
        infoClassification: data.infoClassification || 'internal',
        templateId: template?.id,
        sectionsJson: reportContent.sections,
        eventIdsJson: events.map((e) => e.id),
        correlationIdsJson: [],
        scoreIdsJson: [],
        caseId: data.caseId,
        tenantId,
        createdBy: userId,
      },
    });

    // Generate PDF asynchronously
    this.generatePdf(report.id, reportContent, template, tenantId).catch((err) =>
      this.logger.error(`PDF generation failed for report ${report.id}: ${err.message}`),
    );

    return report;
  }

  private async generatePdf(reportId: string, content: any, template: any, tenantId: string) {
    try {
      const html = await this.pdfRenderer.renderHtml(content, template?.brandingConfig);
      const pdfBuffer = await this.pdfRenderer.renderPdf(html);
      const s3Key = `reports/${tenantId}/${reportId}.pdf`;
      await this.storage.upload(s3Key, pdfBuffer, 'application/pdf');
      await prisma.report.update({
        where: { id: reportId },
        data: { pdfS3Key: s3Key, pdfGeneratedAt: new Date(), status: 'review' },
      });
      this.logger.log(`PDF generated for report ${reportId}: ${s3Key}`);
    } catch (err) {
      this.logger.error(`PDF failed for ${reportId}: ${err.message}`);
    }
  }

  async findAll(tenantId: string, filters: any = {}) {
    return prisma.report.findMany({
      where: {
        tenantId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { template: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit) : 50,
    });
  }

  async findOne(id: string, tenantId: string) {
    const report = await prisma.report.findFirst({ where: { id, tenantId }, include: { template: true } });
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    return report;
  }

  async getDownloadUrl(id: string, tenantId: string) {
    const report = await this.findOne(id, tenantId);
    if (!report.pdfS3Key) return { url: null, message: 'PDF not yet generated' };
    const url = await this.storage.getPresignedUrl(report.pdfS3Key);
    return { url, expiresIn: 3600 };
  }

  async approve(id: string, userId: string, tenantId: string) {
    return prisma.report.update({
      where: { id },
      data: { status: 'approved', approvedBy: userId, approvedAt: new Date() },
    });
  }

  async publish(id: string, tenantId: string) {
    return prisma.report.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    });
  }

  private async getEventsForReport(data: any, tenantId: string) {
    if (data.eventIds?.length) {
      return prisma.event.findMany({ where: { id: { in: data.eventIds }, tenantId } });
    }
    const where: any = { tenantId };
    if (data.dateRange?.from) where.occurredAt = { gte: new Date(data.dateRange.from) };
    if (data.dateRange?.to) where.occurredAt = { ...where.occurredAt, lte: new Date(data.dateRange.to) };
    if (data.countryCode) where.locationJson = { path: '$.countryCode', equals: data.countryCode };
    return prisma.event.findMany({ where, take: 50, orderBy: { impactScore: 'desc' } });
  }
}
