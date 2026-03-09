import { Injectable } from '@nestjs/common';

const BLOC_FRAMING_BIAS: Record<string, Record<string, string>> = {
  WEST_MEDIA: {
    geopolitical: 'sovereignty_violation',
    cyber: 'state_sponsored_attack',
    narrative: 'disinformation',
  },
  RU_STATE: {
    geopolitical: 'western_provocation',
    cyber: 'defensive_measure',
    narrative: 'information_sovereignty',
  },
  CN_STATE: {
    geopolitical: 'internal_affairs',
    cyber: 'technical_cooperation',
    narrative: 'harmonious_development',
  },
  MENA_REGIONAL: {
    geopolitical: 'regional_stability',
    cyber: 'infrastructure_protection',
    narrative: 'cultural_identity',
  },
  THINK_TANK: {
    geopolitical: 'strategic_competition',
    cyber: 'threat_assessment',
    narrative: 'influence_operations',
  },
};

@Injectable()
export class FramingAnalyzer {
  detectFraming(event: any, bloc: string): string {
    const biasMaps = BLOC_FRAMING_BIAS[bloc];
    if (!biasMaps) return 'neutral_reporting';
    return biasMaps[event.eventDomain] || 'neutral_reporting';
  }

  estimateSentiment(event: any, bloc: string): number {
    const baseSentiment: Record<string, number> = {
      WEST_MEDIA: -0.3,
      RU_STATE: 0.4,
      CN_STATE: 0.3,
      MENA_REGIONAL: -0.1,
      LATAM_MEDIA: -0.2,
      GOV_OFFICIAL: 0.2,
      THINK_TANK: -0.1,
      TECH_SCIENTIFIC: 0,
      INDEPENDENT: -0.4,
    };
    const base = baseSentiment[bloc] || 0;
    const domainModifier = event.eventDomain === 'cyber' ? -0.2 : 0;
    return Math.max(-1, Math.min(1, base + domainModifier + (Math.random() - 0.5) * 0.2));
  }

  extractKeyTerms(event: any, bloc: string): string[] {
    const blocTerms: Record<string, string[]> = {
      WEST_MEDIA: ['democracy', 'sovereignty', 'rules-based order', 'transparency'],
      RU_STATE: ['sovereignty', 'NATO expansion', 'provocation', 'Russophobia'],
      CN_STATE: ['win-win', 'non-interference', 'development', 'multilateralism'],
      MENA_REGIONAL: ['stability', 'resistance', 'dialogue', 'regional security'],
      THINK_TANK: ['deterrence', 'escalation', 'strategic competition', 'hybrid warfare'],
      GOV_OFFICIAL: ['diplomatic', 'bilateral', 'cooperation', 'sanctions'],
      INDEPENDENT: ['accountability', 'evidence', 'investigation', 'documentation'],
    };
    return blocTerms[bloc] || ['neutral', 'reporting'];
  }

  findPolarizedTerms(
    sources: any[],
    profiles: any[],
  ): Array<{ term: string; blocs: string[]; polarity: number }> {
    const polarized = [
      { term: 'invasion', blocs: ['WEST_MEDIA', 'INDEPENDENT'], polarity: -0.9 },
      { term: 'special operation', blocs: ['RU_STATE'], polarity: 0.3 },
      { term: 'provocation', blocs: ['RU_STATE', 'CN_STATE'], polarity: -0.5 },
      { term: 'sanctions', blocs: ['WEST_MEDIA', 'GOV_OFFICIAL'], polarity: -0.4 },
      { term: 'anti-sanctions', blocs: ['RU_STATE'], polarity: 0.4 },
      { term: 'hybrid warfare', blocs: ['THINK_TANK', 'WEST_MEDIA'], polarity: -0.7 },
      { term: 'information war', blocs: ['RU_STATE', 'CN_STATE'], polarity: -0.3 },
    ];

    const coveredBlocs = new Set(profiles.map((p) => p.bloc));
    return polarized.filter((p) => p.blocs.some((b) => coveredBlocs.has(b)));
  }
}
