import { useSessionStore } from '../../stores/useSessionStore';
import './BottomNav.css';

export default function BottomNav({ onVoice }) {
  const view = useSessionStore((s) => s.view);
  const mode = useSessionStore((s) => s.mode);
  const setView = useSessionStore((s) => s.setView);

  const isComp = mode === 'companion';

  return (
    <div className="bottom-nav">
      <button
        className={`bnav-btn ${view === 'chat' ? 'on' : ''}`}
        onClick={() => setView('chat')}
      >
        <span className="bico">💬</span>
        <span>Chat</span>
      </button>

      <button
        className={`bnav-btn center-btn ${isComp ? 'comp-mode' : ''}`}
        onClick={onVoice}
      >
        <div className="bnav-center">🎙️</div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>Voice</span>
      </button>

      <button
        className={`bnav-btn ${view === 'history' ? 'on' : ''}`}
        onClick={() => setView('history')}
      >
        <span className="bico">📂</span>
        <span>History</span>
      </button>
    </div>
  );
}
