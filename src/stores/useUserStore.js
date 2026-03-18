import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,             // Firebase User object
  profile: null,          // { displayName, language, onboardingComplete }
  loading: true,
  authStep: 'loading',    // 'loading' | 'language' | 'auth' | 'verify' | 'ready'

  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),
  setAuthStep: (step) => set({ authStep: step }),
  clearUser: () => set({ user: null, profile: null, loading: false, authStep: 'language' }),
}));
