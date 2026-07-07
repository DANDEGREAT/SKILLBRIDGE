import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-4) }));
    const duration = toast.duration || 4000;
    setTimeout(() => { set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })); }, duration);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
}));
