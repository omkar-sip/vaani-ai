import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  mode: 'companion',       // 'companion' | 'consultant'
  section: 'health',       // 'health' | 'finance'
  messages: [],
  extracted: {},
  turns: 0,
  totalTurns: 0,
  totalFields: 0,
  view: 'chat',            // 'chat' | 'history' | 'dashboard'
  apiKey: '',
  demo: false,
  sessions: [],
  allSessions: [],
  curSess: null,
  langStats: { kn: 0, hi: 0, en: 0, mx: 0 },

  setMode: (mode) =>
    set({ mode, messages: [], extracted: {}, turns: 0 }),
  setSection: (section) => set({ section }),
  setView: (view) => set({ view }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  setExtracted: (data) =>
    set((s) => ({
      extracted: { ...s.extracted, ...data },
      totalFields: Math.max(
        s.totalFields,
        Object.values({ ...s.extracted, ...data }).filter(
          (v) => v && String(v).trim()
        ).length
      ),
    })),
  incrementTurns: () =>
    set((s) => ({ turns: s.turns + 1, totalTurns: s.totalTurns + 1 })),
  setApiKey: (apiKey) => set({ apiKey, demo: false }),
  setDemo: () => set({ demo: true }),
  addSession: (sess) =>
    set((s) => ({
      sessions: [sess, ...s.sessions],
      allSessions: [sess, ...s.allSessions],
      curSess: sess.id,
      messages: [],
      extracted: {},
      turns: 0,
    })),
  setCurSess: (id) => set({ curSess: id }),
  updateLangStat: (lang) =>
    set((s) => ({
      langStats: {
        ...s.langStats,
        [lang]: (s.langStats[lang] || 0) + 1,
      },
    })),
  reset: () =>
    set({ messages: [], extracted: {}, turns: 0 }),
  resetForLogout: () =>
    set({
      mode: 'companion',
      section: 'health',
      messages: [],
      extracted: {},
      turns: 0,
      totalTurns: 0,
      totalFields: 0,
      view: 'chat',
      sessions: [],
      allSessions: [],
      curSess: null,
      langStats: { kn: 0, hi: 0, en: 0, mx: 0 },
    }),
}));
