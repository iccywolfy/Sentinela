import {
  EventDomain,
  EventClassification,
  EventStatus,
  EntityType,
  InfoClassification,
} from './enums';
import { GeoLocation, ScoreVector } from './common';

export interface NormalizedEvent {
  id: string;
  title: string;
  summary: string;
  content?: string;
  classificationTitle: EventClassification;
  eventDomain: EventDomain;
  eventSubdomain?: string;
  eventStatus: EventStatus;
  confidenceLevel: number;     // 0–1
  credibilityScore: number;    // 0–1
  relevanceScore: number;      // 0–1
  impactScore: number;         // 0–1
  urgencyScore: number;        // 0–1
  location: GeoLocation;
  occurredAt: string;
  publishedAt: string;
  processedAt: string;
  involvedActors: EventActor[];
  organizations: string[];
  sectorsImpacted: string[];
  financialIndicators?: FinancialIndicators;
  cyberIndicators?: CyberIndicators;
  legalReferences?: string[];
  relatedEventIds: string[];
  sourceIds: string[];
  primarySourceId: string;
  analystNotes?: string;
  verificationState: 'unverified' | 'partial' | 'verified' | 'disputed';
  narrativeProfiles?: NarrativeProfileRef[];
  tags: string[];
  infoClassification: InfoClassification;
  provenanceChain: ProvenanceEntry[];
  tenantId: string;
  createdBy?: string;
  scores?: ScoreVector;
  createdAt: string;
  updatedAt: string;
}

export interface EventActor {
  name: string;
  type: EntityType;
  role?: string;
  entityId?: string;
}

export interface FinancialIndicators {
  currencies?: string[];
  commodities?: string[];
  indices?: string[];
  estimatedImpactUsd?: number;
  sanctionsRelated: boolean;
}

export interface CyberIndicators {
  cveIds?: string[];
  mitreAttackIds?: string[];
  threatActors?: string[];
  targetedSectors?: string[];
  iocs?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface NarrativeProfileRef {
  bloc: string;
  divergenceScore: number;
  dominantFraming?: string;
}

export interface ProvenanceEntry {
  sourceId: string;
  sourceName: string;
  url?: string;
  collectedAt: string;
  credibilityScore: number;
}

export interface EventEntity {
  id: string;
  name: string;
  type: EntityType;
  aliases?: string[];
  wikidataId?: string;
  description?: string;
  countryCode?: string;
  metadata?: Record<string, unknown>;
  tenantId: string;
  createdAt: string;
}

export interface EventFilter {
  domains?: EventDomain[];
  statuses?: EventStatus[];
  classifications?: EventClassification[];
  countries?: string[];
  dateFrom?: string;
  dateTo?: string;
  minCredibility?: number;
  minImpact?: number;
  sourceIds?: string[];
  tags?: string[];
  entityIds?: string[];
  sectors?: string[];
  tenantId?: string;
  q?: string;
}
