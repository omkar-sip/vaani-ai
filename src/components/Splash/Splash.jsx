import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import './Splash.css';

const SLIDES = [0, 1, 2];

export default function Splash({ onLaunch }) {
  const [slide, setSlide] = useState(0);
  const [splashMode, setSplashMode] = useState('companion');
  const [keyValue, setKeyValue] = useState('');
  const setApiKey = useSessionStore((s) => s.setApiKey);
  const setDemo = useSessionStore((s) => s.setDemo);

  function gotoSlide(n) {
    setSlide(n);
  }

  function handleSetKey() {
    const v = keyValue.trim();
    if (!v.startsWith('AIza')) {
      alert('Please enter a valid Gemini API key (starts with AIza...)');
      return;
    }
    setApiKey(v);
    onLaunch(splashMode, false);
  }

  function handleSkipKey() {
    setDemo();
    onLaunch(splashMode, true);
  }

  return (
    <div className="splash" id="splash">
      {/* S0: Welcome + Mode intro */}
      <div className={`slide ${slide === 0 ? 'on' : ''}`}>
        <div className="splash-logo">🎙️</div>
        <div className="s-title">Meet VaaniAI</div>
        <div className="s-sub">
          Your voice-first health assistant. Talk in any language — Kannada, Hindi, or English.
        </div>
        <div className="mode-preview">
          <div
            className={`mode-card comp ${splashMode === 'companion' ? 'sel' : ''}`}
            onClick={() => setSplashMode('companion')}
          >
            <div className="mode-card-icon">💚</div>
            <div className="mode-card-title">Companion</div>
            <div className="mode-card-sub">Daily check-ins, mood, sleep &amp; habits</div>
          </div>
          <div
            className={`mode-card cons ${splashMode === 'consultant' ? 'sel' : ''}`}
            onClick={() => setSplashMode('consultant')}
          >
            <div className="mode-card-icon">🩺</div>
            <div className="mode-card-title">Consultant</div>
            <div className="mode-card-sub">Symptom reports &amp; health records</div>
          </div>
        </div>
        <div className="dots">
          {SLIDES.map((i) => (
            <div key={i} className={`dot ${slide === i ? 'on' : ''}`} />
          ))}
        </div>
        <button className="bigbtn pri" onClick={() => gotoSlide(1)}>
          Get Started →
        </button>
        <span className="skiplink" onClick={() => gotoSlide(2)}>
          Skip to setup
        </span>
      </div>

      {/* S1: How it works */}
      <div className={`slide ${slide === 1 ? 'on' : ''}`}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
        <div className="s-title">Two modes, one app</div>
        <div className="s-sub" style={{ marginBottom: 18 }}>
          Switch anytime with the toggle. Both modes powered by AI.
        </div>
        <div className="feat-list">
          <div className="feat">
            <div className="ficon" style={{ background: '#ECFDF5' }}>💚</div>
            <div>
              <div className="ftitle">Companion Mode</div>
              <div className="fsub">
                Track your daily mood, sleep patterns, stress levels and lifestyle habits through friendly conversation.
              </div>
            </div>
          </div>
          <div className="feat">
            <div className="ficon" style={{ background: '#FFF7ED' }}>🩺</div>
            <div>
              <div className="ftitle">Consultant Mode</div>
              <div className="fsub">
                Describe symptoms, get structured health reports, document financial records and export summaries.
              </div>
            </div>
          </div>
          <div className="feat">
            <div className="ficon" style={{ background: '#FEF2F2' }}>🆘</div>
            <div>
              <div className="ftitle">Distress Detection</div>
              <div className="fsub">
                AI listens for signs of distress in any language and automatically surfaces emergency contacts.
              </div>
            </div>
          </div>
        </div>
        <div className="dots">
          {SLIDES.map((i) => (
            <div key={i} className={`dot ${slide === i ? 'on' : ''}`} />
          ))}
        </div>
        <button className="bigbtn pri" onClick={() => gotoSlide(2)}>
          Next →
        </button>
      </div>

      {/* S2: API Key */}
      <div className={`slide ${slide === 2 ? 'on' : ''}`}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🔑</div>
        <div className="s-title" style={{ fontSize: 22 }}>
          Connect to Gemini AI
        </div>
        <div className="s-sub" style={{ marginBottom: 16 }}>
          Enter your Gemini API key for live AI, or try Demo Mode first.
        </div>
        <div className="keybox">
          <strong>Where to get a key?</strong>
          <br />
          aistudio.google.com → Get API Key
          <br />
          Key starts with <code>AIza...</code>
          <br />
          🔒 Stored only in your browser
        </div>
        <input
          className="keyinput"
          type="password"
          placeholder="AIzaSy..."
          autoComplete="off"
          value={keyValue}
          onChange={(e) => setKeyValue(e.target.value)}
        />
        <button className="bigbtn pri" onClick={handleSetKey} style={{ marginBottom: 10 }}>
          🚀 Start with Live AI
        </button>
        <button className="bigbtn sec" onClick={handleSkipKey}>
          🎭 Try Demo Mode (No key needed)
        </button>
        <div className="dots">
          {SLIDES.map((i) => (
            <div key={i} className={`dot ${slide === i ? 'on' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
