import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  onModuleInit() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME
        ? { username: process.env.ELASTICSEARCH_USERNAME, password: process.env.ELASTICSEARCH_PASSWORD || '' }
        : undefined,
    });
    this.ensureIndices().catch((err) => this.logger.error('Failed to ensure ES indices', err));
  }

  private async ensureIndices() {
    const indices = [
      {
        index: 'sentinela-events',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text', analyzer: 'standard' },
            summary: { type: 'text', analyzer: 'standard' },
            content: { type: 'text', analyzer: 'standard' },
            eventDomain: { type: 'keyword' },
            eventStatus: { type: 'keyword' },
            classificationTitle: { type: 'keyword' },
            confidenceLevel: { type: 'float' },
            credibilityScore: { type: 'float' },
            impactScore: { type: 'float' },
            urgencyScore: { type: 'float' },
            eventPriorityScore: { type: 'float' },
            occurredAt: { type: 'date' },
            publishedAt: { type: 'date' },
            processedAt: { type: 'date' },
            countryCode: { type: 'keyword' },
            location: { type: 'geo_point' },
            tags: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            sourceIds: { type: 'keyword' },
            entityNames: { type: 'keyword' },
            sectors: { type: 'keyword' },
          },
        },
      },
      {
        index: 'sentinela-sources',
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text' },
            category: { type: 'keyword' },
            countryOfOrigin: { type: 'keyword' },
            language: { type: 'keyword' },
            credibilityScore: { type: 'float' },
            tenantId: { type: 'keyword' },
          },
        },
      },
    ];

    for (const { index, mappings } of indices) {
      try {
        const exists = await this.client.indices.exists({ index });
        if (!exists) {
          await this.client.indices.create({ index, mappings } as any);
          this.logger.log(`Created ES index: ${index}`);
        }
      } catch (err) {
        this.logger.warn(`Index ${index} setup issue: ${err}`);
      }
    }
  }

  async indexEvent(event: Record<string, unknown>, tenantId: string) {
    return this.client.index({
      index: 'sentinela-events',
      id: event['id'] as string,
      document: { ...event, tenantId },
    });
  }

  async searchEvents(query: string, filters: Record<string, unknown> = {}, tenantId: string, from = 0, size = 20) {
    const must: unknown[] = [{ term: { tenantId } }];
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['title^3', 'summary^2', 'content'],
          type: 'best_fields',
        },
      });
    }

    const filterClauses: unknown[] = [];
    if (filters['domains']) filterClauses.push({ terms: { eventDomain: filters['domains'] } });
    if (filters['countries']) filterClauses.push({ terms: { countryCode: filters['countries'] } });
    if (filters['dateFrom'] || filters['dateTo']) {
      filterClauses.push({
        range: {
          occurredAt: {
            ...(filters['dateFrom'] ? { gte: filters['dateFrom'] } : {}),
            ...(filters['dateTo'] ? { lte: filters['dateTo'] } : {}),
          },
        },
      });
    }
    if (filters['minImpact']) filterClauses.push({ range: { impactScore: { gte: filters['minImpact'] } } });

    const response = await this.client.search({
      index: 'sentinela-events',
      from,
      size,
      query: {
        bool: { must, filter: filterClauses },
      },
      sort: [{ eventPriorityScore: { order: 'desc' } }, { occurredAt: { order: 'desc' } }],
    });

    return {
      hits: response.hits.hits.map((h) => h._source),
      total: typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total,
    };
  }

  async getClient() {
    return this.client;
  }
}
