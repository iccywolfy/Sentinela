import { NarrativeBloc } from './enums';

export interface NarrativeProfile {
  id: string;
  eventId: string;
  divergenceIndex: number; // 0–1
  dominantThemes: string[];
  polarizedTerms: PolarizedTerm[];
  coverageGaps: string[];
  blocProfiles: BlocProfile[];
  temporalEvolution?: NarrativeEvolutionPoint[];
  analyzedAt: string;
  tenantId: string;
}

export interface BlocProfile {
  bloc: NarrativeBloc;
  sourceCount: number;
  dominantFraming: string;
  sentimentScore: number; // -1 to 1
  keyTerms: string[];
  sampleSources: string[];
  coverageIntensity: number; // 0–1
}

export interface PolarizedTerm {
  term: string;
  blocs: NarrativeBloc[];
  polarity: number; // -1 to 1
}

export interface NarrativeEvolutionPoint {
  date: string;
  divergenceIndex: number;
  dominantBloc?: NarrativeBloc;
  eventCount: number;
}

export const BLOC_SOURCES: Record<NarrativeBloc, string[]> = {
  [NarrativeBloc.WEST_MEDIA]: ['Reuters', 'AP', 'BBC', 'CNN', 'NYT', 'The Guardian'],
  [NarrativeBloc.RU_STATE]: ['TASS', 'RIA Novosti', 'RT', 'Sputnik'],
  [NarrativeBloc.CN_STATE]: ['Xinhua', 'CGTN', "People's Daily", 'Global Times'],
  [NarrativeBloc.MENA_REGIONAL]: ['Al Jazeera', 'Al Arabiya', 'TRT World'],
  [NarrativeBloc.LATAM_MEDIA]: ['Folha de São Paulo', 'O Globo', 'Clarín'],
  [NarrativeBloc.GOV_OFFICIAL]: ['State Dept', 'Foreign Ministries'],
  [NarrativeBloc.THINK_TANK]: ['CSIS', 'IISS', 'RAND', 'Brookings', 'Chatham House'],
  [NarrativeBloc.TECH_SCIENTIFIC]: ['CERTs', 'Academic', 'Industry Reports'],
  [NarrativeBloc.INDEPENDENT]: ['Bellingcat', 'OCCRP', 'The Intercept'],
};
