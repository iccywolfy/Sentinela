import { SourceCategory, CollectionMethod } from './enums';

export interface Source {
  id: string;
  name: string;
  category: SourceCategory;
  countryOfOrigin?: string;
  language: string;
  url: string;
  collectionMethod: CollectionMethod;
  periodicity: 'continuous' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'event_driven';
  credibilityScore: number; // 0–1
  relevanceScore: number;   // 0–1
  stabilityScore: number;   // 0–1
  usageRestrictions?: string;
  isActive: boolean;
  lastCollectedAt?: string;
  errorCount: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  config?: SourceConfig;
}

export interface SourceConfig {
  headers?: Record<string, string>;
  authType?: 'none' | 'api_key' | 'bearer' | 'basic';
  authToken?: string;
  rateLimit?: number;
  timeout?: number;
  maxPages?: number;
  cssSelector?: string;
  xpathSelector?: string;
  rssPath?: string;
}

export interface SourceMetrics {
  sourceId: string;
  collectionSuccessRate: number;
  avgLatencyMs: number;
  eventsPerHour: number;
  lastCheckedAt: string;
  consecutiveFailures: number;
}

export interface RawContent {
  id: string;
  sourceId: string;
  url?: string;
  title?: string;
  content: string;
  contentHash: string;
  language?: string;
  publishedAt?: string;
  collectedAt: string;
  metadata?: Record<string, unknown>;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'duplicate';
  processingError?: string;
  eventId?: string;
}

export interface CreateSourceDto {
  name: string;
  category: SourceCategory;
  countryOfOrigin?: string;
  language: string;
  url: string;
  collectionMethod: CollectionMethod;
  periodicity: Source['periodicity'];
  config?: SourceConfig;
}
