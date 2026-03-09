import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import { FileText, Download, Plus, Loader2 } from 'lucide-react';

const REPORT_TYPES = [
  'FLASH_ALERT', 'DAILY_BRIEF', 'WEEKLY_DIGEST', 'COUNTRY_RISK_DOSSIER',
  'ENTITY_PROFILE', 'THREAT_ASSESSMENT', 'INCIDENT_REPORT', 'NARRATIVE_ANALYSIS',
  'CORRELATION_REPORT', 'EXECUTIVE_SUMMARY', 'CUSTOM',
];

export function ReportsPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', reportType: 'FLASH_ALERT', classificationLevel: 'UNCLASSIFIED' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list({ limit: 30 }),
  });

  const generate = useMutation({
    mutationFn: reportsApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      setShowNew(false);
      setForm({ title: '', reportType: 'FLASH_ALERT', classificationLevel: 'UNCLASSIFIED' });
    },
  });

  const reports = data?.items || [];

  const statusColor: Record<string, string> = {
    DRAFT: 'text-gray-400',
    GENERATING: 'text-blue-400',
    READY: 'text-green-400',
    APPROVED: 'text-gold-400',
    PUBLISHED: 'text-emerald-400',
    FAILED: 'text-red-400',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-navy-800 border-b border-navy-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gold-400" />
          <h1 className="text-lg font-bold text-white">Report Studio</h1>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Report
        </button>
      </div>

      {/* New Report Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">Generate Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                  placeholder="Report title"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
                <select
                  value={form.reportType}
                  onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Classification</label>
                <select
                  value={form.classificationLevel}
                  onChange={e => setForm(f => ({ ...f, classificationLevel: e.target.value }))}
                  className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 px-4 py-2 border border-navy-600 text-gray-300 text-sm rounded-lg hover:border-navy-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => generate.mutate(form)}
                disabled={generate.isPending || !form.title}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm rounded-lg transition-colors disabled:opacity-60"
              >
                {generate.isPending && <Loader2 size={14} className="animate-spin" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {isLoading && <p className="text-gray-500 text-sm">Loading reports...</p>}
        <div className="space-y-2">
          {reports.map((report: any) => (
            <div key={report.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4 flex items-center gap-4">
              <FileText size={20} className="text-gold-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{report.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="bg-navy-700 px-2 py-0.5 rounded">{report.reportType?.replace(/_/g, ' ')}</span>
                  <span className={statusColor[report.status] || 'text-gray-400'}>{report.status}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {(report.status === 'READY' || report.status === 'PUBLISHED') && report.pdfUrl && (
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-navy-600 text-gray-300 hover:text-white text-xs rounded-lg transition-colors"
                >
                  <Download size={13} />
                  PDF
                </a>
              )}
              {report.status === 'GENERATING' && (
                <Loader2 size={16} className="animate-spin text-blue-400 shrink-0" />
              )}
            </div>
          ))}
          {!isLoading && reports.length === 0 && (
            <div className="text-center py-16">
              <FileText size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No reports yet. Generate your first report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
