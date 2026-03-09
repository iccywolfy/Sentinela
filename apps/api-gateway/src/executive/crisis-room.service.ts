import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CrisisRoomService {
  async getCrisisStatus(tenantId: string) {
    const escalatingEvents = await prisma.event.findMany({
      where: {
        tenantId,
        eventStatus: 'escalating',
        occurredAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      },
      include: { scores: { take: 1, orderBy: { computedAt: 'desc' } } },
      orderBy: { impactScore: 'desc' },
      take: 20,
    });

    const criticalAlerts = await prisma.alert.findMany({
      where: { tenantId, severity: { in: ['critical', 'high'] }, status: { in: ['new', 'acknowledged'] } },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });

    const activeCases = await prisma.investigativeCase.findMany({
      where: { tenantId, priority: 'critical', status: { in: ['open', 'in_progress'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const isCrisisModeActive = escalatingEvents.length >= 3 || criticalAlerts.length >= 2;

    return {
      isCrisisModeActive,
      escalatingEvents,
      criticalAlerts,
      activeCases,
      crisisScore: Math.min((escalatingEvents.length * 0.1 + criticalAlerts.length * 0.2), 1),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getScenarioProjections(eventId: string, tenantId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId },
      include: { scores: { take: 1 }, correlationsA: { take: 5 } },
    });

    if (!event) return null;

    const score = event.scores[0]?.escalationScore || 0.5;

    return {
      eventId,
      scenarios: [
        {
          name: 'De-escalation',
          probability: Math.max(0.1, 1 - score - 0.2),
          description: 'Situation stabilizes through diplomatic or operational resolution',
          timeframe: '72h–7d',
          indicators: ['Diplomatic contact', 'Official statements', 'Ceasefire signals'],
        },
        {
          name: 'Status Quo',
          probability: 0.3,
          description: 'Situation remains at current tension level without significant change',
          timeframe: '1–4 weeks',
          indicators: ['No new escalatory actions', 'Regular monitoring reports'],
        },
        {
          name: 'Escalation',
          probability: Math.min(score + 0.1, 0.9),
          description: 'Situation worsens with potential for broader impact',
          timeframe: '24–72h',
          indicators: ['Military mobilization', 'Economic measures', 'Alliance activation'],
        },
      ],
      confidenceLevel: 0.55,
      basedOnEventCount: event.correlationsA.length + 1,
    };
  }
}
