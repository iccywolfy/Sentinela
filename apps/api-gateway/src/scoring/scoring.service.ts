import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEFAULT_WEIGHTS = {
  themeCriticality: 0.15,
  sourceCredibility: 0.20,
  multiSourceConfirmation: 0.10,
  sectorRelevance: 0.10,
  temporalProximity: 0.10,
  geographicProximity: 0.05,
  repercussionVolume: 0.10,
  historicalPatternMatch: 0.05,
  estimatedImpact: 0.05,
  organizationalExposure: 0.05,
  eventPersistence: 0.025,
  eventRecurrence: 0.025,
  regulatorySensitivity: 0.05,
};

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scoreRecentEvents() {
    const unscoredEvents = await prisma.event.findMany({
      where: { scores: { none: {} }, processedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      take: 100,
    });

    for (const event of unscoredEvents) {
      await this.scoreEvent(event.id, event.tenantId).catch((err) =>
        this.logger.error(`Scoring failed for ${event.id}: ${err.message}`),
      );
    }
  }

  async scoreEvent(eventId: string, tenantId: string) {
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) return null;

    const model = await this.getOrCreateModel(tenantId);
    const weights = model.weightsJson as Record<string, number>;

    const factors = this.computeFactors(event);
    const decomposition: Record<string, { value: number; weight: number; contribution: number }> = {};

    let weightedSum = 0;
    for (const [factor, value] of Object.entries(factors)) {
      const weight = weights[factor] || 0;
      const contribution = value * weight;
      decomposition[factor] = { value, weight, contribution };
      weightedSum += contribution;
    }

    const baseScore = Math.min(weightedSum, 1);

    const scores = {
      geopoliticalRiskScore: event.eventDomain === 'geopolitical' ? baseScore * 1.2 : baseScore * 0.7,
      cyberRiskScore: event.eventDomain === 'cyber' ? baseScore * 1.2 : baseScore * 0.5,
      regulatoryRiskScore: event.eventDomain === 'regulatory' ? baseScore * 1.2 : baseScore * 0.4,
      financialImpactScore: event.eventDomain === 'financial' ? baseScore * 1.2 : baseScore * 0.6,
      supplyChainRiskScore: event.eventDomain === 'supply_chain' ? baseScore * 1.2 : baseScore * 0.5,
      reputationalRiskScore: baseScore * 0.6,
      instabilityScore: baseScore * 0.8,
      escalationScore: event.eventStatus === 'escalating' ? baseScore * 1.3 : baseScore * 0.7,
      eventPriorityScore: baseScore,
    };

    // Clamp all scores to [0, 1]
    for (const key of Object.keys(scores)) {
      (scores as any)[key] = Math.min(Math.max((scores as any)[key], 0), 1);
    }

    const existing = await prisma.eventScore.findFirst({ where: { eventId, modelId: model.id } });
    if (existing) {
      return prisma.eventScore.update({
        where: { id: existing.id },
        data: { ...scores, factorDecomposition: decomposition, computedAt: new Date() },
      });
    }

    return prisma.eventScore.create({
      data: {
        id: uuidv4(),
        eventId,
        modelId: model.id,
        modelVersion: model.version,
        ...scores,
        factorDecomposition: decomposition,
        tenantId,
      },
    });
  }

  private computeFactors(event: any): Record<string, number> {
    const actors: any[] = (event.involvedActorsJson as any[]) || [];
    const sources: string[] = (event.sourceIdsJson as string[]) || [];

    return {
      themeCriticality: event.impactScore || 0,
      sourceCredibility: event.credibilityScore || 0.5,
      multiSourceConfirmation: Math.min(sources.length / 5, 1),
      sectorRelevance: ((event.sectorsImpactedJson as string[]) || []).length > 0 ? 0.7 : 0.3,
      temporalProximity: 0.8, // Recent event
      geographicProximity: 0.5,
      repercussionVolume: actors.length > 3 ? 0.8 : 0.4,
      historicalPatternMatch: 0.3,
      estimatedImpact: event.impactScore || 0.5,
      organizationalExposure: 0.5,
      eventPersistence: event.eventStatus === 'developing' || event.eventStatus === 'escalating' ? 0.8 : 0.4,
      eventRecurrence: 0.3,
      regulatorySensitivity: event.eventDomain === 'regulatory' ? 0.9 : 0.3,
    };
  }

  private async getOrCreateModel(tenantId: string) {
    let model = await prisma.scoreModel.findFirst({ where: { tenantId, isActive: true } });
    if (!model) {
      model = await prisma.scoreModel.create({
        data: {
          id: uuidv4(),
          version: '1.0.0',
          name: 'Default Scoring Model',
          weightsJson: DEFAULT_WEIGHTS,
          isActive: true,
          tenantId,
        },
      });
    }
    return model;
  }

  async getEventScores(eventId: string, tenantId: string) {
    return prisma.eventScore.findMany({
      where: { eventId, tenantId },
      orderBy: { computedAt: 'desc' },
      take: 10,
    });
  }

  async getCountryScoreboard(tenantId: string) {
    const events = await prisma.event.findMany({
      where: { tenantId, occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      include: { scores: { take: 1, orderBy: { computedAt: 'desc' } } },
    });

    const countryMap = new Map<string, { scores: number[]; events: string[] }>();
    for (const event of events) {
      const loc = (event.locationJson as any) || {};
      const cc = loc.countryCode;
      if (!cc) continue;

      if (!countryMap.has(cc)) countryMap.set(cc, { scores: [], events: [] });
      const entry = countryMap.get(cc)!;
      entry.events.push(event.id);
      const score = event.scores[0];
      if (score) entry.scores.push(score.geopoliticalRiskScore);
    }

    return [...countryMap.entries()].map(([countryCode, data]) => ({
      countryCode,
      avgRiskScore: data.scores.reduce((a, b) => a + b, 0) / (data.scores.length || 1),
      eventCount: data.events.length,
      topEventIds: data.events.slice(0, 3),
    })).sort((a, b) => b.avgRiskScore - a.avgRiskScore);
  }

  async getModels(tenantId: string) {
    return prisma.scoreModel.findMany({ where: { tenantId } });
  }
}
