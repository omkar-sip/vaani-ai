import { useSessionStore } from '../stores/useSessionStore';

export default function Dashboard() {
  const allSessions = useSessionStore((s) => s.allSessions);
  const totalTurns = useSessionStore((s) => s.totalTurns);
  const totalFields = useSessionStore((s) => s.totalFields);
  const langStats = useSessionStore((s) => s.langStats);

  const tot = Object.values(langStats).reduce((a, b) => a + b, 0) || 1;
  const langs = [
    { key: 'kn', label: 'Kannada', c: 'var(--sun)' },
    { key: 'hi', label: 'Hindi',   c: 'var(--teal)' },
    { key: 'en', label: 'English', c: 'var(--sky)' },
    { key: 'mx', label: 'Mixed',   c: 'var(--leaf)' },
  ];

  return (
    <div className="fview on">
      <div className="vt">📊 Dashboard</div>
      <div className="vs">Analytics from all sessions</div>
      <div className="sgrid">
        <div className="sbig">
          <div className="sn">{allSessions.length}</div>
          <div className="sl">Sessions</div>
        </div>
        <div className="sbig">
          <div className="sn">{totalTurns}</div>
          <div className="sl">Turns</div>
        </div>
        <div className="sbig">
          <div className="sn">{totalFields}</div>
          <div className="sl">Fields</div>
        </div>
        <div className="sbig">
          <div className="sn">94%</div>
          <div className="sl">ASR Accuracy</div>
        </div>
      </div>

      <div className="hcard">
        <div className="hchead">
          <span className="hctitle">Language Usage</span>
        </div>
        <div>
          {langs.map((l) => {
            const p = Math.round(((langStats[l.key] || 0) / tot) * 100);
            return (
              <div className="lbrow" key={l.key}>
                <span className="lbl">{l.label}</span>
                <div className="lbt">
                  <div className="lbf" style={{ width: `${p}%`, background: l.c }} />
                </div>
                <span className="lbp">{p}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
