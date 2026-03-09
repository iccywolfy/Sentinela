export interface Source {
  id: string;
  name: string;
  category: string;
  countryOfOrigin?: string;
  language: string;
  url: string;
  collectionMethod: string;
  periodicity: string;
  credibilityScore: number;
  relevanceScore: number;
  stabilityScore: number;
  usageRestrictions?: string;
  isActive: boolean;
  lastCollectedAt?: Date;
  errorCount: number;
  configJson: Record<string, unknown>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
