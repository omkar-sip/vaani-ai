import { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { resendVerification, logOut, auth } from '../../firebase/auth';
import './AuthPages.css';

export default function VerifyEmail() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const setAuthStep = useUserStore((s) => s.setAuthStep);

  const userEmail = auth.currentUser?.email || 'your email';

  // Poll for email verification every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          setAuthStep('ready');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [setAuthStep]);

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (e) {
      alert(e.message);
    }
    setResending(false);
  }

  async function handleCheckNow() {
    setChecking(true);
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        setAuthStep('ready');
      } else {
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    }
    setChecking(false);
  }

  async function handleSignOut() {
    await logOut();
    setAuthStep('auth');
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-logo">🎙️</div>
          <h1 className="auth-brand-name">VaaniAI</h1>
          <p className="auth-brand-tagline">वाणी AI</p>
          <p className="auth-brand-sub">
            Almost there! Just one more step<br />
            to start your health journey.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="verify-icon">📧</div>
          <h2 className="auth-card-title">Verify your email</h2>
          <p className="auth-card-sub">
            We've sent a verification link to<br />
            <strong style={{ color: 'var(--text)' }}>{userEmail}</strong>
          </p>

          <div className="verify-steps">
            <div className="verify-step">
              <div className="verify-step-num">1</div>
              <span>Open your email inbox</span>
            </div>
            <div className="verify-step">
              <div className="verify-step-num">2</div>
              <span>Click the verification link from VaaniAI</span>
            </div>
            <div className="verify-step">
              <div className="verify-step-num">3</div>
              <span>Come back here — we'll detect it automatically</span>
            </div>
          </div>

          <div className="verify-waiting">
            <div className="verify-spinner" />
            <span>Waiting for verification…</span>
          </div>

          <button
            className="auth-primary-btn"
            onClick={handleCheckNow}
            disabled={checking}
          >
            {checking ? '⏳ Checking…' : "✅ I've verified — Check now"}
          </button>

          <div className="verify-actions">
            <button
              className="auth-secondary-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resent ? '✅ Email sent!' : resending ? 'Sending…' : '📧 Resend verification email'}
            </button>
            <button className="auth-text-btn" onClick={handleSignOut}>
              ← Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
