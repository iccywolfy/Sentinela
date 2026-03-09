import { useQuery } from '@tanstack/react-query';
import { narrativeApi } from '../lib/api';
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BLOC_LABELS: Record<string, string> = {
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

export function NarrativePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['narrative-profile'],
    queryFn: narrativeApi.getLatestProfile,
  });

  const { data: divergence } = useQuery({
    queryKey: ['narrative-divergence'],
    queryFn: narrativeApi.getDivergence,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-400 animate-pulse">Analyzing narratives...</p></div>;
  }

  const blocs: any[] = profile?.blocs || [];
  const polarized: any[] = profile?.polarizedTerms || [];
  const gaps: string[] = divergence?.coverageGaps || [];
  const divergenceIndex = divergence?.divergenceIndex ?? profile?.divergenceIndex;

  const sentimentIcon = (s: number) =>
    s > 0.1 ? <TrendingUp size={14} className="text-green-400" /> :
    s < -0.1 ? <TrendingDown size={14} className="text-red-400" /> :
    <Minus size={14} className="text-gray-400" />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-gold-400" />
          <h1 className="text-xl font-bold text-white">Narrative Intelligence</h1>
        </div>
        {divergenceIndex != null && (
          <div className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-gray-400 mb-0.5">Divergence Index</div>
            <div className={`text-2xl font-bold font-mono ${divergenceIndex > 0.7 ? 'text-red-400' : divergenceIndex > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
              {(divergenceIndex * 100).toFixed(0)}
            </div>
          </div>
        )}
      </div>

      {/* Bloc Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocs.map((bloc: any) => (
          <div key={bloc.bloc} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">{BLOC_LABELS[bloc.bloc] || bloc.bloc}</h3>
              <div className="flex items-center gap-1">
                {sentimentIcon(bloc.avgSentiment || 0)}
                <span className="text-xs font-mono text-gray-400">{bloc.avgSentiment != null ? bloc.avgSentiment.toFixed(2) : '—'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Events covered</span>
                <span className="text-white font-mono">{bloc.eventCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sources</span>
                <span className="text-white font-mono">{bloc.sourceCount ?? 0}</span>
              </div>
              {bloc.dominantFraming && (
                <div className="mt-2 pt-2 border-t border-navy-700">
                  <span className="text-gray-500">Dominant framing: </span>
                  <span className="text-gold-400">{bloc.dominantFraming}</span>
                </div>
              )}
            </div>

            {bloc.topTerms?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <p className="text-xs text-gray-500 mb-1.5">Top terms</p>
                <div className="flex flex-wrap gap-1">
                  {bloc.topTerms.slice(0, 5).map((term: string) => (
                    <span key={term} className="text-xs bg-navy-700 text-gray-300 px-2 py-0.5 rounded">{term}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Polarized Terms */}
      {polarized.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-navy-700">
          <div className="px-4 py-3 border-b border-navy-700">
            <h2 className="text-sm font-semibold text-white">Polarized Terms</h2>
            <p className="text-xs text-gray-500 mt-0.5">Terms with highest divergence across blocs</p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {polarized.slice(0, 12).map((term: any) => (
              <div key={term.term} className="bg-navy-700/50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-white">{term.term}</p>
                <div className="mt-1.5 flex items-center justify-center gap-2 text-xs">
                  <span className="text-red-400">{Math.round((term.divergence || 0) * 100)}% div.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Gaps */}
      {gaps.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-amber-800/50 p-4">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Coverage Gaps Detected</h2>
          <div className="flex flex-wrap gap-2">
            {gaps.map((gap: string) => (
              <span key={gap} className="text-xs bg-amber-900/30 border border-amber-800 text-amber-300 px-2 py-1 rounded">
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {blocs.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No narrative profiles available yet.</p>
          <p className="text-gray-600 text-sm mt-1">Narrative profiles are built from ingested events.</p>
        </div>
      )}
    </div>
  );
}
