// SENTINELA Shared UI — Design tokens and base utilities
// Import from @sentinela/ui in any frontend app

export const COLORS = {
  navy: {
    900: '#0a1628',
    800: '#0f1f3d',
    700: '#1a2f52',
    600: '#243a63',
  },
  gold: {
    500: '#c9a84c',
    400: '#d4b86a',
    300: '#e0cc99',
  },
} as const;

export const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INFO: 'Info',
};

export const DOMAIN_LABELS: Record<string, string> = {
  GEOPOLITICAL: 'Geopolitical',
  ECONOMIC: 'Economic',
  MILITARY: 'Military',
  CYBER: 'Cyber',
  HUMANITARIAN: 'Humanitarian',
  ENVIRONMENTAL: 'Environmental',
  SOCIAL: 'Social',
  TECHNOLOGICAL: 'Technological',
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  THRESHOLD_BREACH: 'Threshold Breach',
  WATCHLIST_MATCH: 'Watchlist Match',
  CORRELATION_DETECTED: 'Correlation',
  NARRATIVE_SHIFT: 'Narrative Shift',
  CRISIS_ESCALATION: 'Crisis Escalation',
  SOURCE_ANOMALY: 'Source Anomaly',
  ENTITY_ACTIVITY: 'Entity Activity',
  GEOGRAPHIC_ALERT: 'Geographic Alert',
  PATTERN_MATCH: 'Pattern Match',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  FLASH_ALERT: 'Flash Alert',
  DAILY_BRIEF: 'Daily Brief',
  WEEKLY_DIGEST: 'Weekly Digest',
  COUNTRY_RISK_DOSSIER: 'Country Risk Dossier',
  ENTITY_PROFILE: 'Entity Profile',
  THREAT_ASSESSMENT: 'Threat Assessment',
  INCIDENT_REPORT: 'Incident Report',
  NARRATIVE_ANALYSIS: 'Narrative Analysis',
  CORRELATION_REPORT: 'Correlation Report',
  EXECUTIVE_SUMMARY: 'Executive Summary',
  CUSTOM: 'Custom',
};

export const NARRATIVE_BLOC_LABELS: Record<string, string> = {
  WEST_MEDIA: 'Western Media',
  RU_STATE: 'Russian State Media',
  CN_STATE: 'Chinese State Media',
  MENA_REGIONAL: 'MENA Regional',
  LATAM_MEDIA: 'Latin America',
  GOV_OFFICIAL: 'Government Official',
  THINK_TANK: 'Think Tanks',
  TECH_SCIENTIFIC: 'Tech / Scientific',
  INDEPENDENT: 'Independent',
};

/** Convert a 0-1 score to a risk level label */
export function scoreToLevel(score: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.6) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}

/** Format a score (0-1) as percentage string */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}`;
}
