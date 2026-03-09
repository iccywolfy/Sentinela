import { ReportType, InfoClassification } from './enums';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  infoClassification: InfoClassification;
  templateId: string;
  sections: ReportSection[];
  eventIds: string[];
  correlationIds: string[];
  scoreIds: string[];
  caseId?: string;
  pdfS3Key?: string;
  pdfGeneratedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'executive_summary' | 'analysis' | 'methodology' | 'conclusion' | 'appendix' | 'custom';
  eventIds?: string[];
  charts?: ReportChart[];
}

export interface ReportChart {
  type: 'bar' | 'line' | 'pie' | 'heatmap' | 'network';
  title: string;
  dataQuery: string;
  config?: Record<string, unknown>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  defaultSections: Omit<ReportSection, 'id' | 'content'>[];
  brandingConfig: BrandingConfig;
  isDefault: boolean;
  tenantId: string;
  createdAt: string;
}

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  organizationName: string;
  footer?: string;
  watermark?: string;
}

export interface GenerateReportDto {
  type: ReportType;
  title: string;
  templateId?: string;
  eventIds?: string[];
  caseId?: string;
  dateRange?: { from: string; to: string };
  countryCode?: string;
  sector?: string;
  customContent?: Record<string, string>;
  infoClassification?: InfoClassification;
}
