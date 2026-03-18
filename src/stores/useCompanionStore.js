import { create } from 'zustand';

export const useCompanionStore = create((set) => ({
  // All values start empty/null — no fake data
  weeklyScore: null,
  stressLevel: null,
  sleepAvg: null,
  todayMood: null,
  habits: [
    { id: 'water', icon: '💧', name: 'Drink Water',    streak: 0, done: false },
    { id: 'walk',  icon: '🚶', name: 'Daily Walk',     streak: 0, done: false },
    { id: 'meds',  icon: '💊', name: 'Take Medicine',  streak: 0, done: false },
    { id: 'sleep', icon: '🌙', name: 'Sleep on Time',  streak: 0, done: false },
    { id: 'food',  icon: '🥗', name: 'Balanced Meals', streak: 0, done: false },
  ],
  scoreBreakdown: [
    { name: 'Sleep',    val: 0, color: 'var(--purple)' },
    { name: 'Activity', val: 0, color: 'var(--leaf)' },
    { name: 'Mood',     val: 0, color: 'var(--sun)' },
    { name: 'Stress',   val: 0, color: 'var(--rose)' },
  ],
  distressDetected: false,

  // Track how many data points we have — card only shows when enough
  dataPointsCollected: 0,
  hasEnoughData: false,

  setMood: (mood) => set({ todayMood: mood }),

  toggleHabit: (id) =>
    set((s) => ({
      habits: s.habits.map((h) =>
        h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : h.streak } : h
      ),
    })),

  /**
   * Apply extracted companion data from AI response JSON.
   * Only updates values that are actually provided (non-empty) by the AI.
   * Tracks data points to determine when enough data is collected to show the card.
   * @param {object} json - { mood, stress_level, sleep_quality, habits_mentioned, distress }
   */
  applyCompanionData: (json) =>
    set((s) => {
      let { stressLevel, sleepAvg, todayMood, habits, distressDetected, dataPointsCollected, scoreBreakdown } = s;
      let newPoints = 0;

      // Only apply mood if actually provided (non-empty emoji)
      if (json.mood && json.mood.trim()) {
        todayMood = json.mood;
        newPoints++;
      }

      // Only apply stress if actually specified
      if (json.stress_level && json.stress_level !== '') {
        const base = stressLevel ?? 50; // start from neutral if first time
        if (json.stress_level === 'high')   stressLevel = Math.min(90, base + 18);
        else if (json.stress_level === 'low')    stressLevel = Math.max(10, base - 15);
        else if (json.stress_level === 'medium') stressLevel = Math.min(65, Math.max(30, base));
        newPoints++;
      }

      // Only apply sleep if actually specified
      if (json.sleep_quality && json.sleep_quality !== '') {
        const base = sleepAvg ?? 7; // start from neutral if first time
        if (json.sleep_quality === 'poor') sleepAvg = Math.max(3, base - 0.8);
        else if (json.sleep_quality === 'good') sleepAvg = Math.min(9, base + 0.3);
        else if (json.sleep_quality === 'fair') sleepAvg = base;
        newPoints++;
      }

      // Only apply habits if actually mentioned
      if (json.habits_mentioned?.length > 0) {
        habits = habits.map((h) => {
          const mentioned = json.habits_mentioned.some(
            (m) => h.name.toLowerCase().includes(m.toLowerCase()) || h.id.includes(m.toLowerCase())
          );
          if (mentioned && !h.done) return { ...h, done: true, streak: h.streak + 1 };
          return h;
        });
        newPoints++;
      }

      if (json.distress) distressDetected = true;

      const totalPoints = dataPointsCollected + newPoints;

      // Only calculate scores if we have real data
      const moodScore = todayMood
        ? { '😊': 85, '🙂': 70, '😐': 50, '😟': 35, '😴': 45, '😰': 30, '😢': 25 }[todayMood] ?? 60
        : 0;
      const sleepScore = sleepAvg != null ? Math.round((sleepAvg / 9) * 100) : 0;
      const stressScore = stressLevel != null ? 100 - stressLevel : 0;
      const doneFrac = habits.filter((h) => h.done).length / habits.length;
      const activityScore = Math.round(doneFrac * 100);

      // Update breakdown only for collected data
      scoreBreakdown = [
        { name: 'Sleep',    val: sleepScore,    color: 'var(--purple)' },
        { name: 'Activity', val: activityScore,  color: 'var(--leaf)' },
        { name: 'Mood',     val: moodScore,      color: 'var(--sun)' },
        { name: 'Stress',   val: stressScore,    color: 'var(--rose)' },
      ];

      // Calculate weekly score only from available data
      const available = [
        sleepScore || null,
        activityScore || null,
        moodScore || null,
        stressScore || null,
      ].filter((v) => v != null);
      const weeklyScore = available.length
        ? Math.round(available.reduce((a, b) => a + b, 0) / available.length)
        : null;

      // Need at least 2 real data points before showing the card
      const hasEnoughData = totalPoints >= 2;

      return {
        stressLevel,
        sleepAvg,
        todayMood,
        habits,
        distressDetected,
        weeklyScore,
        scoreBreakdown,
        dataPointsCollected: totalPoints,
        hasEnoughData,
      };
    }),

  triggerDistress: () => set({ distressDetected: true }),
  dismissDistress: () => set({ distressDetected: false }),
}));
