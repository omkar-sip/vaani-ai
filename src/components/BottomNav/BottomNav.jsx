import { useSessionStore } from '../../stores/useSessionStore';
import { useI18n } from '../../hooks/useI18n';
import './BottomNav.css';

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 18.5C4.79 18.5 3 16.71 3 14.5v-5C3 7.29 4.79 5.5 7 5.5h10c2.21 0 4 1.79 4 4v5c0 2.21-1.79 4-4 4H9.8l-3.35 2.2a.5.5 0 0 1-.77-.42V18.5H7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5h8M8 13.5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V8a3.5 3.5 0 1 0-7 0v4a3.5 3.5 0 0 0 3.5 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.5v.5a5.5 5.5 0 0 0 11 0v-.5M12 17.5v3M9 20.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12a8 8 0 1 0 2.34-5.66L4.5 8.17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4.5v3.67h3.67M12 8.5V12l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BottomNav({ onVoice }) {
  const view = useSessionStore((s) => s.view);
  const mode = useSessionStore((s) => s.mode);
  const setView = useSessionStore((s) => s.setView);
  const { t } = useI18n();

  const isComp = mode === 'companion';

  return (
    <div className="bottom-nav">
      <button
        className={`bnav-btn ${view === 'chat' ? 'on' : ''}`}
        onClick={() => setView('chat')}
      >
        <span className="bico"><ChatIcon /></span>
        <span>{t('chat')}</span>
      </button>

      <button
        className={`bnav-btn center-btn ${isComp ? 'comp-mode' : ''}`}
        onClick={onVoice}
      >
        <div className="bnav-center">
          <MicIcon />
        </div>
        <span className="bnav-label">{t('voice')}</span>
      </button>

      <button
        className={`bnav-btn ${view === 'history' ? 'on' : ''}`}
        onClick={() => setView('history')}
      >
        <span className="bico"><HistoryIcon /></span>
        <span>{t('history')}</span>
      </button>
    </div>
  );
}
