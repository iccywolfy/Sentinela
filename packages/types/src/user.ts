import { UserRole, InfoClassification } from './enums';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamIds: string[];
  tenantId: string;
  isActive: boolean;
  lastLoginAt?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  defaultDashboard?: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  alertSeverityFilter: string[];
  defaultEventFilters?: Record<string, unknown>;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  leadId?: string;
  defaultInfoClassification: InfoClassification;
  tenantId: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  dataResidencyRegion?: string;
  retentionPolicyDays: number;
  maxSources: number;
  maxUsers: number;
  features: TenantFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatures {
  narrativeIntelligence: boolean;
  aiAssistant: boolean;
  vectorSearch: boolean;
  apiAccess: boolean;
  customReports: boolean;
  crisisRoom: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
