import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import { ScoreBadge } from '../components/ScoreBadge';
import { DomainBadge } from '../components/DomainBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { AlertTriangle, TrendingUp, Globe, Zap, Activity, Bell } from 'lucide-react';

export function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 60_000,
  });

  const { data: brief } = useQuery({
    queryKey: ['dashboard-brief'],
    queryFn: dashboardApi.getDailyBrief,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 animate-pulse">Loading intelligence dashboard...</div>
      </div>
    );
  }

  const kpis = overview?.kpis || {};
  const topRisks = overview?.topRisks || [];
  const recentAlerts = overview?.recentAlerts || [];
  const heatmap = overview?.countryRiskHeatmap || [];
  const byDomain = overview?.eventsByDomain || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Global Command Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity size={14} className="text-green-500" />
          <span>Live</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Events (24h)', value: kpis.totalEvents24h ?? '—', icon: Globe, color: 'text-blue-400' },
          { label: 'Active Alerts', value: kpis.activeAlerts ?? '—', icon: Bell, color: 'text-red-400' },
          { label: 'Correlations', value: kpis.correlations24h ?? '—', icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Avg Risk Score', value: kpis.avgRiskScore ? `${Math.round(kpis.avgRiskScore * 100)}` : '—', icon: Zap, color: 'text-gold-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Risk Events */}
        <div className="lg:col-span-2 bg-navy-800 rounded-xl border border-navy-700">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-700">
            <AlertTriangle size={16} className="text-red-400" />
            <h2 className="text-sm font-semibold text-white">Top Risk Events</h2>
          </div>
          <div className="divide-y divide-navy-700">
            {topRisks.length === 0 && (
              <p className="text-gray-500 text-sm p-4">No high-risk events detected.</p>
            )}
            {topRisks.slice(0, 8).map((event: any) => (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                <ScoreBadge score={event.impactScore || 0} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{event.headline || event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DomainBadge domain={event.eventDomain || 'UNKNOWN'} />
                    <span className="text-xs text-gray-500">{event.primaryLocation?.countryCode || ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <div className="bg-navy-800 rounded-xl border border-navy-700">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-700">
              <Bell size={16} className="text-gold-400" />
              <h2 className="text-sm font-semibold text-white">Recent Alerts</h2>
            </div>
            <div className="divide-y divide-navy-700">
              {recentAlerts.length === 0 && (
                <p className="text-gray-500 text-sm p-4">No recent alerts.</p>
              )}
              {recentAlerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <SeverityBadge severity={alert.severity} />
                    <span className="text-xs text-gray-500">{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">{alert.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Domain */}
          <div className="bg-navy-800 rounded-xl border border-navy-700">
            <div className="px-4 py-3 border-b border-navy-700">
              <h2 className="text-sm font-semibold text-white">Events by Domain</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(byDomain).map(([domain, count]) => (
                <div key={domain} className="flex items-center justify-between">
                  <DomainBadge domain={domain} />
                  <span className="text-sm font-mono text-gray-300">{String(count)}</span>
                </div>
              ))}
              {Object.keys(byDomain).length === 0 && (
                <p className="text-gray-500 text-sm">No data.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Country Risk Heatmap (text list) */}
      {heatmap.length > 0 && (
        <div className="bg-navy-800 rounded-xl border border-navy-700">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-700">
            <Globe size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Country Risk Ranking</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-navy-700">
            {heatmap.slice(0, 15).map((item: any, i: number) => (
              <div key={item.countryCode} className="bg-navy-800 p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">#{i + 1} {item.countryCode}</div>
                <ScoreBadge score={item.avgScore} />
                <div className="text-xs text-gray-500 mt-1">{item.eventCount} events</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Brief */}
      {brief && (
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Daily Intelligence Brief</h2>
          <div className="space-y-3">
            {(brief.sections || []).map((section: any, i: number) => (
              <div key={i}>
                <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-1">{section.domain}</h3>
                <p className="text-sm text-gray-300">{section.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
