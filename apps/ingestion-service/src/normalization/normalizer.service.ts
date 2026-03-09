import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

@Injectable()
export class NormalizerService {
  private readonly logger = new Logger(NormalizerService.name);

  constructor(private readonly esService: ElasticsearchService) {}

  async normalize(raw: any, nlp: any): Promise<any> {
    const source = raw.source;
    const tenantId = source?.tenantId || 'default';

    // Determine event domain from NLP result
    const domain = this.mapDomain(nlp.domain);
    const impactScore = this.computeImpactScore(nlp, source);
    const credibilityScore = source?.credibilityScore || 0.5;
    const priorityScore = (impactScore * 0.4 + credibilityScore * 0.3 + this.urgencyFromSentiment(nlp.sentiment) * 0.3);

    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: raw.title || nlp.summary?.slice(0, 200) || 'Untitled',
        summary: nlp.summary || raw.content?.slice(0, 500) || '',
        content: raw.content,
        classificationTitle: this.classifyContent(nlp),
        eventDomain: domain,
        eventSubdomain: nlp.subdomain,
        eventStatus: 'emerging',
        confidenceLevel: 0.6,
        credibilityScore,
        relevanceScore: source?.relevanceScore || 0.5,
        impactScore,
        urgencyScore: this.urgencyFromSentiment(nlp.sentiment),
        locationJson: this.buildLocation(nlp.locations),
        occurredAt: raw.publishedAt || new Date(),
        publishedAt: raw.publishedAt || new Date(),
        processedAt: new Date(),
        involvedActorsJson: this.mapActors(nlp.entities),
        organizationsJson: nlp.entities.filter((e: any) => e.type === 'ORG').map((e: any) => e.text),
        sectorsImpactedJson: this.mapSectors(nlp.keywords),
        sourceIdsJson: [source?.id].filter(Boolean),
        primarySourceId: source?.id || 'unknown',
        verificationState: 'unverified',
        infoClassification: 'internal',
        provenanceChain: [{
          sourceId: source?.id,
          sourceName: source?.name,
          url: raw.url,
          collectedAt: raw.collectedAt,
          credibilityScore,
        }],
        tagsJson: [...nlp.keywords.slice(0, 10)],
        tenantId,
        eventPriorityScore: priorityScore,
      },
    });

    // Index in Elasticsearch
    try {
      await this.esService.indexEvent({
        ...event,
        countryCode: (event.locationJson as any)?.countryCode,
        entityNames: nlp.entities.map((e: any) => e.text),
        sectors: event.sectorsImpactedJson,
        eventPriorityScore: priorityScore,
      }, tenantId);
    } catch (err) {
      this.logger.warn(`ES indexing failed for event ${event.id}: ${err.message}`);
    }

    return event;
  }

  private mapDomain(nlpDomain: string): string {
    const map: Record<string, string> = {
      politics: 'geopolitical',
      military: 'geopolitical',
      diplomacy: 'geopolitical',
      finance: 'financial',
      economy: 'financial',
      regulation: 'regulatory',
      law: 'regulatory',
      cyber: 'cyber',
      security: 'cyber',
      supply: 'supply_chain',
      logistics: 'supply_chain',
      media: 'narrative',
      information: 'narrative',
    };
    return map[nlpDomain?.toLowerCase()] || 'geopolitical';
  }

  private classifyContent(nlp: any): string {
    if (nlp.sentiment < -0.5) return 'fact_confirmed';
    if (nlp.eventType === 'advisory') return 'technical_advisory';
    if (nlp.eventType === 'analysis') return 'analysis';
    if (nlp.eventType === 'opinion') return 'opinion';
    return 'fact_confirmed';
  }

  private computeImpactScore(nlp: any, source: any): number {
    const entityWeight = Math.min(nlp.entities?.length / 10, 1) * 0.3;
    const credWeight = (source?.credibilityScore || 0.5) * 0.4;
    const sentimentWeight = Math.abs(nlp.sentiment) * 0.3;
    return Math.min(entityWeight + credWeight + sentimentWeight, 1);
  }

  private urgencyFromSentiment(sentiment: number): number {
    return Math.min(Math.abs(sentiment) * 1.2, 1);
  }

  private buildLocation(locations: any[]): Record<string, unknown> {
    if (!locations?.length) return {};
    const first = locations[0];
    return {
      country: first.name,
      countryCode: first.countryCode,
      coordinates: first.lat && first.lon ? { lat: first.lat, lon: first.lon } : undefined,
    };
  }

  private mapActors(entities: any[]): any[] {
    return entities
      .filter((e) => ['PERSON', 'ORG', 'GPE'].includes(e.type))
      .map((e) => ({ name: e.text, type: this.mapEntityType(e.type) }));
  }

  private mapEntityType(nlpType: string): string {
    const map: Record<string, string> = {
      PERSON: 'person',
      ORG: 'organization',
      GPE: 'country',
      LOC: 'location',
    };
    return map[nlpType] || 'organization';
  }

  private mapSectors(keywords: string[]): string[] {
    const sectorKeywords: Record<string, string[]> = {
      energy: ['oil', 'gas', 'energy', 'power', 'electricity'],
      finance: ['bank', 'finance', 'market', 'stock', 'currency', 'dollar'],
      technology: ['tech', 'cyber', 'software', 'data', 'digital'],
      defense: ['military', 'army', 'defense', 'weapon', 'NATO'],
      trade: ['trade', 'export', 'import', 'tariff', 'sanction'],
    };

    const sectors: string[] = [];
    for (const [sector, words] of Object.entries(sectorKeywords)) {
      if (keywords.some((k) => words.some((w) => k.toLowerCase().includes(w)))) {
        sectors.push(sector);
      }
    }
    return sectors;
  }
}
