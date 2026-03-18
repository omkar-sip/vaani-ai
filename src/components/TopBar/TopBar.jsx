import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useUserStore } from '../../stores/useUserStore';
import { logOut } from '../../firebase/auth';
import './TopBar.css';

export default function TopBar() {
  const demo = useSessionStore((s) => s.demo);
  const resetForLogout = useSessionStore((s) => s.resetForLogout);
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const [showMenu, setShowMenu] = useState(false);

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
          Health Assistant
        </div>
      </div>

      <div className="topbar-actions">
        <div className={`mbadge ${demo ? 'demo' : 'live'}`}>
          <div className="pulse" />
          <span>{demo ? 'Demo' : 'Live AI'}</span>
        </div>

        <div className="user-menu-wrap">
          <button
            className={`profile-tab ${showMenu ? 'open' : ''}`}
            onClick={() => setShowMenu(!showMenu)}
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <span className="profile-tab-label">Profile</span>
            <span className="user-avatar">{initial}</span>
          </button>

          {showMenu && (
            <>
              <div className="user-menu-backdrop" onClick={() => setShowMenu(false)} />
              <div className="user-menu">
                <div className="user-menu-info">
                  <div className="user-menu-name">{user?.displayName || 'User'}</div>
                  <div className="user-menu-email">{user?.email || ''}</div>
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item logout" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
