import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Search, Briefcase, Bell, FileText,
  MessageSquare, Database, Settings, LogOut, Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/explorer', icon: Search, label: 'Explorer' },
  { to: '/workspace', icon: Briefcase, label: 'Workspace' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/narrative', icon: MessageSquare, label: 'Narrative' },
  { to: '/sources', icon: Database, label: 'Sources' },
  { to: '/admin', icon: Settings, label: 'Admin' },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <aside className="w-16 lg:w-56 bg-navy-800 border-r border-navy-700 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-navy-700">
          <Shield className="text-gold-500 shrink-0" size={22} />
          <span className="ml-3 font-bold text-white hidden lg:block tracking-wider text-sm">SENTINELA</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-navy-700 text-gold-400 font-medium'
                    : 'text-gray-400 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-700">
          <div className="hidden lg:flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-xs font-bold text-navy-900">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-white font-medium truncate">{user?.email || 'Guest'}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role || 'viewer'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:text-red-400 text-sm rounded-lg hover:bg-navy-700 transition-colors"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
