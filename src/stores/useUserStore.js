import { create } from 'zustand';

const PROFILE_STORAGE_KEY = 'vaaniai.profile';

function readStoredProfile() {
  if (typeof window === 'undefined') {
    return { language: 'en' };
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      language: parsed.language || 'en',
      ...parsed,
    };
  } catch {
    return { language: 'en' };
  }
}

function writeStoredProfile(profile) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures and keep the in-memory preference.
  }
}

export const useUserStore = create((set) => ({
  user: null,
  profile: readStoredProfile(),
  loading: true,
  authStep: 'loading',

  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) =>
    set((state) => {
      const nextProfile = {
        ...(state.profile || { language: 'en' }),
        ...(profile || {}),
      };
      writeStoredProfile(nextProfile);
      return { profile: nextProfile };
    }),
  setLanguage: (language) =>
    set((state) => {
      const nextProfile = {
        ...(state.profile || { language: 'en' }),
        language: language || 'en',
      };
      writeStoredProfile(nextProfile);
      return { profile: nextProfile };
    }),
  setAuthStep: (step) => set({ authStep: step }),
  clearUser: () =>
    set((state) => ({
      user: null,
      profile: state.profile || readStoredProfile(),
      loading: false,
      authStep: 'language',
    })),
}));
