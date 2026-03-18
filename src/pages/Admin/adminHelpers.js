/**
 * Aggregate raw analytics events into dashboard KPIs.
 */

export function computeKPIs(events) {
  const uniqueUsers = new Set();
  const uniqueSessions = new Set();
  let totalMessages = 0;
  let totalDurationMs = 0;
  let durationCount = 0;

  for (const e of events) {
    if (e.userId) uniqueUsers.add(e.userId);
    if (e.sessionId) uniqueSessions.add(e.sessionId);
    if (e.type === 'message_sent') totalMessages++;
    if (e.type === 'session_end' && e.durationMs > 0) {
      totalDurationMs += e.durationMs;
      durationCount++;
    }
  }

  return {
    totalUsers: uniqueUsers.size,
    totalSessions: uniqueSessions.size,
    totalMessages,
    avgSessionTimeMs: durationCount > 0 ? Math.round(totalDurationMs / durationCount) : 0,
  };
}

export function formatDuration(ms) {
  if (!ms) return '0s';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

/**
 * Build a user table from events.
 */
export function buildUserTable(events) {
  const users = {};

  for (const e of events) {
    if (!e.userId) continue;
    if (!users[e.userId]) {
      users[e.userId] = {
        userId: e.userId,
        userName: e.userName || 'Unknown',
        email: e.userEmail || '',
        sessions: new Set(),
        features: new Set(),
        messages: 0,
        lastActive: null,
        totalDurationMs: 0,
        durationCount: 0,
      };
    }
    const u = users[e.userId];
    if (e.userName && e.userName !== 'Unknown') u.userName = e.userName;
    if (e.userEmail) u.email = e.userEmail;
    if (e.sessionId) u.sessions.add(e.sessionId);
    if (e.type === 'message_sent') u.messages++;
    if (e.feature) u.features.add(e.feature);
    if (e.mode) u.features.add(e.mode);
    if (e.type === 'session_end' && e.durationMs > 0) {
      u.totalDurationMs += e.durationMs;
      u.durationCount++;
    }

    const ts = e.timestamp?.toDate ? e.timestamp.toDate() : (e.timestamp ? new Date(e.timestamp) : null);
    if (ts && (!u.lastActive || ts > u.lastActive)) u.lastActive = ts;
  }

  return Object.values(users).map((u) => ({
    ...u,
    sessions: u.sessions.size,
    features: [...u.features].join(', '),
    avgTime: u.durationCount > 0 ? Math.round(u.totalDurationMs / u.durationCount) : 0,
  })).sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
}

/**
 * Count feature usage from events.
 */
export function computeFeatureUsage(events) {
  const counts = { companion: 0, consultant: 0, food_scanner: 0, companion_report: 0, consultant_report: 0 };

  for (const e of events) {
    if (e.type === 'session_start' || e.type === 'message_sent') {
      if (e.mode === 'companion') counts.companion++;
      if (e.mode === 'consultant') counts.consultant++;
    }
    if (e.type === 'feature_used') {
      if (e.feature && counts[e.feature] !== undefined) counts[e.feature]++;
    }
  }

  return counts;
}

/**
 * Compute average session time per mode.
 */
export function computeAvgTimeByMode(events) {
  const modes = {};

  for (const e of events) {
    if (e.type !== 'session_end' || !e.durationMs) continue;
    const m = e.mode || 'unknown';
    if (!modes[m]) modes[m] = { total: 0, count: 0 };
    modes[m].total += e.durationMs;
    modes[m].count++;
  }

  return Object.entries(modes).map(([mode, data]) => ({
    mode,
    avgMs: Math.round(data.total / data.count),
  }));
}

/**
 * Daily active users trend (last 14 days).
 */
export function computeDailyTrend(events) {
  const days = {};

  for (const e of events) {
    if (!e.date || !e.userId) continue;
    if (!days[e.date]) days[e.date] = new Set();
    days[e.date].add(e.userId);
  }

  const sorted = Object.entries(days)
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return sorted.slice(-14);
}

/**
 * Build benefit/outcomes summary.
 */
export function computeBenefitSummary(events) {
  const sessionEndEvents = events.filter((e) => e.type === 'session_end');
  const totalTurns = sessionEndEvents.reduce((sum, e) => sum + (e.turnsCount || 0), 0);
  const companionSessions = sessionEndEvents.filter((e) => e.mode === 'companion').length;
  const consultantSessions = sessionEndEvents.filter((e) => e.mode === 'consultant').length;
  const foodScans = events.filter((e) => e.feature === 'food_scanner').length;
  const reportsGenerated = events.filter((e) => e.feature?.includes('report')).length;

  return {
    totalConversationTurns: totalTurns,
    companionSessionsCompleted: companionSessions,
    consultantSessionsCompleted: consultantSessions,
    foodScansPerformed: foodScans,
    reportsGenerated,
  };
}
