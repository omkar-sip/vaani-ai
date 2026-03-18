import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUserStore } from '../../stores/useUserStore';
import { logOut } from '../../firebase/auth';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { useI18n } from '../../hooks/useI18n';
import './TopBar.css';

export default function TopBar() {
  const demo = useSessionStore((s) => s.demo);
  const resetForLogout = useSessionStore((s) => s.resetForLogout);
  const user = useUserStore((s) => s.user);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const clearUser = useUserStore((s) => s.clearUser);
  const [showMenu, setShowMenu] = useState(false);
  const { language, t } = useI18n();

  const initial = user?.displayName?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || 'U';

  async function handleLogout() {
    setShowMenu(false);
    try {
      await logOut();
    } finally {
      resetForLogout();
      clearUser();
    }
  }

  return (
    <div className="topbar">
      <div className="logo-icon">V</div>
      <div className="topbar-brand">
        <div className="logo-name">VaaniAI</div>
        <div className="logo-sub" id="logo-sub">
          {t('healthAssistant')}
        </div>
      </div>

      <div className="topbar-actions">
        <label className="lang-switcher">
          <span className="lang-switcher-label">{t('language')}</span>
          <select
            className="lang-switcher-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={t('language')}
          >
            {SUPPORTED_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className={`mbadge ${demo ? 'demo' : 'live'}`}>
          <div className="pulse" />
          <span>{demo ? t('demo') : t('liveAi')}</span>
        </div>

        <div className="user-menu-wrap">
          <button
            className={`profile-tab ${showMenu ? 'open' : ''}`}
            onClick={() => setShowMenu(!showMenu)}
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <span className="profile-tab-label">{t('profile')}</span>
            <span className="user-avatar">{initial}</span>
          </button>

          {showMenu && (
            <>
              <div className="user-menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="user-menu">
                <div className="user-menu-info">
                  <div className="user-menu-name">{user?.displayName || t('guestUser')}</div>
                  <div className="user-menu-email">{user?.email || ''}</div>
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item logout" onClick={handleLogout}>
                  {t('signOut')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
