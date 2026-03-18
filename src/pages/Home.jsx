import { useState, useCallback, useRef } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { callGemini, getDemoResponse } from '../api/gemini';
import { SYSTEM_PROMPTS, VOICE_SAMPLES, FIELD_LABELS, DISTRESS_WORDS } from '../utils/constants';
import { detectLang, parseCompanionReply, parseConsultantReply, sleep, now, guessTitle } from '../utils/helpers';

import TopBar from '../components/TopBar/TopBar';
import ModeToggle from '../components/ModeToggle/ModeToggle';
import ChatArea from '../components/Chat/ChatArea';
import InputBar from '../components/Chat/InputBar';
import BottomNav from '../components/BottomNav/BottomNav';
import RightPanel from '../components/RightPanel/RightPanel';
import EmergencyStrip from '../components/Emergency/EmergencyStrip';

export default function Home() {
  const [showTyping, setShowTyping] = useState(false);
  const [compCardVisible, setCompCardVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceIdx = useRef({ companion: 0, health: 0, finance: 0 });
  const recognitionRef = useRef(null);

  // Session store — use getState() for async callbacks to avoid stale closures
  const mode = useSessionStore((s) => s.mode);
  const section = useSessionStore((s) => s.section);
  const setSection = useSessionStore((s) => s.setSection);
  const view = useSessionStore((s) => s.view);
  const messages = useSessionStore((s) => s.messages);
  const addMessage = useSessionStore((s) => s.addMessage);
  const incrementTurns = useSessionStore((s) => s.incrementTurns);
  const demo = useSessionStore((s) => s.demo);
  const apiKey = useSessionStore((s) => s.apiKey);
  const setExtracted = useSessionStore((s) => s.setExtracted);
  const extracted = useSessionStore((s) => s.extracted);
  const sessions = useSessionStore((s) => s.sessions);
  const allSessions = useSessionStore((s) => s.allSessions);
  const addSession = useSessionStore((s) => s.addSession);
  const updateLangStat = useSessionStore((s) => s.updateLangStat);

  // Companion store
  const applyCompanionData = useCompanionStore((s) => s.applyCompanionData);
  const triggerDistress = useCompanionStore((s) => s.triggerDistress);

  const isComp = mode === 'companion';

  // ─── TTS: Speak AI responses ──────────────────
  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    // Try to pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && v.name.includes('Google')
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  // ─── Distress detection ────────────────────────
  function scanDistress(text) {
    const lc = text.toLowerCase();
    if (DISTRESS_WORDS.some((w) => lc.includes(w))) {
      triggerDistress();
    }
  }

  // ─── Send message (uses fresh store state) ─────
  async function handleSend(text) {
    const lang = detectLang(text);
    addMessage({ role: 'user', content: text, lang });
    incrementTurns();
    setShowTyping(true);
    scanDistress(text);

    // Read fresh state from store to avoid stale closures
    const freshState = useSessionStore.getState();
    const currentMode = freshState.mode;
    const currentSection = freshState.section;
    const currentDemo = freshState.demo;
    const currentApiKey = freshState.apiKey;
    const currentMessages = freshState.messages;
    const currentTurns = freshState.turns;
    const currentIsComp = currentMode === 'companion';

    try {
      let reply;
      if (currentDemo) {
        await sleep(900 + Math.random() * 500);
        const key = currentIsComp ? 'companion' : currentSection;
        const pick = getDemoResponse(key, currentTurns - 1);
        reply =
          pick.text +
          '\n---' +
          (currentIsComp ? 'COMPANION_' : '') +
          'JSON---\n' +
          JSON.stringify(pick.json);
      } else {
        const sysPrompt = currentIsComp ? SYSTEM_PROMPTS.companion() : SYSTEM_PROMPTS[currentSection]();
        const apiMsgs = currentMessages.map((m) => ({
          role: m.role === 'ai' ? 'assistant' : m.role,
          content: m.content,
        }));
        reply = await callGemini(currentApiKey, sysPrompt, apiMsgs);
      }

      setShowTyping(false);

      if (currentIsComp) {
        const { disp, json } = parseCompanionReply(reply);
        addMessage({ role: 'ai', content: disp });
        speakText(disp); // Speak the AI response
        if (json) {
          applyCompanionData(json);
          setCompCardVisible(true);
        }
      } else {
        const { disp, json } = parseConsultantReply(reply);
        addMessage({ role: 'ai', content: disp });
        speakText(disp); // Speak the AI response
        if (json) {
          setExtracted(json);
          if (json.language_detected) {
            const m = { kn: 'kn', hi: 'hi', en: 'en', mixed: 'mx' };
            updateLangStat(m[json.language_detected] || 'mx');
          }
        }
      }
    } catch (e) {
      setShowTyping(false);
      addMessage({ role: 'ai', content: '⚠️ ' + e.message });
    }
  }

  // ─── Real voice recognition (Web Speech API) ──
  function handleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback to voice sample simulation if no browser support
      const key = isComp ? 'companion' : section;
      const pool = VOICE_SAMPLES[key] || VOICE_SAMPLES.companion;
      const idx = voiceIdx.current[key] || 0;
      const txt = pool[idx % pool.length];
      voiceIdx.current[key] = idx + 1;
      handleSend(txt);
      return;
    }

    if (listening) {
      // Stop listening
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Indian English — also picks up Hindi/Kannada
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  }

  // ─── New session ───────────────────────────────
  function handleNewSession() {
    const id = 's' + Date.now();
    addSession({
      id,
      title: 'Session ' + (sessions.length + 1),
      domain: mode,
      time: now(),
      turns: 0,
      extractedData: {},
      messages: [],
    });
    setCompCardVisible(false);
  }

  // ─── Export ────────────────────────────────────
  function handleExport(fmt) {
    if (!Object.keys(extracted).length) {
      alert('No data yet — start a consultation first.');
      return;
    }
    const turns = useSessionStore.getState().turns;
    if (fmt === 'json') {
      dl(
        new Blob(
          [JSON.stringify({ section, mode, timestamp: new Date().toISOString(), turns, extracted }, null, 2)],
          { type: 'application/json' }
        ),
        'vaani_record.json'
      );
    } else {
      const rows = [['Field', 'Label', 'Value'], ...Object.entries(extracted).map(([k, v]) => [k, FIELD_LABELS[k] || k, v])];
      dl(
        new Blob(
          [rows.map((r) => r.map((c) => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\n')],
          { type: 'text/csv' }
        ),
        'vaani_record.csv'
      );
    }
  }

  function dl(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ─── Summary ───────────────────────────────────
  async function handleSummary() {
    const freshState = useSessionStore.getState();
    if (!freshState.messages.length) {
      alert('No data yet — start a consultation first.');
      return;
    }
    addMessage({ role: 'ai', content: '⏳ Generating summary report…' });
    try {
      let summary;
      if (freshState.demo) {
        await sleep(900);
        summary =
          freshState.section === 'health'
            ? 'Clinical Summary: Patient presents with headache and fever lasting 3 days, moderate severity. Viral fever is the likely diagnosis. Recommended action: visit the nearest PHC, maintain hydration, and rest. Follow-up advised in 3–5 days if no improvement.'
            : 'Financial Summary: Patient identity verified. A payment of ₹5000 via UPI has been recorded. Payment date and reason have been noted. Account details updated successfully.';
      } else {
        const prompt = `Write a concise 3-4 sentence professional ${freshState.section} summary in English from this structured data: ${JSON.stringify(freshState.extracted)}. Be clinical and factual.`;
        summary = await callGemini(freshState.apiKey, 'You are a medical documentation assistant.', [{ role: 'user', content: prompt }]);
      }
      addMessage({ role: 'ai', content: '📋 Summary Report\n\n' + summary });
      speakText(summary);
    } catch (e) {
      addMessage({ role: 'ai', content: 'Summary failed: ' + e.message });
    }
  }

  // ─── History view ──────────────────────────────
  if (view === 'history') {
    return (
      <div className="app-shell">
        <TopBar />
        <div className="fview on">
          <div className="vt">📂 Session History</div>
          <div className="vs">All past consultations and check-ins</div>
          {!allSessions.length ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', marginTop: 36, fontSize: 14 }}>
              No sessions yet — start a conversation! 🎙️
            </div>
          ) : (
            allSessions.map((s) => (
              <div className="hcard" key={s.id}>
                <div className="hchead">
                  <span className="hctitle">{s.title}</span>
                  <span className={`dtag ${s.domain === 'companion' ? 'companion' : 'health'}`}>
                    {s.domain}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
                    {s.time} · {s.turns}t
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <BottomNav onVoice={handleVoice} />
      </div>
    );
  }

  // ─── Main chat view ────────────────────────────
  return (
    <div className="app-shell">
      <TopBar />
      <ModeToggle />

      {/* Section tabs (consultant) */}
      {!isComp && (
        <div className="sectbar on">
          <button
            className={`stab health ${section === 'health' ? 'on' : ''}`}
            onClick={() => setSection('health')}
          >
            🏥 Health
          </button>
          <button
            className={`stab finance ${section === 'finance' ? 'on' : ''}`}
            onClick={() => setSection('finance')}
          >
            💰 Financial
          </button>
        </div>
      )}

      <EmergencyStrip />

      <div className="body">
        <div className="chat-panel">
          <ChatArea
            showTyping={showTyping}
            companionCardVisible={compCardVisible}
            onSendQuick={handleSend}
          />
          <InputBar
            onSend={handleSend}
            onVoice={handleVoice}
            onNewSession={handleNewSession}
            onExport={handleExport}
            onSummary={handleSummary}
            listening={listening}
          />
        </div>
        <RightPanel />
      </div>

      <BottomNav onVoice={handleVoice} />
    </div>
  );
}
