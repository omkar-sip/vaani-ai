import { useCallback, useEffect, useState } from 'react';
import { useUserStore } from './stores/useUserStore';
import { useSessionStore } from './stores/useSessionStore';
import { onAuthChange } from './firebase/auth';
import { hasFirebaseConfig } from './firebase/config';
import { saveUserToFirestore } from './firebase/firestore';
import { now } from './utils/helpers';

import LanguageSelect from './pages/Auth/LanguageSelect';
import AuthPage from './pages/Auth/AuthPage';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Home from './pages/Home';
import AdminDashboard from './pages/Admin/AdminDashboard';

export default function App() {
  const authStep = useUserStore((s) => s.authStep);
  const setUser = useUserStore((s) => s.setUser);
  const setAuthStep = useUserStore((s) => s.setAuthStep);
  const setApiKey = useSessionStore((s) => s.setApiKey);
  const setDemo = useSessionStore((s) => s.setDemo);
  const setMode = useSessionStore((s) => s.setMode);
  const addSession = useSessionStore((s) => s.addSession);

  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    function onHashChange() {
      setRoute(window.location.hash);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const initSession = useCallback((defaultMode) => {
    const sessionStore = useSessionStore.getState();
    if (sessionStore.sessions.length === 0) {
      setMode(defaultMode);
      addSession({
        id: 's1',
        title: 'Session 1',
        domain: defaultMode,
        time: now(),
        turns: 0,
        extractedData: {},
        messages: [],
      });
    }
  }, [addSession, setMode]);

  useEffect(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.startsWith('AIza')) {
      setApiKey(envKey);
    } else {
      setDemo();
    }

    if (!hasFirebaseConfig) {
      initSession('companion');
      setUser(null);
      setAuthStep('ready');
      return () => {};
    }

    const unsub = onAuthChange((user) => {
      if (user) {
        setUser(user);
        saveUserToFirestore(user).catch((e) => console.error('Firestore user save failed:', e));
        if (user.providerData.some((p) => p.providerId === 'google.com')) {
          initSession('companion');
          setAuthStep('ready');
        } else if (user.emailVerified) {
          initSession('companion');
          setAuthStep('ready');
        } else if (user.email) {
          setAuthStep('verify');
        } else {
          setAuthStep('language');
        }
      } else {
        setAuthStep('language');
      }
    });

    return unsub;
  }, [initSession, setApiKey, setAuthStep, setDemo, setUser]);

  if (authStep === 'loading') {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 40, animation: 'flt 2s ease-in-out infinite' }}>Loading</div>
        <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 14 }}>Loading VaaniAI...</div>
      </div>
    );
  }

  if (authStep === 'language') return <LanguageSelect />;
  if (authStep === 'auth') return <AuthPage />;
  if (authStep === 'verify') return <VerifyEmail />;

  /* Hash-based routing for admin dashboard */
  if (route === '#/admin') {
    return <AdminDashboard onBack={() => { window.location.hash = ''; }} />;
  }

  return <Home />;
}
