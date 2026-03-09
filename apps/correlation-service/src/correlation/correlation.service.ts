import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { CorrelationEngine } from './correlation.engine';

const prisma = new PrismaClient();

@Injectable()
export class CorrelationService {
  private readonly logger = new Logger(CorrelationService.name);

  constructor(private readonly engine: CorrelationEngine) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async runCorrelationJob() {
    this.logger.log('Running correlation job...');
    try {
      const recentEvents = await prisma.event.findMany({
        where: {
          occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        take: 200,
        orderBy: { occurredAt: 'desc' },
      });

      if (recentEvents.length < 2) return;

      const tenants = [...new Set(recentEvents.map((e) => e.tenantId))];

      for (const tenantId of tenants) {
        const tenantEvents = recentEvents.filter((e) => e.tenantId === tenantId);
        const candidates = await this.engine.correlateEvents(tenantEvents);
        await this.engine.persistCorrelations(candidates, tenantId);
        this.logger.log(`Tenant ${tenantId}: found ${candidates.length} correlations`);
      }
    } catch (err) {
      this.logger.error(`Correlation job failed: ${err.message}`);
    }
  }

  async findAll(tenantId: string, filters: any = {}) {
    return prisma.correlation.findMany({
      where: {
        tenantId,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.minStrength ? { strength: { gte: parseFloat(filters.minStrength) } } : {}),
        ...(filters.humanReviewStatus ? { humanReviewStatus: filters.humanReviewStatus } : {}),
        isActive: true,
      },
      include: { events: true },
      orderBy: { strength: 'desc' },
      take: filters.limit ? parseInt(filters.limit) : 50,
    });
  }

  async findOne(id: string, tenantId: string) {
    return prisma.correlation.findFirst({
      where: { id, tenantId },
      include: { events: true },
    });
  }

  async review(id: string, status: string, tenantId: string, userId: string) {
    return prisma.correlation.update({
      where: { id },
      data: { humanReviewStatus: status, reviewedBy: userId, reviewedAt: new Date() },
    });
  }

  async getStats(tenantId: string) {
    const [total, pending, approved, byType] = await Promise.all([
      prisma.correlation.count({ where: { tenantId } }),
      prisma.correlation.count({ where: { tenantId, humanReviewStatus: 'pending' } }),
      prisma.correlation.count({ where: { tenantId, humanReviewStatus: 'approved' } }),
      prisma.correlation.groupBy({ by: ['type'], where: { tenantId }, _count: { type: true } }),
    ]);
    return { total, pending, approved, byType };
  }
}
