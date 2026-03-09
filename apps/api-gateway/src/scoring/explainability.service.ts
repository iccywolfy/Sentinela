import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ExplainabilityService {
  async explainScore(eventId: string, tenantId: string) {
    const score = await prisma.eventScore.findFirst({
      where: { eventId, tenantId },
      orderBy: { computedAt: 'desc' },
    });

    if (!score) return null;

    const decomp = score.factorDecomposition as Record<string, { value: number; weight: number; contribution: number }>;
    const topFactors = Object.entries(decomp)
      .sort((a, b) => b[1].contribution - a[1].contribution)
      .slice(0, 5)
      .map(([factor, data]) => ({
        factor,
        value: Math.round(data.value * 100) / 100,
        weight: Math.round(data.weight * 100) / 100,
        contribution: Math.round(data.contribution * 100) / 100,
        explanation: this.factorExplanation(factor, data.value),
      }));

    return {
      eventId,
      eventPriorityScore: score.eventPriorityScore,
      topFactors,
      narrative: this.generateNarrative(topFactors, score),
    };
  }

  private factorExplanation(factor: string, value: number): string {
    const explanations: Record<string, (v: number) => string> = {
      sourceCredibility: (v) => `Source credibility is ${v >= 0.7 ? 'high' : v >= 0.4 ? 'moderate' : 'low'} (${(v * 100).toFixed(0)}%)`,
      multiSourceConfirmation: (v) => `Confirmed by ${Math.round(v * 5)} independent sources`,
      themeCriticality: (v) => `Theme impact assessed as ${v >= 0.7 ? 'high' : 'moderate'}`,
      escalationScore: (v) => `Event is ${v >= 0.6 ? 'escalating' : 'stable'}`,
      temporalProximity: (v) => `Event is recent and time-sensitive`,
    };
    return explanations[factor]?.(value) || `${factor}: ${(value * 100).toFixed(0)}%`;
  }

  private generateNarrative(topFactors: any[], score: any): string {
    const priority = score.eventPriorityScore >= 0.7 ? 'high' : score.eventPriorityScore >= 0.4 ? 'moderate' : 'low';
    const topFactor = topFactors[0]?.factor || 'unknown';
    return `This event has a ${priority} priority score (${(score.eventPriorityScore * 100).toFixed(0)}%), primarily driven by ${topFactor}.`;
  }
}
