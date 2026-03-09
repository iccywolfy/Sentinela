import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourcesApi } from '../lib/api';
import { Database, Plus, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const METHOD_COLORS: Record<string, string> = {
  RSS_FEED: 'bg-blue-900/40 text-blue-300 border-blue-700',
  REST_API: 'bg-purple-900/40 text-purple-300 border-purple-700',
  WEB_CRAWL: 'bg-teal-900/40 text-teal-300 border-teal-700',
  MANUAL_UPLOAD: 'bg-gray-800 text-gray-300 border-gray-600',
  URL_WATCHLIST: 'bg-amber-900/40 text-amber-300 border-amber-700',
};

export function SourcesPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', url: '', collectionMethod: 'RSS_FEED', sourceCategory: 'NEWS_MEDIA',
    credibilityScore: 0.7, updateFrequencyMinutes: 60,
  });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list({ limit: 50 }),
  });

  const create = useMutation({
    mutationFn: sourcesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      setShowNew(false);
    },
  });

  const trigger = useMutation({
    mutationFn: sourcesApi.triggerCollection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });

  const sources = data?.items || [];

  const statusIcon = (s: string) => {
    if (s === 'ACTIVE') return <CheckCircle size={14} className="text-green-400" />;
    if (s === 'ERROR') return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-navy-800 border-b border-navy-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-gold-400" />
          <h1 className="text-lg font-bold text-white">Data Sources</h1>
          <span className="text-xs text-gray-500">({sources.length})</span>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Source
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading && <p className="text-gray-500 text-sm">Loading sources...</p>}
        <div className="space-y-2">
          {sources.map((source: any) => (
            <div key={source.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4 flex items-center gap-4">
              <div className="shrink-0">{statusIcon(source.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-medium text-white">{source.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded border ${METHOD_COLORS[source.collectionMethod] || ''}`}>
                    {source.collectionMethod?.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{source.url}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span>Credibility: <span className="text-white font-mono">{Math.round((source.credibilityScore || 0) * 100)}%</span></span>
                  {source.metrics?.totalItems && (
                    <span>{source.metrics.totalItems.toLocaleString()} items</span>
                  )}
                  {source.lastCollectedAt && (
                    <span>Last: {new Date(source.lastCollectedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => trigger.mutate(source.id)}
                disabled={trigger.isPending}
                className="shrink-0 p-2 rounded-lg border border-navy-600 text-gray-400 hover:text-white hover:border-navy-500 transition-colors"
                title="Trigger collection"
              >
                <RefreshCw size={14} className={trigger.isPending ? 'animate-spin' : ''} />
              </button>
            </div>
          ))}
          {!isLoading && sources.length === 0 && (
            <div className="text-center py-16">
              <Database size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No sources configured.</p>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Add Data Source</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                  placeholder="Source name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">URL</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                  placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Method</label>
                  <select value={form.collectionMethod} onChange={e => setForm(f => ({ ...f, collectionMethod: e.target.value }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    {['RSS_FEED', 'REST_API', 'WEB_CRAWL', 'MANUAL_UPLOAD'].map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={form.sourceCategory} onChange={e => setForm(f => ({ ...f, sourceCategory: e.target.value }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    {['NEWS_MEDIA', 'GOVERNMENT', 'ACADEMIC', 'THINK_TANK', 'SOCIAL_MEDIA', 'FINANCIAL', 'INTELLIGENCE'].map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Credibility (0–1)</label>
                  <input type="number" min="0" max="1" step="0.05"
                    value={form.credibilityScore}
                    onChange={e => setForm(f => ({ ...f, credibilityScore: parseFloat(e.target.value) }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Freq (min)</label>
                  <input type="number" min="5"
                    value={form.updateFrequencyMinutes}
                    onChange={e => setForm(f => ({ ...f, updateFrequencyMinutes: parseInt(e.target.value) }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 border border-navy-600 text-gray-300 text-sm rounded-lg">Cancel</button>
              <button onClick={() => create.mutate(form)} disabled={create.isPending || !form.name || !form.url}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm rounded-lg disabled:opacity-60">
                {create.isPending && <Loader2 size={14} className="animate-spin" />}
                Add Source
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
