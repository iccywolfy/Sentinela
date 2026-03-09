import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  async getGlobalOverview(tenantId: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [topRisks, recentAlerts, eventsByDomain, countryRisks, kpis] = await Promise.all([
      this.getTopRisks(tenantId, 10),
      this.getRecentAlerts(tenantId, 5),
      this.getEventsByDomain(tenantId, last7d),
      this.getCountryRiskHeatmap(tenantId, last7d),
      this.getPlatformKPIs(tenantId, last24h),
    ]);

    return {
      topRisks,
      recentAlerts,
      eventsByDomain,
      countryRisks,
      kpis,
      generatedAt: now.toISOString(),
    };
  }

  async getTopRisks(tenantId: string, limit = 10) {
    const events = await prisma.event.findMany({
      where: {
        tenantId,
        eventStatus: { in: ['emerging', 'developing', 'escalating'] },
        occurredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { scores: { take: 1, orderBy: { computedAt: 'desc' } } },
      orderBy: { impactScore: 'desc' },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      domain: e.eventDomain,
      status: e.eventStatus,
      impactScore: e.impactScore,
      urgencyScore: e.urgencyScore,
      location: e.locationJson,
      priorityScore: e.scores[0]?.eventPriorityScore || e.impactScore,
      occurredAt: e.occurredAt,
    }));
  }

  async getRecentAlerts(tenantId: string, limit = 5) {
    return prisma.alert.findMany({
      where: { tenantId, status: { in: ['new', 'acknowledged'] } },
      orderBy: [{ severity: 'asc' }, { triggeredAt: 'desc' }],
      take: limit,
      select: { id: true, type: true, severity: true, status: true, title: true, summary: true, triggeredAt: true },
    });
  }

  async getEventsByDomain(tenantId: string, since: Date) {
    const grouped = await prisma.event.groupBy({
      by: ['eventDomain'],
      where: { tenantId, occurredAt: { gte: since } },
      _count: { eventDomain: true },
      _avg: { impactScore: true },
    });

    return grouped.map((g) => ({
      domain: g.eventDomain,
      count: g._count.eventDomain,
      avgImpact: Math.round((g._avg.impactScore || 0) * 100) / 100,
    }));
  }

  async getCountryRiskHeatmap(tenantId: string, since: Date) {
    const events = await prisma.event.findMany({
      where: { tenantId, occurredAt: { gte: since } },
      select: { locationJson: true, impactScore: true, eventDomain: true, id: true },
    });

    const countryMap = new Map<string, { totalImpact: number; count: number; domains: Set<string> }>();

    for (const event of events) {
      const loc = event.locationJson as any;
      const cc = loc?.countryCode;
      if (!cc) continue;

      if (!countryMap.has(cc)) {
        countryMap.set(cc, { totalImpact: 0, count: 0, domains: new Set() });
      }
      const entry = countryMap.get(cc)!;
      entry.totalImpact += event.impactScore;
      entry.count += 1;
      entry.domains.add(event.eventDomain);
    }

    return [...countryMap.entries()].map(([countryCode, data]) => ({
      countryCode,
      riskScore: Math.min(data.totalImpact / data.count, 1),
      eventCount: data.count,
      domains: [...data.domains],
    })).sort((a, b) => b.riskScore - a.riskScore);
  }

  private async getPlatformKPIs(tenantId: string, since: Date) {
    const [totalEvents, newAlerts, activeCases, openCorrelations] = await Promise.all([
      prisma.event.count({ where: { tenantId, processedAt: { gte: since } } }),
      prisma.alert.count({ where: { tenantId, status: 'new' } }),
      prisma.investigativeCase.count({ where: { tenantId, status: { in: ['open', 'in_progress'] } } }),
      prisma.correlation.count({ where: { tenantId, humanReviewStatus: 'pending' } }),
    ]);

    return {
      eventsLast24h: totalEvents,
      newAlerts,
      activeCases,
      pendingCorrelations: openCorrelations,
    };
  }

  async getDailyBrief(tenantId: string) {
    const overview = await this.getGlobalOverview(tenantId);
    const topByDomain = await Promise.all([
      'geopolitical', 'financial', 'cyber', 'regulatory',
    ].map(async (domain) => ({
      domain,
      topEvent: (await this.getTopEventsByDomain(tenantId, domain, 1))[0] || null,
    })));

    return {
      date: new Date().toISOString().split('T')[0],
      summary: `${overview.kpis.eventsLast24h} events processed in the last 24h. ${overview.kpis.newAlerts} new alerts require attention.`,
      topRisks: overview.topRisks.slice(0, 5),
      topByDomain,
      criticalAlerts: overview.recentAlerts.filter((a: any) => ['critical', 'high'].includes(a.severity)),
      generatedAt: overview.generatedAt,
    };
  }

  async getTopEventsByDomain(tenantId: string, domain: string, limit = 5) {
    return prisma.event.findMany({
      where: {
        tenantId,
        eventDomain: domain,
        occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: limit,
      orderBy: { impactScore: 'desc' },
    });
  }
}
