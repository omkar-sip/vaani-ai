import { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { hasFirebaseConfig } from '../../firebase/config';
import { SUPPORTED_LANGUAGES, translate } from '../../i18n';
import './AuthPages.css';

export default function LanguageSelect() {
  const currentLanguage = useUserStore((s) => s.profile?.language || 'en');
  const setAuthStep = useUserStore((s) => s.setAuthStep);
  const setProfile = useUserStore((s) => s.setProfile);
  const [selected, setSelected] = useState(currentLanguage);
  const t = (key) => translate(selected, key);

  function handleContinue() {
    setProfile({ language: selected });
    setAuthStep(hasFirebaseConfig ? 'auth' : 'ready');
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">V</div>
          <h1 className="auth-brand-name">VaaniAI</h1>
          <p className="auth-brand-tagline">{selected.toUpperCase()}</p>
          <p className="auth-brand-sub">
            {t('yourVoiceHealth')}
            <br />
            {t('multilingualTag')}
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-card-title">{t('selectLanguage')}</h2>
          <p className="auth-card-sub">{t('chooseLanguage')}</p>

          <div className="lang-grid">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                className={`lang-btn ${selected === lang.code ? 'active' : ''}`}
                onClick={() => setSelected(lang.code)}
              >
                <span className="lang-label">{lang.label}</span>
                <span className="lang-native">{lang.native}</span>
              </button>
            ))}
          </div>

          <button className="auth-primary-btn" onClick={handleContinue}>
            {t('getStarted')}
          </button>
        </div>
      </div>
    </div>
  );
}
