import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../lib/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { DomainBadge } from '../components/DomainBadge';
import { Bell, CheckCircle, Archive, Clock } from 'lucide-react';

const STATUS_TABS = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'];

export function AlertsPage() {
  const [status, setStatus] = useState('ACTIVE');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', status],
    queryFn: () => alertsApi.list({ status, limit: 50 }),
    refetchInterval: 30_000,
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts = data?.items || [];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-navy-800 border-b border-navy-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-gold-400" />
          <h1 className="text-lg font-bold text-white">Alert Management</h1>
          {data?.total != null && (
            <span className="ml-auto text-xs bg-navy-700 border border-navy-600 text-gray-300 px-2 py-0.5 rounded-full">
              {data.total} total
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${status === s ? 'bg-gold-500/20 text-gold-400 border border-gold-600' : 'text-gray-400 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {isLoading && <p className="text-gray-500 text-sm">Loading alerts...</p>}
        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500">No {status.toLowerCase()} alerts.</p>
          </div>
        )}

        {alerts.map((alert: any) => (
          <div key={alert.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{alert.alertType}</span>
                  {alert.domain && <DomainBadge domain={alert.domain} />}
                </div>
                <p className="text-sm font-medium text-white">{alert.title}</p>
                {alert.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{alert.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{new Date(alert.triggeredAt).toLocaleString()}</span>
                  {alert.countryCode && <span>· {alert.countryCode}</span>}
                </div>
              </div>

              {status === 'ACTIVE' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => acknowledge.mutate(alert.id)}
                    disabled={acknowledge.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-700 text-blue-400 hover:bg-blue-900/20 transition-colors"
                  >
                    Ack
                  </button>
                  <button
                    onClick={() => resolve.mutate(alert.id)}
                    disabled={resolve.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-green-700 text-green-400 hover:bg-green-900/20 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              )}

              {status === 'ACKNOWLEDGED' && (
                <button
                  onClick={() => resolve.mutate(alert.id)}
                  disabled={resolve.isPending}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-green-700 text-green-400 hover:bg-green-900/20 transition-colors"
                >
                  Resolve
                </button>
              )}

              {(status === 'RESOLVED' || status === 'SUPPRESSED') && (
                <Archive size={16} className="text-gray-600 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
