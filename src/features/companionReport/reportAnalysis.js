const DEFAULT_HABITS = [
  { id: 'water', name: 'Drink Water' },
  { id: 'walk', name: 'Daily Walk' },
  { id: 'meds', name: 'Take Medicine' },
  { id: 'sleep', name: 'Sleep on Time' },
  { id: 'food', name: 'Balanced Meals' },
];

const MOOD_META = {
  happy: { emoji: '\u{1F60A}', label: 'Positive', score: 86, note: 'The conversation suggests a mostly positive mood.' },
  steady: { emoji: '\u{1F642}', label: 'Steady', score: 72, note: 'The user sounds generally stable with mild concerns.' },
  neutral: { emoji: '\u{1F610}', label: 'Neutral', score: 58, note: 'The emotional state appears mixed or neutral.' },
  tired: { emoji: '\u{1F634}', label: 'Tired', score: 44, note: 'Low energy or fatigue showed up in the check-in.' },
  low: { emoji: '\u{1F61F}', label: 'Low', score: 34, note: 'The user described feeling low, down, or emotionally strained.' },
  anxious: { emoji: '\u{1F630}', label: 'Anxious', score: 28, note: 'The conversation reflects stress, anxiety, or overwhelm.' },
};

const MOOD_ALIASES = {
  '\u{1F60A}': 'happy',
  '\u{1F642}': 'steady',
  '\u{1F610}': 'neutral',
  '\u{1F634}': 'tired',
  '\u{1F61F}': 'low',
  '\u{1F630}': 'anxious',
  happy: 'happy',
  good: 'happy',
  positive: 'happy',
  calm: 'steady',
  stable: 'steady',
  okay: 'steady',
  ok: 'steady',
  fine: 'steady',
  neutral: 'neutral',
  mixed: 'neutral',
  tired: 'tired',
  exhausted: 'tired',
  low: 'low',
  sad: 'low',
  down: 'low',
  anxious: 'anxious',
  stressed: 'anxious',
  worried: 'anxious',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function truncate(text, max = 160) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 3).trim()}...` : value;
}

function getUserMessages(session) {
  return (session?.messages || [])
    .filter((message) => message?.role === 'user' && String(message.content || '').trim())
    .map((message) => String(message.content).trim());
}

function detectMood(userMessages, companionSnapshot = {}) {
  const snapshotMood = String(companionSnapshot.todayMood || '').trim().toLowerCase();
  if (snapshotMood && MOOD_ALIASES[snapshotMood]) {
    return MOOD_META[MOOD_ALIASES[snapshotMood]];
  }

  const combined = userMessages.join(' ').toLowerCase();
  if (/(anxious|worried|overwhelmed|panic|pressure|stressed|stress)/i.test(combined)) {
    return MOOD_META.anxious;
  }
  if (/(sad|low|down|cry|hopeless|alone|depressed)/i.test(combined)) {
    return MOOD_META.low;
  }
  if (/(tired|exhausted|drained|fatigue|sleepy)/i.test(combined)) {
    return MOOD_META.tired;
  }
  if (/(good|better|happy|fine|calm|relaxed|okay|ok)/i.test(combined)) {
    return MOOD_META.steady;
  }
  return MOOD_META.neutral;
}

function detectSleep(userMessages, companionSnapshot = {}) {
  const combined = userMessages.join(' ').toLowerCase();
  const sleepContext = userMessages.filter((message) => /sleep|slept|rest|bed|insomnia|nap/i.test(message)).join(' ');
  const hoursMatches = [...sleepContext.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/gi)];
  const reportedHours = hoursMatches.length ? Number(hoursMatches[hoursMatches.length - 1][1]) : null;
  const hours = companionSnapshot.sleepAvg ?? reportedHours;

  let quality = 'fair';
  if (/(poor|bad|restless|insomnia|couldn'?t sleep|did not sleep|hard to sleep|woke up)/i.test(combined)) {
    quality = 'poor';
  } else if (/(good sleep|slept well|rested|sound sleep|deep sleep)/i.test(combined)) {
    quality = 'good';
  }

  if (hours != null) {
    if (hours < 6) quality = 'poor';
    else if (hours >= 7 && hours <= 9 && quality === 'fair') quality = 'good';
  }

  const scoreBase = hours == null ? (quality === 'good' ? 78 : quality === 'poor' ? 38 : 60) : Math.round((clamp(hours, 3, 9) / 9) * 100);
  const score = quality === 'poor' ? Math.min(scoreBase, 45) : quality === 'good' ? Math.max(scoreBase, 74) : clamp(scoreBase, 50, 72);
  const hoursLabel = hours != null ? `${Number(hours).toFixed(hours % 1 === 0 ? 0 : 1)} hours` : 'Sleep duration not clearly stated';

  let note = `Sleep looks ${quality}. ${hoursLabel}.`;
  if (quality === 'poor') {
    note = `Sleep needs attention. ${hoursLabel}. The user mentioned poor or interrupted rest.`;
  } else if (quality === 'good') {
    note = `Sleep is a relative strength right now. ${hoursLabel}.`;
  }

  return { hours, quality, score, note };
}

function detectStress(userMessages, companionSnapshot = {}) {
  const combined = userMessages.join(' ').toLowerCase();
  let percent = companionSnapshot.stressLevel;

  if (percent == null) {
    if (/(very stressed|overwhelmed|panic|anxious|too much|cannot cope|under pressure|stress)/i.test(combined)) {
      percent = 76;
    } else if (/(little stressed|some stress|busy|worried|tense)/i.test(combined)) {
      percent = 56;
    } else if (/(calm|manageable|relaxed|not stressed)/i.test(combined)) {
      percent = 24;
    } else {
      percent = 48;
    }
  }

  const level = percent > 65 ? 'high' : percent > 38 ? 'moderate' : 'low';
  let note = `Stress appears ${level}.`;
  if (level === 'high') {
    note = 'Stress appears elevated and should be addressed with a daily reset routine.';
  } else if (level === 'low') {
    note = 'Stress appears reasonably controlled in this conversation.';
  }

  return { percent, level, score: 100 - clamp(percent, 0, 100), note };
}

function inferHabitStatus(id, combined) {
  const configs = {
    water: {
      positive: /(drank water|enough water|staying hydrated|hydrated|water bottle|had water)/i,
      negative: /(no water|less water|dehydrated|forgot water|not enough water)/i,
    },
    walk: {
      positive: /(walk|walking|exercise|yoga|steps|stretch)/i,
      negative: /(no walk|did not walk|didn't walk|skipped exercise|inactive)/i,
    },
    meds: {
      positive: /(took my medicine|took medicine|took my meds|medication on time|tablet on time)/i,
      negative: /(forgot my medication|missed my medicine|missed my meds|did not take medicine|skipped medication)/i,
    },
    sleep: {
      positive: /(slept on time|bed on time|kept a routine|good sleep)/i,
      negative: /(slept late|late night|poor sleep|restless|did not sleep well)/i,
    },
    food: {
      positive: /(balanced meal|healthy meal|ate properly|had breakfast|had lunch|had dinner|regular meals)/i,
      negative: /(skipped meal|did not eat|no appetite|junk food|missed breakfast|missed lunch|missed dinner)/i,
    },
  };

  const config = configs[id];
  if (!config) return 'unknown';
  if (config.negative.test(combined)) return 'missed';
  if (config.positive.test(combined)) return 'done';
  return 'unknown';
}

function detectHabits(userMessages, companionSnapshot = {}) {
  const combined = userMessages.join(' ');
  const snapshotHabits = Array.isArray(companionSnapshot.habits) ? companionSnapshot.habits : [];
  const habits = DEFAULT_HABITS.map((habit) => {
    const snapshotMatch = snapshotHabits.find((item) => item.id === habit.id);
    const status = snapshotMatch
      ? snapshotMatch.done
        ? 'done'
        : snapshotMatch.streak > 0
          ? 'partial'
          : 'missed'
      : inferHabitStatus(habit.id, combined);

    let note = 'Not discussed clearly in this session.';
    if (status === 'done') note = 'This habit was positively mentioned in the conversation.';
    if (status === 'missed') note = 'This habit appears inconsistent or missed.';
    if (status === 'partial') note = 'This habit is present but may still need consistency.';

    return {
      ...habit,
      status,
      streak: snapshotMatch?.streak || 0,
      note,
    };
  });

  const doneCount = habits.filter((habit) => habit.status === 'done').length;
  const score = Math.round((doneCount / habits.length) * 100);
  return { habits, doneCount, score };
}

function detectDistress(userMessages, companionSnapshot = {}) {
  if (companionSnapshot.distressDetected) return true;
  const combined = userMessages.join(' ').toLowerCase();
  return /(hopeless|want to die|suicidal|cannot go on|end it all|very low|crying all day)/i.test(combined);
}

function buildStrengths({ mood, sleep, stress, habits }) {
  const items = [];
  if (mood.label === 'Positive' || mood.label === 'Steady') {
    items.push(`Mood looks ${mood.label.toLowerCase()}, which supports recovery and routine building.`);
  }
  if (sleep.quality === 'good') {
    items.push('Sleep appears reasonably supportive right now.');
  }
  if (stress.level === 'low') {
    items.push('Stress signals are currently under better control.');
  }
  habits.habits
    .filter((habit) => habit.status === 'done')
    .slice(0, 2)
    .forEach((habit) => items.push(`${habit.name} is already showing up as a useful habit.`));
  return unique(items);
}

function buildImprovementSteps({ mood, sleep, stress, habits, distress }) {
  const steps = [];

  if (sleep.quality === 'poor' || (sleep.hours != null && sleep.hours < 6.5)) {
    steps.push('Set a fixed bedtime for the next 7 days and avoid screens for 30 minutes before sleep.');
  }
  if (stress.level === 'high') {
    steps.push('Schedule two short reset breaks daily for slow breathing, stretching, or a quiet walk.');
  } else if (stress.level === 'moderate') {
    steps.push('Add one small stress reset habit each day, such as 5 minutes of breathing or journaling.');
  }
  if (mood.label === 'Low' || mood.label === 'Anxious') {
    steps.push('Check in with one trusted person this week and avoid staying isolated when mood dips.');
  }
  if (habits.habits.some((habit) => habit.id === 'water' && habit.status !== 'done')) {
    steps.push('Keep a water bottle nearby and aim for steady hydration through the day.');
  }
  if (habits.habits.some((habit) => habit.id === 'meds' && habit.status === 'missed')) {
    steps.push('Use a phone reminder or pill box so medicine timing is easier to follow consistently.');
  }
  if (habits.habits.some((habit) => habit.id === 'food' && habit.status !== 'done')) {
    steps.push('Try not to skip meals; plan one simple balanced meal with protein, fiber, and fluids.');
  }
  if (distress) {
    steps.push('Please seek immediate emotional support from a trusted person or a mental-health professional today.');
  }

  if (!steps.length) {
    steps.push('Maintain your current routines and continue daily check-ins to keep progress visible.');
  }

  return unique(steps).slice(0, 5);
}

function buildPersonalizedTips({ mood, sleep, stress, habits }) {
  const tips = [];

  if (sleep.quality === 'poor') {
    tips.push('A wind-down alarm 45 minutes before bed can help reduce late-night alertness.');
  }
  if (stress.level !== 'low') {
    tips.push('Pair breathing practice with an existing habit like tea time or evening prayer to make it stick.');
  }
  if (habits.habits.some((habit) => habit.id === 'walk' && habit.status === 'done')) {
    tips.push('Keep the walking habit by attaching it to the same time each day, even if it is only 10 minutes.');
  } else {
    tips.push('Start with a short 10-minute walk after a meal instead of aiming for a full workout immediately.');
  }
  if (habits.habits.some((habit) => habit.id === 'meds' && habit.status === 'missed')) {
    tips.push('Place medication near a routine cue like brushing teeth or breakfast to reduce missed doses.');
  }
  if (mood.label === 'Low' || mood.label === 'Anxious') {
    tips.push('Note one mood trigger and one helpful activity each day to spot patterns early.');
  }

  return unique(tips).slice(0, 4);
}

function buildFollowUp({ distress, sleep, stress, mood }) {
  const items = [];
  if (distress) {
    items.push('Urgent support is recommended if emotional distress feels unsafe or keeps worsening.');
  }
  if (sleep.quality === 'poor') {
    items.push('Seek medical advice if poor sleep continues for more than 1 to 2 weeks.');
  }
  if (stress.level === 'high' || mood.label === 'Low' || mood.label === 'Anxious') {
    items.push('Consider a clinical or counseling follow-up if mood or stress interferes with daily functioning.');
  }
  items.push('This report supports self-management but does not replace professional medical care.');
  return unique(items);
}

function buildOverallStatus({ distress, sleep, stress, mood }) {
  if (distress) return 'Needs urgent support';
  if (stress.level === 'high' || sleep.quality === 'poor' || mood.label === 'Low') return 'Needs attention';
  if (stress.level === 'moderate' || mood.label === 'Anxious') return 'Monitor and improve';
  return 'Stable with healthy momentum';
}

export function buildCompanionHealthReport({ session, companionSnapshot = {}, generatedAt = new Date().toISOString() }) {
  const userMessages = getUserMessages(session);
  const mood = detectMood(userMessages, companionSnapshot);
  const sleep = detectSleep(userMessages, companionSnapshot);
  const stress = detectStress(userMessages, companionSnapshot);
  const habits = detectHabits(userMessages, companionSnapshot);
  const distress = detectDistress(userMessages, companionSnapshot);

  const score =
    typeof companionSnapshot.weeklyScore === 'number'
      ? companionSnapshot.weeklyScore
      : Math.round((mood.score + sleep.score + stress.score + habits.score) / 4);

  const keyFindings = unique([
    mood.note,
    sleep.note,
    stress.note,
    habits.doneCount
      ? `${habits.doneCount} of ${habits.habits.length} tracked lifestyle habits were positively mentioned.`
      : 'Very few healthy routines were clearly confirmed in the conversation.',
  ]);

  const strengths = buildStrengths({ mood, sleep, stress, habits });
  const improvementSteps = buildImprovementSteps({ mood, sleep, stress, habits, distress });
  const personalizedTips = buildPersonalizedTips({ mood, sleep, stress, habits });
  const followUp = buildFollowUp({ distress, sleep, stress, mood });
  const overallStatus = buildOverallStatus({ distress, sleep, stress, mood });
  const conversationHighlights = userMessages.slice(-3).map((message) => truncate(message));

  const overview = distress
    ? 'This companion session suggests the user needs timely emotional support, routine stabilization, and close follow-up.'
    : `This companion session shows ${overallStatus.toLowerCase()} with the biggest opportunities around ${unique([
        sleep.quality === 'poor' ? 'sleep' : '',
        stress.level !== 'low' ? 'stress management' : '',
        habits.doneCount < 3 ? 'daily routines' : '',
      ]).join(', ') || 'routine maintenance'}.`;

  return {
    title: session?.title || 'Daily Check-in',
    generatedAt,
    overallStatus,
    overview,
    wellnessScore: clamp(score, 0, 100),
    mood,
    sleep,
    stress,
    habits: habits.habits,
    habitsDone: habits.doneCount,
    habitsTotal: habits.habits.length,
    keyFindings,
    strengths,
    improvementSteps,
    personalizedTips,
    followUp,
    conversationHighlights,
    disclaimer: 'This report is AI-assisted and should not replace advice from a qualified healthcare professional.',
  };
}
