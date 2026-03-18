import { useState, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import './InputBar.css';

/**
 * @param {{ onSend: (text: string) => void, onVoice: () => void, onNewSession: () => void, onExport: (fmt: string) => void, onSummary: () => void, onOpenFoodScanner: () => void, listening?: boolean }} props
 */
export default function InputBar({
  onSend,
  onVoice,
  onNewSession,
  onExport,
  onSummary,
  onOpenFoodScanner,
  listening,
}) {
  const [text, setText] = useState('');
  const mode = useSessionStore((s) => s.mode);
  const isComp = mode === 'companion';
  const taRef = useRef(null);

  function handleKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  }

  function autoResize(element) {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 100) + 'px';
  }

  return (
    <div className={`input-wrap ${isComp ? 'companion-mode' : 'consultant-mode'}`}>
      {!isComp && (
        <div className="expbar on">
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Export:</span>
          <button className="exbtn" onClick={() => onExport('json')}>JSON</button>
          <button className="exbtn" onClick={() => onExport('csv')}>CSV</button>
          <div style={{ flex: 1 }} />
          <button className="exbtn ai" onClick={onSummary}>Summary</button>
        </div>
      )}

      <div className="irow">
        <textarea
          id="tbox"
          ref={taRef}
          className="tbox"
          rows={1}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            autoResize(event.target);
          }}
          onKeyDown={handleKey}
          placeholder={isComp ? 'How are you feeling today?' : 'Describe your symptoms or concern...'}
        />
        <button id="send-btn" className="sbtn" onClick={handleSend}>^</button>
      </div>

      <div className="action-row">
        <button
          className={`abtn voice ${listening ? 'pulsing' : ''}`}
          onClick={onVoice}
        >
          {listening ? 'Stop listening' : 'Speak'}
        </button>
        <button className="abtn" onClick={onNewSession}>New Session</button>
        <button className="abtn scan" onClick={onOpenFoodScanner}>Scan Food</button>
        <span className="ahint">Voice AI · Gemini 2.0</span>
      </div>
    </div>
  );
}
