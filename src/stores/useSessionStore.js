import { create } from 'zustand';
import { guessTitle, now } from '../utils/helpers';

function normalizeSession(session) {
  return {
    id: session.id,
    title: session.title || 'Session',
    domain: session.domain || 'companion',
    section: session.section || 'health',
    time: session.time || now(),
    turns: session.turns || 0,
    extractedData: session.extractedData || {},
    messages: session.messages || [],
    foodScans: session.foodScans || [],
    preview: session.preview || '',
    userName: session.userName || '',
    lastUpdatedAt: session.lastUpdatedAt || new Date().toISOString(),
  };
}

function upsertSession(list, updatedSession) {
  return [updatedSession, ...list.filter((session) => session.id !== updatedSession.id)];
}

export const useSessionStore = create((set, get) => {
  function syncSession(updatedSession) {
    return {
      sessions: upsertSession(get().sessions, updatedSession),
      allSessions: upsertSession(get().allSessions, updatedSession),
    };
  }

  function ensureActiveSession(seed = {}) {
    const state = get();
    const existing = state.sessions.find((session) => session.id === state.curSess);
    if (existing) {
      return existing;
    }

    const created = normalizeSession({
      id: seed.id || 's' + Date.now(),
      title: seed.title || (state.mode === 'companion' ? 'Daily Check-in' : 'Consultation'),
      domain: seed.domain || state.mode,
      section: seed.section || state.section,
      extractedData: seed.extractedData,
      messages: seed.messages,
      foodScans: seed.foodScans,
      turns: seed.turns,
      preview: seed.preview,
    });

    set({
      ...syncSession(created),
      curSess: created.id,
      mode: created.domain,
      section: created.section,
      messages: created.messages,
      extracted: created.extractedData,
      turns: created.turns,
    });

    return created;
  }

  function updateActiveSession(updater, seed = {}) {
    const active = ensureActiveSession(seed);
    const updated = normalizeSession(updater(active));
    set({
      ...syncSession(updated),
      curSess: updated.id,
    });
    return updated;
  }

  return {
    mode: 'companion',
    section: 'health',
    messages: [],
    extracted: {},
    turns: 0,
    totalTurns: 0,
    totalFields: 0,
    view: 'chat',
    apiKey: '',
    demo: false,
    sessions: [],
    allSessions: [],
    curSess: null,
    userName: '',
    needsNamePrompt: false,
    langStats: { kn: 0, hi: 0, en: 0, mx: 0 },

    setMode: (mode) =>
      set({
        mode,
        messages: [],
        extracted: {},
        turns: 0,
        curSess: null,
        userName: '',
        needsNamePrompt: true,
        view: 'chat',
      }),

    setSection: (section) => {
      set({ section });
      const state = get();
      if (!state.curSess) return;
      updateActiveSession(
        (session) => ({
          ...session,
          section,
          lastUpdatedAt: new Date().toISOString(),
        }),
        { section }
      );
    },

    setView: (view) => set({ view }),

    addMessage: (message) => {
      const state = get();
      const nextMessages = [...state.messages, message];
      const shouldRename =
        message.role === 'user' &&
        state.messages.length === 0 &&
        !Object.keys(state.extracted).length;
      const nextTitle = shouldRename
        ? guessTitle(message.content, state.mode)
        : undefined;

      const updatedSession = updateActiveSession(
        (session) => ({
          ...session,
          title: nextTitle || session.title,
          domain: state.mode,
          section: state.section,
          messages: nextMessages,
          preview: message.content,
          lastUpdatedAt: new Date().toISOString(),
        }),
        {
          title: nextTitle || (state.mode === 'companion' ? 'Daily Check-in' : 'Consultation'),
          domain: state.mode,
          section: state.section,
        }
      );

      set({
        messages: nextMessages,
        curSess: updatedSession.id,
      });
    },

    setExtracted: (data) => {
      const state = get();
      const nextExtracted = { ...state.extracted, ...data };
      const nextTotalFields = Math.max(
        state.totalFields,
        Object.values(nextExtracted).filter((value) => value && String(value).trim()).length
      );

      updateActiveSession(
        (session) => ({
          ...session,
          domain: state.mode,
          section: state.section,
          extractedData: nextExtracted,
          preview: session.preview || 'Structured record updated',
          lastUpdatedAt: new Date().toISOString(),
        }),
        {
          domain: state.mode,
          section: state.section,
        }
      );

      set({
        extracted: nextExtracted,
        totalFields: nextTotalFields,
      });
    },

    incrementTurns: () => {
      const state = get();
      const nextTurns = state.turns + 1;
      updateActiveSession(
        (session) => ({
          ...session,
          turns: nextTurns,
          lastUpdatedAt: new Date().toISOString(),
        }),
        {
          domain: state.mode,
          section: state.section,
        }
      );

      set({
        turns: nextTurns,
        totalTurns: state.totalTurns + 1,
      });
    },

    setApiKey: (apiKey) => set({ apiKey, demo: false }),
    setDemo: () => set({ demo: true }),

    setUserName: (name) => {
      const state = get();
      set({ userName: name, needsNamePrompt: false });
      if (state.curSess) {
        updateActiveSession(
          (session) => ({
            ...session,
            userName: name,
            lastUpdatedAt: new Date().toISOString(),
          }),
          { userName: name }
        );
      }
    },

    addSession: (session) => {
      const created = normalizeSession({
        ...session,
        section: session.section || get().section,
        domain: session.domain || get().mode,
      });

      set({
        ...syncSession(created),
        curSess: created.id,
        mode: created.domain,
        section: created.section,
        messages: created.messages,
        extracted: created.extractedData,
        turns: created.turns,
        userName: '',
        needsNamePrompt: true,
        view: 'chat',
      });
    },

    setCurSess: (id) => set({ curSess: id }),

    openSession: (id) => {
      const session = [...get().sessions, ...get().allSessions].find((item) => item.id === id);
      if (!session) return;

      set({
        curSess: session.id,
        mode: session.domain,
        section: session.section || 'health',
        messages: session.messages || [],
        extracted: session.extractedData || {},
        turns: session.turns || 0,
        view: 'chat',
      });
    },

    addFoodScan: (scan) => {
      const state = get();
      const scanRecord = {
        id: 'scan-' + Date.now(),
        scannedAt: new Date().toISOString(),
        productName: scan.productName || 'Scanned product',
        riskLevel: scan.riskLevel,
        summary: scan.summary,
        ingredients: scan.ingredients || [],
        actionSteps: scan.actionSteps || [],
      };
      const nextTitle =
        state.messages.length === 0 && !state.extracted?.chief_complaint
          ? `Food Scan: ${scanRecord.productName}`
          : undefined;

      updateActiveSession(
        (session) => ({
          ...session,
          title: nextTitle || session.title,
          domain: state.mode,
          section: state.section,
          foodScans: [scanRecord, ...(session.foodScans || [])],
          preview: `Food scan · ${scanRecord.productName} · ${scanRecord.riskLevel}`,
          lastUpdatedAt: scanRecord.scannedAt,
        }),
        {
          title: nextTitle || 'Food Scan',
          domain: state.mode,
          section: state.section,
        }
      );
    },

    updateLangStat: (lang) =>
      set((state) => ({
        langStats: {
          ...state.langStats,
          [lang]: (state.langStats[lang] || 0) + 1,
        },
      })),

    reset: () =>
      set({
        messages: [],
        extracted: {},
        turns: 0,
        curSess: null,
        userName: '',
        needsNamePrompt: false,
      }),

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
        userName: '',
        needsNamePrompt: false,
        langStats: { kn: 0, hi: 0, en: 0, mx: 0 },
      }),
  };
});
