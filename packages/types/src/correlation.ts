import { CorrelationType } from './enums';

export interface Correlation {
  id: string;
  type: CorrelationType;
  strength: number; // 0–1
  rationale: string;
  supportingEvidence: string[];
  eventIds: string[];
  alternativeHypotheses?: string[];
  certaintyDegree: 'low' | 'medium' | 'high' | 'very_high';
  humanReviewStatus: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewedBy?: string;
  reviewedAt?: string;
  modelVersion?: string;
  isActive: boolean;
  crossDomainType?: CrossDomainCorrelationType;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export enum CrossDomainCorrelationType {
  GEOPOLITICAL_FINANCIAL = 'geopolitical_financial',
  CYBER_INTERSTATE = 'cyber_interstate',
  LEGISLATION_OPERATIONAL = 'legislation_operational',
  SANCTIONS_SUPPLY_CHAIN = 'sanctions_supply_chain',
  INSTABILITY_CURRENCY = 'instability_currency',
  DISCOURSE_REGULATORY = 'discourse_regulatory',
  PROTESTS_LOGISTICS = 'protests_logistics',
  MILITARY_ENERGY = 'military_energy',
  VULNERABILITY_SECTOR = 'vulnerability_sector',
  NARRATIVE_DISINFO_CYBER = 'narrative_disinfo_cyber',
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  conditions: CorrelationCondition[];
  strength: number;
  crossDomainType?: CrossDomainCorrelationType;
  isActive: boolean;
  tenantId: string;
}

export interface CorrelationCondition {
  field: string;
  operator: 'eq' | 'in' | 'contains' | 'gte' | 'lte' | 'within_days';
  value: unknown;
}
