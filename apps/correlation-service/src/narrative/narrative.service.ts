import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FramingAnalyzer } from './framing.analyzer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const BLOC_SOURCES: Record<string, string[]> = {
  WEST_MEDIA: ['reuters', 'bbc', 'ap news', 'cnn', 'new york times', 'guardian'],
  RU_STATE: ['tass', 'ria novosti', 'rt', 'sputnik'],
  CN_STATE: ['xinhua', 'cgtn', "people's daily", 'global times'],
  MENA_REGIONAL: ['al jazeera', 'al arabiya', 'trt world'],
  LATAM_MEDIA: ['folha', 'globo', 'clarin'],
  GOV_OFFICIAL: ['state department', 'foreign ministry'],
  THINK_TANK: ['csis', 'iiss', 'rand', 'brookings', 'chatham house'],
  TECH_SCIENTIFIC: ['cert', 'cve', 'mitre', 'nist'],
  INDEPENDENT: ['bellingcat', 'occrp', 'intercept'],
};

@Injectable()
export class NarrativeService {
  private readonly logger = new Logger(NarrativeService.name);

  constructor(private readonly framingAnalyzer: FramingAnalyzer) {}

  async analyzeEvent(eventId: string, tenantId: string) {
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) return null;

    const sources = await this.getEventSources(event);
    const blocProfiles = this.buildBlocProfiles(sources, event);
    const divergenceIndex = this.computeDivergenceIndex(blocProfiles);
    const dominantThemes = this.extractDominantThemes(sources);
    const polarizedTerms = this.framingAnalyzer.findPolarizedTerms(sources, blocProfiles);
    const coverageGaps = this.findCoverageGaps(blocProfiles);

    const existing = await prisma.narrativeProfile.findUnique({ where: { eventId } });
    if (existing) {
      return prisma.narrativeProfile.update({
        where: { eventId },
        data: {
          divergenceIndex,
          dominantThemes,
          polarizedTerms,
          coverageGaps,
          blocProfiles,
          analyzedAt: new Date(),
        },
      });
    }

    return prisma.narrativeProfile.create({
      data: {
        id: uuidv4(),
        eventId,
        divergenceIndex,
        dominantThemes,
        polarizedTerms,
        coverageGaps,
        blocProfiles,
        tenantId,
      },
    });
  }

  private async getEventSources(event: any): Promise<any[]> {
    const sourceIds = (event.sourceIdsJson as string[]) || [];
    if (!sourceIds.length) return [];
    return prisma.source.findMany({ where: { id: { in: sourceIds } } });
  }

  private buildBlocProfiles(sources: any[], event: any): any[] {
    const profiles: any[] = [];

    for (const [bloc, keywords] of Object.entries(BLOC_SOURCES)) {
      const blocSources = sources.filter((s) =>
        keywords.some((k) => s.name.toLowerCase().includes(k)),
      );

      if (blocSources.length === 0) continue;

      const avgCredibility =
        blocSources.reduce((acc, s) => acc + (s.credibilityScore || 0.5), 0) / blocSources.length;

      profiles.push({
        bloc,
        sourceCount: blocSources.length,
        dominantFraming: this.framingAnalyzer.detectFraming(event, bloc),
        sentimentScore: this.framingAnalyzer.estimateSentiment(event, bloc),
        keyTerms: this.framingAnalyzer.extractKeyTerms(event, bloc),
        sampleSources: blocSources.slice(0, 3).map((s) => s.name),
        coverageIntensity: Math.min(blocSources.length / 5, 1),
        avgCredibility,
      });
    }

    return profiles;
  }

  private computeDivergenceIndex(profiles: any[]): number {
    if (profiles.length < 2) return 0;

    const sentiments = profiles.map((p) => p.sentimentScore);
    const maxSentiment = Math.max(...sentiments);
    const minSentiment = Math.min(...sentiments);
    const range = maxSentiment - minSentiment;

    const framings = profiles.map((p) => p.dominantFraming);
    const uniqueFramings = new Set(framings).size;
    const framingDiversity = uniqueFramings / profiles.length;

    return Math.min((range * 0.5 + framingDiversity * 0.5), 1);
  }

  private extractDominantThemes(sources: any[]): string[] {
    const themes = new Map<string, number>();
    for (const source of sources) {
      const category = source.category || '';
      themes.set(category, (themes.get(category) || 0) + 1);
    }
    return [...themes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);
  }

  private findCoverageGaps(profiles: any[]): string[] {
    const coveredBlocs = new Set(profiles.map((p) => p.bloc));
    return Object.keys(BLOC_SOURCES).filter((b) => !coveredBlocs.has(b));
  }

  async findAll(tenantId: string) {
    return prisma.narrativeProfile.findMany({
      where: { tenantId },
      orderBy: { divergenceIndex: 'desc' },
      take: 50,
    });
  }

  async findByEvent(eventId: string, tenantId: string) {
    return prisma.narrativeProfile.findFirst({ where: { eventId, tenantId } });
  }

  async getHighDivergence(tenantId: string, minIndex = 0.5) {
    return prisma.narrativeProfile.findMany({
      where: { tenantId, divergenceIndex: { gte: minIndex } },
      orderBy: { divergenceIndex: 'desc' },
      take: 20,
    });
  }
}
