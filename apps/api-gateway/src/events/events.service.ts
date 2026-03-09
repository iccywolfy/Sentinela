import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Client as ESClient } from '@elastic/elasticsearch';

const prisma = new PrismaClient();

@Injectable()
export class EventsService {
  private es: ESClient;

  constructor() {
    this.es = new ESClient({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
  }

  async search(query: string, filters: any, tenantId: string, page = 1, pageSize = 20) {
    const from = (page - 1) * pageSize;
    const must: unknown[] = [{ term: { tenantId } }];

    if (query) {
      must.push({ multi_match: { query, fields: ['title^3', 'summary^2', 'content'], type: 'best_fields' } });
    }

    const filter: unknown[] = [];
    if (filters.domains?.length) filter.push({ terms: { eventDomain: filters.domains } });
    if (filters.countries?.length) filter.push({ terms: { countryCode: filters.countries } });
    if (filters.dateFrom || filters.dateTo) {
      filter.push({ range: { occurredAt: { gte: filters.dateFrom, lte: filters.dateTo } } });
    }
    if (filters.minImpact) filter.push({ range: { impactScore: { gte: parseFloat(filters.minImpact) } } });
    if (filters.tags?.length) filter.push({ terms: { tags: filters.tags } });

    try {
      const result = await this.es.search({
        index: 'sentinela-events',
        from,
        size: pageSize,
        query: { bool: { must, filter } },
        sort: [{ eventPriorityScore: { order: 'desc' } }, { occurredAt: { order: 'desc' } }],
      });

      const total = typeof result.hits.total === 'object' ? result.hits.total.value : (result.hits.total || 0);
      return {
        data: result.hits.hits.map((h) => h._source),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch {
      // Fallback to Prisma when ES unavailable
      return this.searchPrisma(query, filters, tenantId, page, pageSize);
    }
  }

  private async searchPrisma(query: string, filters: any, tenantId: string, page: number, pageSize: number) {
    const where: any = { tenantId };
    if (filters.domains?.length) where.eventDomain = { in: filters.domains };
    if (filters.dateFrom) where.occurredAt = { gte: new Date(filters.dateFrom) };

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ impactScore: 'desc' }, { occurredAt: 'desc' }],
        include: { scores: { take: 1, orderBy: { computedAt: 'desc' } } },
      }),
      prisma.event.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string, tenantId: string) {
    const event = await prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        scores: { take: 1, orderBy: { computedAt: 'desc' } },
        entityMentions: { include: { entity: true } },
        narrativeProfile: true,
        correlationsA: { include: { eventB: true }, take: 10 },
      },
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async findRelated(id: string, tenantId: string) {
    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) return [];
    const relatedIds = (event.relatedEventIdsJson as string[]) || [];
    return prisma.event.findMany({
      where: { id: { in: relatedIds }, tenantId },
      take: 10,
      orderBy: { impactScore: 'desc' },
    });
  }

  async getByDomain(domain: string, tenantId: string, limit = 20) {
    return prisma.event.findMany({
      where: { tenantId, eventDomain: domain },
      take: limit,
      orderBy: [{ impactScore: 'desc' }, { occurredAt: 'desc' }],
    });
  }
}
