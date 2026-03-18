import { useSessionStore } from '../../stores/useSessionStore';
import './ModeToggle.css';

export default function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  const isComp = mode === 'companion';

  function toggle() {
    setMode(isComp ? 'consultant' : 'companion');
  }

  return (
    <div className="mode-strip">
      <span className="mode-strip-label">Mode</span>
      <div
        className={`toggle-track ${isComp ? 'companion' : 'consultant'}`}
        onClick={toggle}
      >
        <div className="toggle-thumb">
          {isComp ? '💚 Companion' : '🩺 Consultant'}
        </div>
      </div>
      <div className="mode-desc">
        <strong>{isComp ? 'Companion' : 'Consultant'}</strong>
        {isComp
          ? ' — daily check-ins & wellness tracking'
          : ' — symptom reports & health records'}
      </div>
    </div>
  );
}
