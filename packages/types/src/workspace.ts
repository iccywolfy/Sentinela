import { CaseStatus, InfoClassification } from './enums';

export interface InvestigativeCase {
  id: string;
  title: string;
  description?: string;
  status: CaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  assignedAnalystIds: string[];
  leadAnalystId: string;
  eventIds: string[];
  correlationIds: string[];
  notes: CaseNote[];
  attachments: CaseAttachment[];
  tags: string[];
  reportIds: string[];
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  authorId: string;
  authorName: string;
  isAnalytical: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CaseAttachment {
  id: string;
  caseId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  s3Key: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  eventIds: string[];
  entityIds: string[];
  tags: string[];
  infoClassification: InfoClassification;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dossier {
  id: string;
  caseId: string;
  title: string;
  sections: DossierSection[];
  status: 'draft' | 'review' | 'final';
  infoClassification: InfoClassification;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DossierSection {
  id: string;
  title: string;
  content: string;
  eventIds: string[];
  order: number;
}

export interface InvestigativeTimeline {
  id: string;
  caseId: string;
  title: string;
  entries: TimelineEntry[];
  tenantId: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description?: string;
  eventId?: string;
  isManual: boolean;
  importance: 'low' | 'medium' | 'high';
}
