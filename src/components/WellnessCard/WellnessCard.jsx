import { useCompanionStore } from '../../stores/useCompanionStore';

export default function WellnessCard() {
  const {
    weeklyScore, todayMood, scoreBreakdown, sleepAvg, stressLevel, habits, hasEnoughData,
  } = useCompanionStore();

  // Don't render at all if there isn't enough real data
  if (!hasEnoughData) return null;

  const done = habits.filter((h) => h.done).length;

  return (
    <div className="companion-card">
      <div className="cc-title">💚 Wellness Snapshot</div>
      <div className="cc-score">
        <div>
          <div className="cc-score-num">{weeklyScore ?? '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Wellness Score</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28 }}>{todayMood || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Today's mood</div>
        </div>
      </div>
      <div className="cc-bars">
        {scoreBreakdown.map((b) => (
          <div className="cc-bar-row" key={b.name}>
            <div className="cc-bar-name">{b.name}</div>
            <div className="cc-bar-bg">
              <div
                className="cc-bar-fill"
                style={{ width: `${b.val}%`, background: b.color }}
              />
            </div>
            <div className="cc-bar-val">{b.val > 0 ? b.val : '—'}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 10, display: 'flex', gap: 12, alignItems: 'center',
          padding: 8, background: 'var(--bg)', borderRadius: 'var(--r)',
        }}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)' }}>
            {sleepAvg != null ? `${sleepAvg}h` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Avg Sleep</div>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              fontSize: 18, fontWeight: 800,
              color: stressLevel != null
                ? (stressLevel > 60 ? 'var(--rose)' : stressLevel > 35 ? 'var(--sun)' : 'var(--leaf)')
                : 'var(--text3)',
            }}
          >
            {stressLevel != null ? `${stressLevel}%` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Stress</div>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--comp-accent)' }}>
            {done}/{habits.length}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Habits</div>
        </div>
      </div>
    </div>
  );
}
