import { useRef, useState } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useUserStore } from '../stores/useUserStore';
import { useCompanionStore } from '../stores/useCompanionStore';
import { callGemini, getDemoResponse } from '../api/gemini';
import { DISTRESS_WORDS, FIELD_LABELS, SYSTEM_PROMPTS, VOICE_SAMPLES } from '../utils/constants';
import { detectLang, now, parseCompanionReply, parseConsultantReply, sleep } from '../utils/helpers';
import { useI18n } from '../hooks/useI18n';
import { buildCompanionHealthReport } from '../features/companionReport/reportAnalysis';
import { downloadCompanionReportPdf } from '../features/companionReport/pdfReport';
import { buildConsultantReportData } from '../features/consultantReport/reportData';
import { downloadConsultantReportPdf } from '../features/consultantReport/pdfReport';
import { trackEvent } from '../firebase/analyticsTracker';

import TopBar from '../components/TopBar/TopBar';
import ModeToggle from '../components/ModeToggle/ModeToggle';
import ChatArea from '../components/Chat/ChatArea';
import InputBar from '../components/Chat/InputBar';
import BottomNav from '../components/BottomNav/BottomNav';
import RightPanel from '../components/RightPanel/RightPanel';
import EmergencyStrip from '../components/Emergency/EmergencyStrip';
import FoodScanner from '../features/foodScanner/FoodScanner';
import UserNameModal from '../components/UserNameModal/UserNameModal';

