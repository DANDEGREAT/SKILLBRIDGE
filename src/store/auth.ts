import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../lib/types';
import { login as apiLogin, register as apiRegister } from '../lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (phone, password) => {
        set({ isLoading: true, error: null });
        try {
          const user = await apiLogin(phone, password);
          if (!user) {
            set({ error: 'Incorrect phone or password', isLoading: false });
            return false;
          }
          if (!user.is_active) {
            set({ error: 'Account suspended. Contact support.', isLoading: false });
            return false;
          }
          set({ user, isLoading: false, error: null });
          return true;
        } catch {
          set({ error: 'Connection error. Try again.', isLoading: false });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = await apiRegister(data);
          if (!user) {
            set({ error: 'Registration failed. Phone may already be in use.', isLoading: false });
            return false;
          }
          set({ user, isLoading: false, error: null });
          return true;
        } catch {
          set({ error: 'Connection error. Try again.', isLoading: false });
          return false;
        }
      },

      logout: () => set({ user: null, error: null }),

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'skillbridge-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
