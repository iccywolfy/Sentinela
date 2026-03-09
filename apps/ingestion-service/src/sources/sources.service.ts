import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class SourcesService {
  private readonly logger = new Logger(SourcesService.name);

  async create(data: any, tenantId: string) {
    return prisma.source.create({
      data: {
        ...data,
        tenantId,
        configJson: data.config || {},
      },
    });
  }

  async findAll(tenantId: string, filters: any = {}) {
    return prisma.source.findMany({
      where: {
        tenantId,
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      include: { sourceMetrics: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const source = await prisma.source.findFirst({ where: { id, tenantId } });
    if (!source) throw new NotFoundException(`Source ${id} not found`);
    return source;
  }

  async update(id: string, data: any, tenantId: string) {
    await this.findOne(id, tenantId);
    return prisma.source.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return prisma.source.update({ where: { id }, data: { isActive: false } });
  }

  async updateMetrics(sourceId: string, success: boolean, latencyMs: number) {
    const existing = await prisma.sourceMetrics.findUnique({ where: { sourceId } });
    if (existing) {
      const newSuccessRate = success
        ? Math.min(1, existing.collectionSuccessRate * 0.9 + 0.1)
        : Math.max(0, existing.collectionSuccessRate * 0.9);
      const newLatency = (existing.avgLatencyMs * 0.8 + latencyMs * 0.2);
      await prisma.sourceMetrics.update({
        where: { sourceId },
        data: {
          collectionSuccessRate: newSuccessRate,
          avgLatencyMs: newLatency,
          consecutiveFailures: success ? 0 : existing.consecutiveFailures + 1,
          lastCheckedAt: new Date(),
        },
      });
    } else {
      await prisma.sourceMetrics.create({
        data: {
          sourceId,
          collectionSuccessRate: success ? 1 : 0,
          avgLatencyMs: latencyMs,
          consecutiveFailures: success ? 0 : 1,
        },
      });
    }

    if (!success) {
      await prisma.source.update({
        where: { id: sourceId },
        data: { errorCount: { increment: 1 } },
      });
    } else {
      await prisma.source.update({
        where: { id: sourceId },
        data: { lastCollectedAt: new Date() },
      });
    }
  }

  async getActiveSources(tenantId?: string) {
    return prisma.source.findMany({
      where: {
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }
}
