import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class SearchService {
  private es: Client;

  constructor() {
    this.es = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
  }

  async semanticSearch(query: string, filters: any, tenantId: string, page = 1, pageSize = 20) {
    const from = (page - 1) * pageSize;
    try {
      const result = await this.es.search({
        index: 'sentinela-events',
        from,
        size: pageSize,
        query: {
          bool: {
            must: [
              { term: { tenantId } },
              { multi_match: { query, fields: ['title^3', 'summary^2', 'content', 'tags'], type: 'best_fields', fuzziness: 'AUTO' } },
            ],
            filter: this.buildFilters(filters),
          },
        },
        highlight: { fields: { title: {}, summary: {}, content: { fragment_size: 150 } } },
        sort: [{ _score: { order: 'desc' } }, { occurredAt: { order: 'desc' } }],
      });

      const total = typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0;
      return {
        data: result.hits.hits.map((h) => ({ ...h._source, highlights: h.highlight })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  }

  async entityPivot(entityName: string, tenantId: string) {
    const entity = await prisma.entity.findFirst({
      where: { tenantId, name: { contains: entityName, mode: 'insensitive' } },
      include: { mentions: { include: { event: { include: { scores: { take: 1 } } } }, take: 20 } },
    });

    const events = await prisma.event.findMany({
      where: {
        tenantId,
        involvedActorsJson: { string_contains: entityName },
      },
      take: 20,
      orderBy: { occurredAt: 'desc' },
    });

    return {
      entity,
      relatedEvents: events,
      mentionCount: entity?.mentions.length || events.length,
    };
  }

  private buildFilters(filters: any): unknown[] {
    const f: unknown[] = [];
    if (filters?.domains?.length) f.push({ terms: { eventDomain: filters.domains } });
    if (filters?.countries?.length) f.push({ terms: { countryCode: filters.countries } });
    if (filters?.dateFrom || filters?.dateTo) {
      f.push({ range: { occurredAt: { gte: filters.dateFrom, lte: filters.dateTo } } });
    }
    return f;
  }
}
