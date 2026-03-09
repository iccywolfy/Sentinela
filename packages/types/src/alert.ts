import { AlertType, AlertSeverity, AlertStatus, WatchlistType } from './enums';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  summary: string;
  rationale: string;
  evidence: string[];
  expectedImpact?: string;
  recommendations?: string[];
  relatedEventIds: string[];
  relatedCorrelationIds: string[];
  watchlistId?: string;
  recipients: string[];
  feedback?: AlertFeedback;
  tenantId: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertFeedback {
  userId: string;
  rating: 'relevant' | 'not_relevant' | 'false_positive';
  comment?: string;
  submittedAt: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: AlertType;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  cooldownMinutes: number;
  isActive: boolean;
  recipientUserIds: string[];
  tenantId: string;
  createdAt: string;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in' | 'contains';
  value: unknown;
  scoreType?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  type: WatchlistType;
  description?: string;
  items: WatchlistItem[];
  compoundExpression?: string;
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  value: string;
  label?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
