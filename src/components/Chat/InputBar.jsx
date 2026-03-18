import { useState, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import './InputBar.css';

/**
 * @param {{ onSend: (text: string) => void, onVoice: () => void, onNewSession: () => void, onExport: (fmt: string) => void, onSummary: () => void, listening?: boolean }} props
 */
export default function InputBar({ onSend, onVoice, onNewSession, onExport, onSummary, listening }) {
  const [text, setText] = useState('');
  const mode = useSessionStore((s) => s.mode);
  const isComp = mode === 'companion';
  const taRef = useRef(null);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const v = text.trim();
    if (!v) return;
    onSend(v);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  return (
    <div className={`input-wrap ${isComp ? 'companion-mode' : 'consultant-mode'}`}>
      {/* Export bar (consultant only) */}
      {!isComp && (
        <div className="expbar on">
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Export:</span>
          <button className="exbtn" onClick={() => onExport('json')}>📦 JSON</button>
          <button className="exbtn" onClick={() => onExport('csv')}>📊 CSV</button>
          <div style={{ flex: 1 }} />
          <button className="exbtn ai" onClick={onSummary}>✨ Summary</button>
        </div>
      )}

      <div className="irow">
        <textarea
          id="tbox"
          ref={taRef}
          className="tbox"
          rows={1}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
          onKeyDown={handleKey}
          placeholder={isComp ? 'How are you feeling today?' : 'Describe your symptoms or concern…'}
        />
        <button id="send-btn" className="sbtn" onClick={handleSend}>↑</button>
      </div>
      <div className="action-row">
        <button
          className={`abtn voice ${listening ? 'pulsing' : ''}`}
          onClick={onVoice}
        >
          {listening ? '⏹ Listening…' : '🎙 Speak'}
        </button>
        <button className="abtn" onClick={onNewSession}>＋ New Session</button>
        <span className="ahint">Voice AI · Gemini 2.0</span>
      </div>
    </div>
  );
}
