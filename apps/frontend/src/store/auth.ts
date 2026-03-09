import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        localStorage.setItem('sentinela_token', token);
        localStorage.setItem('sentinela_tenant', user?.tenantId || 'default');
        localStorage.setItem('sentinela_user_id', user?.id || 'system');
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.clear();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    { name: 'sentinela-auth' },
  ),
);
