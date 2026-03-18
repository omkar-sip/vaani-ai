import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { getAllEvents } from '../../firebase/analyticsTracker';
import {
  computeKPIs,
  formatDuration,
  buildUserTable,
  computeFeatureUsage,
  computeAvgTimeByMode,
  computeDailyTrend,
  computeBenefitSummary,
} from './adminHelpers';
import { PieChart, BarChart, TrendLineChart } from './AdminCharts';
import './AdminDashboard.css';

const AVATAR_COLORS = ['#F97316', '#0D9488', '#2563EB', '#7C3AED', '#16A34A', '#DC2626', '#D97706'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name || name === 'Unknown') return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function featureTagClass(f) {
  const map = { companion: 'companion', consultant: 'consultant', food_scanner: 'food_scanner', companion_report: 'companion_report', consultant_report: 'consultant_report' };
  return map[f] || 'companion';
}

function featureDisplayName(f) {
  const map = { companion: 'Companion', consultant: 'Consultant', food_scanner: 'Food Scan', companion_report: 'Health Report', consultant_report: 'Consult Report' };
  return map[f] || f;
}

export default function AdminDashboard({ onBack }) {
  const user = useUserStore((s) => s.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  if (!user) {
    return (
      <div className="admin-root">
        <div className="admin-header">
          <div className="admin-header-left">
            <div className="admin-logo">V</div>
            <div><div className="admin-title">Admin Dashboard</div></div>
          </div>
          <button className="admin-back-btn" onClick={onBack}>← Back to App</button>
        </div>
        <div className="admin-denied">
          <div className="admin-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>Please log in to access the admin dashboard.</p>
          <button className="admin-back-btn" onClick={onBack} style={{ marginTop: 16 }}>← Back to App</button>
        </div>
      </div>
    );
  }

  const kpis = computeKPIs(events);
  const userTable = buildUserTable(events);
  const featureUsage = computeFeatureUsage(events);
  const avgByMode = computeAvgTimeByMode(events);
  const dailyTrend = computeDailyTrend(events);
  const benefits = computeBenefitSummary(events);

  const pieData = [
    { label: 'Companion', value: featureUsage.companion },
    { label: 'Consultant', value: featureUsage.consultant },
    { label: 'Food Scanner', value: featureUsage.food_scanner },
    { label: 'Health Report', value: featureUsage.companion_report },
    { label: 'Consult Report', value: featureUsage.consultant_report },
  ].filter((d) => d.value > 0);

  const timeBarData = avgByMode.map((d) => ({
    label: d.mode,
    value: d.avgMs,
    displayValue: formatDuration(d.avgMs),
  }));

  function handleAnalyzeExport() {
    if (!userTable.length) {
      alert('No data to export yet. Use the app to generate analytics.');
      return;
    }
    const header = ['Name', 'Email', 'Sessions', 'Messages', 'Features Used', 'Avg Time', 'Last Active'];
    const rows = userTable.map((u) => [
      u.userName,
      u.email,
      u.sessions,
      u.messages,
      u.features,
      formatDuration(u.avgTime),
      u.lastActive ? u.lastActive.toISOString() : '',
    ]);

    // Add summary section
    const summary = [
      [],
      ['--- ANALYTICS SUMMARY ---'],
      ['Total Users', kpis.totalUsers],
      ['Total Sessions', kpis.totalSessions],
      ['Total Messages', kpis.totalMessages],
      ['Avg Session Time', formatDuration(kpis.avgSessionTimeMs)],
      [],
      ['--- FEATURE USAGE ---'],
      ['Companion Interactions', featureUsage.companion],
      ['Consultant Interactions', featureUsage.consultant],
      ['Food Scans', featureUsage.food_scanner],
      ['Health Reports Downloaded', featureUsage.companion_report],
      ['Consultant Reports Downloaded', featureUsage.consultant_report],
      [],
      ['--- IMPACT ---'],
      ['Total Conversation Turns', benefits.totalConversationTurns],
      ['Companion Sessions Completed', benefits.companionSessionsCompleted],
      ['Consultant Sessions Completed', benefits.consultantSessionsCompleted],
      ['Food Scans Performed', benefits.foodScansPerformed],
      ['Reports Generated', benefits.reportsGenerated],
    ];

    const allRows = [header, ...rows, ...summary];
    const csv = allRows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `VaaniAI_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="admin-root">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">V</div>
          <div>
            <div className="admin-title">VaaniAI Analytics</div>
            <div className="admin-subtitle">User Insights & Usage Dashboard</div>
          </div>
        </div>
        <div className="admin-actions-row">
          <button className="admin-refresh-btn" onClick={fetchEvents} disabled={loading}>
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          <button className="admin-export-btn" onClick={handleAnalyzeExport}>
            📊 Analyze & Export
          </button>
          <button className="admin-back-btn" onClick={onBack}>← Back to App</button>
        </div>
      </div>

      <div className="admin-content">
        {/* Loading */}
        {loading && (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <span style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500 }}>Loading analytics…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="admin-section" style={{ borderColor: '#FECACA' }}>
            <div className="admin-section-header">
              <div className="admin-section-icon" style={{ background: '#FEF2F2' }}>⚠️</div>
              <div className="admin-section-title">Error Loading Data</div>
            </div>
            <p style={{ color: '#DC2626', fontSize: 13, marginTop: 8 }}>{error}</p>
            <button className="admin-refresh-btn" onClick={fetchEvents} style={{ marginTop: 12 }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── KPI Cards ── */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-label">Total Users</div>
                <div className="kpi-value">{kpis.totalUsers}</div>
                <div className="kpi-sub">unique users tracked</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">💬</div>
                <div className="kpi-label">Total Sessions</div>
                <div className="kpi-value">{kpis.totalSessions}</div>
                <div className="kpi-sub">sessions initiated</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">✉️</div>
                <div className="kpi-label">Total Messages</div>
                <div className="kpi-value">{kpis.totalMessages}</div>
                <div className="kpi-sub">conversations exchanged</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">⏱️</div>
                <div className="kpi-label">Avg Session Time</div>
                <div className="kpi-value">{formatDuration(kpis.avgSessionTimeMs)}</div>
                <div className="kpi-sub">per session</div>
              </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="admin-charts-row">
              <div className="admin-section">
                <div className="admin-section-header">
                  <div className="admin-section-icon orange">📊</div>
                  <div className="admin-section-title">Feature Usage</div>
                </div>
                <div className="admin-section-subtitle">How users interact with each feature</div>
                {pieData.length > 0 ? (
                  <PieChart data={pieData} />
                ) : (
                  <div className="admin-empty">No usage data yet — start using the app!</div>
                )}
              </div>

              <div className="admin-section">
                <div className="admin-section-header">
                  <div className="admin-section-icon teal">⏱️</div>
                  <div className="admin-section-title">Avg Time by Mode</div>
                </div>
                <div className="admin-section-subtitle">Average session duration per mode</div>
                {timeBarData.length > 0 ? (
                  <BarChart data={timeBarData} />
                ) : (
                  <div className="admin-empty">No session time data yet</div>
                )}
              </div>
            </div>

            {/* ── Daily Active Users ── */}
            <div className="admin-section">
              <div className="admin-section-header">
                <div className="admin-section-icon green">📈</div>
                <div className="admin-section-title">Daily Active Users</div>
              </div>
              <div className="admin-section-subtitle">Unique users per day (last 14 days)</div>
              <TrendLineChart data={dailyTrend} />
            </div>

            {/* ── User Activity Table ── */}
            <div className="admin-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="admin-section-header">
                    <div className="admin-section-icon blue">👥</div>
                    <div className="admin-section-title">User Activity</div>
                  </div>
                  <div className="admin-section-subtitle">All tracked users and their interactions</div>
                </div>
                <button className="admin-export-btn" onClick={handleAnalyzeExport}>
                  📊 Analyze & Export
                </button>
              </div>

              {userTable.length > 0 ? (
                <div className="user-table-wrap">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Sessions</th>
                        <th>Messages</th>
                        <th>Features Used</th>
                        <th>Avg Time</th>
                        <th>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTable.map((u) => (
                        <tr key={u.userId}>
                          <td>
                            <div className="user-name-cell">
                              <div
                                className="user-avatar"
                                style={{ background: getAvatarColor(u.userName) }}
                              >
                                {getInitials(u.userName)}
                              </div>
                              {u.userName}
                            </div>
                          </td>
                          <td>{u.email || '—'}</td>
                          <td><strong>{u.sessions}</strong></td>
                          <td><strong>{u.messages}</strong></td>
                          <td>
                            {u.features.split(', ').filter(Boolean).map((f) => (
                              <span className={`feature-tag ${featureTagClass(f)}`} key={f}>
                                {featureDisplayName(f)}
                              </span>
                            ))}
                          </td>
                          <td>{formatDuration(u.avgTime)}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>
                            {u.lastActive
                              ? u.lastActive.toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">
                  No user data recorded yet. Users will appear here once they start using VaaniAI.
                </div>
              )}
            </div>

            {/* ── Impact & Benefits ── */}
            <div className="admin-section">
              <div className="admin-section-header">
                <div className="admin-section-icon purple">🎯</div>
                <div className="admin-section-title">Impact & Benefits</div>
              </div>
              <div className="admin-section-subtitle">How users are benefiting from VaaniAI</div>
              <div className="benefit-grid">
                <div className="benefit-item">
                  <div className="benefit-icon">💬</div>
                  <div className="benefit-value">{benefits.totalConversationTurns}</div>
                  <div className="benefit-label">Conversation Turns</div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🫂</div>
                  <div className="benefit-value">{benefits.companionSessionsCompleted}</div>
                  <div className="benefit-label">Companion Sessions</div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🩺</div>
                  <div className="benefit-value">{benefits.consultantSessionsCompleted}</div>
                  <div className="benefit-label">Consultant Sessions</div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🍎</div>
                  <div className="benefit-value">{benefits.foodScansPerformed}</div>
                  <div className="benefit-label">Food Scans</div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📄</div>
                  <div className="benefit-value">{benefits.reportsGenerated}</div>
                  <div className="benefit-label">Reports Generated</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
