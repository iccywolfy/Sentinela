export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface GeoLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  locality?: string;
  coordinates?: GeoCoordinates;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface ScoreVector {
  geopoliticalRiskScore: number;
  cyberRiskScore: number;
  regulatoryRiskScore: number;
  financialImpactScore: number;
  supplyChainRiskScore: number;
  reputationalRiskScore: number;
  instabilityScore: number;
  escalationScore: number;
  eventPriorityScore: number;
}

export interface KafkaMessage<T = unknown> {
  topic: string;
  partition?: number;
  key?: string;
  value: T;
  timestamp?: string;
}

export interface SearchQuery {
  q?: string;
  filters?: Record<string, string | string[] | number | boolean>;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
