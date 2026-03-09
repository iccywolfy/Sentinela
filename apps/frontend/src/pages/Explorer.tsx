import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../lib/api';
import { ScoreBadge } from '../components/ScoreBadge';
import { DomainBadge } from '../components/DomainBadge';
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const DOMAINS = ['GEOPOLITICAL', 'ECONOMIC', 'MILITARY', 'CYBER', 'HUMANITARIAN', 'ENVIRONMENTAL', 'SOCIAL', 'TECHNOLOGICAL'];

export function ExplorerPage() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [minScore, setMinScore] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['events', query, domain, minScore, page],
    queryFn: () => eventsApi.search({ query, domain: domain || undefined, minScore: minScore ? Number(minScore) / 100 : undefined, page, limit: 20 }),
    keepPreviousData: true,
  });

  const events = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="bg-navy-800 border-b border-navy-700 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search events, entities, locations..."
              className="w-full bg-navy-900 border border-navy-600 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${showFilters ? 'bg-gold-500/10 border-gold-600 text-gold-400' : 'border-navy-600 text-gray-400 hover:border-navy-500'}`}
          >
            <Filter size={15} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-navy-700">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Domain</label>
              <select
                value={domain}
                onChange={e => { setDomain(e.target.value); setPage(1); }}
                className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="">All domains</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Risk Score</label>
              <select
                value={minScore}
                onChange={e => { setMinScore(e.target.value); setPage(1); }}
                className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              >
                <option value="">Any</option>
                <option value="30">30+</option>
                <option value="50">50+</option>
                <option value="70">70+</option>
                <option value="80">80+</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            {isLoading ? 'Searching...' : `${total.toLocaleString()} events found`}
            {isFetching && !isLoading && <span className="ml-2 text-gold-500">Updating...</span>}
          </p>
        </div>

        <div className="space-y-2">
          {events.map((event: any) => (
            <div key={event.id} className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
              <button
                className="w-full text-left px-4 py-3 flex items-start gap-3"
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                <ScoreBadge score={event.impactScore || 0} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium line-clamp-2">{event.headline || event.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <DomainBadge domain={event.eventDomain || 'UNKNOWN'} />
                    {event.primaryLocation?.countryCode && (
                      <span className="text-xs text-gray-500">{event.primaryLocation.countryCode}</span>
                    )}
                    {event.publishedAt && (
                      <span className="text-xs text-gray-500">{new Date(event.publishedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {expanded === event.id ? <ChevronUp size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
              </button>

              {expanded === event.id && (
                <div className="px-4 pb-4 border-t border-navy-700 mt-1 pt-3 space-y-3">
                  {event.summary && <p className="text-sm text-gray-300">{event.summary}</p>}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Credibility:</span>{' '}
                      <span className="text-white font-mono">{event.credibilityScore ? `${Math.round(event.credibilityScore * 100)}%` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Urgency:</span>{' '}
                      <span className="text-white font-mono">{event.urgencyScore ? `${Math.round(event.urgencyScore * 100)}%` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Language:</span>{' '}
                      <span className="text-white">{event.language || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Classification:</span>{' '}
                      <span className="text-white">{event.classificationType || '—'}</span>
                    </div>
                  </div>

                  {event.entities?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Entities</p>
                      <div className="flex flex-wrap gap-1">
                        {event.entities.slice(0, 8).map((e: any) => (
                          <span key={e.id} className="text-xs bg-navy-700 border border-navy-600 text-gray-300 px-2 py-0.5 rounded">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.sourceUrl && (
                    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                      <ExternalLink size={12} /> View Source
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-600 text-gray-300 hover:border-navy-500 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-600 text-gray-300 hover:border-navy-500 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
