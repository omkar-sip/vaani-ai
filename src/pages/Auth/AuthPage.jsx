import { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
} from '../../firebase/auth';
import './AuthPages.css';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const setAuthStep = useUserStore((s) => s.setAuthStep);

  // ─── Google Sign-In ────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // Google accounts are auto-verified, go straight to ready
      setAuthStep('ready');
    } catch (e) {
      setError(getFriendlyError(e.code));
    }
    setLoading(false);
  }

  // ─── Email Sign-Up ─────────────────────────────
  async function handleSignUp() {
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password);
      // Email sent → go to verification screen
      setAuthStep('verify');
    } catch (e) {
      setError(getFriendlyError(e.code));
    }
    setLoading(false);
  }

  // ─── Email Sign-In ─────────────────────────────
  async function handleSignIn() {
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }

    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmail(email, password);
      if (!cred.user.emailVerified) {
        setAuthStep('verify');
      } else {
        setAuthStep('ready');
      }
    } catch (e) {
      setError(getFriendlyError(e.code));
    }
    setLoading(false);
  }

  // ─── Forgot Password ──────────────────────────
  async function handleReset() {
    if (!email.trim()) { setError('Enter your email above first'); return; }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e) {
      setError(getFriendlyError(e.code));
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'signup') handleSignUp();
    else if (mode === 'forgot') handleReset();
    else handleSignIn();
  }

  return (
    <div className="auth-page">
      {/* Left panel — brand */}
      <div className="auth-brand">
        <div className="auth-brand-inner">
          <div className="auth-badge">VAANIAI HEALTH</div>
          <h1 className="auth-hero-title">
            {mode === 'signup'
              ? 'Join your health companion.'
              : 'Sign in to your health companion.'}
          </h1>
          <p className="auth-hero-sub">
            VaaniAI helps you track your daily wellness, manage symptoms, and
            maintain health records — all through natural voice conversation in
            Kannada, Hindi, or English.
          </p>
          <div className="auth-features">
            <div className="auth-feat-card">
              <div className="auth-feat-icon">💚</div>
              <div className="auth-feat-title">Daily Wellness</div>
              <div className="auth-feat-sub">Track mood, sleep &amp; habits daily</div>
            </div>
            <div className="auth-feat-card">
              <div className="auth-feat-icon">🩺</div>
              <div className="auth-feat-title">Health Records</div>
              <div className="auth-feat-sub">Structured OPD &amp; symptom reports</div>
            </div>
            <div className="auth-feat-card">
              <div className="auth-feat-icon">🎙️</div>
              <div className="auth-feat-title">Voice-First</div>
              <div className="auth-feat-sub">Speak naturally in your language</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="auth-card-title">
            {mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Sign in to VaaniAI'}
          </h2>
          <p className="auth-card-sub">
            {mode === 'signup'
              ? 'Start your health journey with VaaniAI'
              : mode === 'forgot'
                ? "Enter your email and we'll send a reset link"
                : 'Access your wellness data and health records'}
          </p>

          {/* Google sign-in (not on forgot) */}
          {mode !== 'forgot' && (
            <>
              <button
                className="auth-google-btn"
                onClick={handleGoogle}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>
              <div className="auth-divider">
                <span>or sign {mode === 'signup' ? 'up' : 'in'} with email</span>
              </div>
            </>
          )}

          {/* Error message */}
          {error && <div className="auth-error">{error}</div>}
          {resetSent && (
            <div className="auth-success">
              ✅ Password reset email sent! Check your inbox.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name (sign-up only) */}
            {mode === 'signup' && (
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <input
                className="auth-input"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password (not on forgot) */}
            {mode !== 'forgot' && (
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-pw-wrap">
                  <input
                    className="auth-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'signin' && (
              <div className="auth-forgot-row">
                <span
                  className="auth-link"
                  onClick={() => { setMode('forgot'); setError(''); setResetSent(false); }}
                >
                  Forgot password?
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading
                ? '⏳ Please wait…'
                : mode === 'signup'
                  ? '🚀 Create Account'
                  : mode === 'forgot'
                    ? '📧 Send Reset Link'
                    : '🔑 Sign In'}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="auth-toggle">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <span className="auth-link" onClick={() => { setMode('signin'); setError(''); }}>
                  Sign in
                </span>
              </>
            ) : mode === 'forgot' ? (
              <>
                Remembered?{' '}
                <span className="auth-link" onClick={() => { setMode('signin'); setError(''); setResetSent(false); }}>
                  Back to sign in
                </span>
              </>
            ) : (
              <>
                New to VaaniAI?{' '}
                <span className="auth-link" onClick={() => { setMode('signup'); setError(''); }}>
                  Create an account
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Friendly Firebase error messages ────────────────
function getFriendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email. Create one instead?',
    'auth/wrong-password': 'Incorrect password. Try again or reset it.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
