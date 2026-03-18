import { useSessionStore } from '../../stores/useSessionStore';
import './ModeToggle.css';

export default function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  const isComp = mode === 'companion';

  function toggle() {
    setMode(isComp ? 'consultant' : 'companion');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }

  return (
    <div className="mode-strip">
      <span className="mode-strip-label">Mode</span>
      <div
        className={`toggle-track ${isComp ? 'companion' : 'consultant'}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Switch to ${isComp ? 'consultant' : 'companion'} mode`}
      >
        <span className="toggle-option left">Companion</span>
        <span className="toggle-option right">Consultant</span>
        <div className="toggle-thumb">
          <span className="toggle-thumb-dot" />
          <span>{isComp ? 'Companion' : 'Consultant'}</span>
        </div>
      </div>
      <div className="mode-desc">
        <strong>{isComp ? 'Companion' : 'Consultant'}</strong>
        {isComp
          ? ' - daily check-ins and wellness tracking'
          : ' - symptom reports and health records'}
      </div>
    </div>
  );
}
