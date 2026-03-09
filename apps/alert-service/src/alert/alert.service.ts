import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { AlertEngine } from './alert.engine';

const prisma = new PrismaClient();

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly engine: AlertEngine) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processNewEvents() {
    const recentEvents = await prisma.event.findMany({
      where: { processedAt: { gte: new Date(Date.now() - 2 * 60 * 1000) } },
      take: 50,
    });
    for (const event of recentEvents) {
      await this.engine.evaluateEvent(event).catch((err) =>
        this.logger.error(`Alert eval failed for event ${event.id}: ${err.message}`),
      );
    }
  }

  async findAll(tenantId: string, filters: any = {}) {
    return prisma.alert.findMany({
      where: {
        tenantId,
        ...(filters.severity ? { severity: filters.severity } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      include: { events: { include: { event: true } } },
      orderBy: [{ severity: 'asc' }, { triggeredAt: 'desc' }],
      take: filters.limit ? parseInt(filters.limit) : 50,
    });
  }

  async findOne(id: string, tenantId: string) {
    return prisma.alert.findFirst({ where: { id, tenantId }, include: { events: true } });
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    const data: any = { status };
    if (status === 'acknowledged') data.acknowledgedAt = new Date();
    if (status === 'resolved') data.resolvedAt = new Date();
    return prisma.alert.update({ where: { id }, data });
  }

  async submitFeedback(id: string, feedback: any, tenantId: string) {
    return prisma.alert.update({
      where: { id },
      data: { feedbackJson: { ...feedback, submittedAt: new Date().toISOString() } },
    });
  }

  async getStats(tenantId: string) {
    const [total, byStatus, bySeverity] = await Promise.all([
      prisma.alert.count({ where: { tenantId } }),
      prisma.alert.groupBy({ by: ['status'], where: { tenantId }, _count: { status: true } }),
      prisma.alert.groupBy({ by: ['severity'], where: { tenantId }, _count: { severity: true } }),
    ]);
    return { total, byStatus, bySeverity };
  }
}
