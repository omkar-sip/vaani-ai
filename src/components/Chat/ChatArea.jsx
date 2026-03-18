import { useRef, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import MessageBubble from './MessageBubble';
import FieldStrip from './FieldStrip';
import WellnessCard from '../WellnessCard/WellnessCard';
import './ChatArea.css';

export default function ChatArea({ showTyping, companionCardVisible, onSendQuick }) {
  const messages = useSessionStore((s) => s.messages);
  const mode = useSessionStore((s) => s.mode);
  const extracted = useSessionStore((s) => s.extracted);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping, companionCardVisible]);

  const isComp = mode === 'companion';
  const filled = Object.values(extracted).filter((v) => v && String(v).trim()).length;
  const confidence = Math.min(25 + filled * 8, 97);

  // Build empty-state chip sets
  const compChips = [
    { e: '😊', label: 'Daily Check-in',  msg: 'Hi, I want to do my daily check-in.' },
    { e: '😴', label: 'Sleep Quality',   msg: 'I want to log my sleep from last night.' },
    { e: '🧘', label: 'Stress Check',    msg: "I've been feeling stressed lately." },
    { e: '✅', label: 'Habit Log',       msg: 'Can we go through my daily habits?' },
    { e: '😰', label: 'Feeling Low',     msg: "I'm not feeling great today, emotionally." },
  ];
  const consChips = [
    { e: '🤒', label: 'Start OPD',       msg: 'Start a new patient OPD consultation.' },
    { e: '🌡️', label: 'Fever / Pain',    msg: 'I have headache and fever for 3 days.' },
    { e: '💊', label: 'Medicine Query',  msg: 'I need to know about my diabetes medicines.' },
    { e: '👶', label: 'Child Health',    msg: 'My child has fever, 6 years old, not eating.' },
    { e: '💰', label: 'Payment Record',  msg: 'I need to update my payment record.' },
  ];
  const chips = isComp ? compChips : consChips;

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-area" id="chat-area">
      {/* Empty state */}
      {!hasMessages && (
        <div className="empty-state">
          <div className="empty-icon">{isComp ? '💚' : '🩺'}</div>
          <div className="empty-title">
            {isComp ? 'Hello! How are you today?' : 'Ready to consult'}
          </div>
          <div className="empty-sub">
            {isComp
              ? "I'm here to check in on your mood, sleep, stress and daily habits."
              : "Tell me your symptoms or concern and I'll create a structured health record."}
          </div>
          <div className="mode-chip-row">
            {chips.map((c) => (
              <button
                key={c.label}
                className={`mode-chip ${isComp ? 'comp-chip' : 'cons-chip'}`}
                onClick={() => onSendQuick(c.msg)}
              >
                <span>{c.e}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((m, i) => (
        <MessageBubble key={i} role={m.role} text={m.content} lang={m.lang} mode={mode} />
      ))}

      {/* Companion wellness card */}
      {companionCardVisible && isComp && <WellnessCard />}

      {/* Consultant field strip */}
      {!isComp && filled > 0 && <FieldStrip extracted={extracted} confidence={confidence} />}

      {/* Typing indicator */}
      {showTyping && (
        <div className="msg ai">
          <div className="mav">V</div>
          <div style={{ flex: 1 }}>
            <div className="tbub">
              <div className="td" /><div className="td" /><div className="td" />
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ height: 1 }} />
    </div>
  );
}
