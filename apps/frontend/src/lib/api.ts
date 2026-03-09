import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinela_token');
  const tenantId = localStorage.getItem('sentinela_tenant') || 'default';
  const userId = localStorage.getItem('sentinela_user_id') || 'system';
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  config.headers['x-tenant-id'] = tenantId;
  config.headers['x-user-id'] = userId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sentinela_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const eventsApi = {
  search: (params: Record<string, unknown>) =>
    api.get('/events', { params }).then((r) => r.data),
  findOne: (id: string) => api.get(`/events/${id}`).then((r) => r.data),
  findRelated: (id: string) => api.get(`/events/${id}/related`).then((r) => r.data),
};

export const dashboardApi = {
  overview: () => api.get('/executive/dashboard').then((r) => r.data),
  topRisks: (limit?: number) =>
    api.get('/executive/dashboard/top-risks', { params: { limit } }).then((r) => r.data),
  heatmap: () => api.get('/executive/dashboard/heatmap').then((r) => r.data),
  dailyBrief: () => api.get('/executive/dashboard/daily-brief').then((r) => r.data),
  crisisStatus: () => api.get('/executive/crisis-room').then((r) => r.data),
};

export const alertsApi = {
  findAll: (params?: Record<string, unknown>) =>
    api.get('/alerts', { params }).then((r) => r.data),
  findOne: (id: string) => api.get(`/alerts/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    api.put(`/alerts/${id}/status`, { status }).then((r) => r.data),
  getStats: () => api.get('/alerts/stats').then((r) => r.data),
};

export const watchlistsApi = {
  findAll: () => api.get('/watchlists').then((r) => r.data),
  create: (data: unknown) => api.post('/watchlists', data).then((r) => r.data),
  addItem: (id: string, item: unknown) =>
    api.post(`/watchlists/${id}/items`, item).then((r) => r.data),
};

export const correlationsApi = {
  findAll: (params?: Record<string, unknown>) =>
    api.get('/correlations', { params }).then((r) => r.data),
  getStats: () => api.get('/correlations/stats').then((r) => r.data),
};

export const scoringApi = {
  getCountryScoreboard: () => api.get('/scoring/country-scoreboard').then((r) => r.data),
  getEventScores: (eventId: string) =>
    api.get(`/scoring/event/${eventId}`).then((r) => r.data),
  explainScore: (eventId: string) =>
    api.get(`/scoring/event/${eventId}/explain`).then((r) => r.data),
};

export const workspaceApi = {
  cases: {
    findAll: (params?: Record<string, unknown>) =>
      api.get('/workspace/cases', { params }).then((r) => r.data),
    findOne: (id: string) => api.get(`/workspace/cases/${id}`).then((r) => r.data),
    create: (data: unknown) => api.post('/workspace/cases', data).then((r) => r.data),
    update: (id: string, data: unknown) =>
      api.put(`/workspace/cases/${id}`, data).then((r) => r.data),
    addEvent: (id: string, eventId: string) =>
      api.post(`/workspace/cases/${id}/events`, { eventId }).then((r) => r.data),
    addNote: (id: string, content: string, isAnalytical?: boolean) =>
      api.post(`/workspace/cases/${id}/notes`, { content, isAnalytical }).then((r) => r.data),
  },
  search: (params: Record<string, unknown>) =>
    api.get('/workspace/search', { params }).then((r) => r.data),
  entityPivot: (name: string) =>
    api.get(`/workspace/search/entity/${encodeURIComponent(name)}`).then((r) => r.data),
  collections: {
    findAll: () => api.get('/workspace/collections').then((r) => r.data),
    create: (data: unknown) => api.post('/workspace/collections', data).then((r) => r.data),
    addEvent: (id: string, eventId: string) =>
      api.post(`/workspace/collections/${id}/events`, { eventId }).then((r) => r.data),
  },
};

export const narrativeApi = {
  findAll: () => api.get('/narrative').then((r) => r.data),
  highDivergence: (minIndex?: number) =>
    api.get('/narrative/high-divergence', { params: { minIndex } }).then((r) => r.data),
  findByEvent: (eventId: string) =>
    api.get(`/narrative/event/${eventId}`).then((r) => r.data),
  analyze: (eventId: string) =>
    api.post(`/narrative/event/${eventId}/analyze`).then((r) => r.data),
};

export const reportsApi = {
  findAll: (params?: Record<string, unknown>) =>
    api.get('/reports', { params }).then((r) => r.data),
  findOne: (id: string) => api.get(`/reports/${id}`).then((r) => r.data),
  generate: (data: unknown) => api.post('/reports', data).then((r) => r.data),
  download: (id: string) => api.get(`/reports/${id}/download`).then((r) => r.data),
  approve: (id: string) => api.put(`/reports/${id}/approve`).then((r) => r.data),
  publish: (id: string) => api.put(`/reports/${id}/publish`).then((r) => r.data),
};

export const sourcesApi = {
  findAll: (params?: Record<string, unknown>) =>
    api.get('/sources', { params }).then((r) => r.data),
  findOne: (id: string) => api.get(`/sources/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/sources', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/sources/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/sources/${id}`).then((r) => r.data),
};
