// ─── Event Domain ────────────────────────────────────────────────────────────
export enum EventDomain {
  GEOPOLITICAL = 'geopolitical',
  FINANCIAL = 'financial',
  REGULATORY = 'regulatory',
  CYBER = 'cyber',
  SUPPLY_CHAIN = 'supply_chain',
  NARRATIVE = 'narrative',
  MULTI_DOMAIN = 'multi_domain',
}

// ─── Event Classification ─────────────────────────────────────────────────────
export enum EventClassification {
  FACT_CONFIRMED = 'fact_confirmed',
  RUMOR = 'rumor',
  ANALYSIS = 'analysis',
  OPINION = 'opinion',
  PROPAGANDA = 'propaganda',
  OFFICIAL_STATEMENT = 'official_statement',
  TECHNICAL_ADVISORY = 'technical_advisory',
  DERIVED_INFERENCE = 'derived_inference',
}

// ─── Event Status ─────────────────────────────────────────────────────────────
export enum EventStatus {
  EMERGING = 'emerging',
  DEVELOPING = 'developing',
  CONFIRMED = 'confirmed',
  ESCALATING = 'escalating',
  RESOLVED = 'resolved',
}

// ─── Source Category ──────────────────────────────────────────────────────────
export enum SourceCategory {
  INTERNATIONAL_MEDIA = 'international_media',
  LOCAL_REGIONAL_MEDIA = 'local_regional_media',
  GOVERNMENT_OFFICIAL = 'government_official',
  REGULATORS = 'regulators',
  PARLIAMENTS = 'parliaments',
  CENTRAL_BANKS = 'central_banks',
  THINK_TANKS = 'think_tanks',
  CERTS_CSIRTS = 'certs_csirts',
  TECHNICAL_ADVISORIES = 'technical_advisories',
  FINANCIAL_DATA = 'financial_data',
  MULTILATERAL_ORGANIZATIONS = 'multilateral_organizations',
  SANCTIONS_LISTS = 'sanctions_lists',
  PUBLIC_OBSERVATORIES = 'public_observatories',
  LEGAL_DATABASES = 'legal_databases',
  SPECIALIZED_REPORTS = 'specialized_reports',
}

// ─── Collection Method ────────────────────────────────────────────────────────
export enum CollectionMethod {
  REST_API = 'rest_api',
  RSS_ATOM = 'rss_atom',
  WEB_CRAWLER = 'web_crawler',
  PDF_INGESTION = 'pdf_ingestion',
  STRUCTURED_FEED = 'structured_feed',
  MANUAL_UPLOAD = 'manual_upload',
  URL_WATCHLIST = 'url_watchlist',
}

// ─── Correlation Type ─────────────────────────────────────────────────────────
export enum CorrelationType {
  TEMPORAL = 'temporal',
  GEOGRAPHIC = 'geographic',
  ENTITY_BASED = 'entity_based',
  THEMATIC = 'thematic',
  HISTORICAL_PATTERN = 'historical_pattern',
  RULE_BASED = 'rule_based',
  PROBABILISTIC = 'probabilistic',
  AI_ASSISTED = 'ai_assisted',
}

// ─── Alert Type ───────────────────────────────────────────────────────────────
export enum AlertType {
  REAL_TIME_EVENT = 'real_time_event',
  THRESHOLD = 'threshold',
  SIGNAL_COMBINATION = 'signal_combination',
  WATCHLIST = 'watchlist',
  COUNTRY = 'country',
  ENTITY = 'entity',
  SECTOR = 'sector',
  THEME = 'theme',
  ESCALATION = 'escalation',
  NARRATIVE_SHIFT = 'narrative_shift',
}

// ─── Alert Severity ───────────────────────────────────────────────────────────
export enum AlertSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ─── Alert Status ─────────────────────────────────────────────────────────────
export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  DISMISSED = 'dismissed',
}

// ─── Case Status ──────────────────────────────────────────────────────────────
export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

// ─── Report Type ──────────────────────────────────────────────────────────────
export enum ReportType {
  FLASH_ALERT = 'flash_alert',
  DAILY_BRIEF = 'daily_brief',
  WEEKLY_STRATEGIC = 'weekly_strategic',
  REGULATORY_BULLETIN = 'regulatory_bulletin',
  CYBER_THREAT_BULLETIN = 'cyber_threat_bulletin',
  COUNTRY_RISK_DOSSIER = 'country_risk_dossier',
  SECTOR_RISK_DOSSIER = 'sector_risk_dossier',
  EXECUTIVE_MEMO = 'executive_memo',
  CRISIS_ESCALATION = 'crisis_escalation',
  COMPARATIVE_NARRATIVE = 'comparative_narrative',
  SPECIAL_REPORT = 'special_report',
}

// ─── User Role ────────────────────────────────────────────────────────────────
export enum UserRole {
  ADMIN = 'admin',
  DIRECTOR = 'director',
  SENIOR_ANALYST = 'senior_analyst',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  API_CONSUMER = 'api_consumer',
}

// ─── Entity Type ──────────────────────────────────────────────────────────────
export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  COUNTRY = 'country',
  LOCATION = 'location',
  STATE_ACTOR = 'state_actor',
  NON_STATE_ACTOR = 'non_state_actor',
  COMPANY = 'company',
  FINANCIAL_INSTRUMENT = 'financial_instrument',
  CVE = 'cve',
  LEGISLATION = 'legislation',
}

// ─── Watchlist Type ───────────────────────────────────────────────────────────
export enum WatchlistType {
  COUNTRY = 'country',
  ENTITY = 'entity',
  THEME = 'theme',
  ACTOR = 'actor',
  COMPANY = 'company',
  COMPOUND = 'compound',
}

// ─── Narrative Bloc ───────────────────────────────────────────────────────────
export enum NarrativeBloc {
  WEST_MEDIA = 'WEST_MEDIA',
  RU_STATE = 'RU_STATE',
  CN_STATE = 'CN_STATE',
  MENA_REGIONAL = 'MENA_REGIONAL',
  LATAM_MEDIA = 'LATAM_MEDIA',
  GOV_OFFICIAL = 'GOV_OFFICIAL',
  THINK_TANK = 'THINK_TANK',
  TECH_SCIENTIFIC = 'TECH_SCIENTIFIC',
  INDEPENDENT = 'INDEPENDENT',
}

// ─── Information Classification ───────────────────────────────────────────────
export enum InfoClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

// ─── Pipeline Stage ───────────────────────────────────────────────────────────
export enum PipelineStage {
  COLLECTION = 'collection',
  FORMAT_VALIDATION = 'format_validation',
  CONTENT_EXTRACTION = 'content_extraction',
  CLEANING = 'cleaning',
  BASIC_ENRICHMENT = 'basic_enrichment',
  DEDUPLICATION = 'deduplication',
  LANGUAGE_DETECTION = 'language_detection',
  TRANSLATION = 'translation',
  THEMATIC_CLASSIFICATION = 'thematic_classification',
  ENTITY_EXTRACTION = 'entity_extraction',
  GEOREFERENCING = 'georeferencing',
  TEMPORAL_NORMALIZATION = 'temporal_normalization',
  CREDIBILITY_ASSESSMENT = 'credibility_assessment',
  PRELIMINARY_CORRELATION = 'preliminary_correlation',
  INDEXING = 'indexing',
  STORAGE = 'storage',
  ALERT_GENERATION = 'alert_generation',
  UX_AVAILABILITY = 'ux_availability',
}
