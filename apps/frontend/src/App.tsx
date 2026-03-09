import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { ExplorerPage } from './pages/Explorer';
import { WorkspacePage } from './pages/Workspace';
import { AlertsPage } from './pages/Alerts';
import { ReportsPage } from './pages/Reports';
import { NarrativePage } from './pages/Narrative';
import { SourcesPage } from './pages/Sources';
import { AdminPage } from './pages/Admin';
import { LoginPage } from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="explorer" element={<ExplorerPage />} />
          <Route path="workspace/*" element={<WorkspacePage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="narrative" element={<NarrativePage />} />
          <Route path="sources" element={<SourcesPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