export default function Home() {
  const [showTyping, setShowTyping] = useState(false);
  const [compCardVisible, setCompCardVisible] = useState(false);
  const [listening, setListening] = useState(false);
  const [foodScannerOpen, setFoodScannerOpen] = useState(false);
  const [downloadingCompanionReport, setDownloadingCompanionReport] = useState(false);
  const [downloadingConsultantReport, setDownloadingConsultantReport] = useState(false);
  const voiceIdx = useRef({ companion: 0, health: 0, finance: 0 });
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const latestInteractionRef = useRef(0);
  const sessionStartTimeRef = useRef(Date.now());

  const mode = useSessionStore((s) => s.mode);
  const section = useSessionStore((s) => s.section);
  const setSection = useSessionStore((s) => s.setSection);
  const view = useSessionStore((s) => s.view);
  const messages = useSessionStore((s) => s.messages);
  const addMessage = useSessionStore((s) => s.addMessage);
  const incrementTurns = useSessionStore((s) => s.incrementTurns);
  const setExtracted = useSessionStore((s) => s.setExtracted);
  const extracted = useSessionStore((s) => s.extracted);
  const sessions = useSessionStore((s) => s.sessions);
  const allSessions = useSessionStore((s) => s.allSessions);
  const addSession = useSessionStore((s) => s.addSession);
  const openSession = useSessionStore((s) => s.openSession);
  const updateLangStat = useSessionStore((s) => s.updateLangStat);
  const needsNamePrompt = useSessionStore((s) => s.needsNamePrompt);
  const setUserName = useSessionStore((s) => s.setUserName);
  const user = useUserStore((s) => s.user);

  const applyCompanionData = useCompanionStore((s) => s.applyCompanionData);
  const triggerDistress = useCompanionStore((s) => s.triggerDistress);
  const { language, languageConfig, t } = useI18n();

  const isComp = mode === 'companion';
  const companionUserTurns = messages.filter((message) => message.role === 'user').length;
  const filledExtractedFields = Object.values(extracted).filter((value) => value && String(value).trim()).length;
  const canDownloadCompanionReport = isComp && companionUserTurns >= 2;
  const canDownloadConsultantReport =
    !isComp &&
    filledExtractedFields >= 4 &&
    Boolean(String(extracted.patient_name || extracted.consultation_reason || extracted.chief_complaint || '').trim());

  function formatHistoryTime(value) {
    if (!value) return t('recently');
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(languageConfig.locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function trimPreview(value, max = 120) {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.length > max ? text.slice(0, max).trim() + '...' : text;
  }

  function setListeningState(value) {
    listeningRef.current = value;
    setListening(value);
  }

  function noteUserInteraction() {
    latestInteractionRef.current += 1;
    return latestInteractionRef.current;
  }

  function stopNarration() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    stopNarration();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = languageConfig.speechCode;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((voice) => voice.lang?.toLowerCase() === languageConfig.speechCode.toLowerCase()) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(languageConfig.ttsPrefix)) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith('en'));

    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  function scanDistress(text) {
    const lowered = text.toLowerCase();
    if (DISTRESS_WORDS.some((word) => lowered.includes(word))) {
      triggerDistress();
    }
  }

  async function handleSend(text) {
    stopNarration();
    const interactionId = noteUserInteraction();
    const lang = detectLang(text);
    addMessage({ role: 'user', content: text, lang });
    incrementTurns();
    setShowTyping(true);
    scanDistress(text);

    /* analytics: message sent */
    const freshUser = useUserStore.getState().user;
    const freshSession = useSessionStore.getState();
    trackEvent('message_sent', {
      userId: freshUser?.uid || '',
      userName: freshSession.userName || '',
      userEmail: freshUser?.email || '',
      sessionId: freshSession.curSess || '',
      mode: freshSession.mode,
      section: freshSession.section,
    });

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
        const pick = getDemoResponse(key, currentTurns - 1, language);
        reply =
          pick.text +
          '\n---' +
          (currentIsComp ? 'COMPANION_' : '') +
          'JSON---\n' +
          JSON.stringify(pick.json);
      } else {
        const systemPrompt = currentIsComp
          ? SYSTEM_PROMPTS.companion(languageConfig)
          : SYSTEM_PROMPTS[currentSection](languageConfig);
        const apiMessages = currentMessages.map((message) => ({
          role: message.role === 'ai' ? 'assistant' : message.role,
          content: message.content,
        }));
        reply = await callGemini(currentApiKey, systemPrompt, apiMessages, {
          requiredSeparator: currentIsComp ? '---COMPANION_JSON---' : '---JSON---',
        });
      }

      setShowTyping(false);

      if (currentIsComp) {
        const { disp, json } = parseCompanionReply(reply);
        addMessage({ role: 'ai', content: disp });
        if (interactionId === latestInteractionRef.current && !listeningRef.current) {
          speakText(disp);
        }
        if (json) {
          applyCompanionData(json);
          setCompCardVisible(true);
        }
      } else {
        const { disp, json } = parseConsultantReply(reply);
        addMessage({ role: 'ai', content: disp });
        if (interactionId === latestInteractionRef.current && !listeningRef.current) {
          speakText(disp);
        }
        if (json) {
          setExtracted(json);
          if (json.language_detected) {
            const langMap = { kn: 'kn', hi: 'hi', en: 'en', mixed: 'mx', ta: 'mx', te: 'mx', mr: 'mx' };
            updateLangStat(langMap[json.language_detected] || 'mx');
          }
        }
      }
    } catch (error) {
      setShowTyping(false);
      addMessage({ role: 'ai', content: t('warningPrefix') + error.message });
    }
  }

  function handleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const wasNarrating =
      'speechSynthesis' in window &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending);

    if (!SpeechRecognition) {
      stopNarration();
      noteUserInteraction();
      const key = isComp ? 'companion' : section;
      const pool = VOICE_SAMPLES[key] || VOICE_SAMPLES.companion;
      const idx = voiceIdx.current[key] || 0;
      const text = pool[idx % pool.length];
      voiceIdx.current[key] = idx + 1;
      handleSend(text);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListeningState(false);
      return;
    }

    stopNarration();
    noteUserInteraction();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = languageConfig.speechCode;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListeningState(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
      setListeningState(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert(t('microphoneDenied'));
      }
      recognitionRef.current = null;
      setListeningState(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListeningState(false);
    };

    window.setTimeout(() => {
      try {
        recognition.start();
      } catch (error) {
        console.error('Speech recognition start error:', error);
        recognitionRef.current = null;
        setListeningState(false);
      }
    }, wasNarrating ? 120 : 0);
  }

  function handleNewSession() {
    /* analytics: end previous session */
    const prevState = useSessionStore.getState();
    const prevUser = useUserStore.getState().user;
    if (prevState.curSess) {
      trackEvent('session_end', {
        userId: prevUser?.uid || '',
        userName: prevState.userName || '',
        userEmail: prevUser?.email || '',
        sessionId: prevState.curSess,
        mode: prevState.mode,
        section: prevState.section,
        durationMs: Date.now() - sessionStartTimeRef.current,
        turnsCount: prevState.turns,
      });
    }

    const id = 's' + Date.now();
    addSession({
      id,
      title: `${t('newSession')} ${sessions.length + 1}`,
      domain: mode,
      time: now(),
      turns: 0,
      extractedData: {},
      messages: [],
    });
    setCompCardVisible(false);
    sessionStartTimeRef.current = Date.now();
  }

  function downloadBlob(blob, name) {
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  }

  function getActiveSessionSnapshot(state, fallbackTitle) {
    return (
      [...state.sessions, ...state.allSessions].find((session) => session.id === state.curSess) || {
        id: state.curSess || `${fallbackTitle.toLowerCase()}-${Date.now()}`,
        title: fallbackTitle,
        messages: state.messages,
      }
    );
  }

  function handleExport(format) {
    if (!Object.keys(extracted).length) {
      alert(t('noDataYet'));
      return;
    }

    const turns = useSessionStore.getState().turns;
    if (format === 'json') {
      downloadBlob(
        new Blob(
          [JSON.stringify({ section, mode, timestamp: new Date().toISOString(), turns, extracted }, null, 2)],
          { type: 'application/json' }
        ),
        'vaani_record.json'
      );
      return;
    }

    const rows = [
      ['Field', 'Label', 'Value'],
      ...Object.entries(extracted).map(([key, value]) => [key, FIELD_LABELS[key] || key, value]),
    ];
    downloadBlob(
      new Blob(
        [rows.map((row) => row.map((cell) => '"' + String(cell || '').replace(/"/g, '""') + '"').join(',')).join('\n')],
        { type: 'text/csv' }
      ),
      'vaani_record.csv'
    );
  }

  async function handleDownloadCompanionReport() {
    const freshState = useSessionStore.getState();
    const userTurns = freshState.messages.filter((message) => message.role === 'user').length;
    if (userTurns < 2) {
      alert(t('healthReportNotReady'));
      return;
    }

    const activeSession = getActiveSessionSnapshot(freshState, 'Daily Check-in');

    setDownloadingCompanionReport(true);
    try {
      const report = buildCompanionHealthReport({
        session: {
          ...activeSession,
          messages: freshState.messages,
        },
        companionSnapshot: useCompanionStore.getState(),
      });
      await downloadCompanionReportPdf({ report });
      /* analytics: companion report downloaded */
      const freshUser = useUserStore.getState().user;
      trackEvent('feature_used', {
        userId: freshUser?.uid || '',
        userName: freshState.userName || '',
        userEmail: freshUser?.email || '',
        sessionId: freshState.curSess || '',
        mode: 'companion',
        feature: 'companion_report',
      });
    } catch (error) {
      alert(t('healthReportFailed') + error.message);
    } finally {
      setDownloadingCompanionReport(false);
    }
  }

  async function handleDownloadConsultantReport() {
    const freshState = useSessionStore.getState();
    const extractedFields = freshState.extracted || {};
    const filledFields = Object.values(extractedFields).filter((value) => value && String(value).trim()).length;
    const hasCoreField = String(
      extractedFields.patient_name || extractedFields.consultation_reason || extractedFields.chief_complaint || ''
    ).trim();

    if (!hasCoreField || filledFields < 4) {
      alert(t('consultantReportNotReady'));
      return;
    }

    const activeSession = getActiveSessionSnapshot(freshState, 'Consultation');
    setDownloadingConsultantReport(true);
    try {
      const report = buildConsultantReportData({
        session: {
          ...activeSession,
          messages: freshState.messages,
        },
        extracted: extractedFields,
      });
      await downloadConsultantReportPdf({ report });
      /* analytics: consultant report downloaded */
      const freshUser = useUserStore.getState().user;
      trackEvent('feature_used', {
        userId: freshUser?.uid || '',
        userName: freshState.userName || '',
        userEmail: freshUser?.email || '',
        sessionId: freshState.curSess || '',
        mode: 'consultant',
        feature: 'consultant_report',
      });
    } catch (error) {
      alert(t('consultantReportFailed') + error.message);
    } finally {
      setDownloadingConsultantReport(false);
    }
  }

  async function handleSummary() {
    const freshState = useSessionStore.getState();
    if (!freshState.messages.length) {
      alert(t('noSummaryYet'));
      return;
    }

    stopNarration();
    const narrationId = latestInteractionRef.current;
    addMessage({ role: 'ai', content: t('generatingSummary') });
    try {
      let summary;
      if (freshState.demo) {
        await sleep(900);
        summary = freshState.section === 'health' ? t('healthDemoSummary') : t('financeDemoSummary');
      } else {
        const prompt = `Write a concise 3-4 sentence professional ${freshState.section} summary in ${languageConfig.geminiName} from this structured data: ${JSON.stringify(freshState.extracted)}. Be factual and useful for a real user.`;
        summary = await callGemini(
          freshState.apiKey,
          `You are a medical documentation assistant. Respond in ${languageConfig.geminiName}.`,
          [{ role: 'user', content: prompt }]
        );
      }
      addMessage({ role: 'ai', content: `${t('summaryReport')}\n\n${summary}` });
      if (narrationId === latestInteractionRef.current && !listeningRef.current) {
        speakText(summary);
      }
    } catch (error) {
      addMessage({ role: 'ai', content: t('summaryFailed') + error.message });
    }
  }

  if (view === 'history') {
    return (
      <div className="app-shell">
        <TopBar />
        <div className="fview on">
          <div className="vt">{t('historyTitle')}</div>
          <div className="vs">{t('historySubtitle')}</div>
          {!allSessions.length ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', marginTop: 36, fontSize: 14 }}>
              {t('noSessions')}
            </div>
          ) : (
            allSessions.map((session) => (
              <div className="hcard history-card" key={session.id}>
                <div className="hchead">
                  <span className="hctitle">{session.title}</span>
                  <span className={`dtag ${session.domain === 'companion' ? 'companion' : 'health'}`}>
                    {session.domain === 'companion' ? t('companion') : t('consultant')}
                  </span>
                  {session.domain !== 'companion' && (
                    <span className={`dtag ${session.section === 'finance' ? 'finance' : 'health'}`}>
                      {session.section === 'finance' ? t('financial') : t('health')}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
                    {formatHistoryTime(session.lastUpdatedAt || session.time)}
                  </span>
                </div>

                <div className="history-meta-row">
                  <span>{session.turns || 0} {t('userTurns')}</span>
                  <span>{session.messages?.length || 0} {t('messages')}</span>
                  <span>{session.foodScans?.length || 0} {t('scans')}</span>
                </div>

                {session.preview && (
                  <div className="history-preview">
                    {trimPreview(session.preview, 180)}
                  </div>
                )}

                {!!session.messages?.length && (
                  <div className="history-block">
                    <div className="history-block-title">{t('recentConversation')}</div>
                    <div className="history-list">
                      {session.messages.slice(-3).map((message, index) => (
                        <div className="history-item" key={`${session.id}-msg-${index}`}>
                          <span className={`history-role ${message.role}`}>{message.role === 'ai' ? t('ai') : t('you')}</span>
                          <span className="history-text">{trimPreview(message.content, 140)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!!session.foodScans?.length && (
                  <div className="history-block">
                    <div className="history-block-title">{t('foodScans')}</div>
                    <div className="history-list">
                      {session.foodScans.slice(0, 3).map((scan) => (
                        <div className="history-item food" key={scan.id}>
                          <span className={`history-risk ${String(scan.riskLevel || '').toLowerCase()}`}>
                            {scan.riskLevel}
                          </span>
                          <span className="history-text">
                            {scan.productName} · {trimPreview(scan.summary, 120)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="history-actions">
                  <button className="history-open-btn" onClick={() => openSession(session.id)}>
                    {t('openSession')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <BottomNav onVoice={handleVoice} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TopBar />
      <ModeToggle />

      {!isComp && (
        <div className="sectbar on">
          <button
            className={`stab health ${section === 'health' ? 'on' : ''}`}
            onClick={() => setSection('health')}
          >
            {t('health')}
          </button>
          <button
            className={`stab finance ${section === 'finance' ? 'on' : ''}`}
            onClick={() => setSection('finance')}
          >
            {t('financial')}
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
            onOpenFoodScanner={() => {
              setFoodScannerOpen(true);
              /* analytics: food scanner opened */
              const freshUser = useUserStore.getState().user;
              const freshSess = useSessionStore.getState();
              trackEvent('feature_used', {
                userId: freshUser?.uid || '',
                userName: freshSess.userName || '',
                userEmail: freshUser?.email || '',
                sessionId: freshSess.curSess || '',
                mode: freshSess.mode,
                feature: 'food_scanner',
              });
            }}
            listening={listening}
            showCompanionReportAction={canDownloadCompanionReport}
            onDownloadCompanionReport={handleDownloadCompanionReport}
            downloadingCompanionReport={downloadingCompanionReport}
            showConsultantReportAction={canDownloadConsultantReport}
            onDownloadConsultantReport={handleDownloadConsultantReport}
            downloadingConsultantReport={downloadingConsultantReport}
          />
        </div>
        <RightPanel />
      </div>

      <FoodScanner open={foodScannerOpen} onClose={() => setFoodScannerOpen(false)} />
      <BottomNav onVoice={handleVoice} />

      {needsNamePrompt && (
        <UserNameModal
          onSubmit={(name) => {
            setUserName(name);
            const freshSess = useSessionStore.getState();
            trackEvent('session_start', {
              userId: user?.uid || '',
              userName: name,
              userEmail: user?.email || '',
              sessionId: freshSess.curSess || '',
              mode: freshSess.mode,
              section: freshSess.section,
            });
            sessionStartTimeRef.current = Date.now();
          }}
        />
      )}
    </div>
  );
}
