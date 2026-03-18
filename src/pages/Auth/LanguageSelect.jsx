import { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import './AuthPages.css';

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada',  native: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்' },
  { code: 'te', label: 'Telugu',   native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi',  native: 'मराठी' },
];

export default function LanguageSelect() {
  const [selected, setSelected] = useState('en');
  const setAuthStep = useUserStore((s) => s.setAuthStep);
  const setProfile = useUserStore((s) => s.setProfile);

  function handleContinue() {
    setProfile({ language: selected });
    setAuthStep('auth');
  }

  return (
    <div className="auth-page">
      {/* Left panel — brand */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">🎙️</div>
          <h1 className="auth-brand-name">VaaniAI</h1>
          <p className="auth-brand-tagline">वाणी AI</p>
          <p className="auth-brand-sub">
            Your Voice. Your Health.<br />
            India's Multilingual Health Assistant.
          </p>
        </div>
      </div>

      {/* Right panel — language select */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-card-title">Select Your Language</h2>
          <p className="auth-card-sub">Choose your preferred language to continue</p>

          <div className="lang-grid">
            {LANGUAGES.map((lang) => (
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
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
