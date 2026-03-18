import { useEffect } from 'react';
import { useUserStore } from './stores/useUserStore';
import { useSessionStore } from './stores/useSessionStore';
import { onAuthChange } from './firebase/auth';
import { saveUserToFirestore } from './firebase/firestore';
import { now } from './utils/helpers';

import LanguageSelect from './pages/Auth/LanguageSelect';
import AuthPage from './pages/Auth/AuthPage';
import VerifyEmail from './pages/Auth/VerifyEmail';
import Home from './pages/Home';

export default function App() {
  const authStep = useUserStore((s) => s.authStep);
  const setUser = useUserStore((s) => s.setUser);
  const setAuthStep = useUserStore((s) => s.setAuthStep);
  const setApiKey = useSessionStore((s) => s.setApiKey);
  const setMode = useSessionStore((s) => s.setMode);
  const addSession = useSessionStore((s) => s.addSession);

  // ─── Listen to Firebase auth state ────────────
  useEffect(() => {
    // Set up Gemini API key from env
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey.startsWith('AIza')) {
      setApiKey(envKey);
    }

    const unsub = onAuthChange((user) => {
      if (user) {
        setUser(user);
        // Save/update user document in Firestore on every login
        saveUserToFirestore(user).catch((e) => console.error('Firestore user save failed:', e));
        if (user.providerData.some((p) => p.providerId === 'google.com')) {
          // Google users are auto-verified
          initSession('companion');
          setAuthStep('ready');
        } else if (user.emailVerified) {
          initSession('companion');
          setAuthStep('ready');
        } else if (user.email) {
          // Email user but not verified
          setAuthStep('verify');
        } else {
          // No user info yet
          setAuthStep('language');
        }
      } else {
        setAuthStep('language');
      }
    });

    return unsub;
  }, []);

  function initSession(defaultMode) {
    const sessionStore = useSessionStore.getState();
    // Only create first session if none exist
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
  }

  // ─── Render based on auth step ────────────────
  if (authStep === 'loading') {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 40, animation: 'flt 2s ease-in-out infinite' }}>🎙️</div>
        <div style={{ fontWeight: 700, color: 'var(--text3)', fontSize: 14 }}>Loading VaaniAI…</div>
      </div>
    );
  }

  if (authStep === 'language') return <LanguageSelect />;
  if (authStep === 'auth') return <AuthPage />;
  if (authStep === 'verify') return <VerifyEmail />;

  return <Home />;
}
