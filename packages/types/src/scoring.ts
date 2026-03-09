export interface ScoreModel {
  id: string;
  version: string;
  name: string;
  weights: ScoreWeights;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface ScoreWeights {
  themeCriticality: number;
  sourceCredibility: number;
  multiSourceConfirmation: number;
  sectorRelevance: number;
  temporalProximity: number;
  geographicProximity: number;
  repercussionVolume: number;
  historicalPatternMatch: number;
  estimatedImpact: number;
  organizationalExposure: number;
  eventPersistence: number;
  eventRecurrence: number;
  regulatorySensitivity: number;
}

export interface EventScore {
  id: string;
  eventId: string;
  modelId: string;
  modelVersion: string;
  geopoliticalRiskScore: number;
  cyberRiskScore: number;
  regulatoryRiskScore: number;
  financialImpactScore: number;
  supplyChainRiskScore: number;
  reputationalRiskScore: number;
  instabilityScore: number;
  escalationScore: number;
  eventPriorityScore: number;
  factorDecomposition: FactorDecomposition;
  baselineComparison?: BaselineComparison;
  tenantId: string;
  computedAt: string;
}

export interface FactorDecomposition {
  [factor: string]: {
    value: number;
    weight: number;
    contribution: number;
  };
}

export interface BaselineComparison {
  thirtyDayAvg: number;
  ninetyDayAvg: number;
  oneYearAvg: number;
  stdDeviation: number;
  zScore: number;
}

export interface CountryScorecard {
  countryCode: string;
  countryName: string;
  scores: {
    geopoliticalRiskScore: number;
    cyberRiskScore: number;
    regulatoryRiskScore: number;
    financialImpactScore: number;
    supplyChainRiskScore: number;
    instabilityScore: number;
  };
  trends: {
    thirtyDay: number;
    ninetyDay: number;
    oneYear: number;
  };
  topEvents: string[];
  lastUpdated: string;
}
