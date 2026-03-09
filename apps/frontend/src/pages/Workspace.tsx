import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../lib/api';
import { Briefcase, Plus, Loader2, FolderOpen, Clock, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-green-400 bg-green-900/20 border-green-700',
  IN_PROGRESS: 'text-blue-400 bg-blue-900/20 border-blue-700',
  PENDING_REVIEW: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
  CLOSED: 'text-gray-400 bg-gray-900/20 border-gray-700',
  ARCHIVED: 'text-gray-500 bg-gray-900/10 border-gray-800',
};

export function WorkspacePage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', classificationLevel: 'UNCLASSIFIED' });
  const [selected, setSelected] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => workspaceApi.listCases({ limit: 30 }),
  });

  const { data: caseDetail } = useQuery({
    queryKey: ['case', selected],
    queryFn: () => workspaceApi.getCase(selected!),
    enabled: !!selected,
  });

  const create = useMutation({
    mutationFn: workspaceApi.createCase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      setShowNew(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', classificationLevel: 'UNCLASSIFIED' });
    },
  });

  const cases = data?.items || [];

  return (
    <div className="flex h-full">
      {/* Case List */}
      <div className="w-72 bg-navy-800 border-r border-navy-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-gold-400" />
            <span className="text-sm font-semibold text-white">Cases</span>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="p-1.5 rounded-lg hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && <p className="text-gray-500 text-xs p-2">Loading...</p>}
          {cases.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${selected === c.id ? 'bg-navy-700 border border-navy-600' : 'hover:bg-navy-700/50'}`}
            >
              <p className="text-sm text-white font-medium truncate">{c.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[c.status] || STATUS_COLORS.OPEN}`}>
                  {c.status}
                </span>
                <span className="text-xs text-gray-500">{c._count?.events || 0} events</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Case Detail */}
      <div className="flex-1 overflow-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-500">Select a case to view details</p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm rounded-lg"
            >
              <Plus size={15} />
              Create Case
            </button>
          </div>
        ) : caseDetail ? (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white">{caseDetail.title}</h1>
                  {caseDetail.description && (
                    <p className="text-gray-400 text-sm mt-1">{caseDetail.description}</p>
                  )}
                </div>
                <span className={`shrink-0 text-sm px-2.5 py-1 rounded-lg border ${STATUS_COLORS[caseDetail.status] || STATUS_COLORS.OPEN}`}>
                  {caseDetail.status}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(caseDetail.createdAt).toLocaleDateString()}
                </div>
                {caseDetail.assignees?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    {caseDetail.assignees.length} assignees
                  </div>
                )}
                <span className="bg-navy-700 px-2 py-0.5 rounded">{caseDetail.priority}</span>
              </div>
            </div>

            {/* Events */}
            <div className="bg-navy-800 rounded-xl border border-navy-700">
              <div className="px-4 py-3 border-b border-navy-700">
                <h2 className="text-sm font-semibold text-white">Evidence Events ({caseDetail.events?.length || 0})</h2>
              </div>
              <div className="divide-y divide-navy-700">
                {(caseDetail.events || []).slice(0, 10).map((ce: any) => (
                  <div key={ce.id} className="px-4 py-3">
                    <p className="text-sm text-white">{ce.event?.headline || ce.event?.title || ce.eventId}</p>
                    {ce.relevanceNote && <p className="text-xs text-gray-500 mt-0.5">{ce.relevanceNote}</p>}
                  </div>
                ))}
                {(!caseDetail.events || caseDetail.events.length === 0) && (
                  <p className="text-gray-500 text-sm p-4">No events linked yet.</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-navy-800 rounded-xl border border-navy-700">
              <div className="px-4 py-3 border-b border-navy-700">
                <h2 className="text-sm font-semibold text-white">Notes ({caseDetail.notes?.length || 0})</h2>
              </div>
              <div className="divide-y divide-navy-700">
                {(caseDetail.notes || []).map((note: any) => (
                  <div key={note.id} className="px-4 py-3">
                    <p className="text-sm text-gray-300">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                ))}
                {(!caseDetail.notes || caseDetail.notes.length === 0) && (
                  <p className="text-gray-500 text-sm p-4">No notes yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-gray-500" />
          </div>
        )}
      </div>

      {/* New Case Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">New Investigative Case</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                  placeholder="Case title"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500 resize-none"
                  placeholder="Case description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Classification</label>
                  <select
                    value={form.classificationLevel}
                    onChange={e => setForm(f => ({ ...f, classificationLevel: e.target.value }))}
                    className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2 border border-navy-600 text-gray-300 text-sm rounded-lg">Cancel</button>
              <button
                onClick={() => create.mutate(form)}
                disabled={create.isPending || !form.title}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm rounded-lg disabled:opacity-60"
              >
                {create.isPending && <Loader2 size={14} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
