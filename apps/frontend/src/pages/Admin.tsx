import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { Settings, User, Shield, Activity, Database } from 'lucide-react';

export function AdminPage() {
  const { user } = useAuthStore();

  if (user?.role !== 'admin' && user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Shield size={48} className="text-gray-700 mb-4" />
        <p className="text-gray-400 text-lg font-semibold">Access Restricted</p>
        <p className="text-gray-500 text-sm mt-1">Administrator privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-gold-400" />
        <h1 className="text-xl font-bold text-white">Administration</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-white">Tenant Configuration</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Tenant ID</span>
              <span className="text-white font-mono text-xs">{user?.tenantId || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Environment</span>
              <span className="text-white">Production</span>
            </div>
          </div>
        </div>

        {/* Current User */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-white">Current Session</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="text-white capitalize">{user?.role?.toLowerCase() || '—'}</span>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-white">Platform Services</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: 'API Gateway', port: 3000 },
              { name: 'Ingestion Service', port: 3001 },
              { name: 'Correlation Service', port: 3002 },
              { name: 'Alert Service', port: 3003 },
              { name: 'Report Service', port: 3004 },
              { name: 'NLP Service', port: 8000 },
            ].map(svc => (
              <div key={svc.name} className="bg-navy-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-white">{svc.name}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">:{svc.port}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RBAC Info */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-gold-400" />
            <h2 className="text-sm font-semibold text-white">Roles & Permissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-700">
                  <th className="text-left text-gray-400 py-2 pr-4">Role</th>
                  <th className="text-left text-gray-400 py-2 pr-4">Explorer</th>
                  <th className="text-left text-gray-400 py-2 pr-4">Workspace</th>
                  <th className="text-left text-gray-400 py-2 pr-4">Reports</th>
                  <th className="text-left text-gray-400 py-2">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {[
                  { role: 'VIEWER', explorer: '✓', workspace: '—', reports: 'read', admin: '—' },
                  { role: 'ANALYST', explorer: '✓', workspace: '✓', reports: '✓', admin: '—' },
                  { role: 'SENIOR_ANALYST', explorer: '✓', workspace: '✓', reports: '✓', admin: '—' },
                  { role: 'ADMIN', explorer: '✓', workspace: '✓', reports: '✓', admin: '✓' },
                ].map(r => (
                  <tr key={r.role}>
                    <td className="py-2 pr-4 font-mono text-white">{r.role}</td>
                    <td className="py-2 pr-4 text-gray-300">{r.explorer}</td>
                    <td className="py-2 pr-4 text-gray-300">{r.workspace}</td>
                    <td className="py-2 pr-4 text-gray-300">{r.reports}</td>
                    <td className="py-2 text-gray-300">{r.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
