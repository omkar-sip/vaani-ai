import { useSessionStore } from '../../stores/useSessionStore';
import { useUserStore } from '../../stores/useUserStore';
import { useI18n } from '../../hooks/useI18n';
import { trackEvent } from '../../firebase/analyticsTracker';
import './ModeToggle.css';

export default function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);
  const { t } = useI18n();

  const isComp = mode === 'companion';

  function toggle() {
    const nextMode = isComp ? 'consultant' : 'companion';
    const user = useUserStore.getState().user;
    const sess = useSessionStore.getState();
    trackEvent('mode_switch', {
      userId: user?.uid || '',
      userName: sess.userName || '',
      userEmail: user?.email || '',
      fromMode: mode,
      toMode: nextMode,
    });
    setMode(nextMode);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }

  return (
    <div className="mode-strip">
      <span className="mode-strip-label">{t('mode')}</span>
      <div
        className={`toggle-track ${isComp ? 'companion' : 'consultant'}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={isComp ? t('switchToConsultant') : t('switchToCompanion')}
      >
        <span className="toggle-option left">{t('companion')}</span>
        <span className="toggle-option right">{t('consultant')}</span>
        <div className="toggle-thumb">
          <span className="toggle-thumb-dot" />
          <span>{isComp ? t('companion') : t('consultant')}</span>
        </div>
      </div>
      <div className="mode-desc">
        <strong>{isComp ? t('companion') : t('consultant')}</strong>
        {' - '}
        {isComp ? t('companionDesc') : t('consultantDesc')}
      </div>
    </div>
  );
}
